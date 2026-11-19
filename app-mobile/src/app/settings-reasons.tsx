// src/app/settings-reasons.tsx
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
          Motivos oficiais registrados na tabela tb_motivosSaidas (somente consulta).
        </Text>

        {carregando ? (
          <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 20 }} />
        ) : motivos.length === 0 ? (
          <View style={{ padding: 20, backgroundColor: theme.surface, borderRadius: 14, alignItems: 'center' }}>
            <Text style={{ color: theme.subtext, fontSize: 13 * fontScale }}>
              Nenhum motivo encontrado na AWS. Puxe para atualizar.
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
              }}
            >
              <Text style={{ fontWeight: 'bold', color: theme.text, fontSize: 15 * fontScale }}>
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
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
