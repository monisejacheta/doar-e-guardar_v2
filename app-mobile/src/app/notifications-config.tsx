// src/app/notifications-config.tsx
import React, { useState } from 'react';
import { Text, View, SafeAreaView, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAppTheme } from '../context/ThemeContext';
import { AppButton } from '../components/common/AppButton';

export default function NotificationsConfigScreen() {
  const roteador = useRouter();
  const { theme, tokens, fontScale } = useAppTheme();

  const [alertaVencimento7d, setAlertaVencimento7d] = useState(true);
  const [alertaVencimento30d, setAlertaVencimento30d] = useState(true);
  const [alertaEstoqueMinimo, setAlertaEstoqueMinimo] = useState(true);
  const [sugestoesDora, setSugestoesDora] = useState(true);

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
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={{ fontWeight: 'bold', color: theme.text, fontSize: 14 * fontScale }}>
                Alerta Crítico (≤ 7 dias para vencer)
              </Text>
              <Text style={{ color: theme.subtext, fontSize: 12 * fontScale }}>
                Destaca lotes em vermelho na Home e nas prateleiras.
              </Text>
            </View>
            <Switch value={alertaVencimento7d} onValueChange={setAlertaVencimento7d} trackColor={{ false: theme.border, true: theme.danger }} />
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={{ fontWeight: 'bold', color: theme.text, fontSize: 14 * fontScale }}>
                Alerta Preventivo FEFO (≤ 30 dias)
              </Text>
              <Text style={{ color: theme.subtext, fontSize: 12 * fontScale }}>
                Sinaliza lotes em âmbar para priorizar o consumo na cozinha.
              </Text>
            </View>
            <Switch value={alertaVencimento30d} onValueChange={setAlertaVencimento30d} trackColor={{ false: theme.border, true: tokens.colors.accentAmber500 }} />
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={{ fontWeight: 'bold', color: theme.text, fontSize: 14 * fontScale }}>
                Aviso de Estoque Mínimo
              </Text>
              <Text style={{ color: theme.subtext, fontSize: 12 * fontScale }}>
                Notifica quando a quantidade de pacotes atingir o limite de segurança.
              </Text>
            </View>
            <Switch value={alertaEstoqueMinimo} onValueChange={setAlertaEstoqueMinimo} trackColor={{ false: theme.border, true: theme.primary }} />
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={{ fontWeight: 'bold', color: theme.text, fontSize: 14 * fontScale }}>
                Sugestões Anti-Desperdício da Dora
              </Text>
              <Text style={{ color: theme.subtext, fontSize: 12 * fontScale }}>
                Permite que a Dora sugira receitas para lotes próximos do vencimento.
              </Text>
            </View>
            <Switch value={sugestoesDora} onValueChange={setSugestoesDora} trackColor={{ false: theme.border, true: theme.secondary }} />
          </View>
        </View>

        <AppButton
          title="Salvar Preferências de Alerta"
          variant="primary"
          onPress={() => {
            Alert.alert('Preferências Salvas', 'Regras de alerta FEFO atualizadas com sucesso.', [
              { text: 'OK', onPress: () => roteador.back() },
            ]);
          }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
