// src/app/reports.tsx
import React, { useState, useEffect } from 'react';
import { Text, View, SafeAreaView, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAppTheme } from '../context/ThemeContext';
import { AppInput } from '../components/common/AppInput';
import { AppButton } from '../components/common/AppButton';
import { estilosReports } from '../styles/reports.styles';
import { requisicaoApi } from '../services/api';

const TIPOS_GRAFICO = [
  { id: 'Barras', icone: 'bar-chart-2' },
  { id: 'Colunas', icone: 'bar-chart' },
  { id: 'Proporção', icone: 'pie-chart' },
] as const;

export default function ReportsScreen() {
  const roteador = useRouter();
  const { theme, tokens, fontScale } = useAppTheme();

  const [tipoGrafico, setTipoGrafico] = useState<string>('Barras');
  const [mostrarPorcentagem, setMostrarPorcentagem] = useState<boolean>(true); // Estado do Toggle
  const [emailsDestino, setEmailsDestino] = useState('');
  
  const [dadosGrafico, setDadosGrafico] = useState<any[]>([]);
  const [lotesCompletos, setLotesCompletos] = useState<any[]>([]); // Guarda o estoque completo para o envio
  const [carregandoDados, setCarregandoDados] = useState(true);
  const [enviandoEmail, setEnviandoEmail] = useState(false);

  // Busca de dados reais da AWS (DynamoDB)
  useEffect(() => {
    const carregarEstatisticasReais = async () => {
      try {
        setCarregandoDados(true);
        const resposta: any = await requisicaoApi('/api/estoque', {
          metodo: 'POST',
          dados: { modulo: 'estoque', acao: 'consultar_estoque' },
        });

        if (resposta?.sucesso && Array.isArray(resposta.lotes)) {
          setLotesCompletos(resposta.lotes); // Armazena para mandar no relatório completo
          
          const agregacao: Record<string, number> = {};
          let totalPacotes = 0;

          resposta.lotes.forEach((lote: any) => {
            const categoria = lote.categoria || 'Outros';
            const qtd = parseInt(lote.quantidade_atual_pacote, 10) || 0;
            agregacao[categoria] = (agregacao[categoria] || 0) + qtd;
            totalPacotes += qtd;
          });

          // Paleta oficial
          const paletaCores = [
            theme.primary, 
            tokens.colors.accentAmber500, 
            theme.secondary, 
            theme.danger, 
            tokens.colors.neutral600
          ];
          
          const novosDados = Object.keys(agregacao).map((cat, index) => ({
            label: cat,
            valor: totalPacotes > 0 ? Math.round((agregacao[cat] / totalPacotes) * 100) : 0, // % para as barras
            quantidade: agregacao[cat], // Valor real para a visualização
            cor: paletaCores[index % paletaCores.length]
          })).sort((a, b) => b.valor - a.valor);

          setDadosGrafico(novosDados);
        }
      } catch (erro) {
        console.log('Erro AWS:', erro);
      } finally {
        setCarregandoDados(false);
      }
    };

    carregarEstatisticasReais();
  }, []);

  // Novo serviço de disparo: envia requisição de relatório completo
  const exportarPdfPorEmail = async () => {
    if (!emailsDestino.trim() || !emailsDestino.includes('@')) {
      Alert.alert('E-mail Inválido', 'Por favor, digite um endereço de e-mail válido.');
      return;
    }

    try {
      setEnviandoEmail(true);
      const resposta: any = await requisicaoApi('/api/relatorios', {
        metodo: 'POST',
        dados: {
          modulo: 'relatorios',
          acao: 'enviar_relatorio_completo_email', // Ação refatorada para o backend
          relatorio_completo: true,
          dados_consolidados: dadosGrafico,
          total_itens: lotesCompletos.length, // Passa a instrução para carregar as info detalhadas
          destinatarios: emailsDestino.split(',').map(e => e.trim()),
          tipo_grafico: tipoGrafico
        },
      });

      if (resposta?.sucesso) {
        Alert.alert(
          'E-mail Enviado com Sucesso!', 
          `O relatório completo com todas as informações dos produtos em estoque foi gerado e enviado para:\n\n${emailsDestino}`
        );
        setEmailsDestino('');
      } else {
        Alert.alert('Erro', resposta.mensagem || 'Falha ao gerar o relatório completo.');
      }
    } catch (erro: any) {
      Alert.alert('Erro de Conexão', 'Não foi possível conectar com os servidores da AWS.');
    } finally {
      setEnviandoEmail(false);
    }
  };

  // Renderização Dinâmica e Segura dos Gráficos
  const renderizarVisualizacaoGrafica = () => {
    if (carregandoDados) {
      return <ActivityIndicator size="large" color={theme.primary} style={{ marginVertical: 40 }} />;
    }
    
    if (dadosGrafico.length === 0) {
      return <Text style={{ color: theme.subtext, textAlign: 'center', marginVertical: 20 }}>Estoque vazio.</Text>;
    }

    // Função auxiliar para exibir a métrica formatada baseada no toggle
    const formatarMetrica = (item: any) => mostrarPorcentagem ? `${item.valor}%` : `${item.quantidade} itens`;

    return (
      <View style={estilosReports.areaGraficoSegura}>
        {tipoGrafico === 'Colunas' && (
          <View style={{ flexDirection: 'row', height: 180, alignItems: 'flex-end', justifyContent: 'space-around' }}>
            {dadosGrafico.map(item => (
              <View key={item.label} style={{ alignItems: 'center', flex: 1, height: '100%', justifyContent: 'flex-end' }}>
                <Text style={{ fontSize: 11 * fontScale, color: theme.subtext, marginBottom: 4, fontWeight: 'bold' }}>
                  {formatarMetrica(item)}
                </Text>
                {/* A altura SEMPRE usa a proporção em %, para não quebrar o layout da coluna */}
                <View style={{ width: '50%', height: `${Math.max(item.valor, 5)}%`, backgroundColor: item.cor, borderTopLeftRadius: 4, borderTopRightRadius: 4 }} />
                <Text style={{ fontSize: 10 * fontScale, color: theme.text, marginTop: 8, textAlign: 'center' }} numberOfLines={1}>
                  {item.label}
                </Text>
              </View>
            ))}
          </View>
        )}

        {tipoGrafico === 'Proporção' && (
          <View>
            <View style={{ height: 30, borderRadius: 8, flexDirection: 'row', overflow: 'hidden', marginBottom: 16 }}>
              {dadosGrafico.map(item => (
                <View key={item.label} style={{ width: `${item.valor}%`, backgroundColor: item.cor, justifyContent: 'center', alignItems: 'center' }} />
              ))}
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
               {dadosGrafico.map(item => (
                 <View key={item.label} style={{ flexDirection: 'row', alignItems: 'center', width: '45%' }}>
                    <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: item.cor, marginRight: 8 }} />
                    <Text style={{ fontSize: 11 * fontScale, color: theme.text }}>
                      {item.label} ({formatarMetrica(item)})
                    </Text>
                 </View>
               ))}
            </View>
          </View>
        )}

        {tipoGrafico === 'Barras' && (
          <View style={{ gap: 12 }}>
            {dadosGrafico.map((item) => (
              <View key={item.label}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={{ color: theme.text, fontSize: 12 * fontScale, fontWeight: '600' }}>{item.label}</Text>
                  <Text style={{ color: theme.subtext, fontSize: 12 * fontScale, fontWeight: 'bold' }}>
                    {formatarMetrica(item)}
                  </Text>
                </View>
                <View style={{ height: 10, borderRadius: 5, backgroundColor: theme.border, width: '100%', overflow: 'hidden' }}>
                  {/* A largura também usa o item.valor para manter a proporção correta */}
                  <View style={{ width: `${item.valor}%`, height: '100%', backgroundColor: item.cor }} />
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  // Componente de atalho modificado (sem bordas coloridas)
  const MiniCard = ({ titulo, icone, corDestaque, rota }: any) => {
    return (
      <TouchableOpacity
        accessible={true}
        accessibilityRole="button"
        onPress={() => roteador.push(rota)}
        style={[estilosReports.miniCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
      >
        <View style={[estilosReports.miniCardIcone, { backgroundColor: `${corDestaque}15` }]}>
           <Feather name={icone} size={20} color={corDestaque} />
        </View>
        <Text style={[estilosReports.miniCardTitulo, { color: theme.text, fontSize: tokens.typography.fontSize.sm * fontScale }]}>
          {titulo}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[estilosReports.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={estilosReports.rolagem} keyboardShouldPersistTaps="handled">
        
        <View style={estilosReports.cabecalho}>
          <Text style={[estilosReports.titulo, { color: theme.primary, fontSize: tokens.typography.fontSize.xl * fontScale }]}>
            Central de Relatórios
          </Text>
          <Text style={[estilosReports.subtitulo, { color: theme.subtext, fontSize: tokens.typography.fontSize.sm * fontScale }]}>
            Acompanhe a situação atual do estoque e envie relatórios operacionais completos em PDF.
          </Text>
        </View>

        {/* 1. GRÁFICOS NO TOPO DA TELA */}
        <View style={[estilosReports.secaoCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          
          {/* Cabeçalho do Gráfico com o Toggle Button */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={[estilosReports.tituloSecao, { color: theme.text, fontSize: tokens.typography.fontSize.md * fontScale, marginBottom: 0 }]}>
              Gráfico da Situação Atual
            </Text>
            
            <TouchableOpacity 
              onPress={() => setMostrarPorcentagem(!mostrarPorcentagem)}
              style={{ 
                flexDirection: 'row', 
                alignItems: 'center', 
                backgroundColor: `${theme.primary}15`, 
                paddingHorizontal: 10, 
                paddingVertical: 6, 
                borderRadius: 12 
              }}
            >
              <Feather name="refresh-ccw" size={12} color={theme.primary} style={{ marginRight: 6 }} />
              <Text style={{ color: theme.primary, fontSize: 11 * fontScale, fontWeight: '700' }}>
                Ver {mostrarPorcentagem ? 'Qtd. Real' : 'Porcentagem'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={estilosReports.linhaGraficos}>
            {TIPOS_GRAFICO.map((tipo) => {
              const ativo = tipoGrafico === tipo.id;
              return (
                <TouchableOpacity
                  key={tipo.id}
                  accessible={true}
                  accessibilityRole="button"
                  onPress={() => setTipoGrafico(tipo.id)}
                  style={[
                    estilosReports.botaoTipoGrafico,
                    {
                      backgroundColor: ativo ? `${theme.primary}10` : theme.background,
                      borderColor: theme.border, // Borda neutra, sem cor
                    },
                  ]}
                >
                  <Feather name={tipo.icone as any} size={16} color={ativo ? theme.primary : theme.text} />
                  <Text style={{ fontWeight: ativo ? 'bold' : '600', color: ativo ? theme.primary : theme.text, fontSize: 13 * fontScale }}>
                    {tipo.id}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          
          {renderizarVisualizacaoGrafica()}
        </View>

        {/* 2. ATALHOS EM GRADE (2 por linha, sem bordas coloridas) */}
        <View style={estilosReports.gradeBotoes}>
          <MiniCard 
            titulo="Estoque Atual" 
            icone="box" 
            corDestaque={theme.primary}
            rota="/reports-stock" 
          />
          <MiniCard 
            titulo="Movimentações" 
            icone="refresh-cw" 
            corDestaque={theme.secondary}
            rota="/reports-movements" 
          />
          <MiniCard 
            titulo="Perdas e Descartes" 
            icone="alert-triangle" 
            corDestaque={theme.danger}
            rota="/reports-losses" 
          />
          <MiniCard 
            titulo="Validades (FEFO)" 
            icone="clock" 
            corDestaque={tokens.colors.accentAmber500}
            rota="/reports-expiry" 
          />
        </View>

        {/* 3. ENVIO DE RELATÓRIO COMPLETO POR E-MAIL */}
        <View style={[estilosReports.secaoCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[estilosReports.tituloSecao, { color: theme.text, fontSize: tokens.typography.fontSize.md * fontScale }]}>
            Exportar Documento (PDF Completo)
          </Text>
          <AppInput
            rotulo="E-mails destinatários"
            placeholder="exemplo@casadacrianca.org.br"
            keyboardType="email-address"
            value={emailsDestino}
            onChangeText={setEmailsDestino}
          />
          <AppButton
            title={enviandoEmail ? "Processando..." : "Gerar e Enviar Relatório"}
            variant="secondary"
            loading={enviandoEmail}
            onPress={exportarPdfPorEmail}
          />
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}