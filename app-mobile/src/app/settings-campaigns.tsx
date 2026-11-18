// src/app/settings-campaigns.tsx
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
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
import { AppButton } from '../components/common/AppButton';
import { requisicaoApi } from '../services/api';

interface CampanhaAws {
  id_campanha: string;
  titulo: string;
  meta: string;
  status_aprovacao: string;
  data_fim?: string;
  descricao?: string;
  itens_necessarios?: string;
  responsavel?: string;
  atualizado_em?: string;
}

export default function SettingsCampaignsScreen() {
  const roteador = useRouter();
  const { theme, tokens, fontScale } = useAppTheme();

  const [campanhas, setCampanhas] = useState<CampanhaAws[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [campanhaSelecionada, setCampanhaSelecionada] = useState<CampanhaAws | null>(null);

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
          Toque em uma campanha para ver os detalhes. Puxe para baixo para atualizar.
        </Text>

        {carregando ? (
          <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 20 }} />
        ) : campanhas.length === 0 ? (
          <View style={{ padding: 20, backgroundColor: theme.surface, borderRadius: 14, alignItems: 'center' }}>
            <Text style={{ color: theme.subtext, fontSize: 13 * fontScale }}>
              Nenhuma campanha ativa encontrada na AWS no momento.
            </Text>
          </View>
        ) : (
          campanhas.map((c) => (
            <TouchableOpacity
              key={c.id_campanha}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={`Ver detalhes da campanha ${c.titulo}`}
              activeOpacity={0.8}
              onPress={() => setCampanhaSelecionada(c)}
              style={{
                backgroundColor: theme.surface,
                borderRadius: 14,
                borderWidth: 1.5,
                borderColor: theme.secondary,
                padding: 16,
                marginBottom: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={{ fontWeight: 'bold', color: theme.text, fontSize: 14 * fontScale }}>{c.titulo}</Text>
                {!!c.meta && (
                  <Text style={{ color: theme.subtext, fontSize: 12 * fontScale, marginTop: 4 }}>Foco: {c.meta}</Text>
                )}
                <Text style={{ color: theme.secondary, fontSize: 12 * fontScale, fontWeight: '700', marginTop: 6 }}>
                  ✅ {c.status_aprovacao || 'Ativa'}
                </Text>
              </View>
              <Feather name="chevron-right" size={20} color={theme.subtext} />
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <Modal
        visible={Boolean(campanhaSelecionada)}
        transparent
        animationType="fade"
        onRequestClose={() => setCampanhaSelecionada(null)}
      >
        <Pressable
          onPress={() => setCampanhaSelecionada(null)}
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            padding: 20,
          }}
        >
          <Pressable
            onPress={() => {}}
            style={{
              backgroundColor: theme.surface,
              borderRadius: 18,
              borderWidth: 1.5,
              borderColor: theme.secondary,
              padding: 20,
              maxHeight: '85%',
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <Text style={{ flex: 1, fontWeight: '800', color: theme.primary, fontSize: 18 * fontScale, paddingRight: 12 }}>
                {campanhaSelecionada?.titulo}
              </Text>
              <TouchableOpacity
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Fechar detalhes da campanha"
                onPress={() => setCampanhaSelecionada(null)}
                style={{ padding: 4 }}
              >
                <Feather name="x" size={22} color={theme.subtext} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ marginBottom: 16 }}>
              <View style={{ marginBottom: 10 }}>
                <Text style={{ color: theme.subtext, fontSize: 11 * fontScale, fontWeight: '700' }}>STATUS</Text>
                <Text style={{ color: theme.secondary, fontSize: 14 * fontScale, fontWeight: '700', marginTop: 2 }}>
                  ✅ {campanhaSelecionada?.status_aprovacao || 'Ativa'}
                </Text>
              </View>

              <View style={{ marginBottom: 10 }}>
                <Text style={{ color: theme.subtext, fontSize: 11 * fontScale, fontWeight: '700' }}>FOCO / META</Text>
                <Text style={{ color: theme.text, fontSize: 14 * fontScale, marginTop: 2 }}>
                  {campanhaSelecionada?.meta || 'Não informado'}
                </Text>
              </View>

              {!!campanhaSelecionada?.descricao && (
                <View style={{ marginBottom: 10 }}>
                  <Text style={{ color: theme.subtext, fontSize: 11 * fontScale, fontWeight: '700' }}>DESCRIÇÃO</Text>
                  <Text style={{ color: theme.text, fontSize: 14 * fontScale, marginTop: 2 }}>
                    {campanhaSelecionada.descricao}
                  </Text>
                </View>
              )}

              {!!campanhaSelecionada?.itens_necessarios && (
                <View style={{ marginBottom: 10 }}>
                  <Text style={{ color: theme.subtext, fontSize: 11 * fontScale, fontWeight: '700' }}>ITENS NECESSÁRIOS</Text>
                  <Text style={{ color: theme.text, fontSize: 14 * fontScale, marginTop: 2 }}>
                    {campanhaSelecionada.itens_necessarios}
                  </Text>
                </View>
              )}

              {!!campanhaSelecionada?.responsavel && (
                <View style={{ marginBottom: 10 }}>
                  <Text style={{ color: theme.subtext, fontSize: 11 * fontScale, fontWeight: '700' }}>RESPONSÁVEL</Text>
                  <Text style={{ color: theme.text, fontSize: 14 * fontScale, marginTop: 2 }}>
                    {campanhaSelecionada.responsavel}
                  </Text>
                </View>
              )}

              <View style={{ marginBottom: 10 }}>
                <Text style={{ color: theme.subtext, fontSize: 11 * fontScale, fontWeight: '700' }}>ENCERRAMENTO</Text>
                <Text style={{ color: theme.text, fontSize: 14 * fontScale, marginTop: 2 }}>
                  {campanhaSelecionada?.data_fim || 'Sem data definida'}
                </Text>
              </View>

              <View>
                <Text style={{ color: theme.subtext, fontSize: 11 * fontScale, fontWeight: '700' }}>CÓDIGO DA CAMPANHA</Text>
                <Text style={{ color: theme.subtext, fontSize: 12 * fontScale, marginTop: 2 }}>
                  {campanhaSelecionada?.id_campanha}
                </Text>
              </View>
            </ScrollView>

            <AppButton title="Fechar" onPress={() => setCampanhaSelecionada(null)} />
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
