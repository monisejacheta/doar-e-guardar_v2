// src/app/profile-edit.tsx
import React, { useState } from 'react';
import { Text, View, SafeAreaView, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { updateProfile } from 'firebase/auth';
import { auth } from '../services/firebaseConfig';
import { useAppTheme } from '../context/ThemeContext';
import { AppInput } from '../components/common/AppInput';
import { AppButton } from '../components/common/AppButton';

export default function ProfileEditScreen() {
  const roteador = useRouter();
  const { theme, tokens, fontScale } = useAppTheme();

  const u = auth?.currentUser;
  const [nome, setNome] = useState(u?.displayName || 'Colaborador Casa da Criança');
  const [setor, setSetor] = useState('Almoxarifado e Nutrição');
  const [salvando, setSalvando] = useState(false);

  const salvarAlteracoes = async () => {
    if (!nome.trim()) {
      Alert.alert('Campo Obrigatório', 'Informe o nome de identificação do operador.');
      return;
    }

    setSalvando(true);
    try {
      if (auth?.currentUser) {
        await updateProfile(auth.currentUser, { displayName: nome.trim() });
      }
      Alert.alert(
        'Perfil Atualizado',
        'Seus dados de identificação foram salvos e serão utilizados nos próximos registros de auditoria na AWS.',
        [{ text: 'Concluir', onPress: () => roteador.back() }]
      );
    } catch (e: any) {
      Alert.alert('Aviso', e?.message || 'Não foi possível atualizar o perfil.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
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
          Editar Perfil
        </Text>
        <Text style={{ color: theme.subtext, fontSize: 13 * fontScale, marginBottom: 16 }}>
          Atualize seu nome de operador exibido nas movimentações de prateleiras e baixas.
        </Text>

        <View style={{ backgroundColor: theme.surface, padding: 16, borderRadius: 14, borderWidth: 1.5, borderColor: theme.border, marginBottom: 16 }}>
          <AppInput
            rotulo="Nome Completo / Identificação na Auditoria"
            value={nome}
            onChangeText={setNome}
            placeholder="Ex: Maria Silva"
          />
          <AppInput
            rotulo="Setor / Equipe"
            value={setor}
            onChangeText={setSetor}
            placeholder="Ex: Cozinha / Despensa"
          />
        </View>

        <AppButton title="Salvar Dados do Perfil" variant="primary" loading={salvando} onPress={salvarAlteracoes} />
      </ScrollView>
    </SafeAreaView>
  );
}
