// src/app/audit-export.tsx
import React, { useState } from 'react';
import { Text, View, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAppTheme } from '../context/ThemeContext';
import { AppInput } from '../components/common/AppInput';
import { AppButton } from '../components/common/AppButton';
import { requisicaoApi } from '../services/api';

export default function AuditExportScreen() {
  const roteador = useRouter();
  const { theme, tokens, fontScale } = useAppTheme();
  const [emailDestino, setEmailDestino] = useState('');
  const [enviando, setEnviando] = useState(false);

  const exportarLogsAuditoria = async () => {
    if (!emailDestino.trim() || !emailDestino.includes('@')) {
      Alert.alert('E-mail Inválido', 'Informe um endereço de e-mail válido para receber o histórico.');
      return;
    }

    setEnviando(true);
    try {
      const respMov: any = await requisicaoApi('/api/estoque', {
        metodo: 'POST',
        dados: { modulo: 'estoque', acao: 'consultar_movimentacoes' },
      });
      const movs = Array.isArray(respMov?.movimentacoes) ? respMov.movimentacoes : [];

      const respEmail: any = await requisicaoApi('/api/relatorios', {
        metodo: 'POST',
        dados: {
          modulo: 'relatorios',
          acao: 'enviar_relatorio_completo_email',
          relatorio_completo: true,
          total_itens: movs.length,
          destinatarios: emailDestino.split(',').map((e) => e.trim()),
          tipo_grafico: 'Histórico de Movimentações',
        },
      });

      if (respEmail?.sucesso) {
        Alert.alert(
          'Histórico Enviado!',
          `O relatório com ${movs.length} registro(s) foi enviado para ${emailDestino}.`
        );
        setEmailDestino('');
      } else {
        Alert.alert('Aviso', respEmail?.mensagem || 'Não foi possível enviar o relatório no momento.');
      }
    } catch {
      Alert.alert('Ops!', 'Não foi possível enviar o histórico agora.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 110 }} keyboardShouldPersistTaps="handled">
        <TouchableOpacity
          accessible={true}
          accessibilityRole="button"
          onPress={() => roteador.back()}
          style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}
        >
          <Feather name="arrow-left" size={22} color={theme.primary} />
          <Text style={{ color: theme.primary, fontWeight: '700', marginLeft: 8, fontSize: 15 * fontScale }}>Voltar</Text>
        </TouchableOpacity>

        <Text style={{ fontWeight: '800', color: theme.primary, fontSize: tokens.typography.fontSize.xl * fontScale }}>
          Enviar Histórico por E-mail
        </Text>
        <Text style={{ color: theme.subtext, fontSize: tokens.typography.fontSize.sm * fontScale, marginTop: 4, marginBottom: 18 }}>
          Envie o histórico completo de entradas, saídas, ajustes de contagem e mudanças de prateleira por e-mail.
        </Text>

        <View
          style={{
            backgroundColor: theme.surface,
            borderColor: theme.border,
            borderWidth: 1.5,
            borderRadius: 16,
            padding: 16,
          }}
        >
          <AppInput
            rotulo="E-mail(s) para envio *"
            placeholder="contato@casadacrianca.org.br"
            keyboardType="email-address"
            value={emailDestino}
            onChangeText={setEmailDestino}
          />
          <AppButton
            title={enviando ? 'Enviando...' : 'Enviar Histórico por E-mail'}
            variant="primary"
            loading={enviando}
            onPress={exportarLogsAuditoria}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
