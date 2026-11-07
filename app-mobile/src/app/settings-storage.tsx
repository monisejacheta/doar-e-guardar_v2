// app-mobile/src/app/settings-storage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Text,
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
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

  // Formulário de nova prateleira (US06)
  const [nomeLocal, setNomeLocal] = useState('');
  const [tipoLocal, setTipoLocal] = useState<'armário' | 'geladeira'>('armário');
  const [sublocal, setSublocal] = useState('');
  const [ambiente, setAmbiente] = useState('Despensa Principal');
  const [salvandoNovo, setSalvandoNovo] = useState(false);

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
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
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

        {/* Lista de Prateleiras Cadastradas na AWS */}
        <Text style={{ fontWeight: '800', color: theme.text, fontSize: 15 * fontScale, marginBottom: 10 }}>
          Prateleiras Cadastradas ({locais.length})
        </Text>

        {carregando ? (
          <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 20 }} />
        ) : (
          <View style={{ gap: 10 }}>
            {locais.map((loc) => {
              const ocupado = (loc.quantidade_pacotes_alocados || 0) > 0;
              return (
                <View
                  key={loc.id_local_armazenamento}
                  style={{
                    backgroundColor: theme.surface,
                    borderColor: ocupado ? `${theme.primary}60` : theme.border,
                    borderWidth: 1.5,
                    borderRadius: 14,
                    padding: 14,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 10 }}>
                    <View
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: 12,
                        backgroundColor: loc.tipo_local === 'geladeira' ? '#E0F2FE' : '#ECFDF5',
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginRight: 12,
                      }}
                    >
                      <Feather
                        name={loc.tipo_local === 'geladeira' ? 'thermometer' : 'archive'}
                        size={20}
                        color={loc.tipo_local === 'geladeira' ? '#0284C7' : '#059669'}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontWeight: '800', color: theme.text, fontSize: 13.5 * fontScale }}>
                        {loc.local_descricao}
                      </Text>
                      <Text style={{ color: theme.subtext, fontSize: 11 * fontScale, marginTop: 2 }}>
                        {loc.localizacao_ambiente} • ID: {loc.id_local_armazenamento}
                      </Text>
                      <Text
                        style={{
                          color: ocupado ? theme.primary : theme.subtext,
                          fontWeight: ocupado ? '700' : '500',
                          fontSize: 11 * fontScale,
                          marginTop: 3,
                        }}
                      >
                        {ocupado
                          ? `${loc.quantidade_lotes_ativos} lote(s) ativo(s) • ${loc.quantidade_pacotes_alocados} pacote(s)`
                          : 'Prateleira livre (0 pacotes)'}
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel={`Excluir prateleira ${loc.local_descricao}`}
                    onPress={() => confirmarExclusao(loc)}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      backgroundColor: ocupado ? '#F1F5F9' : '#FEF2F2',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <Feather name={ocupado ? 'lock' : 'trash-2'} size={17} color={ocupado ? '#94A3B8' : theme.danger} />
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
