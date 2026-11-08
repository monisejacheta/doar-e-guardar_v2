// src/app/notifications-config.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Text, View, SafeAreaView, ScrollView, TouchableOpacity, Switch, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppTheme } from '../context/ThemeContext';
import { AppButton } from '../components/common/AppButton';

// FIX #3: Chave de armazenamento centralizada para as preferências de alerta
const CHAVE_PREFERENCIAS_ALERTA = '@doareguardar:preferencias_alerta';

interface PreferenciasAlerta {
  alertaVencimento7d: boolean;
  alertaVencimento30d: boolean;
  alertaEstoqueMinimo: boolean;
  sugestoesDora: boolean;
}

const PREFERENCIAS_PADRAO: PreferenciasAlerta = {
  alertaVencimento7d: true,
  alertaVencimento30d: true,
  alertaEstoqueMinimo: true,
  sugestoesDora: true,
};

export default function NotificationsConfigScreen() {
  const roteador = useRouter();
  const { theme, tokens, fontScale } = useAppTheme();

  const [preferencias, setPreferencias] = useState<PreferenciasAlerta>(PREFERENCIAS_PADRAO);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  // FIX #3: Carrega as preferências salvas ao abrir a tela
  const carregarPreferencias = useCallback(async () => {
    try {
      const json = await AsyncStorage.getItem(CHAVE_PREFERENCIAS_ALERTA);
      if (json) {
        const salvas: PreferenciasAlerta = JSON.parse(json);
        setPreferencias({ ...PREFERENCIAS_PADRAO, ...salvas });
      }
    } catch (erro) {
      console.warn('[NotificationsConfig] Erro ao carregar preferências:', erro);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarPreferencias();
  }, [carregarPreferencias]);

  // FIX #3: Persiste as preferências no AsyncStorage ao salvar
  const salvarPreferencias = async () => {
    setSalvando(true);
    try {
      await AsyncStorage.setItem(CHAVE_PREFERENCIAS_ALERTA, JSON.stringify(preferencias));
      Alert.alert(
        'Preferências Salvas',
        'Regras de alerta FEFO atualizadas com sucesso.',
        [{ text: 'OK', onPress: () => roteador.back() }],
      );
    } catch (erro) {
      Alert.alert(
        'Erro ao Salvar',
        'Não foi possível salvar suas preferências. Tente novamente.',
      );
    } finally {
      setSalvando(false);
    }
  };

  const atualizarPreferencia = (campo: keyof PreferenciasAlerta) => (valor: boolean) => {
    setPreferencias((prev) => ({ ...prev, [campo]: valor }));
  };

  if (carregando) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={{ color: theme.subtext, marginTop: 12, fontSize: 14 * fontScale }}>
          Carregando preferências…
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <TouchableOpacity
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Voltar para Notificações"
          onPress={() => roteador.back()}
          style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16, minHeight: 44 }}
        >
          <Feather name="arrow-left" size={20} color={theme.primary} />
          <Text style={{ color: theme.primary, fontWeight: 'bold', marginLeft: 8, fontSize: 15 * fontScale }}>
            Voltar às Notificações
          </Text>
        </TouchableOpacity>

        <Text style={{ fontWeight: '800', color: theme.primary, fontSize: tokens.typography.fontSize.xl * fontScale, marginBottom: 6 }}>
          Configurar Alertas de Validade
        </Text>
        <Text style={{ color: theme.subtext, fontSize: 13 * fontScale, marginBottom: 18 }}>
          Defina quais regras preventivas FEFO e de estoque mínimo devem gerar avisos prioritários.
        </Text>

        <View style={{ backgroundColor: theme.surface, borderRadius: 14, borderWidth: 1.5, borderColor: theme.border, padding: 16, gap: 16, marginBottom: 20 }}>
          {/* Alerta Crítico 7 dias */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={{ fontWeight: 'bold', color: theme.text, fontSize: 14 * fontScale }}>
                Alerta Crítico (≤ 7 dias para vencer)
              </Text>
              <Text style={{ color: theme.subtext, fontSize: 12 * fontScale }}>
                Destaca lotes em vermelho na Home e nas prateleiras.
              </Text>
            </View>
            <Switch
              value={preferencias.alertaVencimento7d}
              onValueChange={atualizarPreferencia('alertaVencimento7d')}
              trackColor={{ false: theme.border, true: theme.danger }}
              accessibilityLabel="Ativar alerta crítico para lotes com até 7 dias para vencer"
            />
          </View>

          {/* Alerta FEFO 30 dias */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={{ fontWeight: 'bold', color: theme.text, fontSize: 14 * fontScale }}>
                Alerta Preventivo FEFO (≤ 30 dias)
              </Text>
              <Text style={{ color: theme.subtext, fontSize: 12 * fontScale }}>
                Sinaliza lotes em âmbar para priorizar o consumo na cozinha.
              </Text>
            </View>
            <Switch
              value={preferencias.alertaVencimento30d}
              onValueChange={atualizarPreferencia('alertaVencimento30d')}
              trackColor={{ false: theme.border, true: tokens.colors.accentAmber500 }}
              accessibilityLabel="Ativar alerta preventivo FEFO para lotes com até 30 dias para vencer"
            />
          </View>

          {/* Estoque Mínimo */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={{ fontWeight: 'bold', color: theme.text, fontSize: 14 * fontScale }}>
                Aviso de Estoque Mínimo
              </Text>
              <Text style={{ color: theme.subtext, fontSize: 12 * fontScale }}>
                Notifica quando a quantidade de pacotes atingir o limite de segurança.
              </Text>
            </View>
            <Switch
              value={preferencias.alertaEstoqueMinimo}
              onValueChange={atualizarPreferencia('alertaEstoqueMinimo')}
              trackColor={{ false: theme.border, true: theme.primary }}
              accessibilityLabel="Ativar aviso de estoque mínimo"
            />
          </View>

          {/* Sugestões Dora */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={{ fontWeight: 'bold', color: theme.text, fontSize: 14 * fontScale }}>
                Sugestões Anti-Desperdício da Dora
              </Text>
              <Text style={{ color: theme.subtext, fontSize: 12 * fontScale }}>
                Permite que a Dora sugira receitas para lotes próximos do vencimento.
              </Text>
            </View>
            <Switch
              value={preferencias.sugestoesDora}
              onValueChange={atualizarPreferencia('sugestoesDora')}
              trackColor={{ false: theme.border, true: theme.secondary }}
              accessibilityLabel="Ativar sugestões anti-desperdício da Dora"
            />
          </View>
        </View>

        <AppButton
          title="Salvar Preferências de Alerta"
          variant="primary"
          loading={salvando}
          onPress={salvarPreferencias}
          accessibilityHint="Persiste as configurações de alerta FEFO no dispositivo"
        />
      </ScrollView>
    </SafeAreaView>
  );
}
