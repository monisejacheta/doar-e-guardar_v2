// src/app/settings.tsx
import React from 'react';
import { Text, View, SafeAreaView, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppTheme } from '../context/ThemeContext';
import { ActionCard } from '../components/common/ActionCard';
import { estilosSettings } from '../styles/settings.styles';

export default function SettingsScreen() {
  const roteador = useRouter();
  const { theme, tokens, fontScale } = useAppTheme();

  return (
    <SafeAreaView style={[estilosSettings.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={estilosSettings.rolagem}>
        <View style={estilosSettings.cabecalho}>
          <Text style={[estilosSettings.titulo, { color: theme.primary, fontSize: tokens.typography.fontSize.xl * fontScale }]}>
            Configurações e Cadastros
          </Text>
          <Text style={[estilosSettings.subtitulo, { color: theme.subtext, fontSize: tokens.typography.fontSize.sm * fontScale }]}>
            Gerencie armários, geladeiras, categorias de alimentos, doadores e níveis de permissão.
          </Text>
        </View>

        <Text style={[estilosSettings.categoriaSecao, { color: theme.primary, fontSize: tokens.typography.fontSize.md * fontScale }]}>
          Estrutura Física e Alimentos
        </Text>

        <ActionCard
          titulo="6.5 Locais de Armazenamento"
          descricao="Cadastrar armários, geladeiras, prateleiras e gavetas (sem ruas ou corredores)."
          iconName="box"
          destaque={true}
          corDestaque={theme.secondary}
          aoTocar={() => roteador.push('/settings-storage')}
        />

        <ActionCard
          titulo="6.4 Categorias de Alimentos"
          descricao="Organizar categorias, subcategorias (ex: Grãos, Laticínios) e descrições."
          iconName="clipboard"
          aoTocar={() => roteador.push('/settings-categories')}
        />

        <ActionCard
          titulo="6.7 Motivos de Saída"
          descricao="Configurar justificativas padrão para baixas de consumo ou descarte."
          iconName="arrow-down-circle"
          aoTocar={() => roteador.push('/settings-reasons')}
        />

        <Text style={[estilosSettings.categoriaSecao, { color: theme.primary, fontSize: tokens.typography.fontSize.md * fontScale }]}>
          Comunidade e Doações
        </Text>

        <ActionCard
          titulo="6.1 Doadores (Pessoa Física)"
          descricao="Cadastrar, editar e consultar apoiadores e representantes."
          iconName="user"
          aoTocar={() => roteador.push('/settings-donors')}
        />

        <ActionCard
          titulo="6.2 Instituições Parceiras"
          descricao="Gerenciar entidades vinculadas a doadores representantes."
          iconName="box"
          aoTocar={() => roteador.push('/settings-institutions')}
        />

        <ActionCard
          titulo="6.3 Campanhas de Doações Ativas"
          descricao="Consultar campanhas criadas por doadores e homologadas pela ONG."
          iconName="bell"
          aoTocar={() => roteador.push('/settings-campaigns')}
        />

        <Text style={[estilosSettings.categoriaSecao, { color: theme.primary, fontSize: tokens.typography.fontSize.md * fontScale }]}>
          Segurança e Nuvem
        </Text>

        <ActionCard
          titulo="6.6 Usuários e Permissões"
          descricao="Controlar acessos de administradores, voluntários e operadores."
          iconName="settings"
          aoTocar={() => roteador.push('/settings-users')}
        />

        <ActionCard
          titulo="6.8 Backup e Sincronização"
          descricao="Conferir o status de sincronização com os bancos de dados na AWS."
          iconName="refresh-cw"
          aoTocar={() => roteador.push('/settings-sync')}
        />
      </ScrollView>
    </SafeAreaView>
  );
}