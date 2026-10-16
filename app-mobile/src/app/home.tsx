// src/app/home.tsx
import React, { useState } from 'react';
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
import { AppIcon } from '../components/common/AppIcon';
import { estilosHome } from '../styles/home.styles';

export default function HomeScreen() {
  const roteador = useRouter();
  const { theme, tokens, fontScale, mode, setMode } = useAppTheme();

  // Estados com dados do inventário e avisos
  const [totalAlertasValidade] = useState(3);
  const [totalEstoqueCritico] = useState(2);
  const [notificacoesNaoLidas] = useState(2);

  const alternarContraste = () => {
    if (mode === 'light') setMode('high-contrast');
    else if (mode === 'high-contrast') setMode('dark');
    else setMode('light');
  };

  return (
    <SafeAreaView style={[estilosHome.container, { backgroundColor: theme.background }]}>
      {/* Barra Superior com Perfil e Notificações */}
      <View style={[estilosHome.barraSuperior, { borderBottomColor: theme.border }]}>
        <TouchableOpacity
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Abrir meu perfil de usuário"
          accessibilityHint="Acessa dados cadastrais e opções da conta"
          onPress={() => roteador.push('/profile')}
          style={estilosHome.perfilResumo}
        >
          <View style={[estilosHome.avatarPequeno, { borderColor: theme.primary, backgroundColor: theme.surface }]}>
            <AppIcon name="user" size={22} variant="primary" />
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
          {/* Botão de Notificações com Badge */}
          <TouchableOpacity
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={`Ver avisos e notificações. Você possui ${notificacoesNaoLidas} avisos não lidos.`}
            accessibilityHint="Abre a lista detalhada de notificações"
            onPress={() => roteador.push('/notifications')}
            style={[estilosHome.botaoIconeTopo, { borderColor: theme.border, backgroundColor: theme.surface }]}
          >
            <AppIcon name="bell" size={20} variant="primary" />
            {notificacoesNaoLidas > 0 && (
              <View style={[estilosHome.badgeNotificacao, { backgroundColor: theme.danger }]}>
                <Text style={estilosHome.textoBadge}>{notificacoesNaoLidas}</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Alternador de Contraste */}
          <TouchableOpacity
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Mudar modo visual de alto contraste"
            accessibilityHint="Alterna as cores para facilitar a visualização"
            onPress={alternarContraste}
            style={[estilosHome.botaoIconeTopo, { borderColor: theme.border, backgroundColor: theme.surface }]}
          >
            <AppIcon name="contrast" size={20} variant="primary" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={estilosHome.rolagem}>
        {/* Painel de Resumo Operacional */}
        <View style={estilosHome.secaoResumo}>
          <Text
            style={[
              estilosHome.secaoTitulo,
              { color: theme.primary, fontSize: tokens.typography.fontSize.md * fontScale },
            ]}
          >
            Resumo do Dia
          </Text>

          <View style={estilosHome.linhaResumos}>
            {/* Lotes a Vencer (< 7 dias) em Âmbar */}
            <TouchableOpacity
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={`${totalAlertasValidade} lotes com vencimento próximo em menos de 7 dias. Toque para consultar os lotes.`}
              onPress={() => roteador.push('/stock-details')}
              activeOpacity={0.8}
              style={[
                estilosHome.cartaoResumoPequeno,
                {
                  backgroundColor: theme.surface,
                  borderColor: tokens.colors.accentAmber500, // Âmbar Oficial
                },
              ]}
            >
              <View style={estilosHome.cabecalhoResumo}>
                <AppIcon name="clock" size={20} variant="amber" />
                <AppIcon name="chevron-right" size={16} variant="amber" />
              </View>
              <View>
                <Text
                  style={[
                    estilosHome.valorResumo,
                    { color: tokens.colors.accentAmber500, fontSize: tokens.typography.fontSize.xl * fontScale },
                  ]}
                >
                  {totalAlertasValidade}
                </Text>
                <Text
                  style={[
                    estilosHome.legendaResumo,
                    { color: theme.text, fontSize: 11 * fontScale },
                  ]}
                >
                  Vencem em breve
                </Text>
              </View>
            </TouchableOpacity>

            {/* Estoque Mínimo / Crítico em Vermelho */}
            <TouchableOpacity
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={`${totalEstoqueCritico} alimentos atingiram o estoque mínimo. Toque para ver a lista de produtos.`}
              onPress={() => roteador.push('/stock')}
              activeOpacity={0.8}
              style={[
                estilosHome.cartaoResumoPequeno,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.danger, // Vermelho Alerta
                },
              ]}
            >
              <View style={estilosHome.cabecalhoResumo}>
                <AppIcon name="alert-triangle" size={20} variant="danger" />
                <AppIcon name="chevron-right" size={16} variant="danger" />
              </View>
              <View>
                <Text
                  style={[
                    estilosHome.valorResumo,
                    { color: theme.danger, fontSize: tokens.typography.fontSize.xl * fontScale },
                  ]}
                >
                  {totalEstoqueCritico}
                </Text>
                <Text
                  style={[
                    estilosHome.legendaResumo,
                    { color: theme.text, fontSize: 11 * fontScale },
                  ]}
                >
                  Estoque em falta
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Card da Dora */}
        <TouchableOpacity
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Conversar com a Dora, assistente de estoque e sugestões de receitas"
          accessibilityHint="Abre o chat em linguagem natural com a Dora"
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
            <AppIcon name="help-circle" size={24} color={tokens.colors.accentAmber500} />
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
              Consulte itens a vencer, saldos ou receba receitas para aproveitar os alimentos.
            </Text>
          </View>
          <AppIcon name="chevron-right" size={18} variant="amber" />
        </TouchableOpacity>

        {/* Áreas Operacionais */}
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
          iconName="box"
          destaque={true}
          corDestaque={theme.secondary} // Verde Doar
          aoTocar={() => roteador.push('/stock')}
        />

        {/* Tela 04: Relatórios */}
        <ActionCard
          titulo="Relatórios de Alimentos"
          descricao="Gerar balanços de estoque, validades e descartes para exportar em PDF."
          iconName="bar-chart-2"
          aoTocar={() => roteador.push('/reports')}
        />

        {/* Tela 07: Histórico e Auditoria */}
        <ActionCard
          titulo="Histórico de Ações"
          descricao="Conferir quem realizou cada entrada, saída ou movimentação no estoque."
          iconName="clipboard"
          aoTocar={() => roteador.push('/audit')}
        />

        {/* Tela 06: Configurações Avançadas */}
        <ActionCard
          titulo="Configurações e Cadastros"
          descricao="Organizar armários, geladeiras, categorias de comida e doadores."
          iconName="settings"
          aoTocar={() => roteador.push('/settings')}
        />

        {/* Tela 09: Diagnóstico e Disponibilidade */}
        <ActionCard
          titulo="Verificar Conexão e Central"
          descricao="Checar se a internet, o banco de dados e as centrais estão funcionando bem."
          iconName="activity"
          aoTocar={() => roteador.push('/diagnostic')}
        />
      </ScrollView>
    </SafeAreaView>
  );
}