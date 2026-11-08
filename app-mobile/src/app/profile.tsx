// src/app/profile.tsx
import React, { useState } from 'react';
import {
  Text,
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { signOut } from 'firebase/auth';
import { auth } from '../services/firebaseConfig';
import { useAppTheme } from '../context/ThemeContext';
import { AppIcon } from '../components/common/AppIcon';

export default function ProfileScreen() {
  const roteador = useRouter();
  const { theme, fontScale } = useAppTheme();
  const [saindo, setSaindo] = useState(false);

  const usuarioAtual = auth?.currentUser;
  const nomeExibicao = usuarioAtual?.displayName || 'Colaborador Casa da Criança';
  const emailExibicao = usuarioAtual?.email || 'operador@casadacrianca.org.br';
  const urlFoto = usuarioAtual?.photoURL ?? null;

  const executarLogout = async () => {
    if (saindo) return;
    setSaindo(true);
    try {
      if (auth) {
        await signOut(auth);
      }
    } catch (erro: any) {
      console.warn('[Logout] signOut Firebase:', erro?.message);
      // Mesmo com erro no Firebase, derruba a sessão local e redireciona
    } finally {
      roteador.replace('/');
    }
  };

  const confirmarLogout = () => {
    Alert.alert(
      'Encerrar Sessão',
      'Deseja realmente sair da sua conta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sim, Sair', style: 'destructive', onPress: executarLogout },
      ],
      { cancelable: true }
    );
  };

  return (
    // flex: 1 garante que o View filho com posição absoluta funcione corretamente
    <View style={[estilos.raiz, { backgroundColor: theme.background }]}>
      <SafeAreaView style={{ flex: 1 }}>

        {/* Conteúdo rolável — paddingBottom reserva espaço para o botão fixo + BottomNavBar */}
        <ScrollView
          contentContainerStyle={[estilos.scroll, { paddingBottom: 160 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Botão Voltar */}
          <TouchableOpacity
            accessible
            accessibilityRole="button"
            accessibilityLabel="Voltar para a tela anterior"
            onPress={() => roteador.back()}
            style={estilos.voltar}
          >
            <Feather name="arrow-left" size={20} color={theme.primary} />
            <Text style={[estilos.voltarTexto, { color: theme.primary, fontSize: 15 * fontScale }]}>
              Voltar
            </Text>
          </TouchableOpacity>

          {/* Avatar + Nome + Email */}
          <View style={estilos.cabecalho}>
            {urlFoto ? (
              <Image
                source={{ uri: urlFoto }}
                style={[estilos.avatar, { borderColor: theme.primary, backgroundColor: theme.surface }]}
                accessibilityLabel="Foto de perfil do usuário"
              />
            ) : (
              <View style={[estilos.avatar, estilos.avatarFallback, { borderColor: theme.primary, backgroundColor: theme.surface }]}>
                <AppIcon name="user" size={40} variant="primary" />
              </View>
            )}
            <Text style={[estilos.nome, { color: theme.text, fontSize: 18 * fontScale }]}>
              {nomeExibicao}
            </Text>
            <Text style={[estilos.email, { color: theme.subtext, fontSize: 13 * fontScale }]}>
              {emailExibicao}
            </Text>
          </View>

          {/* Opções de Navegação */}
          <View style={estilos.opcoes}>
            {[
              { label: 'Visualizar Perfil Detalhado', icone: 'user', variante: 'primary', rota: '/profile-view' },
              { label: 'Editar Perfil', icone: 'settings', variante: 'primary', rota: '/profile-edit' },
              { label: 'Alterar Preferências e Acessibilidade', icone: 'contrast', variante: 'secondary', rota: '/accessibility' },
            ].map((item) => (
              <TouchableOpacity
                key={item.rota}
                accessible
                accessibilityRole="button"
                accessibilityLabel={item.label}
                onPress={() => roteador.push(item.rota as any)}
                style={[estilos.opcaoBotao, { backgroundColor: theme.surface, borderColor: theme.border }]}
              >
                <View style={estilos.opcaoEsquerda}>
                  <AppIcon name={item.icone as any} size={20} variant={item.variante as any} />
                  <Text style={[estilos.opcaoTexto, { color: theme.text, fontSize: 14 * fontScale }]}>
                    {item.label}
                  </Text>
                </View>
                <AppIcon name="chevron-right" size={16} variant="neutral" />
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/*
          Botão "Sair da Conta" fixado acima do BottomNavBar (bottom: 80 = altura da navbar 72 + 8 de margem).
          Renderizado FORA do ScrollView e com zIndex alto para garantir que
          nenhum overlay o bloqueie.
        */}
        <View
          style={[
            estilos.rodape,
            { backgroundColor: theme.background },
          ]}
          pointerEvents="box-none"
        >
          <TouchableOpacity
            accessible
            accessibilityRole="button"
            accessibilityLabel="Sair da Conta"
            accessibilityHint="Encerra a sessão e retorna à tela de login"
            onPress={confirmarLogout}
            disabled={saindo}
            activeOpacity={0.75}
            style={[
              estilos.botaoSair,
              {
                backgroundColor: saindo ? theme.subtext : theme.danger,
              },
            ]}
          >
            {saindo ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Feather name="log-out" size={18} color="#FFFFFF" style={{ marginRight: 10 }} />
                <Text style={[estilos.botaoSairTexto, { fontSize: 15 * fontScale }]}>
                  Sair da Conta
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

      </SafeAreaView>
    </View>
  );
}

const estilos = StyleSheet.create({
  raiz: {
    flex: 1,
  },
  scroll: {
    padding: 20,
  },
  voltar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    minHeight: 44,
  },
  voltarTexto: {
    fontWeight: 'bold',
    marginLeft: 8,
  },
  cabecalho: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    marginBottom: 12,
  },
  avatarFallback: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  nome: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  email: {
    marginTop: 2,
  },
  opcoes: {
    gap: 12,
  },
  opcaoBotao: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    minHeight: 52,
  },
  opcaoEsquerda: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  opcaoTexto: {
    fontWeight: '600',
    flexShrink: 1,
  },
  // Faixa fixada na parte de baixo da SafeAreaView, acima do BottomNavBar
  rodape: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 90 : 80,   // 72 (navbar) + margem
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 8,
    zIndex: 99,
    elevation: 20,                             // Android: garante que fica acima do BottomNavBar (elevation 10)
  },
  botaoSair: {
    flexDirection: 'row',
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  botaoSairTexto: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
