// src/app/reports-movements.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Text,
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '../context/ThemeContext';
import { estilosReportsMove } from '../styles/reports-movements.styles';
import { requisicaoApi } from '../services/api';

interface MovimentacaoItem {
  id_movimentacao_estoque: string;
  id_lote_produto: string;
  ean: string;
  nome: string;
  categoria: string;
  operacao: 'Entrada' | 'Saída' | 'Movimentação';
  qtd: number;
  data: string;
  responsavel: string;
  lote: string;
  local: string;
  motivo_saida: string;
  justificativa: string;
}

type FiltroOperacao = 'Todas' | 'Entrada' | 'Saída';

export default function ReportsMovementsScreen() {
  const roteador = useRouter();
  const { theme, tokens, fontScale } = useAppTheme();

  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoItem[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [recarregando, setRecarregando] = useState(false);

  // Filtros
  const [termoBusca, setTermoBusca] = useState('');
  const [buscaAvancadaAberta, setBuscaAvancadaAberta] = useState(false);
  const [operacaoSelecionada, setOperacaoSelecionada] = useState<FiltroOperacao>('Todas');

  const carregarMovimentacoes = useCallback(async () => {
    try {
      setCarregando(true);
      const resposta: any = await requisicaoApi('/api/estoque', {
        metodo: 'POST',
        dados: { modulo: 'estoque', acao: 'consultar_movimentacoes' },
      });

      if (resposta?.sucesso && Array.isArray(resposta.movimentacoes)) {
        setMovimentacoes(resposta.movimentacoes);
      } else {
        setMovimentacoes([]);
      }
    } catch (erro) {
      Alert.alert('Erro de Conexão', 'Não foi possível carregar a linha do tempo da AWS.');
    } finally {
      setCarregando(false);
      setRecarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarMovimentacoes();
  }, [carregarMovimentacoes]);

  // Formata a data ISO (2026-10-31T14:30:00) para um texto amigável BR
  const formatarDataAmigavel = (dataIso: string) => {
    try {
      if (!dataIso) return 'Data não registrada';
      const partes = dataIso.split('T');
      if (partes.length < 2) return dataIso;
      
      const [ano, mes, dia] = partes[0].split('-');
      const horaMinuto = partes[1].substring(0, 5);
      
      return `${dia}/${mes}/${ano} às ${horaMinuto}`;
    } catch {
      return dataIso;
    }
  };

  // Mapeamento visual das operações (Design System Oficial)
  const obterEstiloOperacao = (operacao: string, motivo: string) => {
    const isPerda = (motivo || '').toLowerCase().includes('perda') || (motivo || '').toLowerCase().includes('descarte');
    
    // Verde Doar para Entradas
    if (operacao === 'Entrada') {
      return { corPrimaria: '#10B981', corFundo: '#ECFDF5', corBordaFundo: '#A7F3D0', icone: 'download', rotulo: 'Entrada no Estoque' };
    }
    
    // Vermelho Alerta para Descartes e Perdas
    if (isPerda) {
      return { corPrimaria: '#EF4444', corFundo: '#FEF2F2', corBordaFundo: '#FECACA', icone: 'trash-2', rotulo: 'Baixa por Perda' };
    }
    
    // Azul Guardar para Saídas regulares e Transferências Internas
    return { corPrimaria: '#0284C7', corFundo: '#F0F9FF', corBordaFundo: '#BAE6FD', icone: 'upload', rotulo: 'Saída / Movimentação' };
  };

  // Aplicação dos Filtros
  const historicoFiltrado = useMemo(() => {
    let lista = [...movimentacoes];
    const termo = termoBusca.toLowerCase().trim();

    if (termo) {
      lista = lista.filter(
        (m) =>
          (m.nome || '').toLowerCase().includes(termo) ||
          (m.lote || '').toLowerCase().includes(termo) ||
          (m.responsavel || '').toLowerCase().includes(termo)
      );
    }

    if (operacaoSelecionada !== 'Todas') {
      lista = lista.filter((m) => m.operacao === operacaoSelecionada);
    }

    return lista;
  }, [movimentacoes, termoBusca, operacaoSelecionada]);


  const renderizarBotaoFiltroOperacao = (tipo: FiltroOperacao, titulo: string, icone: any) => {
    const ativo = operacaoSelecionada === tipo;
    return (
      <TouchableOpacity
        onPress={() => setOperacaoSelecionada(tipo)}
        activeOpacity={0.7}
        style={[
          estilosReportsMove.chipFiltro,
          { 
            backgroundColor: ativo ? theme.primary : theme.surface,
            borderColor: ativo ? theme.primary : theme.border 
          }
        ]}
      >
        <Feather name={icone} size={14} color={ativo ? '#FFFFFF' : theme.text} />
        <Text style={[estilosReportsMove.chipFiltroTexto, { color: ativo ? '#FFFFFF' : theme.text, fontSize: 11.5 * fontScale }]}>
          {titulo}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[estilosReportsMove.container, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={estilosReportsMove.rolagem}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={recarregando}
            onRefresh={() => {
              setRecarregando(true);
              carregarMovimentacoes();
            }}
            tintColor={theme.primary}
          />
        }
      >
        <TouchableOpacity
          accessible={true}
          accessibilityRole="button"
          onPress={() => roteador.back()}
          style={estilosReportsMove.botaoVoltar}
        >
          <Feather name="arrow-left" size={22} color={theme.primary} />
          <Text style={[estilosReportsMove.textoBotaoVoltar, { color: theme.primary, fontSize: 15 * fontScale }]}>
            Voltar
          </Text>
        </TouchableOpacity>

        <View style={estilosReportsMove.cabecalho}>
          <Text style={[estilosReportsMove.titulo, { color: theme.primary, fontSize: tokens.typography.fontSize.xl * fontScale }]}>
            Linha do Tempo
          </Text>
          <Text style={[estilosReportsMove.subtitulo, { color: theme.subtext, fontSize: tokens.typography.fontSize.sm * fontScale }]}>
            Acompanhe o histórico de todas as entradas, saídas e descartes registrados.
          </Text>
        </View>

        {/* Busca e Filtros Avançados */}
        <View style={estilosReportsMove.searchBarRow}>
          <View style={[estilosReportsMove.inputSearchWrapper, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Feather name="search" size={16} color="#94A3B8" />
            <TextInput
              placeholder="Pesquisar alimento, lote ou responsável..."
              placeholderTextColor="#94A3B8"
              value={termoBusca}
              onChangeText={setTermoBusca}
              style={[estilosReportsMove.searchInput, { color: theme.text, fontSize: 12.5 * fontScale }]}
            />
            {termoBusca.length > 0 && (
              <TouchableOpacity onPress={() => setTermoBusca('')} style={{ padding: 4 }}>
                <Feather name="x-circle" size={16} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            onPress={() => setBuscaAvancadaAberta(!buscaAvancadaAberta)}
            style={{
              width: 44, height: 44, borderRadius: 10, borderWidth: 1.5,
              alignItems: 'center', justifyContent: 'center',
              backgroundColor: buscaAvancadaAberta ? `${theme.primary}15` : theme.surface,
              borderColor: buscaAvancadaAberta ? theme.primary : theme.border,
            }}
          >
            <Feather name="filter" size={16} color={buscaAvancadaAberta ? theme.primary : '#475569'} />
          </TouchableOpacity>
        </View>

        {buscaAvancadaAberta && (
          <View style={[estilosReportsMove.gavetaFiltros, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[estilosReportsMove.labelFiltro, { color: theme.text, fontSize: 12 * fontScale }]}>
              O que você deseja ver?
            </Text>
            <View style={estilosReportsMove.botoesWrapRow}>
              {renderizarBotaoFiltroOperacao('Todas', 'Todo o histórico', 'list')}
              {renderizarBotaoFiltroOperacao('Entrada', 'Apenas Entradas', 'download')}
              {renderizarBotaoFiltroOperacao('Saída', 'Apenas Saídas', 'upload')}
            </View>
          </View>
        )}

        {/* Listagem da Linha do Tempo */}
        {carregando ? (
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={{ marginTop: 12, color: theme.subtext, fontWeight: '600' }}>Sincronizando registros da nuvem...</Text>
          </View>
        ) : historicoFiltrado.length === 0 ? (
          <View style={[estilosReportsMove.emptyBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <MaterialCommunityIcons name="timeline-text-outline" size={32} color="#94A3B8" />
            <Text style={[estilosReportsMove.emptyTitle, { color: theme.text, fontSize: 13.5 * fontScale }]}>
              Nenhum registro encontrado
            </Text>
            <Text style={[estilosReportsMove.emptySubtitle, { color: theme.subtext, fontSize: 11.5 * fontScale }]}>
              Não houve nenhuma movimentação neste período ou os filtros atuais não retornaram resultados.
            </Text>
          </View>
        ) : (
          <View style={{ gap: 4 }}>
            {historicoFiltrado.map((mov, index) => {
              const estilosAcao = obterEstiloOperacao(mov.operacao, mov.motivo_saida);

              return (
                <View 
                  key={mov.id_movimentacao_estoque || index.toString()} 
                  style={[estilosReportsMove.cardMovimentacao, { backgroundColor: theme.surface, borderColor: theme.border }]}
                >
                  <View style={[estilosReportsMove.linhaTopoCard, { borderBottomColor: theme.border }]}>
                    <View style={estilosReportsMove.identificadorOperacao}>
                      <View style={[estilosReportsMove.iconeOperacaoBox, { backgroundColor: estilosAcao.corFundo, borderColor: estilosAcao.corBordaFundo }]}>
                        <Feather name={estilosAcao.icone as any} size={14} color={estilosAcao.corPrimaria} />
                      </View>
                      <Text style={[estilosReportsMove.textoOperacao, { color: estilosAcao.corPrimaria, fontSize: 12.5 * fontScale }]}>
                        {estilosAcao.rotulo}
                      </Text>
                    </View>
                    <Text style={[estilosReportsMove.textoDataHora, { color: theme.subtext, fontSize: 10.5 * fontScale }]}>
                      {formatarDataAmigavel(mov.data)}
                    </Text>
                  </View>

                  <View style={estilosReportsMove.linhaProdutoCard}>
                    <Text style={[estilosReportsMove.textoNomeProduto, { color: theme.text, fontSize: 13.5 * fontScale }]}>
                      {mov.nome}
                    </Text>
                    <Text style={[estilosReportsMove.textoLoteLocal, { color: theme.subtext, fontSize: 11 * fontScale }]}>
                      Lote: {mov.lote} • Local: {mov.local}
                    </Text>
                    
                    {mov.justificativa && mov.justificativa !== 'Entrada manual no estoque' && (
                      <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginTop: 6 }}>
                        <Feather name="message-square" size={12} color={theme.subtext} style={{ marginTop: 2, marginRight: 4 }} />
                        <Text style={{ color: theme.subtext, fontSize: 11 * fontScale, fontStyle: 'italic', flex: 1 }}>
                          {mov.justificativa}
                        </Text>
                      </View>
                    )}
                  </View>

                  <View style={estilosReportsMove.linhaRodapeCard}>
                    <View style={estilosReportsMove.caixaResponsavel}>
                      <Feather name="user" size={13} color="#64748B" />
                      <Text style={[estilosReportsMove.textoResponsavel, { color: '#64748B', fontSize: 10.5 * fontScale }]}>
                        {mov.responsavel}
                      </Text>
                    </View>
                    
                    <View style={[estilosReportsMove.caixaQuantidade, { backgroundColor: estilosAcao.corFundo, borderColor: estilosAcao.corBordaFundo }]}>
                      <Text style={[estilosReportsMove.textoQuantidade, { color: estilosAcao.corPrimaria, fontSize: 12 * fontScale }]}>
                        {mov.operacao === 'Entrada' ? '+' : '-'}{mov.qtd} pacotes
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}