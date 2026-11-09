// src/app/diagnostic-apis.tsx
import React, { useState } from 'react';
import { Text, View, SafeAreaView, ScrollView, TouchableOpacity, Alert } from 'react-native';
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
      Alert.alert('EAN Inválido', 'Informe um código de barras EAN-8 ou EAN-13 válido para testar a cascata.');
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
      Alert.alert('Falha na Consulta', erro?.message || 'Erro ao comunicar com o barramento de APIs.');
    } finally {
      setTestando(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 105 }} keyboardShouldPersistTaps="handled">
        <TouchableOpacity
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Voltar para Diagnóstico"
          onPress={() => roteador.back()}
          style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16, minHeight: 44 }}
        >
          <Feather name="arrow-left" size={20} color={theme.primary} />
          <Text style={{ color: theme.primary, fontWeight: 'bold', marginLeft: 8, fontSize: 15 * fontScale }}>
            Voltar ao Diagnóstico
          </Text>
        </TouchableOpacity>

        <Text style={{ fontWeight: '800', color: theme.primary, fontSize: tokens.typography.fontSize.xl * fontScale, marginBottom: 6 }}>
          9.3 Cascata de 3 APIs (Código de Barras)
        </Text>
        <Text style={{ color: theme.subtext, fontSize: 13 * fontScale, marginBottom: 16 }}>
          Ordem de busca: 0. Catálogo AWS (`tb_produtos`) → 1. Open Food Facts → 2. Cosmos/Bluesoft → 3. Open Product Data / UPCitemdb.
        </Text>

        <View style={{ backgroundColor: theme.surface, padding: 16, borderRadius: 14, borderWidth: 1.5, borderColor: theme.border, marginBottom: 16 }}>
          <AppInput
            rotulo="Código EAN para Teste Real na Cascata"
            placeholder="Ex: 7891000100103"
            keyboardType="numeric"
            value={eanTeste}
            onChangeText={setEanTeste}
          />
          <AppButton
            title="Disparar Consulta Real na Cascata"
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
              {resultadoTeste.encontrado ? '✅ PRODUTO IDENTIFICADO' : '⚠️ NÃO LOCALIZADO NAS BASES (CADASTRO MANUAL)'}
            </Text>
            <Text style={{ color: theme.text, fontSize: 13 * fontScale, marginTop: 8 }}>
              <Text style={{ fontWeight: 'bold' }}>Produto:</Text> {resultadoTeste.dados?.nome_basico || 'N/A'}
            </Text>
            <Text style={{ color: theme.text, fontSize: 13 * fontScale, marginTop: 4 }}>
              <Text style={{ fontWeight: 'bold' }}>Marca:</Text> {resultadoTeste.dados?.marca_fabricante || 'N/A'}
            </Text>
            <Text style={{ color: theme.text, fontSize: 13 * fontScale, marginTop: 4 }}>
              <Text style={{ fontWeight: 'bold' }}>Categoria:</Text> {resultadoTeste.dados?.categoria || 'N/A'}
            </Text>
            <Text style={{ color: theme.text, fontSize: 13 * fontScale, marginTop: 4 }}>
              <Text style={{ fontWeight: 'bold' }}>Fonte Vencedora:</Text> {resultadoTeste.fonte || resultadoTeste.dados?.fonte_dados || 'N/A'}
            </Text>
            <Text style={{ color: theme.subtext, fontSize: 12 * fontScale, marginTop: 6 }}>
              Tempo de resposta total: {resultadoTeste.latenciaMs} ms
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

