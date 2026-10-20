// src/app/profile.tsx
import React from 'react';
import { Text, View, SafeAreaView, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppTheme } from '../context/ThemeContext';
import { AppIcon } from '../components/common/AppIcon';
import { AppButton } from '../components/common/AppButton';

export default function ProfileScreen() {
  const roteador = useRouter();
  const { theme, tokens, fontScale } = useAppTheme();

  const confirmarLogout = () => {
    Alert.alert(
      'Encerrar Sessão',
      'Deseja realmente sair da sua conta na Casa da Criança?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sim, Sair', style: 'destructive', onPress: () => roteador.replace('/login' as never) },
      ]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        {/* Cabeçalho do Perfil */}
        <View style={{ alignItems: 'center', marginBottom: 24 }}>
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              borderWidth: 2,
              borderColor: theme.primary,
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: theme.surface,
              marginBottom: 12,
            }}
          >
            <AppIcon name="user" size={40} variant="primary" />
          </View>
          <Text style={{ fontWeight: 'bold', color: theme.text, fontSize: 18 * fontScale }}>
            Colaborador Casa da Criança
          </Text>
          <Text style={{ color: theme.subtext, fontSize: 13 * fontScale, marginTop: 2 }}>
            colaborador@casadacrianca.org.br
          </Text>
        </View>

        {/* Opções de Navegação do Perfil */}
        <View style={{ gap: 12, marginBottom: 24 }}>
          <TouchableOpacity
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="2.1.1 Visualizar perfil detalhado"
            onPress={() => Alert.alert('Visualizar Perfil', 'Nome: Colaborador\nE-mail: colaborador@casadacrianca.org.br\nNível: Operador / Funcionário')}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: 16,
              borderRadius: 12,
              borderWidth: 1.5,
              backgroundColor: theme.surface,
              borderColor: theme.border,
              minHeight: 52,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <AppIcon name="user" size={20} variant="primary" />
              <Text style={{ fontWeight: '600', color: theme.text, fontSize: 14 * fontScale }}>
                2.1.1 Visualizar Perfil Detalhado
              </Text>
            </View>
            <AppIcon name="chevron-right" size={16} variant="neutral" />
          </TouchableOpacity>

          <TouchableOpacity
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="2.1.2 Editar perfil e dados cadastrais"
            onPress={() => Alert.alert('Editar Perfil', 'Funcionalidade de edição de nome e telefone disponível.')}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: 16,
              borderRadius: 12,
              borderWidth: 1.5,
              backgroundColor: theme.surface,
              borderColor: theme.border,
              minHeight: 52,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <AppIcon name="settings" size={20} variant="primary" />
              <Text style={{ fontWeight: '600', color: theme.text, fontSize: 14 * fontScale }}>
                2.1.2 Editar Perfil
              </Text>
            </View>
            <AppIcon name="chevron-right" size={16} variant="neutral" />
          </TouchableOpacity>

          <TouchableOpacity
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="2.1.3 Alterar preferências do sistema e acessibilidade"
            onPress={() => roteador.push('/accessibility')}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: 16,
              borderRadius: 12,
              borderWidth: 1.5,
              backgroundColor: theme.surface,
              borderColor: theme.border,
              minHeight: 52,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <AppIcon name="contrast" size={20} variant="secondary" />
              <Text style={{ fontWeight: '600', color: theme.text, fontSize: 14 * fontScale }}>
                2.1.3 Alterar Preferências e Acessibilidade
              </Text>
            </View>
            <AppIcon name="chevron-right" size={16} variant="neutral" />
          </TouchableOpacity>
        </View>

        {/* Botão de Logout (2.1.4) */}
        <AppButton
          title="2.1.4 Sair da Conta (Logout)"
          variant="danger"
          onPress={confirmarLogout}
          accessibilityHint="Encerra a sessão atual e retorna à tela de login"
        />
      </ScrollView>
    </SafeAreaView>
  );
}