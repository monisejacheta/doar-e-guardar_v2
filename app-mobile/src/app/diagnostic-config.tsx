// src/app/diagnostic-config.tsx
import React from 'react';
import { Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAppTheme } from '../context/ThemeContext';
import { API_BASE_URL } from '../services/api';

export default function DiagnosticConfigScreen() {
  const roteador = useRouter();
  const { theme, tokens, fontScale } = useAppTheme();

  const parametros = [
    { chave: 'Conexão do Aplicativo', valor: 'Conectado à internet e atualizado automaticamente' },
    { chave: 'Tempo Máximo de Espera', valor: 'Até 15 segundos para conexões mais lentas' },
    { chave: 'Busca de Código de Barras', valor: 'Procura primeiro nos alimentos já conhecidos da despensa' },
    { chave: 'Cadastro Automático', valor: 'Preenche nome, marca e foto quando o código é reconhecido' },
    { chave: 'Organização de Prateleiras', valor: 'Padroniza nomes de armários, geladeiras, prateleiras e gavetas' },
    { chave: 'Proteção de Validades', valor: 'Avisa sobre itens que vencem logo e impede entrada de vencidos' },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 110 }}>
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
          Informações do Aplicativo
        </Text>
        <Text style={{ color: theme.subtext, fontSize: 13 * fontScale, marginBottom: 16 }}>
          Veja como o aplicativo funciona para ajudar no cuidado diário da despensa da Casa da Criança.
        </Text>

        {parametros.map((p) => (
          <View
            key={p.chave}
            style={{
              backgroundColor: theme.surface,
              borderRadius: 12,
              borderWidth: 1.5,
              borderColor: theme.border,
              padding: 14,
              marginBottom: 10,
            }}
          >
            <Text style={{ fontWeight: 'bold', color: theme.primary, fontSize: 13 * fontScale }}>{p.chave}</Text>
            <Text style={{ color: theme.text, fontSize: 13 * fontScale, marginTop: 4 }}>{p.valor}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

