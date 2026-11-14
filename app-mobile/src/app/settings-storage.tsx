// app-mobile/src/app/settings-storage.tsx
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
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAppTheme } from '../context/ThemeContext';
import { AppInput } from '../components/common/AppInput';
import { AppButton } from '../components/common/AppButton';
import {
  LocalArmazenamento,
  carregarPrateleirasAws,
  cadastrarPrateleiraAws,
  excluirPrateleiraAws,
} from '../services/storageLocations';
import { requisicaoApi } from '../services/api';
import { auth } from '../services/firebaseConfig';

export default function SettingsStorageScreen() {
  const roteador = useRouter();
  const { theme, tokens, fontScale } = useAppTheme();

  const [locais, setLocais] = useState<LocalArmazenamento[]>([]);
  const [lotesParaSincronizar, setLotesParaSincronizar] = useState<any[]>([]);
  const [discrepanciasDetectadas, setDiscrepanciasDetectadas] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [recarregando, setRecarregando] = useState(false);
  const [sincronizandoAws, setSincronizandoAws] = useState(false);

  // Filtros e Organização de Prateleiras
  const [filtroTipo, setFiltroTipo] = useState<'TODOS' | 'armário' | 'geladeira'>('TODOS');
  const [buscaTermo, setBuscaTermo] = useState('');

  // Formulário de nova prateleira (US06)
  const [nomeLocal, setNomeLocal] = useState('');
  const [tipoLocal, setTipoLocal] = useState<'armário' | 'geladeira'>('armário');
  const [sublocal, setSublocal] = useState('');
  const [ambiente, setAmbiente] = useState('Despensa Principal');
  const [salvandoNovo, setSalvandoNovo] = useState(false);

  const locaisFiltrados = useMemo(() => {
    return locais.filter((l) => {
      if (filtroTipo !== 'TODOS' && l.tipo_local !== filtroTipo) {
        return false;
      }
      if (buscaTermo.trim()) {
        const termo = buscaTermo.trim().toLowerCase();
        return (
          l.local_descricao.toLowerCase().includes(termo) ||
          l.nome_local.toLowerCase().includes(termo) ||
          l.sublocal_compartimento.toLowerCase().includes(termo) ||
          (l.localizacao_ambiente || '').toLowerCase().includes(termo)
        );
      }
      return true;
    });
  }, [locais, filtroTipo, buscaTermo]);

  const locaisAgrupadosPorMovel = useMemo(() => {
    const grupos: Record<string, LocalArmazenamento[]> = {};
    locaisFiltrados.forEach((l) => {
      const chave = l.nome_local || 'Outros Compartimentos';
      if (!grupos[chave]) grupos[chave] = [];
      grupos[chave].push(l);
    });
    return grupos;
  }, [locaisFiltrados]);

  const carregarDados = useCallback(async (silencioso = false) => {
    try {
      if (!silencioso) setCarregando(true);
      const resultado = await carregarPrateleirasAws();
      setLocais(resultado.locais);
      setDiscrepanciasDetectadas(resultado.discrepanciasCorrigidas);
      setLotesParaSincronizar(
        resultado.lotesNormalizados.filter(
          (l: any) => l.local_descricao_original && l.local_descricao_original !== l.local_descricao
        )
      );
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar as prateleiras cadastradas na AWS.');
    } finally {
      setCarregando(false);
      setRecarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const normalizarLotesDivergentesNaAws = async () => {
    if (lotesParaSincronizar.length === 0) {
      Alert.alert('Tudo Sincronizado', 'Todos os lotes ativos na AWS já utilizam a nomenclatura canônica de prateleiras.');
      return;
    }

    setSincronizandoAws(true);
    try {
      const usuario = auth.currentUser?.email || 'Administrador';
      for (const lote of lotesParaSincronizar) {
        await requisicaoApi('/api/estoque', {
          metodo: 'POST',
          dados: {
            modulo: 'estoque',
            acao: 'cadastrar_lote',
            lote: {
              ...lote,
              eh_transferencia_interna: true,
              local_origem: lote.local_descricao_original,
            },
            id_usuario: usuario,
          },
        });
      }
      await carregarDados(true);
      Alert.alert(
        'Banco AWS Normalizado!',
        `${lotesParaSincronizar.length} lote(s) tiveram suas prateleiras e IDs atualizados na AWS com sucesso.`
      );
    } catch {
      Alert.alert('Aviso', 'A normalização local foi aplicada, mas houve oscilação ao gravar um dos lotes na nuvem.');
    } finally {
      setSincronizandoAws(false);
    }
  };

  const salvarNovaPrateleira = async () => {
    setSalvandoNovo(true);
    try {
      const res = await cadastrarPrateleiraAws({
        nome_local: nomeLocal,
        tipo_local: tipoLocal,
        sublocal_compartimento: sublocal,
        localizacao_ambiente: ambiente,
      });

      if (res.sucesso) {
        setNomeLocal('');
        setSublocal('');
        await carregarDados(true);
        Alert.alert('Prateleira Homologada', res.mensagem);
      } else {
        Alert.alert('Atenção (Regra US06)', res.mensagem);
      }
    } finally {
      setSalvandoNovo(false);
    }
  };

  const confirmarExclusao = (loc: LocalArmazenamento) => {
    if ((loc.quantidade_pacotes_alocados || 0) > 0) {
      Alert.alert(
        'Exclusão Bloqueada (US06)',
        `A prateleira "${loc.local_descricao}" possui ${loc.quantidade_lotes_ativos} lote(s) ativo(s) (${loc.quantidade_pacotes_alocados} pacotes).\n\nTransfira os pacotes em "Movimentação Interna" antes de excluir o compartimento.`
      );
      return;
    }

    Alert.alert(
      'Remover Prateleira',
      `Deseja remover "${loc.local_descricao}" do catálogo de armazenamento?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            const res = await excluirPrateleiraAws(loc);
            if (res.sucesso) {
              await carregarDados(true);
            } else {
              Alert.alert('Não Permitido', res.mensagem);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={recarregando}
            onRefresh={() => {
              setRecarregando(true);
              carregarDados(true);
            }}
            tintColor={theme.primary}
          />
        }
      >
        <TouchableOpacity
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Voltar para a tela anterior"
          onPress={() => roteador.back()}
          style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16, minHeight: 40 }}
        >
          <Feather name="arrow-left" size={22} color={theme.primary} />
          <Text style={{ color: theme.primary, fontWeight: '700', marginLeft: 8, fontSize: 15 * fontScale }}>
            Voltar
          </Text>
        </TouchableOpacity>

        <View style={{ marginBottom: 18 }}>
          <Text style={{ fontWeight: '800', color: theme.primary, fontSize: tokens.typography.fontSize.xl * fontScale }}>
            Locais e Prateleiras (AWS)
          </Text>
          <Text style={{ color: theme.subtext, fontSize: tokens.typography.fontSize.sm * fontScale, marginTop: 4 }}>
            Gerencie os armários e geladeiras homologados no banco de dados da AWS (Regra US06: vedados corredores ou ruas).
          </Text>
        </View>

        {/* Card de Verificação de Discrepâncias no Banco AWS */}
        <View
          style={{
            backgroundColor: discrepanciasDetectadas > 0 ? '#FFFBEB' : '#ECFDF5',
            borderColor: discrepanciasDetectadas > 0 ? '#F59E0B' : '#10B981',
            borderWidth: 1.5,
            borderRadius: 14,
            padding: 14,
            marginBottom: 18,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
            <Feather
              name={discrepanciasDetectadas > 0 ? 'alert-circle' : 'check-circle'}
              size={18}
              color={discrepanciasDetectadas > 0 ? '#D97706' : '#059669'}
              style={{ marginRight: 8 }}
            />
            <Text
              style={{
                fontWeight: '800',
                color: discrepanciasDetectadas > 0 ? '#92400E' : '#065F46',
                fontSize: 13 * fontScale,
              }}
            >
              {discrepanciasDetectadas > 0
                ? `Auditoria de Prateleiras: ${discrepanciasDetectadas} divergência(s) detectada(s)`
                : 'Integridade de Prateleiras AWS: 100% Sincronizado'}
            </Text>
          </View>
          <Text
            style={{
              color: discrepanciasDetectadas > 0 ? '#B45309' : '#047857',
              fontSize: 11.5 * fontScale,
              lineHeight: 17,
            }}
          >
            {discrepanciasDetectadas > 0
              ? 'Foram identificados lotes com abreviações ("Prat.") ou IDs genéricos ("loc_arm"). Eles já foram reconciliados nas telas de Entrada e Movimentação.'
              : 'Todas as prateleiras utilizadas nas telas de Entrada, Movimentação Interna e Relatórios possuem IDs únicos e nomenclatura padronizada.'}
          </Text>

          {lotesParaSincronizar.length > 0 && (
            <TouchableOpacity
              onPress={normalizarLotesDivergentesNaAws}
              disabled={sincronizandoAws}
              style={{
                marginTop: 10,
                backgroundColor: '#D97706',
                borderRadius: 10,
                paddingVertical: 10,
                alignItems: 'center',
              }}
            >
              {sincronizandoAws ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 12 * fontScale }}>
                  Persistir Normalização nos Lotes da AWS ({lotesParaSincronizar.length})
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Formulário de Cadastro de Nova Prateleira */}
        <View
          style={{
            backgroundColor: theme.surface,
            borderColor: theme.border,
            borderWidth: 1.5,
            borderRadius: 16,
            padding: 16,
            marginBottom: 20,
          }}
        >
          <Text style={{ fontWeight: '800', color: theme.text, fontSize: 15 * fontScale, marginBottom: 12 }}>
            Cadastrar Nova Prateleira / Gaveta
          </Text>

          <Text style={{ fontWeight: '600', color: theme.text, fontSize: 12 * fontScale, marginBottom: 8 }}>
            Tipo de Equipamento (Restrito pela US06) *
          </Text>
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
            {(['armário', 'geladeira'] as const).map((tipo) => {
              const ativo = tipoLocal === tipo;
              return (
                <TouchableOpacity
                  key={tipo}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityState={{ selected: ativo }}
                  onPress={() => {
                    setTipoLocal(tipo);
                    setAmbiente(tipo === 'geladeira' ? 'Cozinha Institucional' : 'Despensa Principal');
                  }}
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    paddingVertical: 12,
                    borderRadius: 12,
                    borderWidth: 1.5,
                    backgroundColor: ativo ? theme.primary : theme.background,
                    borderColor: ativo ? theme.primary : theme.border,
                    minHeight: 48,
                  }}
                >
                  <Feather
                    name={tipo === 'geladeira' ? 'thermometer' : 'archive'}
                    size={16}
                    color={ativo ? '#FFFFFF' : theme.text}
                  />
                  <Text
                    style={{
                      fontWeight: '700',
                      color: ativo ? '#FFFFFF' : theme.text,
                      fontSize: 13 * fontScale,
                      textTransform: 'capitalize',
                    }}
                  >
                    {tipo}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <AppInput
            rotulo="Nome do Armário ou Geladeira *"
            placeholder={tipoLocal === 'geladeira' ? 'Ex: Geladeira 2' : 'Ex: Armário C'}
            value={nomeLocal}
            onChangeText={setNomeLocal}
          />

          <AppInput
            rotulo="Identificação da Prateleira ou Gaveta *"
            placeholder="Ex: Prateleira 2 ou Gaveta Superior"
            value={sublocal}
            onChangeText={setSublocal}
          />

          <AppInput
            rotulo="Ambiente Físico"
            placeholder="Ex: Despensa Principal / Cozinha"
            value={ambiente}
            onChangeText={setAmbiente}
          />

          <AppButton
            title={salvandoNovo ? 'Salvando na AWS...' : 'Homologar Prateleira na AWS'}
            variant="secondary"
            loading={salvandoNovo}
            onPress={salvarNovaPrateleira}
          />
        </View>

        {/* Seção Organizada de Prateleiras Cadastradas na AWS */}
        <View style={{ marginBottom: 12 }}>
          <Text style={{ fontWeight: '800', color: theme.text, fontSize: 16 * fontScale }}>
            Locais Cadastrados ({locaisFiltrados.length} de {locais.length})
          </Text>
          <Text style={{ color: theme.subtext, fontSize: 12 * fontScale, marginTop: 2 }}>
            Organizados por equipamento e compartimento para navegação ágil.
          </Text>
        </View>

        {/* Abas de Filtro por Equipamento */}
        <View style={{ flexDirection: 'row', gap: 6, marginBottom: 10 }}>
          {[
            { chave: 'TODOS', rotulo: `Todos (${locais.length})`, icon: 'layers' },
            { chave: 'armário', rotulo: `Armários (${locais.filter((l) => l.tipo_local === 'armário').length})`, icon: 'archive' },
            { chave: 'geladeira', rotulo: `Geladeiras (${locais.filter((l) => l.tipo_local === 'geladeira').length})`, icon: 'thermometer' },
          ].map((aba) => {
            const ativo = filtroTipo === aba.chave;
            return (
              <TouchableOpacity
                key={aba.chave}
                onPress={() => setFiltroTipo(aba.chave as any)}
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical: 8,
                  paddingHorizontal: 4,
                  borderRadius: 10,
                  borderWidth: 1.5,
                  backgroundColor: ativo ? theme.primary : theme.surface,
                  borderColor: ativo ? theme.primary : theme.border,
                }}
              >
                <Feather
                  name={aba.icon as any}
                  size={13}
                  color={ativo ? '#FFFFFF' : theme.subtext}
                  style={{ marginRight: 4 }}
                />
                <Text
                  numberOfLines={1}
                  style={{
                    fontSize: 11 * fontScale,
                    fontWeight: ativo ? '700' : '500',
                    color: ativo ? '#FFFFFF' : theme.text,
                  }}
                >
                  {aba.rotulo}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Campo de Busca Rápida de Locais */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: theme.surface,
            borderRadius: 12,
            paddingHorizontal: 12,
            paddingVertical: 8,
            marginBottom: 14,
            borderWidth: 1.5,
            borderColor: theme.border,
          }}
        >
          <Feather name="search" size={16} color="#9CA3AF" style={{ marginRight: 8 }} />
          <TextInput
            style={{ flex: 1, fontSize: 13 * fontScale, color: theme.text, padding: 0 }}
            placeholder="Buscar por armário, geladeira ou prateleira..."
            placeholderTextColor="#9CA3AF"
            value={buscaTermo}
            onChangeText={setBuscaTermo}
          />
          {buscaTermo.length > 0 && (
            <TouchableOpacity onPress={() => setBuscaTermo('')}>
              <Feather name="x" size={16} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>

        {carregando ? (
          <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 20 }} />
        ) : Object.keys(locaisAgrupadosPorMovel).length === 0 ? (
          <View
            style={{
              padding: 24,
              backgroundColor: theme.surface,
              borderRadius: 14,
              alignItems: 'center',
              borderWidth: 1.5,
              borderColor: theme.border,
            }}
          >
            <Feather name="inbox" size={32} color={theme.subtext} style={{ marginBottom: 8 }} />
            <Text style={{ color: theme.text, fontWeight: '700', fontSize: 14 * fontScale }}>
              Nenhum compartimento encontrado
            </Text>
            <Text style={{ color: theme.subtext, fontSize: 12 * fontScale, marginTop: 4, textAlign: 'center' }}>
              Tente ajustar os termos de busca ou o filtro por tipo de equipamento.
            </Text>
          </View>
        ) : (
          <View style={{ gap: 14 }}>
            {Object.entries(locaisAgrupadosPorMovel).map(([nomeMovel, listaCompartimentos]) => {
              const ehGeladeira = listaCompartimentos[0]?.tipo_local === 'geladeira';
              const ambienteMovel = listaCompartimentos[0]?.localizacao_ambiente || 'Despensa';
              const totalPacotesNoMovel = listaCompartimentos.reduce(
                (acc, cur) => acc + (cur.quantidade_pacotes_alocados || 0),
                0
              );

              return (
                <View
                  key={nomeMovel}
                  style={{
                    backgroundColor: theme.surface,
                    borderRadius: 16,
                    borderWidth: 1.5,
                    borderColor: theme.border,
                    padding: 14,
                    overflow: 'hidden',
                  }}
                >
                  {/* Cabeçalho do Equipamento */}
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingBottom: 10,
                      borderBottomWidth: 1,
                      borderBottomColor: theme.border,
                      marginBottom: 10,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }}>
                      <View
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          backgroundColor: ehGeladeira ? '#E0F2FE' : '#ECFDF5',
                          justifyContent: 'center',
                          alignItems: 'center',
                          marginRight: 10,
                        }}
                      >
                        <Feather
                          name={ehGeladeira ? 'thermometer' : 'archive'}
                          size={18}
                          color={ehGeladeira ? '#0284C7' : '#059669'}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontWeight: '800', color: theme.text, fontSize: 14 * fontScale }}>
                          {nomeMovel}
                        </Text>
                        <Text style={{ color: theme.subtext, fontSize: 11 * fontScale }}>
                          {ambienteMovel} • {listaCompartimentos.length} compartimento(s)
                        </Text>
                      </View>
                    </View>

                    <View
                      style={{
                        backgroundColor: totalPacotesNoMovel > 0 ? `${theme.primary}15` : '#F3F4F6',
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 8,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 10.5 * fontScale,
                          fontWeight: '700',
                          color: totalPacotesNoMovel > 0 ? theme.primary : theme.subtext,
                        }}
                      >
                        {totalPacotesNoMovel} pcts
                      </Text>
                    </View>
                  </View>

                  {/* Lista de Compartimentos deste Equipamento */}
                  <View style={{ gap: 8 }}>
                    {listaCompartimentos.map((loc) => {
                      const ocupado = (loc.quantidade_pacotes_alocados || 0) > 0;
                      return (
                        <View
                          key={loc.id_local_armazenamento}
                          style={{
                            backgroundColor: ocupado ? '#F8FAFC' : '#FFFFFF',
                            borderColor: ocupado ? `${theme.primary}40` : '#E2E8F0',
                            borderWidth: 1,
                            borderRadius: 12,
                            paddingVertical: 9,
                            paddingHorizontal: 12,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          <View style={{ flex: 1, marginRight: 10 }}>
                            <Text style={{ fontWeight: '700', color: theme.text, fontSize: 13 * fontScale }}>
                              {loc.sublocal_compartimento || loc.local_descricao}
                            </Text>
                            <Text
                              style={{
                                color: ocupado ? theme.primary : theme.subtext,
                                fontWeight: ocupado ? '700' : '500',
                                fontSize: 11 * fontScale,
                                marginTop: 2,
                              }}
                            >
                              {ocupado
                                ? `${loc.quantidade_lotes_ativos} lote(s) • ${loc.quantidade_pacotes_alocados} pacotes`
                                : 'Livre (0 pacotes)'}
                            </Text>
                          </View>

                          <TouchableOpacity
                            accessible={true}
                            accessibilityRole="button"
                            accessibilityLabel={`Excluir prateleira ${loc.local_descricao}`}
                            onPress={() => confirmarExclusao(loc)}
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: 8,
                              backgroundColor: ocupado ? '#F1F5F9' : '#FEF2F2',
                              justifyContent: 'center',
                              alignItems: 'center',
                            }}
                          >
                            <Feather
                              name={ocupado ? 'lock' : 'trash-2'}
                              size={15}
                              color={ocupado ? '#94A3B8' : theme.danger}
                            />
                          </TouchableOpacity>
                        </View>
                      );
                    })}
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
