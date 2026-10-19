// src/app/stock-remove.tsx
import React, { useState } from 'react';
import { Text, View, SafeAreaView, ScrollView, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppTheme } from '../context/ThemeContext';
import { AppButton } from '../components/common/AppButton';
import { estilosStockRemove } from '../styles/stock-remove.styles';

export default function StockRemoveScreen() {
  const roteador = useRouter();
  const { theme, tokens, fontScale } = useAppTheme();
  const [motivo, setMotivo] = useState('perda - descarte vencido');
  const [confirmacao, setConfirmacao] = useState('');

  const processarBaixa = () => {
    if (motivo.includes('perda') && confirmacao.trim() !== 'PERDA') {
      Alert.alert(
        'Confirmação Necessária',
        'Para confirmar a baixa por descarte, digite exatamente a palavra PERDA em letras maiúsculas.'
      );
      return;
    }
    Alert.alert(
      'Baixa Concluída',
      'A saída do item foi registrada e auditada com sucesso.',
      [{ text: 'OK', onPress: () => roteador.back() }]
    );
  };

  return (
    <SafeAreaView style={[estilosStockRemove.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={estilosStockRemove.rolagem}>
        <View style={estilosStockRemove.cabecalho}>
          <Text style={[estilosStockRemove.titulo, { color: theme.primary, fontSize: tokens.typography.fontSize.xl * fontScale }]}>
            Tela 3.2 - Remover Produtos do Estoque
          </Text>
          <Text style={[estilosStockRemove.subtitulo, { color: theme.subtext, fontSize: tokens.typography.fontSize.sm * fontScale }]}>
            Baixa de itens com confirmação de descarte via palavra PERDA.
          </Text>
        </View>

        <View style={[estilosStockRemove.secaoCard, { backgroundColor: theme.surface, borderColor: theme.danger }]}>
          <Text style={[estilosStockRemove.instrucaoPerda, { color: theme.text, fontSize: tokens.typography.fontSize.sm * fontScale }]}>
            Atenção: A remoção definitiva de mantimentos exige justificativa formal e trava de proteção contra baixas acidentais.
          </Text>

          <Text style={{ fontWeight: 'bold', color: theme.text, marginBottom: 6 }}>
            Digite "PERDA" para autorizar o descarte:
          </Text>
          <TextInput
            placeholder="Digite PERDA aqui"
            placeholderTextColor={theme.subtext}
            value={confirmacao}
            onChangeText={setConfirmacao}
            autoCapitalize="characters"
            style={[estilosStockRemove.campoDigitacao, { backgroundColor: theme.background, borderColor: theme.danger, color: theme.text }]}
          />

          <AppButton
            title="Confirmar Baixa do Estoque"
            variant="danger"
            onPress={processarBaixa}
            accessibilityHint="Efetiva a remoção do lote do inventário"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
