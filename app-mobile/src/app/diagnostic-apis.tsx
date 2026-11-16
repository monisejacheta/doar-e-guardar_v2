// src/app/diagnostic-apis.tsx
import React, { useState } from 'react';
import { Text, View, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAppTheme } from '../context/ThemeContext';
import { AppInput } from '../components/common/AppInput';
import { AppButton } from '../components/common/AppButton';
import { requisicaoApi } from '../services/api';

export default function DiagnosticApisScreen() {
  const roteador = useRouter();
  const { theme, tokens, fontScale } = useAppTheme();
  const [eanTeste, setEanTeste] = useState('7891000100103');
  const [testando, setTestando] = useState(false);
  const [resultadoTeste, setResultadoTeste] = useState<any | null>(null);

  const testarCascataEan = async () => {
    const codigoLimpo = eanTeste.replace(/\D/g, '');
    if (codigoLimpo.length < 8) {
      Alert.alert('Código Inválido', 'Digite um código de barras válido (pelo menos 8 números) para testar.');
      return;
    }

    setTestando(true);
    const inicio = Date.now();
    try {
      const resp: any = await requisicaoApi('/api/estoque', {
        metodo: 'POST',
        dados: {
          modulo: 'estoque',
          acao: 'verificar_produto',
          codigo_barras: codigoLimpo,
        },
      });
      const tempo = Date.now() - inicio;
      setResultadoTeste({
        ...resp,
        latenciaMs: tempo,
      });
    } catch (erro: any) {
      Alert.alert('Não foi possível consultar', erro?.message || 'Verifique sua internet e tente novamente.');
    } finally {
      setTestando(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 110 }} keyboardShouldPersistTaps="handled">
        <TouchableOpacity
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Voltar para Status do App"
          onPress={() => roteador.back()}
          style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16, minHeight: 44 }}
        >
          <Feather name="arrow-left" size={20} color={theme.primary} />
          <Text style={{ color: theme.primary, fontWeight: 'bold', marginLeft: 8, fontSize: 15 * fontScale }}>
            Voltar
          </Text>
        </TouchableOpacity>

        <Text style={{ fontWeight: '800', color: theme.primary, fontSize: tokens.typography.fontSize.xl * fontScale, marginBottom: 6 }}>
          Teste do Leitor de Código de Barras
        </Text>
        <Text style={{ color: theme.subtext, fontSize: 13 * fontScale, marginBottom: 16 }}>
          Digite um código de barras abaixo para testar se o aplicativo encontra o nome e a marca do alimento automaticamente.
        </Text>

        <View style={{ backgroundColor: theme.surface, padding: 16, borderRadius: 14, borderWidth: 1.5, borderColor: theme.border, marginBottom: 16 }}>
          <AppInput
            rotulo="Código de Barras para Teste"
            placeholder="Ex: 7891000100103"
            keyboardType="numeric"
            value={eanTeste}
            onChangeText={setEanTeste}
          />
          <AppButton
            title="Testar Busca pelo Código"
            variant="primary"
            loading={testando}
            onPress={testarCascataEan}
          />
        </View>

        {resultadoTeste && (
          <View
            style={{
              backgroundColor: theme.surface,
              padding: 16,
              borderRadius: 14,
              borderWidth: 1.5,
              borderColor: resultadoTeste.encontrado ? theme.secondary : tokens.colors.accentAmber500,
            }}
          >
            <Text style={{ fontWeight: '800', color: resultadoTeste.encontrado ? theme.secondary : tokens.colors.accentAmber500, fontSize: 14 * fontScale }}>
              {resultadoTeste.encontrado ? '✅ ALIMENTO ENCONTRADO' : '⚠️ AINDA NÃO CADASTRADO (PREENCHER MANUALMENTE)'}
            </Text>
            <Text style={{ color: theme.text, fontSize: 13 * fontScale, marginTop: 8 }}>
              <Text style={{ fontWeight: 'bold' }}>Alimento:</Text> {resultadoTeste.dados?.nome_basico || 'Não informado'}
            </Text>
            <Text style={{ color: theme.text, fontSize: 13 * fontScale, marginTop: 4 }}>
              <Text style={{ fontWeight: 'bold' }}>Marca:</Text> {resultadoTeste.dados?.marca_fabricante || 'Não informada'}
            </Text>
            <Text style={{ color: theme.text, fontSize: 13 * fontScale, marginTop: 4 }}>
              <Text style={{ fontWeight: 'bold' }}>Categoria:</Text> {resultadoTeste.dados?.categoria || 'Não informada'}
            </Text>
            <Text style={{ color: theme.subtext, fontSize: 12 * fontScale, marginTop: 6 }}>
              Tempo de busca: {resultadoTeste.latenciaMs} ms
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

