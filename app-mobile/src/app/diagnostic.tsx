// src/app/diagnostic.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Text, View, SafeAreaView, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAppTheme } from '../context/ThemeContext';
import { AppButton } from '../components/common/AppButton';
import { estilosDiagnostic } from '../styles/diagnostic.styles';
import { requisicaoApi, API_BASE_URL } from '../services/api';
import { carregarPrateleirasAws } from '../services/storageLocations';

export default function DiagnosticScreen() {
  const roteador = useRouter();
  const { theme, tokens, fontScale } = useAppTheme();
  const [verificando, setVerificando] = useState(false);
  const [latenciaMs, setLatenciaMs] = useState<number | null>(null);
  const [statusAws, setStatusAws] = useState<'DISPONÍVEL' | 'VERIFICANDO' | 'OFFLINE'>('VERIFICANDO');
  const [totalLotes, setTotalLotes] = useState<number>(0);
  const [totalPrateleiras, setTotalPrateleiras] = useState<number>(0);

  const executarDiagnosticoReal = useCallback(async (exibirAlerta = false) => {
    setVerificando(true);
    setStatusAws('VERIFICANDO');
    const inicio = Date.now();
    try {
      const [respEstoque, resPrateleiras] = await Promise.all([
        requisicaoApi<any>('/api/estoque', {
          metodo: 'POST',
          dados: { modulo: 'estoque', acao: 'consultar_estoque' },
        }),
        carregarPrateleirasAws(),
      ]);

      const tempo = Date.now() - inicio;
      setLatenciaMs(tempo);

      if (respEstoque?.sucesso && Array.isArray(respEstoque.lotes)) {
        const ativos = respEstoque.lotes.filter((l: any) => (Number(l.quantidade_atual_pacote) || 0) > 0);
        setTotalLotes(ativos.length);
        setTotalPrateleiras(resPrateleiras.locais.length);
        setStatusAws('DISPONÍVEL');

        if (exibirAlerta) {
          Alert.alert(
            'Diagnóstico Concluído',
            `AWS Lambda e DynamoDB operacionais (${tempo} ms).\n• ${ativos.length} lotes ativos sincronizados.\n• ${resPrateleiras.locais.length} prateleiras homologadas.`
          );
        }
      } else {
        setStatusAws('OFFLINE');
        if (exibirAlerta) {
          Alert.alert('Atenção', 'O servidor respondeu, mas sem confirmação de lotes.');
        }
      }
    } catch (erro: any) {
      setStatusAws('OFFLINE');
      if (exibirAlerta) {
        Alert.alert('Falha de Conexão', erro?.message || 'Não foi possível alcançar a AWS Lambda.');
      }
    } finally {
      setVerificando(false);
    }
  }, []);

  useEffect(() => {
    executarDiagnosticoReal(false);
  }, [executarDiagnosticoReal]);

  const servicos = [
    {
      rota: '/diagnostic-aws',
      nome: ' Funções Serverless AWS Lambda',
      detalhe:
        latenciaMs !== null
          ? `Região us-east-2 • Latência real: ${latenciaMs} ms`
          : `Endpoint: ${API_BASE_URL.replace('https://', '').slice(0, 28)}...`,
      status: statusAws,
      cor: statusAws === 'DISPONÍVEL' ? theme.secondary : statusAws === 'VERIFICANDO' ? tokens.colors.accentAmber500 : theme.danger,
    },
    {
      rota: '/diagnostic-database',
      nome: 'Bancos de Dados (DynamoDB + Firebase)',
      detalhe: `${totalLotes} lotes ativos • ${totalPrateleiras} prateleiras homologadas`,
      status: statusAws === 'DISPONÍVEL' ? 'SINCRONIZADO' : statusAws,
      cor: statusAws === 'DISPONÍVEL' ? theme.secondary : theme.danger,
    },
    {
      rota: '/diagnostic-apis',
      nome: 'Cascata de 3 APIs (Código de Barras)',
      detalhe: 'Open Food Facts • Cosmos/Bluesoft • Open Product Data / UPCitemdb',
      status: 'TESTAR EAN',
      cor: tokens.colors.accentAmber500,
    },
    {
      rota: '/diagnostic-config',
      nome: 'Configurar Chaves e Integrações',
      detalhe: 'Inspecionar endpoints AWS, timeouts e prioridade da cascata EAN',
      status: 'INSPECIONAR',
      cor: theme.primary,
    },
  ];

  return (
    <SafeAreaView style={[estilosDiagnostic.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={estilosDiagnostic.rolagem}>
        <TouchableOpacity
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Voltar para a tela anterior"
          onPress={() => roteador.back()}
          style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, minHeight: 44 }}
        >
          <Feather name="arrow-left" size={20} color={theme.primary} />
          <Text style={{ color: theme.primary, fontWeight: 'bold', marginLeft: 8, fontSize: 15 * fontScale }}>
            Voltar
          </Text>
        </TouchableOpacity>

        <View style={estilosDiagnostic.cabecalho}>
          <Text style={[estilosDiagnostic.titulo, { color: theme.primary, fontSize: tokens.typography.fontSize.xl * fontScale }]}>
            Disponibilidade do Sistema
          </Text>
          <Text style={[estilosDiagnostic.subtitulo, { color: theme.subtext, fontSize: tokens.typography.fontSize.sm * fontScale }]}>
            Verifique em tempo real a saúde dos servidores AWS, tabelas DynamoDB e cascata de APIs de código de barras.
          </Text>
        </View>

        {servicos.map((item) => (
          <TouchableOpacity
            key={item.nome}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={`${item.nome}. Status: ${item.status}. ${item.detalhe}`}
            onPress={() => roteador.push(item.rota as any)}
            style={[
              estilosDiagnostic.cartaoStatus,
              { backgroundColor: theme.surface, borderColor: item.cor },
            ]}
          >
            <View style={estilosDiagnostic.infoComponente}>
              <Text style={[estilosDiagnostic.nomeComponente, { color: theme.text, fontSize: 14 * fontScale }]}>
                {item.nome}
              </Text>
              <Text style={[estilosDiagnostic.detalheComponente, { color: theme.subtext, fontSize: 12 * fontScale }]}>
                {item.detalhe}
              </Text>
            </View>
            <View style={[estilosDiagnostic.badgeSaude, { backgroundColor: item.cor }]}>
              <Text style={estilosDiagnostic.textoBadgeSaude}>{item.status}</Text>
            </View>
          </TouchableOpacity>
        ))}

        <View style={{ marginTop: 12 }}>
          <AppButton
            title="Testar Todas as Conexões Agora"
            variant="primary"
            loading={verificando}
            onPress={() => executarDiagnosticoReal(true)}
            accessibilityHint="Executa uma chamada real à nuvem AWS e mede a latência atual"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

