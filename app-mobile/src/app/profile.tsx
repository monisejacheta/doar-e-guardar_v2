// src/app/profile.tsx
import React from 'react';
import {
  Text,
  View,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAppTheme } from '../context/ThemeContext';
import { ActionCard } from '../components/common/ActionCard';
import { AppButton } from '../components/common/AppButton';
import { estilosPerfil } from '../styles/profile.styles';

export default function ProfileScreen() {
  const roteador = useRouter();
  const { theme, tokens, fontScale } = useAppTheme();

  // Dados provisórios da sessão atual
  const dadosUsuario = {
    nome: 'Colaborador da Casa da Criança',
    email: 'operador@casadacrianca.org.br',
    funcao: 'Atendimento e Estoque',
  };

  const abrirAviso = (titulo: string, mensagem: string) => {
    Alert.alert(titulo, mensagem);
  };

  // Tela 2.1.4 - Confirmação amigável de encerramento de sessão
  const confirmarSaida = () => {
    Alert.alert(
      'Encerrar sessão',
      'Você tem certeza de que deseja sair da sua conta agora?',
      [
        { text: 'Continuar no app', style: 'cancel' },
        {
          text: 'Sim, quero sair',
          style: 'destructive',
          onPress: () => roteador.replace('/'),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[estilosPerfil.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={estilosPerfil.rolagem}>
        {/* Cartão de identificação rápida */}
        <View
          style={[
            estilosPerfil.cartaoResumo,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <View style={[estilosPerfil.fotoArea, { borderColor: theme.primary, backgroundColor: theme.background }]}>
            <Text style={estilosPerfil.fotoIcone}>👤</Text>
          </View>
          <Text
            style={[
              estilosPerfil.nomeUsuario,
              { color: theme.text, fontSize: tokens.typography.fontSize.lg * fontScale },
            ]}
          >
            {dadosUsuario.nome}
          </Text>
          <Text
            style={[
              estilosPerfil.emailUsuario,
              { color: theme.subtext, fontSize: tokens.typography.fontSize.sm * fontScale },
            ]}
          >
            {dadosUsuario.email}
          </Text>
          <View style={[estilosPerfil.etiquetaFuncao, { backgroundColor: `${theme.primary}15` }]}>
            <Text style={[estilosPerfil.textoFuncao, { color: theme.primary, fontSize: 12 * fontScale }]}>
              {dadosUsuario.funcao}
            </Text>
          </View>
        </View>

        <Text
          style={[
            estilosPerfil.tituloSecao,
            { color: theme.primary, fontSize: tokens.typography.fontSize.md * fontScale },
          ]}
        >
          Opções da Minha Conta
        </Text>

        <View style={estilosPerfil.listaOpcoes}>
          {/* Tela 2.1.1 - Visualizar perfil detalhado */}
          <ActionCard
            titulo="Visualizar Informações"
            descricao="Consultar todos os seus dados cadastrados sem fazer alterações."
            icone="📄"
            aoTocar={() =>
              abrirAviso(
                'Tela 2.1.1 - Visualizar Perfil',
                `Nome: ${dadosUsuario.nome}\nE-mail: ${dadosUsuario.email}\nFunção: ${dadosUsuario.funcao}`
              )
            }
          />

          {/* Tela 2.1.2 - Editar perfil */}
          <ActionCard
            titulo="Editar Meus Dados"
            descricao="Atualizar seu nome de exibição, telefone e foto de identificação."
            icone="✏️"
            aoTocar={() =>
              abrirAviso('Tela 2.1.2 - Editar Perfil', 'O formulário de edição de dados será ativado em breve.')
            }
          />

          {/* Tela 2.1.3 - Alterar preferências */}
          <ActionCard
            titulo="Preferências do Sistema"
            descricao="Ajustar sons de confirmação e formas de aviso do aplicativo."
            icone="⚙️"
            aoTocar={() =>
              abrirAviso('Tela 2.1.3 - Preferências', 'Configurações de som e idioma serão ligadas aqui.')
            }
          />

          {/* Tela 02.3 - Acessibilidade Geral */}
          <ActionCard
            titulo="Acessibilidade e Leitura"
            descricao="Ajustar tamanho da letra, cores em alto contraste e opções de voz."
            icone="♿"
            destaque={true}
            corDestaque={theme.primary}
            aoTocar={() =>
              abrirAviso(
                'Tela 02.3 - Acessibilidade',
                'Painel completo para leitor de tela, voz e ajustes de visual.'
              )
            }
          />
        </View>

        {/* Tela 2.1.4 - Botão Sair / Logout */}
        <View style={estilosPerfil.areaLogout}>
          <AppButton
            title="Sair da Conta (Logout)"
            variant="danger"
            onPress={confirmarSaida}
            accessibilityHint="Toque para encerrar a sua sessão e voltar à tela inicial"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}