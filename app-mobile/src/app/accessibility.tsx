// src/app/accessibility.tsx
import React, { useState } from 'react';
import {
  Text,
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAppTheme } from '../context/ThemeContext';
import { AppButton } from '../components/common/AppButton';
import { AppIcon } from '../components/common/AppIcon';
import { estilosAccessibility } from '../styles/accessibility.styles';

export default function AccessibilityScreen() {
  const roteador = useRouter();
  const { theme, tokens, mode, setMode, fontScale, setFontScale } = useAppTheme();

  const [leitorTelaAtivo, setLeitorTelaAtivo] = useState(true);
  const [comandoVozAtivo, setComandoVozAtivo] = useState(true);

  const opcoesFonte = [
    { rotulo: 'Normal (100%)', valor: 1.0 },
    { rotulo: 'Grande (125%)', valor: 1.25 },
    { rotulo: 'Extra (150%)', valor: 1.5 },
  ];

  const salvarPreferencias = () => {
    Alert.alert(
      'Acessibilidade Atualizada',
      'Suas preferências visuais e de leitura foram aplicadas em todas as telas do aplicativo.',
      [{ text: 'Concluir', onPress: () => roteador.back() }]
    );
  };

  return (
    <SafeAreaView style={[estilosAccessibility.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={estilosAccessibility.rolagem}>
        {/* Cabeçalho */}
        <View style={estilosAccessibility.cabecalho}>
          <Text
            style={[
              estilosAccessibility.titulo,
              { color: theme.primary, fontSize: tokens.typography.fontSize.xl * fontScale },
            ]}
          >
            Acessibilidade e Leitura
          </Text>
          <Text
            style={[
              estilosAccessibility.subtitulo,
              { color: theme.subtext, fontSize: tokens.typography.fontSize.sm * fontScale },
            ]}
          >
            Ajuste o tamanho das letras, o contraste de cores e os recursos de voz para facilitar o seu uso.
          </Text>
        </View>

        {/* 1. Tamanho da Fonte (Tela 2.3.3 - Tarefa 04 do Teste Beta) */}
        <View
          style={[
            estilosAccessibility.secaoCard,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <Text
            style={[
              estilosAccessibility.tituloSecao,
              { color: theme.text, fontSize: tokens.typography.fontSize.md * fontScale },
            ]}
          >
            1. Tamanho da Letra
          </Text>
          <Text
            style={[
              estilosAccessibility.descricaoSecao,
              { color: theme.subtext, fontSize: tokens.typography.fontSize.xs * fontScale },
            ]}
          >
            Aumente o texto de todas as telas sem cortar palavras ou botões.
          </Text>

          <View style={estilosAccessibility.linhaBotoesEscala}>
            {opcoesFonte.map((opcao) => {
              const selecionado = fontScale === opcao.valor;
              return (
                <TouchableOpacity
                  key={opcao.rotulo}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={`Tamanho da fonte ${opcao.rotulo}`}
                  accessibilityState={{ selected: selecionado }}
                  onPress={() => setFontScale(opcao.valor)}
                  style={[
                    estilosAccessibility.botaoEscala,
                    {
                      backgroundColor: selecionado ? theme.primary : theme.background,
                      borderColor: selecionado ? theme.primary : theme.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      estilosAccessibility.textoBotaoEscala,
                      {
                        color: selecionado ? '#FFFFFF' : theme.text,
                        fontSize: 13 * opcao.valor,
                      },
                    ]}
                  >
                    {opcao.rotulo}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 2. Modos de Cor: Alto Contraste e Modo Escuro (Telas 2.3.4 e 2.3.5) */}
        <View
          style={[
            estilosAccessibility.secaoCard,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <Text
            style={[
              estilosAccessibility.tituloSecao,
              { color: theme.text, fontSize: tokens.typography.fontSize.md * fontScale },
            ]}
          >
            2. Contraste e Cores da Tela
          </Text>
          <Text
            style={[
              estilosAccessibility.descricaoSecao,
              { color: theme.subtext, fontSize: tokens.typography.fontSize.xs * fontScale },
            ]}
          >
            Escolha o estilo visual mais confortável para a sua visão.
          </Text>

          <View style={estilosAccessibility.gradeModosVisuais}>
            {[
              { id: 'light', nome: 'Modo Claro Padrão (Azul & Verde)' },
              { id: 'high-contrast', nome: 'Alto Contraste (Baixa Visão - WCAG AAA)' },
              { id: 'dark', nome: 'Modo Escuro (Redução de Cansaço Visual)' },
            ].map((item) => {
              const ativo = mode === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={`Ativar ${item.nome}`}
                  accessibilityState={{ selected: ativo }}
                  onPress={() => setMode(item.id as any)}
                  style={[
                    estilosAccessibility.botaoModoVisual,
                    {
                      backgroundColor: ativo ? `${theme.secondary}15` : theme.background,
                      borderColor: ativo ? theme.secondary : theme.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      estilosAccessibility.textoModoVisual,
                      {
                        color: ativo ? theme.secondary : theme.text,
                        fontSize: tokens.typography.fontSize.sm * fontScale,
                      },
                    ]}
                  >
                    {item.nome}
                  </Text>
                  <AppIcon
                    name="contrast"
                    size={20}
                    variant={ativo ? 'secondary' : 'neutral'}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 3. Leitor de Tela e Comando de Voz (Telas 2.3.1 e 2.3.2) */}
        <View
          style={[
            estilosAccessibility.secaoCard,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <Text
            style={[
              estilosAccessibility.tituloSecao,
              { color: theme.text, fontSize: tokens.typography.fontSize.md * fontScale },
            ]}
          >
            3. Assistência de Leitura e Voz
          </Text>

          <View style={[estilosAccessibility.linhaSwitch, { borderBottomColor: theme.border }]}>
            <View style={estilosAccessibility.infoSwitch}>
              <Text
                style={[
                  estilosAccessibility.tituloSwitch,
                  { color: theme.text, fontSize: tokens.typography.fontSize.sm * fontScale },
                ]}
              >
                Descrições para Leitor de Tela
              </Text>
              <Text style={{ color: theme.subtext, fontSize: 12 * fontScale }}>
                Otimiza rótulos detalhados para TalkBack e VoiceOver.
              </Text>
            </View>
            <Switch
              value={leitorTelaAtivo}
              onValueChange={setLeitorTelaAtivo}
              trackColor={{ false: theme.border, true: theme.secondary }}
              accessibilityLabel="Ativar descrições detalhadas para leitor de tela"
            />
          </View>

          <View style={[estilosAccessibility.linhaSwitch, { borderBottomWidth: 0 }]}>
            <View style={estilosAccessibility.infoSwitch}>
              <Text
                style={[
                  estilosAccessibility.tituloSwitch,
                  { color: theme.text, fontSize: tokens.typography.fontSize.sm * fontScale },
                ]}
              >
                Navegação e Ditado por Voz
              </Text>
              <Text style={{ color: theme.subtext, fontSize: 12 * fontScale }}>
                Permite conversar por voz com a assistente Dora e preencher campos.
              </Text>
            </View>
            <Switch
              value={comandoVozAtivo}
              onValueChange={setComandoVozAtivo}
              trackColor={{ false: theme.border, true: theme.secondary }}
              accessibilityLabel="Ativar navegação e ditado por comando de voz"
            />
          </View>
        </View>

        <AppButton
          title="Salvar e Voltar"
          variant="primary"
          onPress={salvarPreferencias}
          accessibilityHint="Confirma os ajustes de acessibilidade e retorna à tela anterior"
        />
      </ScrollView>
    </SafeAreaView>
  );
}