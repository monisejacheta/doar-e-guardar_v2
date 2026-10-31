// src/app/audit.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Text,
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '../context/ThemeContext';
import { estilosAudit } from '../styles/audit.styles';
import { requisicaoApi } from '../services/api';
import { auth } from '../services/firebaseConfig';
import { AppInput } from '../components/common/AppInput';
import { AppButton } from '../components/common/AppButton';

export default function AuditScreen() {
  const roteador = useRouter();
  const { theme, tokens, fontScale } = useAppTheme();

  const [movimentacoes, setMovimentacoes] = useState<any[]>([]);
  const [lotesSistema, setLotesSistema] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [recarregando, setRecarregando] = useState(false);

  // Estados dos Modais
  const [modalBuscaLoteVisivel, setModalBuscaLoteVisivel] = useState(false);
  const [modalAjusteVisivel, setModalAjusteVisivel] = useState(false);
  
  // Estados do Formulário de Ajuste
  const [termoBuscaLote, setTermoBuscaLote] = useState('');
  const [loteSelecionado, setLoteSelecionado] = useState<any | null>(null);
  const [quantidadeFisica, setQuantidadeFisica] = useState('');
  const [justificativaAjuste, setJustificativaAjuste] = useState('');
  const [processandoAjuste, setProcessandoAjuste] = useState(false);

  // Cor principal da tela (Índigo/Roxo para Auditoria)
  const corAuditoria = '#6366F1'; 
  const corFundoAuditoria = '#EEF2FF';
  const corBordaAuditoria = '#C7D2FE';

  const carregarDados = useCallback(async () => {
    try {
      setCarregando(true);
      
      const [respMov, respEst] = await Promise.all([
        requisicaoApi('/api/estoque', { metodo: 'POST', dados: { modulo: 'estoque', acao: 'consultar_movimentacoes' } }),
        requisicaoApi('/api/estoque', { metodo: 'POST', dados: { modulo: 'estoque', acao: 'consultar_estoque' } })
      ]) as any[];

      if (respMov?.sucesso) setMovimentacoes(respMov.movimentacoes || []);
      if (respEst?.sucesso) setLotesSistema(respEst.lotes || []);

    } catch (erro) {
      Alert.alert('Erro', 'Não foi possível carregar os dados de auditoria da AWS.');
    } finally {
      setCarregando(false);
      setRecarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  // Cálculos do Termômetro de Saúde
  const { saudeEstoque, totalAjustes, logsDeAjuste } = useMemo(() => {
    const totalOperacoes = movimentacoes.length;
    const ajustes = movimentacoes.filter(m => m.operacao === 'Ajuste');
    const qtdAjustes = ajustes.length;
    
    // Matemática Gamificada: Começa em 100%. Cada ajuste tira precisão (ex: (total - ajustes) / total).
    // Se não houver operações, 100%.
    const acuracia = totalOperacoes > 0 
      ? Math.max(0, Math.round(((totalOperacoes - qtdAjustes) / totalOperacoes) * 100))
      : 100;

    return {
      saudeEstoque: acuracia,
      totalAjustes: qtdAjustes,
      logsDeAjuste: ajustes
    };
  }, [movimentacoes]);

  // Filtro da busca no modal
  const lotesFiltrados = useMemo(() => {
    const termo = termoBuscaLote.toLowerCase().trim();
    if (!termo) return [];
    return lotesSistema.filter(l => 
      (l.nome_produto || '').toLowerCase().includes(termo) ||
      (l.numero_codigo_lote || '').toLowerCase().includes(termo) ||
      (l.codigo_barra_produto || '').includes(termo)
    ).slice(0, 15); // Limita a 15 para não pesar o modal
  }, [lotesSistema, termoBuscaLote]);

  const abrirModalAjuste = (lote: any) => {
    setLoteSelecionado(lote);
    setQuantidadeFisica('');
    setJustificativaAjuste('');
    setModalBuscaLoteVisivel(false);
    setModalAjusteVisivel(true);
  };

  const confirmarAjusteFisico = async () => {
    const qtdFisicaNum = Number(quantidadeFisica);

    if (quantidadeFisica === '' || isNaN(qtdFisicaNum) || qtdFisicaNum < 0) {
      Alert.alert('Valor Inválido', 'Informe a quantidade exata encontrada na prateleira (0 ou mais).');
      return;
    }

    if (qtdFisicaNum === Number(loteSelecionado.quantidade_atual_pacote)) {
      Alert.alert('Sem Divergência', 'O saldo físico informado é exatamente igual ao do sistema. Nenhum ajuste necessário.');
      return;
    }

    if (!justificativaAjuste.trim()) {
      Alert.alert('Atenção', 'Por segurança, você deve informar o motivo ou observação sobre esta discrepância.');
      return;
    }

    setProcessandoAjuste(true);
    try {
      const resposta: any = await requisicaoApi('/api/estoque', {
        metodo: 'POST',
        dados: {
          modulo: 'estoque',
          acao: 'ajustar_estoque',
          id_lote_produto: loteSelecionado.id_lote_produto,
          nova_quantidade: qtdFisicaNum,
          justificativa: justificativaAjuste,
          id_usuario: auth.currentUser?.email || 'Auditor',
        },
      });

      if (resposta?.sucesso) {
        setModalAjusteVisivel(false);
        Alert.alert(
          'Auditoria Concluída!',
          `Estoque corrigido com sucesso. Diferença de ${resposta.diferenca > 0 ? '+' : ''}${resposta.diferenca} pacote(s) registrada no histórico.`,
          [{ text: 'OK', onPress: () => carregarDados() }]
        );
      } else {
        Alert.alert('Falha no Ajuste', resposta?.mensagem || 'Erro ao processar na AWS.');
      }
    } catch (erro: any) {
      Alert.alert('Erro', erro.message || 'Falha de comunicação.');
    } finally {
      setProcessandoAjuste(false);
    }
  };

  const formatarDataAmigavel = (dataIso: string) => {
    try {
      if (!dataIso) return '';
      const [data, hora] = dataIso.split('T');
      const [ano, mes, dia] = data.split('-');
      return `${dia}/${mes}/${ano} às ${hora.substring(0, 5)}`;
    } catch {
      return dataIso;
    }
  };

  return (
    <SafeAreaView style={[estilosAudit.container, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={estilosAudit.rolagem}
        refreshControl={<RefreshControl refreshing={recarregando} onRefresh={() => { setRecarregando(true); carregarDados(); }} tintColor={corAuditoria} />}
      >
        <TouchableOpacity onPress={() => roteador.back()} style={estilosAudit.botaoVoltar}>
          <Feather name="arrow-left" size={22} color={corAuditoria} />
          <Text style={[estilosAudit.textoBotaoVoltar, { color: corAuditoria, fontSize: 15 * fontScale }]}>Voltar</Text>
        </TouchableOpacity>

        <View style={estilosAudit.cabecalho}>
          <Text style={[estilosAudit.titulo, { color: corAuditoria, fontSize: tokens.typography.fontSize.xl * fontScale }]}>
            Histórico e Auditoria
          </Text>
          <Text style={[estilosAudit.subtitulo, { color: theme.subtext, fontSize: tokens.typography.fontSize.sm * fontScale }]}>
            Realize o balanço físico nas prateleiras e acompanhe os ajustes feitos no sistema.
          </Text>
        </View>

        {/* TERMÔMETRO DE SAÚDE GAMIFICADO */}
        {!carregando && (
          <View style={[estilosAudit.cardSaude, { backgroundColor: corFundoAuditoria, borderColor: corBordaAuditoria, borderWidth: 1.5 }]}>
            <View style={[estilosAudit.indicadorBox, { borderColor: saudeEstoque >= 95 ? '#10B981' : saudeEstoque >= 80 ? '#F59E0B' : theme.danger }]}>
              <Text style={[estilosAudit.indicadorTexto, { color: saudeEstoque >= 95 ? '#059669' : saudeEstoque >= 80 ? '#D97706' : theme.danger }]}>
                {saudeEstoque}%
              </Text>
            </View>
            <View style={estilosAudit.textoSaudeContainer}>
              <Text style={[estilosAudit.tituloSaude, { color: corAuditoria, fontSize: 14 * fontScale }]}>
                Precisão do Estoque
              </Text>
              <Text style={[estilosAudit.subtituloSaude, { color: '#4F46E5', fontSize: 11 * fontScale }]}>
                {saudeEstoque >= 95 
                  ? "Excelente! Nossos estoques físico e digital estão super alinhados." 
                  : saudeEstoque >= 80 
                  ? "Bom, mas temos algumas discrepâncias recentes. Fique de olho!"
                  : "Atenção: Muitas diferenças encontradas entre o sistema e as prateleiras."}
              </Text>
            </View>
          </View>
        )}

        {/* BOTÃO PRINCIPAL DE AUDITORIA */}
        <TouchableOpacity
          onPress={() => {
            setTermoBuscaLote('');
            setModalBuscaLoteVisivel(true);
          }}
          style={[estilosAudit.botaoAuditoria, { backgroundColor: corAuditoria }]}
        >
          <Feather name="check-square" size={20} color="#FFFFFF" />
          <Text style={[estilosAudit.botaoAuditoriaTexto, { color: '#FFFFFF', fontSize: 14 * fontScale }]}>
            Realizar Conferência Física
          </Text>
        </TouchableOpacity>

        {/* HISTÓRICO SENSÍVEL DE AUDITORIA */}
        <View style={estilosAudit.tituloSecaoRow}>
          <Feather name="shield" size={18} color={theme.text} />
          <Text style={[estilosAudit.tituloSecao, { color: theme.text, fontSize: 14 * fontScale }]}>
            Logs de Correção ({totalAjustes})
          </Text>
        </View>

        {carregando ? (
          <ActivityIndicator size="large" color={corAuditoria} style={{ marginTop: 20 }} />
        ) : logsDeAjuste.length === 0 ? (
          <View style={[estilosAudit.emptyBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Feather name="check-circle" size={32} color="#10B981" />
            <Text style={[estilosAudit.emptyTitle, { color: theme.text, fontSize: 13.5 * fontScale }]}>Tudo Perfeito</Text>
            <Text style={[estilosAudit.emptySubtitle, { color: theme.subtext, fontSize: 11.5 * fontScale }]}>
              Nenhum ajuste de auditoria foi necessário até o momento.
            </Text>
          </View>
        ) : (
          <View>
            {logsDeAjuste.map((log) => {
              const diferenca = log.qtd; // Backend devolve abs(diferenca)
              const [txtSist, txtFis] = (log.motivo_saida || '').split('|');

              return (
                <View key={log.id_movimentacao_estoque} style={[estilosAudit.cardLog, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  <View style={estilosAudit.linhaTopoLog}>
                    <View style={[estilosAudit.badgeAjuste, { backgroundColor: corFundoAuditoria }]}>
                      <MaterialCommunityIcons name="tools" size={14} color={corAuditoria} />
                      <Text style={[estilosAudit.badgeAjusteTexto, { color: corAuditoria, fontSize: 10 * fontScale }]}>Ajuste Manual</Text>
                    </View>
                    <Text style={[estilosAudit.textoDataLog, { color: theme.subtext, fontSize: 10 * fontScale }]}>{formatarDataAmigavel(log.data)}</Text>
                  </View>

                  <Text style={[estilosAudit.textoProdutoLog, { color: theme.text, fontSize: 13.5 * fontScale }]}>{log.nome}</Text>
                  <Text style={[estilosAudit.textoMetadadosLog, { color: theme.subtext, fontSize: 11 * fontScale }]}>Lote: {log.lote} • Local: {log.local}</Text>

                  <View style={[estilosAudit.caixaComparacao, { backgroundColor: theme.background }]}>
                    <Text style={[estilosAudit.textoComparacao, { color: theme.text, fontSize: 11.5 * fontScale, flex: 1 }]}>
                      {txtSist} <Feather name="arrow-right" size={12} /> {txtFis}
                    </Text>
                    <Text style={{ color: theme.danger, fontWeight: '900', fontSize: 12 * fontScale }}>
                      Δ {diferenca} pct(s)
                    </Text>
                  </View>
                  
                  {log.justificativa && (
                    <Text style={{ color: theme.subtext, fontSize: 11 * fontScale, fontStyle: 'italic', marginBottom: 10 }}>
                      Motivo: {log.justificativa}
                    </Text>
                  )}

                  <View style={estilosAudit.rodapeLog}>
                    <Feather name="user" size={12} color="#64748B" />
                    <Text style={[estilosAudit.textoResponsavelLog, { color: '#64748B', fontSize: 10 * fontScale }]}>{log.responsavel}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* MODAL 1: Buscar Lote para Conferência */}
      <Modal visible={modalBuscaLoteVisivel} transparent={true} animationType="fade">
        <View style={estilosAudit.modalOverlay}>
          <View style={[estilosAudit.modalCard, { borderColor: corBordaAuditoria, borderWidth: 1.5 }]}>
            <View style={estilosAudit.modalHeaderRow}>
              <Text style={[estilosAudit.modalTitulo, { color: corAuditoria, fontSize: 16 * fontScale }]}>Localizar Lote</Text>
              <TouchableOpacity onPress={() => setModalBuscaLoteVisivel(false)}><Feather name="x" size={20} color="#64748B" /></TouchableOpacity>
            </View>
            <Text style={{ color: theme.subtext, fontSize: 11.5 * fontScale, marginBottom: 12 }}>
              Digite o nome ou código de barras do produto que você está conferindo fisicamente.
            </Text>
            
            <View style={[estilosAudit.inputBuscaModal, { backgroundColor: theme.background, borderColor: theme.border }]}>
              <Feather name="search" size={16} color="#94A3B8" style={{ marginRight: 8 }} />
              <TextInput
                placeholder="Ex: Arroz, 78910..."
                value={termoBuscaLote}
                onChangeText={setTermoBuscaLote}
                autoFocus
                style={{ flex: 1, color: theme.text }}
              />
            </View>

            <ScrollView style={{ maxHeight: 250 }} showsVerticalScrollIndicator={false}>
              {lotesFiltrados.map(lote => (
                <TouchableOpacity 
                  key={lote.id_lote_produto} 
                  onPress={() => abrirModalAjuste(lote)}
                  style={[estilosAudit.itemListaLote, { backgroundColor: theme.surface, borderColor: theme.border }]}
                >
                  <Text style={[estilosAudit.textoLoteModal, { color: theme.text, fontSize: 12.5 * fontScale }]} numberOfLines={1}>{lote.nome_produto}</Text>
                  <View style={estilosAudit.linhaLoteModal}>
                    <Text style={{ color: theme.subtext, fontSize: 11 * fontScale }}>Lote: {lote.numero_codigo_lote}</Text>
                    <Text style={[estilosAudit.textoQtdModal, { color: corAuditoria, fontSize: 11 * fontScale }]}>{lote.quantidade_atual_pacote} pct(s)</Text>
                  </View>
                  <Text style={{ color: theme.subtext, fontSize: 10 * fontScale }}>{lote.local_descricao}</Text>
                </TouchableOpacity>
              ))}
              {termoBuscaLote.length > 2 && lotesFiltrados.length === 0 && (
                <Text style={{ textAlign: 'center', marginTop: 20, color: theme.subtext }}>Nenhum lote ativo encontrado.</Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* MODAL 2: Inserir Quantidade Física (Ajuste) */}
      <Modal visible={modalAjusteVisivel} transparent={true} animationType="slide">
        <View style={estilosAudit.modalOverlay}>
          <View style={[estilosAudit.modalCard, { borderColor: corBordaAuditoria, borderWidth: 1.5 }]}>
            <View style={estilosAudit.modalHeaderRow}>
              <Text style={[estilosAudit.modalTitulo, { color: corAuditoria, fontSize: 16 * fontScale }]}>Auditoria de Saldo</Text>
              <TouchableOpacity onPress={() => setModalAjusteVisivel(false)}><Feather name="x" size={20} color="#64748B" /></TouchableOpacity>
            </View>

            <View style={[estilosAudit.boxInfoAtual, { backgroundColor: corFundoAuditoria, borderColor: corBordaAuditoria }]}>
              <Text style={{ fontWeight: '800', color: theme.text, fontSize: 14 * fontScale, textAlign: 'center' }}>{loteSelecionado?.nome_produto}</Text>
              <Text style={{ color: theme.subtext, fontSize: 11 * fontScale, marginTop: 4 }}>Lote: {loteSelecionado?.numero_codigo_lote} | Local: {loteSelecionado?.local_descricao}</Text>
              <Text style={{ fontWeight: '900', color: corAuditoria, fontSize: 18 * fontScale, marginTop: 10 }}>
                Sistema informa: {loteSelecionado?.quantidade_atual_pacote} pcts
              </Text>
            </View>

            <AppInput
              rotulo="Quantidade encontrada na prateleira:"
              placeholder="Ex: Se encontrou 14, digite 14."
              keyboardType="numeric"
              value={quantidadeFisica}
              onChangeText={setQuantidadeFisica}
            />

            <AppInput
              rotulo="Justificativa da diferença:"
              placeholder="Ex: Embalagem danificada não registrada."
              value={justificativaAjuste}
              onChangeText={setJustificativaAjuste}
            />

            <View style={{ marginTop: 16 }}>
              {processandoAjuste ? (
                <ActivityIndicator size="large" color={corAuditoria} />
              ) : (
                <AppButton
                  title="Confirmar Ajuste Físico"
                  variant="primary"
                  onPress={confirmarAjusteFisico}
                  style={{ backgroundColor: corAuditoria }}
                />
              )}
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}