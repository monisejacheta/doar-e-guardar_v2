// src/app/settings.tsx
import React from 'react';
import { Text, View, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
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
            Configurações e Cadastros
          </Text>
          <Text style={[estilosSettings.subtitulo, { color: theme.subtext, fontSize: tokens.typography.fontSize.sm * fontScale }]}>
            Gerencie prateleiras homologadas na AWS, categorias institucionais, motivos de baixa e sincronização.
          </Text>
        </View>

        <Text style={[estilosSettings.categoriaSecao, { color: theme.primary, fontSize: tokens.typography.fontSize.md * fontScale }]}>
          Estrutura Física e Alimentos (AWS)
        </Text>

        <ActionCard
          titulo="Locais de Armazenamento (Prateleiras AWS)"
          descricao="Cadastrar armários, geladeiras, prateleiras e gavetas sincronizados na tabela tb_locaisArmazenamento."
          iconName="box"
          destaque={true}
          corDestaque={theme.secondary}
          aoTocar={() => roteador.push('/settings-storage')}
        />

        <ActionCard
          titulo="Categorias de Alimentos"
          descricao="Conferir categorias institucionais e contagem real de lotes ativos por categoria na AWS."
          iconName="clipboard"
          aoTocar={() => roteador.push('/settings-categories')}
        />

        <ActionCard
          titulo="Motivos de Saída e Trava US07"
          descricao="Regras de justificativa para consumo diário na cozinha e baixa auditada com trava PERDA."
          iconName="arrow-down-circle"
          aoTocar={() => roteador.push('/settings-reasons')}
        />

        <Text style={[estilosSettings.categoriaSecao, { color: theme.primary, fontSize: tokens.typography.fontSize.md * fontScale }]}>
          Comunidade e Doações (Portal Web & LGPD)
        </Text>

        <ActionCard
          titulo="Doadores (Pessoa Física)"
          descricao="Consultar apoiadores e política de anonimização LGPD de dados sensíveis."
          iconName="user"
          aoTocar={() => roteador.push('/settings-donors')}
        />

        <ActionCard
          titulo="Instituições Parceiras"
          descricao="Entidades homologadas vinculadas às doações recorrentes da Casa da Criança."
          iconName="box"
          aoTocar={() => roteador.push('/settings-institutions')}
        />

        <ActionCard
          titulo="Campanhas de Doações Ativas"
          descricao="Campanhas homologadas pela administração da ONG (Regra W08)."
          iconName="bell"
          aoTocar={() => roteador.push('/settings-campaigns')}
        />

        <Text style={[estilosSettings.categoriaSecao, { color: theme.primary, fontSize: tokens.typography.fontSize.md * fontScale }]}>
          Segurança e Nuvem
        </Text>

        <ActionCard
          titulo="Usuários e Permissões"
          descricao="Níveis de acesso de administradores, nutricionistas e operadores de estoque."
          iconName="settings"
          aoTocar={() => roteador.push('/settings-users')}
        />

        <ActionCard
          titulo="Backup e Sincronização AWS"
          descricao="Reconciliar prateleiras e verificar o status de sincronização com o DynamoDB."
          iconName="refresh-cw"
          aoTocar={() => roteador.push('/settings-sync')}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
