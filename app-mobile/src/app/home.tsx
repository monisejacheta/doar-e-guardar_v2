// src/app/home.tsx
import React from 'react';
import {
  Text,
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAppTheme } from '../context/ThemeContext';
import { ActionCard } from '../components/common/ActionCard';
import { estilosHome } from '../styles/home.styles';

export default function HomeScreen() {
  const roteador = useRouter();
  const { theme, tokens, fontScale, mode, setMode } = useAppTheme();

  const alternarContraste = () => {
    if (mode === 'light') setMode('high-contrast');
    else if (mode === 'high-contrast') setMode('dark');
    else setMode('light');
  };

  return (
    <SafeAreaView style={[estilosHome.container, { backgroundColor: theme.background }]}>
      {/* Barra Superior */}
      <View style={[estilosHome.barraSuperior, { borderBottomColor: theme.border }]}>
        <TouchableOpacity
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Abrir meu perfil de usuário"
          onPress={() => roteador.push('/profile')}
          style={estilosHome.perfilResumo}
        >
          <View style={[estilosHome.avatarPequeno, { borderColor: theme.primary, backgroundColor: theme.surface }]}>
            <Text style={estilosHome.avatarTexto}>👤</Text>
          </View>
          <View>
            <Text style={[estilosHome.saudacaoNome, { color: theme.text, fontSize: 15 * fontScale }]}>
              Olá, Colaborador
            </Text>
            <Text style={[estilosHome.rotuloFuncao, { color: theme.subtext, fontSize: 12 * fontScale }]}>
              Casa da Criança
            </Text>
          </View>
        </TouchableOpacity>

        <View style={estilosHome.acoesTopo}>
          <TouchableOpacity
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Ver avisos e notificações"
            onPress={() => roteador.push('/notifications')}
            style={[estilosHome.botaoIconeTopo, { borderColor: theme.border, backgroundColor: theme.surface }]}
          >
            <Text style={estilosHome.iconeTextoTopo}>🔔</Text>
          </TouchableOpacity>

          <TouchableOpacity
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Mudar contraste da tela"
            onPress={alternarContraste}
            style={[estilosHome.botaoIconeTopo, { borderColor: theme.border, backgroundColor: theme.surface }]}
          >
            <Text style={estilosHome.iconeTextoTopo}>🌓</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={estilosHome.rolagem}>
        {/* Cartão de Destaque da Assistente Dora (Tela 05) */}
        <TouchableOpacity
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Conversar com a Dora, nossa assistente de estoque e receitas"
          onPress={() => roteador.push('/dora')}
          activeOpacity={0.85}
          style={[
            estilosHome.blocoDestaqueDora,
            {
              backgroundColor: theme.surface,
              borderColor: tokens.colors.accentAmber500,
            },
          ]}
        >
          <View style={[estilosHome.iconeDora, { backgroundColor: `${tokens.colors.accentAmber500}20` }]}>
            <Text style={estilosHome.textoIconeDora}>💡</Text>
          </View>
          <View style={estilosHome.conteudoDora}>
            <Text
              style={[
                estilosHome.tituloDora,
                { color: theme.text, fontSize: tokens.typography.fontSize.md * fontScale },
              ]}
            >
              Falar com a Dora
            </Text>
            <Text
              style={[
                estilosHome.descricaoDora,
                { color: theme.subtext, fontSize: tokens.typography.fontSize.xs * fontScale },
              ]}
            >
              Pergunte sobre itens a vencer, saldos ou peça sugestões de receitas.
            </Text>
          </View>
        </TouchableOpacity>

        <Text
          style={[
            estilosHome.secaoTitulo,
            { color: theme.primary, fontSize: tokens.typography.fontSize.lg * fontScale },
          ]}
        >
          Áreas de Trabalho
        </Text>

        {/* Tela 03: Gerenciamento de Estoque */}
        <ActionCard
          titulo="Gerenciar Estoque"
          descricao="Consultar itens, registrar entradas com câmera e dar baixa com segurança."
          icone="📦"
          destaque={true}
          corDestaque={theme.secondary}
          aoTocar={() => roteador.push('/stock')}
        />

        {/* Tela 04: Relatórios */}
        <ActionCard
          titulo="Relatórios de Alimentos"
          descricao="Gerar balanços de estoque, validades e descartes para exportar em PDF."
          icone="📊"
          aoTocar={() => roteador.push('/reports')}
        />

        {/* Tela 07: Histórico e Auditoria */}
        <ActionCard
          titulo="Histórico de Ações"
          descricao="Conferir quem realizou cada entrada, saída ou movimentação no estoque."
          icone="📋"
          aoTocar={() => roteador.push('/audit')}
        />

        {/* Tela 06: Configurações Avançadas */}
        <ActionCard
          titulo="Configurações e Cadastros"
          descricao="Organizar armários, geladeiras, categorias de comida e doadores."
          icone="⚙️"
          aoTocar={() => roteador.push('/settings')}
        />

        {/* Tela 09: Diagnóstico e Disponibilidade */}
        <ActionCard
          titulo="Verificar Conexão e Central"
          descricao="Checar se a internet, o banco de dados e as centrais estão funcionando bem."
          icone="🩺"
          aoTocar={() => roteador.push('/diagnostic')}
        />
      </ScrollView>
    </SafeAreaView>
  );
}