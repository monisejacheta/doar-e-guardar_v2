// src/app/settings-campaigns.tsx
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
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

interface CampanhaAws {
  id_campanha: string;
  titulo: string;
  meta: string;
  status_aprovacao: string;
  data_fim?: string;
}

export default function SettingsCampaignsScreen() {
  const roteador = useRouter();
  const { theme, tokens, fontScale } = useAppTheme();

  const [campanhas, setCampanhas] = useState<CampanhaAws[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const [titulo, setTitulo] = useState('');
  const [meta, setMeta] = useState('');

  const carregarCampanhas = useCallback(async () => {
    try {
      const resp: any = await requisicaoApi('/api/configuracoes', {
        metodo: 'POST',
        dados: { modulo: 'configuracoes', acao: 'listar_campanhas' },
      });
      if (resp?.sucesso && Array.isArray(resp.campanhas)) {
        setCampanhas(resp.campanhas);
      } else {
        setCampanhas([]);
      }
    } catch (err: any) {
      Alert.alert('Erro ao carregar', err?.message || 'Não foi possível consultar as campanhas na AWS.');
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }, []);

  useEffect(() => {
    carregarCampanhas();
  }, [carregarCampanhas]);

  const cadastrarCampanha = async () => {
    if (!titulo.trim()) {
      Alert.alert('Campo obrigatório', 'Informe o título da campanha.');
      return;
    }
    setSalvando(true);
    try {
      const resp: any = await requisicaoApi('/api/configuracoes', {
        metodo: 'POST',
        dados: {
          modulo: 'configuracoes',
          acao: 'cadastrar_campanha',
          titulo: titulo.trim(),
          meta: meta.trim() || 'Reposição da Despensa',
          status_aprovacao: 'Ativa',
        },
      });
      if (resp?.sucesso) {
        setTitulo('');
        setMeta('');
        await carregarCampanhas();
      } else {
        Alert.alert('Aviso', resp?.mensagem || 'Não foi possível salvar a campanha.');
      }
    } catch (err: any) {
      Alert.alert('Erro', err?.message || 'Falha ao cadastrar campanha na AWS.');
    } finally {
      setSalvando(false);
    }
  };

  const excluirCampanha = (item: CampanhaAws) => {
    Alert.alert('Excluir Campanha', `Deseja remover "${item.titulo}" da AWS?`, [
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
                acao: 'excluir_campanha',
                id_campanha: item.id_campanha,
              },
            });
            await carregarCampanhas();
          } catch (err: any) {
            Alert.alert('Erro', err?.message || 'Não foi possível excluir a campanha.');
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
              carregarCampanhas();
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
          Campanhas de Doações
        </Text>
        <Text style={{ color: theme.subtext, fontSize: 13 * fontScale, marginBottom: 16 }}>
          Cadastre e gerencie as campanhas sincronizadas com a AWS.
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
            Nova Campanha
          </Text>
          <AppInput
            rotulo="Título da campanha"
            placeholder="Ex: Arrecadação de Leite Integral"
            value={titulo}
            onChangeText={setTitulo}
          />
          <AppInput
            rotulo="Foco / Meta"
            placeholder="Ex: Alimentação das Crianças"
            value={meta}
            onChangeText={setMeta}
          />
          <AppButton
            title={salvando ? 'Salvando na AWS...' : 'Cadastrar Campanha'}
            onPress={cadastrarCampanha}
            disabled={salvando}
          />
        </View>

        {carregando ? (
          <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 20 }} />
        ) : campanhas.length === 0 ? (
          <View style={{ padding: 20, backgroundColor: theme.surface, borderRadius: 14, alignItems: 'center' }}>
            <Text style={{ color: theme.subtext, fontSize: 13 * fontScale }}>
              Nenhuma campanha cadastrada na AWS no momento.
            </Text>
          </View>
        ) : (
          campanhas.map((c) => (
            <View
              key={c.id_campanha}
              style={{
                backgroundColor: theme.surface,
                borderRadius: 14,
                borderWidth: 1.5,
                borderColor: theme.secondary,
                padding: 16,
                marginBottom: 12,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={{ fontWeight: 'bold', color: theme.text, fontSize: 14 * fontScale }}>{c.titulo}</Text>
                {!!c.meta && (
                  <Text style={{ color: theme.subtext, fontSize: 12 * fontScale, marginTop: 4 }}>Foco: {c.meta}</Text>
                )}
                <Text style={{ color: theme.secondary, fontSize: 12 * fontScale, fontWeight: '700', marginTop: 6 }}>
                  ✅ {c.status_aprovacao || 'Ativa'}
                </Text>
              </View>
              <TouchableOpacity
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={`Excluir campanha ${c.titulo}`}
                onPress={() => excluirCampanha(c)}
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
