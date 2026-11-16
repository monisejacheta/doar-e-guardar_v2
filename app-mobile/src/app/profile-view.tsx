// src/app/profile-view.tsx
import React from 'react';
import { Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { auth } from '../services/firebaseConfig';
import { useAppTheme } from '../context/ThemeContext';

export default function ProfileViewScreen() {
  const roteador = useRouter();
  const { theme, tokens, fontScale } = useAppTheme();

  const u = auth?.currentUser;
  const campos = [
    { rotulo: 'Seu Nome', valor: u?.displayName || 'Colaborador Casa da Criança' },
    { rotulo: 'Seu E-mail', valor: u?.email || 'operador@casadacrianca.org.br' },
    { rotulo: 'Sua Função', valor: 'Equipe de Estoque e Cozinha (Casa da Criança)' },
    { rotulo: 'Local de Trabalho', valor: 'Sede Casa da Criança - Despensa e Geladeiras' },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 110 }}>
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
          Meus Dados
        </Text>
        <Text style={{ color: theme.subtext, fontSize: 13 * fontScale, marginBottom: 16 }}>
          Veja as informações da sua conta usada no dia a dia da despensa.
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
