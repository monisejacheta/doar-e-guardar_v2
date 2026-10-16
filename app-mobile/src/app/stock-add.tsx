// src/app/stock-add.tsx
import React, { useState } from 'react';
import { Text, View, SafeAreaView, ScrollView, TextInput, Alert, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppTheme } from '../context/ThemeContext';
import { AppButton } from '../components/common/AppButton';
import { estilosStockAdd } from '../styles/stock-add.styles';

export default function StockAddScreen() {
  const roteador = useRouter();
  const { theme, tokens, fontScale } = useAppTheme();
  const [codigoBarras, setCodigoBarras] = useState('');

  const simularLeituraCamera = () => {
    setCodigoBarras('7891000100103');
    Alert.alert('Código Detectado', 'Código de barras 7891000100103 identificado via câmera com redundância de APIs.');
  };

  const cadastrarEntrada = () => {
    if (!codigoBarras.trim()) {
      Alert.alert('Aviso', 'Aponte a câmera para o código de barras ou digite a sequência numérica.');
      return;
    }
    Alert.alert('Sucesso', 'Entrada de lote registrada com sucesso.', [
      { text: 'Voltar ao Estoque', onPress: () => roteador.back() }
    ]);
  };

  return (
    <SafeAreaView style={[estilosStockAdd.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={estilosStockAdd.rolagem}>
        <View style={estilosStockAdd.cabecalho}>
          <Text style={[estilosStockAdd.titulo, { color: theme.primary, fontSize: tokens.typography.fontSize.xl * fontScale }]}>
            Tela 3.1 - Entrada de Produtos
          </Text>
          <Text style={[estilosStockAdd.subtitulo, { color: theme.subtext, fontSize: tokens.typography.fontSize.sm * fontScale }]}>
            Leitura de código de barras pela câmera ou digitação manual.
          </Text>
        </View>

        <View style={[estilosStockAdd.cartaoPrincipal, { backgroundColor: theme.surface, borderColor: theme.secondary }]}>
          <AppButton
            title="📷 Abrir Leitor pela Câmera"
            variant="secondary"
            onPress={simularLeituraCamera}
            accessibilityHint="Ativa a câmera para leitura ótica do código de barras"
          />

          <Text style={{ textAlign: 'center', marginVertical: 12, color: theme.subtext, fontWeight: 'bold' }}>
            OU DIGITE MANUALMENTE
          </Text>

          <TextInput
            placeholder="Ex: 7891000100103"
            placeholderTextColor={theme.subtext}
            keyboardType="numeric"
            value={codigoBarras}
            onChangeText={setCodigoBarras}
            style={[estilosStockAdd.campoDigitacao, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }]}
          />

          <AppButton
            title="Registrar Novo Lote"
            variant="primary"
            onPress={cadastrarEntrada}
            accessibilityHint="Grava o novo lote no estoque da instituição"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
