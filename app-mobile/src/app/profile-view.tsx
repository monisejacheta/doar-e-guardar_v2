// src/app/profile-view.tsx
import React from 'react';
import { Text, View, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { auth } from '../services/firebaseConfig';
import { useAppTheme } from '../context/ThemeContext';

export default function ProfileViewScreen() {
  const roteador = useRouter();
  const { theme, tokens, fontScale } = useAppTheme();

  const u = auth?.currentUser;
  const campos = [
    { rotulo: 'Nome de Exibição', valor: u?.displayName || 'Colaborador Casa da Criança' },
    { rotulo: 'E-mail Institucional', valor: u?.email || 'operador@casadacrianca.org.br' },
    { rotulo: 'Identificador Único (UID)', valor: u?.uid || 'sessao_institucional_aws' },
    { rotulo: 'Papel / Permissão', valor: 'Operador de Estoque & Auditoria (Casa da Criança)' },
    { rotulo: 'Unidade Vinculada', valor: 'Sede Casa da Criança - Despensa & Câmara Fria' },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <TouchableOpacity
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Voltar para Perfil"
          onPress={() => roteador.back()}
          style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16, minHeight: 44 }}
        >
          <Feather name="arrow-left" size={20} color={theme.primary} />
          <Text style={{ color: theme.primary, fontWeight: 'bold', marginLeft: 8, fontSize: 15 * fontScale }}>
            Voltar ao Perfil
          </Text>
        </TouchableOpacity>

        <Text style={{ fontWeight: '800', color: theme.primary, fontSize: tokens.typography.fontSize.xl * fontScale, marginBottom: 6 }}>
          2.1.1 Dados do Colaborador
        </Text>
        <Text style={{ color: theme.subtext, fontSize: 13 * fontScale, marginBottom: 16 }}>
          Informações vinculadas à sua credencial de operador para rastreabilidade de lotes na AWS.
        </Text>

        {campos.map((c) => (
          <View
            key={c.rotulo}
            style={{
              backgroundColor: theme.surface,
              borderRadius: 12,
              borderWidth: 1.5,
              borderColor: theme.border,
              padding: 14,
              marginBottom: 10,
            }}
          >
            <Text style={{ color: theme.subtext, fontSize: 12 * fontScale, fontWeight: '600' }}>{c.rotulo}</Text>
            <Text style={{ color: theme.text, fontSize: 14 * fontScale, fontWeight: 'bold', marginTop: 4 }}>
              {c.valor}
            </Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
