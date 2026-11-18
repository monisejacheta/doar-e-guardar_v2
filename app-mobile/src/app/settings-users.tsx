// src/app/settings-users.tsx
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAppTheme } from '../context/ThemeContext';
import { AppInput } from '../components/common/AppInput';
import { AppButton } from '../components/common/AppButton';
import { requisicaoApi } from '../services/api';

interface UsuarioAws {
  id_usuario: string;
  nome_usuario: string;
  email_usuario: string;
  nivel_acesso_permissao: string;
}

const NIVEIS_PERMISSAO = [
  { id: 'administrador', label: 'Administrador' },
  { id: 'funcionario_operador', label: 'Operador' },
  { id: 'voluntario', label: 'Voluntário' },
];

export default function SettingsUsersScreen() {
  const roteador = useRouter();
  const { theme, tokens, fontScale } = useAppTheme();

  const [usuarios, setUsuarios] = useState<UsuarioAws[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [nivel, setNivel] = useState('funcionario_operador');

  const carregarUsuarios = useCallback(async () => {
    try {
      const resp: any = await requisicaoApi('/api/configuracoes', {
        metodo: 'POST',
        dados: { modulo: 'configuracoes', acao: 'listar_usuarios' },
      });
      if (resp?.sucesso && Array.isArray(resp.usuarios)) {
        setUsuarios(resp.usuarios);
      } else {
        setUsuarios([]);
      }
    } catch (err: any) {
      Alert.alert('Erro ao carregar', err?.message || 'Não foi possível consultar a equipe na AWS.');
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }, []);

  useEffect(() => {
    carregarUsuarios();
  }, [carregarUsuarios]);

  const cadastrarUsuario = async () => {
    if (!nome.trim() || !email.trim()) {
      Alert.alert('Campos obrigatórios', 'Informe o nome e o e-mail do membro da equipe.');
      return;
    }
    setSalvando(true);
    try {
      const resp: any = await requisicaoApi('/api/configuracoes', {
        metodo: 'POST',
        dados: {
          modulo: 'configuracoes',
          acao: 'cadastrar_usuario',
          nome_usuario: nome.trim(),
          email_usuario: email.trim().toLowerCase(),
          nivel_acesso_permissao: nivel,
        },
      });
      if (resp?.sucesso) {
        setNome('');
        setEmail('');
        await carregarUsuarios();
      } else {
        Alert.alert('Aviso', resp?.mensagem || 'Não foi possível salvar o usuário.');
      }
    } catch (err: any) {
      Alert.alert('Erro', err?.message || 'Falha ao cadastrar usuário na AWS.');
    } finally {
      setSalvando(false);
    }
  };

  const excluirUsuario = (item: UsuarioAws) => {
    Alert.alert('Remover Membro', `Deseja remover "${item.nome_usuario}" da equipe na AWS?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: async () => {
          try {
            await requisicaoApi('/api/configuracoes', {
              metodo: 'POST',
              dados: {
                modulo: 'configuracoes',
                acao: 'excluir_usuario',
                id_usuario: item.id_usuario,
              },
            });
            await carregarUsuarios();
          } catch (err: any) {
            Alert.alert('Erro', err?.message || 'Não foi possível remover o usuário.');
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 110 }}
        refreshControl={
          <RefreshControl
            refreshing={atualizando}
            onRefresh={() => {
              setAtualizando(true);
              carregarUsuarios();
            }}
            colors={[theme.primary]}
          />
        }
      >
        <TouchableOpacity
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Voltar para Configurações"
          onPress={() => roteador.back()}
          style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16, minHeight: 44 }}
        >
          <Feather name="arrow-left" size={20} color={theme.primary} />
          <Text style={{ color: theme.primary, fontWeight: 'bold', marginLeft: 8, fontSize: 15 * fontScale }}>
            Voltar às Configurações
          </Text>
        </TouchableOpacity>

        <Text style={{ fontWeight: '800', color: theme.primary, fontSize: tokens.typography.fontSize.xl * fontScale, marginBottom: 6 }}>
          Equipe e Funções
        </Text>
        <Text style={{ color: theme.subtext, fontSize: 13 * fontScale, marginBottom: 16 }}>
          Gerencie os membros da equipe e permissões salvos na AWS.
        </Text>

        <View
          style={{
            backgroundColor: theme.surface,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: theme.border,
            padding: 16,
            marginBottom: 20,
          }}
        >
          <Text style={{ fontWeight: '700', color: theme.text, marginBottom: 10, fontSize: 14 * fontScale }}>
            Novo Membro da Equipe
          </Text>
          <AppInput rotulo="Nome completo" placeholder="Ex: Ana Paula" value={nome} onChangeText={setNome} />
          <AppInput
            rotulo="E-mail"
            placeholder="ana@casadacrianca.org.br"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Text style={{ color: theme.text, fontWeight: '600', fontSize: 12 * fontScale, marginBottom: 8 }}>
            Nível de acesso:
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
            {NIVEIS_PERMISSAO.map((n) => {
              const ativo = nivel === n.id;
              return (
                <TouchableOpacity
                  key={n.id}
                  onPress={() => setNivel(n.id)}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 10,
                    borderWidth: 1.5,
                    borderColor: ativo ? theme.primary : theme.border,
                    backgroundColor: ativo ? theme.primary : 'transparent',
                  }}
                >
                  <Text style={{ color: ativo ? '#FFFFFF' : theme.text, fontWeight: '700', fontSize: 12 * fontScale }}>
                    {n.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <AppButton
            title={salvando ? 'Salvando na AWS...' : 'Cadastrar Membro'}
            onPress={cadastrarUsuario}
            disabled={salvando}
          />
        </View>

        {carregando ? (
          <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 20 }} />
        ) : usuarios.length === 0 ? (
          <View style={{ padding: 20, backgroundColor: theme.surface, borderRadius: 14, alignItems: 'center' }}>
            <Text style={{ color: theme.subtext, fontSize: 13 * fontScale }}>
              Nenhum membro cadastrado na AWS no momento.
            </Text>
          </View>
        ) : (
          usuarios.map((u) => (
            <View
              key={u.id_usuario}
              style={{
                backgroundColor: theme.surface,
                borderRadius: 14,
                borderWidth: 1.5,
                borderColor: theme.border,
                padding: 16,
                marginBottom: 12,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={{ fontWeight: 'bold', color: theme.primary, fontSize: 14 * fontScale }}>
                  {u.nome_usuario}
                </Text>
                <Text style={{ color: theme.text, fontSize: 12 * fontScale, marginTop: 4 }}>{u.email_usuario}</Text>
                <Text style={{ color: theme.secondary, fontSize: 11 * fontScale, fontWeight: '700', marginTop: 6 }}>
                  Perfil: {u.nivel_acesso_permissao}
                </Text>
              </View>
              <TouchableOpacity
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={`Remover ${u.nome_usuario}`}
                onPress={() => excluirUsuario(u)}
                style={{ padding: 8 }}
              >
                <Feather name="trash-2" size={18} color={theme.danger} />
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
