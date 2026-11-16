// src/app/settings.tsx
import React from 'react';
import { Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAppTheme } from '../context/ThemeContext';
import { ActionCard } from '../components/common/ActionCard';
import { estilosSettings } from '../styles/settings.styles';

export default function SettingsScreen() {
  const roteador = useRouter();
  const { theme, tokens, fontScale } = useAppTheme();

  return (
    <SafeAreaView style={[estilosSettings.container, { backgroundColor: 'transparent' }]}>
      <ScrollView contentContainerStyle={estilosSettings.rolagem}>
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

        <View style={estilosSettings.cabecalho}>
          <Text style={[estilosSettings.titulo, { color: theme.primary, fontSize: tokens.typography.fontSize.xl * fontScale }]}>
            Ajustes e Cadastros
          </Text>
          <Text style={[estilosSettings.subtitulo, { color: theme.subtext, fontSize: tokens.typography.fontSize.sm * fontScale }]}>
            Cuide das prateleiras da despensa, categorias de alimentos, motivos de saída e parceiros.
          </Text>
        </View>

        <Text style={[estilosSettings.categoriaSecao, { color: theme.primary, fontSize: tokens.typography.fontSize.md * fontScale }]}>
          Organização da Despensa
        </Text>

        <ActionCard
          titulo="Prateleiras e Armários"
          descricao="Cadastre e organize os armários, geladeiras, prateleiras e gavetas onde os alimentos ficam guardados."
          iconName="box"
          destaque={true}
          corDestaque={theme.secondary}
          aoTocar={() => roteador.push('/settings-storage')}
        />

        <ActionCard
          titulo="Categorias de Alimentos"
          descricao="Veja os tipos de alimentos e quantos pacotes temos guardados em cada categoria."
          iconName="clipboard"
          aoTocar={() => roteador.push('/settings-categories')}
        />

        <ActionCard
          titulo="Motivos de Saída"
          descricao="Veja as opções para registrar o uso diário na cozinha, doações ou descartes."
          iconName="arrow-down-circle"
          aoTocar={() => roteador.push('/settings-reasons')}
        />

        <Text style={[estilosSettings.categoriaSecao, { color: theme.primary, fontSize: tokens.typography.fontSize.md * fontScale }]}>
          Comunidade e Doações
        </Text>

        <ActionCard
          titulo="Doadores e Apoiadores"
          descricao="Cadastre e consulte as pessoas e empresas que ajudam a Casa da Criança com doações."
          iconName="user"
          aoTocar={() => roteador.push('/settings-donors')}
        />

        <ActionCard
          titulo="Instituições Parceiras"
          descricao="Veja as unidades e entidades parceiras que caminham junto com a Casa da Criança."
          iconName="box"
          aoTocar={() => roteador.push('/settings-institutions')}
        />

        <ActionCard
          titulo="Campanhas de Doações"
          descricao="Acompanhe as campanhas de arrecadação de alimentos que estão abertas."
          iconName="bell"
          aoTocar={() => roteador.push('/settings-campaigns')}
        />

        <Text style={[estilosSettings.categoriaSecao, { color: theme.primary, fontSize: tokens.typography.fontSize.md * fontScale }]}>
          Equipe e Atualização
        </Text>

        <ActionCard
          titulo="Equipe e Funções"
          descricao="Veja o que cada pessoa da equipe pode fazer no aplicativo."
          iconName="settings"
          aoTocar={() => roteador.push('/settings-users')}
        />

        <ActionCard
          titulo="Atualizar Dados do App"
          descricao="Confira se as prateleiras, alimentos e movimentações estão todos atualizados."
          iconName="refresh-cw"
          aoTocar={() => roteador.push('/settings-sync')}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
