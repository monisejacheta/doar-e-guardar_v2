// src/app/audit-export.tsx
import React, { useState } from 'react';
import { Text, View, SafeAreaView, ScrollView, TouchableOpacity, Alert } from 'react-native';
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
      Alert.alert('E-mail Inválido', 'Informe um endereço de e-mail institucional válido para receber a trilha de auditoria.');
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
          tipo_grafico: 'Auditoria de Movimentações',
        },
      });

      if (respEmail?.sucesso) {
        Alert.alert(
          'Trilha de Auditoria Exportada!',
          `O relatório contendo ${movs.length} registro(s) auditados na AWS foi enviado para ${emailDestino}.`
        );
        setEmailDestino('');
      } else {
        Alert.alert('Aviso', respEmail?.mensagem || 'Não foi possível despachar o relatório no momento.');
      }
    } catch {
      Alert.alert('Erro', 'Falha de comunicação ao exportar os logs da AWS.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 96 }} keyboardShouldPersistTaps="handled">
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
          Exportar Logs de Auditoria
        </Text>
        <Text style={{ color: theme.subtext, fontSize: tokens.typography.fontSize.sm * fontScale, marginTop: 4, marginBottom: 18 }}>
          Envie a trilha de auditoria completa (entradas, saídas com trava PERDA, ajustes físicos e transferências de prateleira) para o e-mail da diretoria.
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
            rotulo="E-mail(s) da Diretoria / Conselho Fiscal *"
            placeholder="auditoria@casadacrianca.org.br"
            keyboardType="email-address"
            value={emailDestino}
            onChangeText={setEmailDestino}
          />
          <AppButton
            title={enviando ? 'Gerando Arquivo...' : 'Exportar e Enviar por E-mail'}
            variant="primary"
            loading={enviando}
            onPress={exportarLogsAuditoria}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
