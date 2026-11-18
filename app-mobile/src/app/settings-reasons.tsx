// src/app/settings-reasons.tsx
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAppTheme } from '../context/ThemeContext';
import { AppInput } from '../components/common/AppInput';
import { AppButton } from '../components/common/AppButton';
import { requisicaoApi } from '../services/api';

interface MotivoSaidaAws {
  id_motivo_saida: string;
  nome_motivo_saida: string;
  exige_confirmacao_perda: boolean;
  regra?: string;
}

export default function SettingsReasonsScreen() {
  const roteador = useRouter();
  const { theme, tokens, fontScale } = useAppTheme();

  const [motivos, setMotivos] = useState<MotivoSaidaAws[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const [nomeMotivo, setNomeMotivo] = useState('');
  const [regra, setRegra] = useState('');
  const [exigePerda, setExigePerda] = useState(false);

  const carregarMotivos = useCallback(async () => {
    try {
      const resp: any = await requisicaoApi('/api/configuracoes', {
        metodo: 'POST',
        dados: { modulo: 'configuracoes', acao: 'motivos_saida', subacao: 'listar' },
      });
      if (resp?.sucesso && Array.isArray(resp.motivos_saida)) {
        setMotivos(resp.motivos_saida);
      } else {
        setMotivos([]);
      }
    } catch (err: any) {
      Alert.alert('Erro ao carregar', err?.message || 'Não foi possível consultar os motivos na AWS.');
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }, []);

  useEffect(() => {
    carregarMotivos();
  }, [carregarMotivos]);

  const cadastrarMotivo = async () => {
    if (!nomeMotivo.trim()) {
      Alert.alert('Campo obrigatório', 'Informe o nome do motivo de saída.');
      return;
    }
    setSalvando(true);
    try {
      const resp: any = await requisicaoApi('/api/configuracoes', {
        metodo: 'POST',
        dados: {
          modulo: 'configuracoes',
          acao: 'motivos_saida',
          subacao: 'cadastrar',
          nome_motivo: nomeMotivo.trim(),
          exige_perda: exigePerda,
          regra: regra.trim(),
        },
      });
      if (resp?.sucesso) {
        setNomeMotivo('');
        setRegra('');
        setExigePerda(false);
        await carregarMotivos();
      } else {
        Alert.alert('Aviso', resp?.mensagem || 'Não foi possível salvar o motivo.');
      }
    } catch (err: any) {
      Alert.alert('Erro', err?.message || 'Falha ao cadastrar motivo na AWS.');
    } finally {
      setSalvando(false);
    }
  };

  const excluirMotivo = (item: MotivoSaidaAws) => {
    Alert.alert('Excluir Motivo', `Deseja remover "${item.nome_motivo_saida}" da AWS?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            await requisicaoApi('/api/configuracoes', {
              metodo: 'POST',
              dados: {
                modulo: 'configuracoes',
                acao: 'motivos_saida',
                subacao: 'excluir',
                id_motivo_saida: item.id_motivo_saida,
              },
            });
            await carregarMotivos();
          } catch (err: any) {
            Alert.alert('Erro', err?.message || 'Não foi possível excluir o motivo.');
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 110 }}
        refreshControl={
          <RefreshControl
            refreshing={atualizando}
            onRefresh={() => {
              setAtualizando(true);
              carregarMotivos();
            }}
            colors={[theme.primary]}
          />
        }
      >
        <TouchableOpacity
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Voltar para Configurações"
          onPress={() => roteador.back()}
          style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16, minHeight: 44 }}
        >
          <Feather name="arrow-left" size={20} color={theme.primary} />
          <Text style={{ color: theme.primary, fontWeight: 'bold', marginLeft: 8, fontSize: 15 * fontScale }}>
            Voltar às Configurações
          </Text>
        </TouchableOpacity>

        <Text style={{ fontWeight: '800', color: theme.primary, fontSize: tokens.typography.fontSize.xl * fontScale, marginBottom: 6 }}>
          Motivos de Saída
        </Text>
        <Text style={{ color: theme.subtext, fontSize: 13 * fontScale, marginBottom: 16 }}>
          Gerencie os motivos de baixa no estoque sincronizados com a AWS.
        </Text>

        <View
          style={{
            backgroundColor: theme.surface,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: theme.border,
            padding: 16,
            marginBottom: 20,
          }}
        >
          <Text style={{ fontWeight: '700', color: theme.text, marginBottom: 10, fontSize: 14 * fontScale }}>
            Novo Motivo de Saída
          </Text>
          <AppInput
            rotulo="Nome do motivo"
            placeholder="Ex: Consumo na Cozinha"
            value={nomeMotivo}
            onChangeText={setNomeMotivo}
          />
          <AppInput
            rotulo="Descrição / Regra (opcional)"
            placeholder="Quando utilizar este motivo"
            value={regra}
            onChangeText={setRegra}
          />
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <Text style={{ color: theme.text, fontSize: 13 * fontScale, flex: 1, paddingRight: 8 }}>
              Exige confirmação "PERDA" (descarte)
            </Text>
            <Switch value={exigePerda} onValueChange={setExigePerda} />
          </View>
          <AppButton
            title={salvando ? 'Salvando na AWS...' : 'Cadastrar Motivo'}
            onPress={cadastrarMotivo}
            disabled={salvando}
          />
        </View>

        {carregando ? (
          <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 20 }} />
        ) : motivos.length === 0 ? (
          <View style={{ padding: 20, backgroundColor: theme.surface, borderRadius: 14, alignItems: 'center' }}>
            <Text style={{ color: theme.subtext, fontSize: 13 * fontScale }}>
              Nenhum motivo de saída cadastrado na AWS.
            </Text>
          </View>
        ) : (
          motivos.map((m) => (
            <View
              key={m.id_motivo_saida}
              style={{
                backgroundColor: theme.surface,
                borderRadius: 14,
                borderWidth: 1.5,
                borderColor: m.exige_confirmacao_perda ? theme.danger : theme.secondary,
                padding: 16,
                marginBottom: 12,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={{ fontWeight: 'bold', color: theme.text, fontSize: 14 * fontScale }}>
                  {m.nome_motivo_saida}
                </Text>
                {!!m.regra && (
                  <Text style={{ color: theme.subtext, fontSize: 12 * fontScale, marginTop: 6 }}>{m.regra}</Text>
                )}
                <Text
                  style={{
                    marginTop: 8,
                    fontWeight: '800',
                    fontSize: 11 * fontScale,
                    color: m.exige_confirmacao_perda ? theme.danger : theme.secondary,
                  }}
                >
                  {m.exige_confirmacao_perda
                    ? '📋 EXIGE CONFIRMAÇÃO "PERDA" (DESCARTE)'
                    : '✅ SAÍDA RÁPIDA PARA USO'}
                </Text>
              </View>
              <TouchableOpacity
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={`Excluir motivo ${m.nome_motivo_saida}`}
                onPress={() => excluirMotivo(m)}
                style={{ padding: 8 }}
              >
                <Feather name="trash-2" size={18} color={theme.danger} />
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
