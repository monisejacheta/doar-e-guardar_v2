// src/app/dora.tsx
import React, { useState } from 'react';
import {
  Text,
  View,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { useAppTheme } from '../context/ThemeContext';
import { AppIcon } from '../components/common/AppIcon';
import { estilosDora } from '../styles/dora.styles';

interface ReceitaSugerida {
  titulo: string;
  ingredientesEstoque: string;
  modoPreparo: string;
  fonteNome: string;
  fonteUrl: string;
}

interface MensagemChat {
  id: string;
  autor: 'dora' | 'usuario';
  texto: string;
  receita?: ReceitaSugerida;
}

export default function DoraScreen() {
  const { theme, tokens, fontScale } = useAppTheme();
  const [entradaTexto, setEntradaTexto] = useState('');
  const [ouvindoVoz, setOuvindoVoz] = useState(false);

  const [historico, setHistorico] = useState<MensagemChat[]>([
    {
      id: 'msg-1',
      autor: 'dora',
      texto:
        'Olá! Eu sou a Dora, sua assistente da Casa da Criança. Posso consultar lotes a vencer, sugerir receitas para evitar desperdício, gerar relatórios em PDF ou ensinar como realizar uma tarefa. Toque em um exemplo abaixo ou escreva seu pedido!',
    },
  ]);

  // Exemplos visíveis na tela conforme exigido para usuários com pouca experiência mobile
  const comandosExemplo = [
    'Sugerir receita com itens a vencer',
    'Quais lotes vencem esta semana?',
    'Gerar relatório de perdas em PDF',
    'Como dar baixa por perda?',
  ];

  const processarIntencaoDora = (pergunta: string) => {
    const p = pergunta.toLowerCase();

    // 1. Intenção: Sugestão de Receitas (US08 / Tarefa 05 do Teste Beta)
    if (p.includes('receita') || p.includes('cozinhar') || p.includes('cardápio') || p.includes('aproveitar')) {
      return {
        texto:
          'Consultei o estoque relacional e identifiquei que o lote LOTE-2026-A1 de Leite Integral (8 litros) vence em 4 dias e temos Arroz Tipo 1 disponível. Aqui está uma sugestão nutritiva para aproveitar esses insumos:',
        receita: {
          titulo: 'Arroz Doce Cremoso Nutritivo (Rendimento: 25 porções)',
          ingredientesEstoque:
            '• 4 litros de Leite Integral UHT (Priorizar LOTE-2026-A1 - Geladeira 1)\n• 1 kg de Arroz Tipo 1 (Armário B)\n• Açúcar e canela da despensa',
          modoPreparo:
            '1. Cozinhe o arroz em água até amaciar.\n2. Adicione o leite integral do lote próximo ao vencimento e deixe ferver em fogo baixo mexendo sempre.\n3. Adoce a gosto e sirva morno ou gelado para as crianças.',
          fonteNome: 'Fonte Externa: TudoGostoso / Receitas Sociais',
          fonteUrl: 'https://www.tudogostoso.com.br',
        },
      };
    }

    // 2. Intenção: Consulta de Validades / Estoque em Tempo Real
    if (p.includes('vencem') || p.includes('validade') || p.includes('estoque') || p.includes('saldo')) {
      return {
        texto:
          'Atualmente temos 2 alertas prioritários no inventário:\n• Leite Integral UHT (LOTE-2026-A1): 8 unidades na Geladeira 1 (Vence em 4 dias).\n• Feijão Carioca (LOTE-2026-FJ2): 6 pacotes no Armário B (Abaixo do estoque mínimo).',
      };
    }

    // 3. Intenção: Geração de Relatórios por Comando
    if (p.includes('relatório') || p.includes('pdf') || p.includes('gráfico')) {
      return {
        texto:
          'Pronto! Consolidei o relatório solicitado com gráfico comparativo. O arquivo PDF foi gerado e enviado para o e-mail institucional cadastrado da diretoria.',
      };
    }

    // 4. Intenção: Auxílio Operacional
    return {
      texto:
        'Para dar baixa em um item vencido ou avariado:\n1. Acesse "Gerenciar Estoque" e toque em "- Saída".\n2. Escolha o lote prioritário e selecione o motivo de perda.\n3. Digite a palavra PERDA em letras maiúsculas para destravar a confirmação.',
    };
  };

  const enviarComando = (textoManual?: string) => {
    const perguntaFinal = (textoManual ?? entradaTexto).trim();
    if (!perguntaFinal) return;

    const respostaIa = processarIntencaoDora(perguntaFinal);

    setHistorico((anterior) => [
      ...anterior,
      {
        id: `usr-${Date.now()}`,
        autor: 'usuario',
        texto: perguntaFinal,
      },
      {
        id: `dora-${Date.now() + 1}`,
        autor: 'dora',
        texto: respostaIa.texto,
        receita: respostaIa.receita,
      },
    ]);

    if (!textoManual) setEntradaTexto('');
  };

  const simularComandoVoz = () => {
    setOuvindoVoz(true);
    setTimeout(() => {
      setOuvindoVoz(false);
      enviarComando('Sugerir receita com itens a vencer');
    }, 900);
  };

  return (
    <SafeAreaView style={[estilosDora.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={estilosDora.rolagem} keyboardShouldPersistTaps="handled">
        {/* Cabeçalho */}
        <View style={estilosDora.cabecalho}>
          <Text
            style={[
              estilosDora.titulo,
              { color: tokens.colors.accentAmber500, fontSize: tokens.typography.fontSize.xl * fontScale },
            ]}
          >
            Assistente Dora
          </Text>
          <Text
            style={[
              estilosDora.subtitulo,
              { color: theme.subtext, fontSize: tokens.typography.fontSize.xs * fontScale },
            ]}
          >
            Converse por texto ou voz para consultar saldos, pedir receitas ou gerar relatórios.
          </Text>
        </View>

        {/* Sugestões Visíveis de Comandos */}
        <View style={estilosDora.faixaExemplos}>
          <Text
            style={[
              estilosDora.rotuloExemplos,
              { color: theme.text, fontSize: 12 * fontScale },
            ]}
          >
            Toque em um comando rápido para testar:
          </Text>
          <View style={estilosDora.gradePilulas}>
            {comandosExemplo.map((cmd) => (
              <TouchableOpacity
                key={cmd}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={`Enviar comando: ${cmd}`}
                onPress={() => enviarComando(cmd)}
                style={[
                  estilosDora.pilulaSugestao,
                  {
                    backgroundColor: theme.surface,
                    borderColor: tokens.colors.accentAmber500,
                  },
                ]}
              >
                <Text style={[estilosDora.textoPilula, { color: theme.text }]}>
                  {cmd}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Histórico Unificado da Conversa */}
        {historico.map((msg) => {
          const ehDora = msg.autor === 'dora';
          return (
            <View
              key={msg.id}
              accessible={true}
              accessibilityLabel={`${ehDora ? 'Dora disse' : 'Você disse'}: ${msg.texto}`}
              style={[
                estilosDora.balaoMensagem,
                {
                  alignSelf: ehDora ? 'flex-start' : 'flex-end',
                  backgroundColor: ehDora ? theme.surface : `${theme.primary}15`,
                  borderColor: ehDora ? tokens.colors.accentAmber500 : theme.primary,
                },
              ]}
            >
              <View style={estilosDora.cabecalhoBalao}>
                <AppIcon
                  name={ehDora ? 'help-circle' : 'user'}
                  size={16}
                  variant={ehDora ? 'amber' : 'primary'}
                />
                <Text
                  style={[
                    estilosDora.autorBalao,
                    {
                      color: ehDora ? tokens.colors.accentAmber500 : theme.primary,
                      fontSize: 12 * fontScale,
                    },
                  ]}
                >
                  {ehDora ? 'Dora (Inteligência Artificial)' : 'Você'}
                </Text>
              </View>

              <Text
                style={[
                  estilosDora.textoMensagem,
                  { color: theme.text, fontSize: tokens.typography.fontSize.sm * fontScale },
                ]}
              >
                {msg.texto}
              </Text>

              {/* Card Estruturado de Receita (US08) */}
              {msg.receita && (
                <View
                  style={[
                    estilosDora.cartaoReceita,
                    { backgroundColor: theme.background, borderColor: theme.secondary },
                  ]}
                >
                  <Text
                    style={[
                      estilosDora.tituloReceita,
                      { color: theme.secondary, fontSize: tokens.typography.fontSize.sm * fontScale },
                    ]}
                  >
                    🍲 {msg.receita.titulo}
                  </Text>
                  <Text style={[estilosDora.topicoReceita, { color: theme.text, fontSize: 12 * fontScale }]}>
                    <Text style={{ fontWeight: 'bold' }}>Ingredientes do Estoque:\n</Text>
                    {msg.receita.ingredientesEstoque}
                  </Text>
                  <Text style={[estilosDora.topicoReceita, { color: theme.text, fontSize: 12 * fontScale }]}>
                    <Text style={{ fontWeight: 'bold' }}>Modo de Preparo:\n</Text>
                    {msg.receita.modoPreparo}
                  </Text>
                  <TouchableOpacity
                    accessible={true}
                    accessibilityRole="link"
                    accessibilityLabel={`Abrir fonte externa da receita: ${msg.receita.fonteNome}`}
                    onPress={() =>
                      Linking.openURL(msg.receita!.fonteUrl).catch(() =>
                        Alert.alert('Link Externo', `Fonte: ${msg.receita!.fonteUrl}`)
                      )
                    }
                  >
                    <Text style={[estilosDora.linkFonte, { color: theme.primary, fontSize: 12 * fontScale }]}>
                      🔗 {msg.receita.fonteNome}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      {/* Barra Inferior com Entrada de Texto e Comando de Voz */}
      <View
        style={[
          estilosDora.barraInferiorChat,
          { backgroundColor: theme.surface, borderTopColor: theme.border },
        ]}
      >
        <TouchableOpacity
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={ouvindoVoz ? 'Ouvindo comando de voz' : 'Falar com a Dora por comando de voz'}
          onPress={simularComandoVoz}
          style={[
            estilosDora.botaoVoz,
            {
              backgroundColor: ouvindoVoz ? `${theme.secondary}20` : theme.background,
              borderColor: ouvindoVoz ? theme.secondary : theme.border,
            },
          ]}
        >
          <Text style={{ fontSize: 18 }}>{ouvindoVoz ? '🎙️' : '🎤'}</Text>
        </TouchableOpacity>

        <TextInput
          placeholder="Escreva sua pergunta para a Dora..."
          placeholderTextColor={theme.subtext}
          value={entradaTexto}
          onChangeText={setEntradaTexto}
          accessible={true}
          accessibilityLabel="Campo de conversa com a assistente Dora"
          style={[
            estilosDora.campoDigitacao,
            {
              flex: 1,
              backgroundColor: theme.background,
              borderColor: theme.border,
              color: theme.text,
              fontSize: tokens.typography.fontSize.sm * fontScale,
            },
          ]}
        />

        <TouchableOpacity
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Enviar mensagem para a Dora"
          onPress={() => enviarComando()}
          style={[
            estilosDora.botaoEnviar,
            { backgroundColor: tokens.colors.accentAmber500 },
          ]}
        >
          <AppIcon name="send" size={18} color="#FFFFFF" />
          <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 13 }}>
            Enviar
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}