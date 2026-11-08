// src/app/profile.tsx
import React, { useState } from 'react';
import { Text, View, SafeAreaView, ScrollView, TouchableOpacity, Alert, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { signOut } from 'firebase/auth';
import { auth } from '../services/firebaseConfig';
import { useAppTheme } from '../context/ThemeContext';
import { AppIcon } from '../components/common/AppIcon';
import { AppButton } from '../components/common/AppButton';

export default function ProfileScreen() {
  const roteador = useRouter();
  const { theme, fontScale } = useAppTheme();
  const [saindo, setSaindo] = useState(false);

  const usuarioAtual = auth?.currentUser;
  const nomeExibicao = usuarioAtual?.displayName || 'Colaborador Casa da Criança';
  const emailExibicao = usuarioAtual?.email || 'operador@casadacrianca.org.br';
  // FIX #1: Lê a URL da foto do usuário autenticado no Firebase
  const urlFoto = usuarioAtual?.photoURL ?? null;

  const confirmarLogout = () => {
    Alert.alert(
      'Encerrar Sessão',
      'Deseja realmente sair da sua conta na Casa da Criança?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sim, Sair',
          style: 'destructive',
          onPress: async () => {
            setSaindo(true);
            try {
              // FIX #1: aguarda o signOut completo antes de navegar
              if (auth) {
                await signOut(auth);
              }
              // Substitui a rota atual pelo index (tela de login) para limpar o histórico
              roteador.replace('/');
            } catch (erro: any) {
              setSaindo(false);
              Alert.alert(
                'Erro ao Sair',
                erro?.message || 'Não foi possível encerrar a sessão. Tente novamente.',
              );
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <TouchableOpacity
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Voltar para a tela anterior"
          onPress={() => roteador.back()}
          style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, minHeight: 44 }}
        >
          <Feather name="arrow-left" size={20} color={theme.primary} />
          <Text style={{ color: theme.primary, fontWeight: 'bold', marginLeft: 8, fontSize: 15 * fontScale }}>
            Voltar
          </Text>
        </TouchableOpacity>

        {/* Cabeçalho do Perfil */}
        <View style={{ alignItems: 'center', marginBottom: 24 }}>
          {/* FIX #1: Exibe a foto real do perfil quando disponível */}
          {urlFoto ? (
            <Image
              source={{ uri: urlFoto }}
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                borderWidth: 2,
                borderColor: theme.primary,
                marginBottom: 12,
                backgroundColor: theme.surface,
              }}
              accessibilityLabel="Foto de perfil do usuário"
            />
          ) : (
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
          )}
          <Text style={{ fontWeight: 'bold', color: theme.text, fontSize: 18 * fontScale, textAlign: 'center' }}>
            {nomeExibicao}
          </Text>
          <Text style={{ color: theme.subtext, fontSize: 13 * fontScale, marginTop: 2 }}>
            {emailExibicao}
          </Text>
        </View>

        {/* Opções de Navegação do Perfil */}
        <View style={{ gap: 12, marginBottom: 24 }}>
          <TouchableOpacity
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="2.1.1 Visualizar perfil detalhado"
            onPress={() => roteador.push('/profile-view' as any)}
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
                 Visualizar Perfil Detalhado
              </Text>
            </View>
            <AppIcon name="chevron-right" size={16} variant="neutral" />
          </TouchableOpacity>

          <TouchableOpacity
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Editar perfil e dados cadastrais"
            onPress={() => roteador.push('/profile-edit' as any)}
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
                 Editar Perfil
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
                 Alterar Preferências e Acessibilidade
              </Text>
            </View>
            <AppIcon name="chevron-right" size={16} variant="neutral" />
          </TouchableOpacity>
        </View>

        {/* Botão de Logout (2.1.4) */}
        <AppButton
          title=" Sair da Conta "
          variant="danger"
          loading={saindo}
          onPress={confirmarLogout}
          accessibilityHint="Encerra a sessão atual e retorna à tela de login"
        />
      </ScrollView>
    </SafeAreaView>
  );
}
