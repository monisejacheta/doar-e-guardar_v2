import React from 'react';
import { Image, Linking, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAppTheme } from '../../context/ThemeContext';
import { estilosDora } from '../../styles/dora.styles';
import { DoraStructuredText } from './DoraStructuredText';
import { AVATAR_DORA_ASSET, CoresChatDora, MensagemChat } from './types';

interface DoraMessageBubbleProps {
  mensagem: MensagemChat;
  ehUltimaMensagem: boolean;
  coresChat: CoresChatDora;
  onAbrirSobre: () => void;
  onNavegarAtalho: (rota: string) => void;
  onSelecionarSugestao: (texto: string) => void;
}

export function DoraMessageBubble({
  mensagem,
  ehUltimaMensagem,
  coresChat,
  onAbrirSobre,
  onNavegarAtalho,
  onSelecionarSugestao,
}: DoraMessageBubbleProps) {
  const { theme, tokens, fontScale } = useAppTheme();

  if (mensagem.autor === 'usuario') {
    return (
      <View style={estilosDora.linhaMensagemUsuario}>
        <View
          style={[
            estilosDora.balaoUsuario,
            {
              backgroundColor: coresChat.balaoUsuarioBg,
              borderColor: coresChat.balaoUsuarioBorda,
            },
          ]}
        >
          <Text
            style={[
              estilosDora.textoMensagem,
              {
                color: coresChat.balaoUsuarioTexto,
                fontSize: tokens.typography.fontSize.sm * fontScale,
              },
            ]}
          >
            {mensagem.texto}
          </Text>

          <View style={estilosDora.rodapeBalao}>
            <Text
              style={[
                estilosDora.horarioBalao,
                { color: coresChat.horarioUsuario, fontSize: 10 * fontScale },
              ]}
            >
              {mensagem.horario}
            </Text>
            <Feather name="check" size={13} color={coresChat.tituloBloco} />
            <Feather name="check" size={13} color="#10B981" style={{ marginLeft: -8 }} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View>
      <View style={estilosDora.linhaMensagemDora}>
        <TouchableOpacity
          onPress={onAbrirSobre}
          activeOpacity={0.8}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          accessibilityRole="button"
          accessibilityLabel="Conhecer a assistente Dora"
        >
          <Image
            source={AVATAR_DORA_ASSET}
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              borderWidth: 1.5,
              borderColor: '#10B981',
              backgroundColor: '#D1FAE5',
            }}
            resizeMode="cover"
            accessibilityLabel="Avatar da assistente Dora"
          />
        </TouchableOpacity>

        <View
          style={[
            estilosDora.balaoDora,
            {
              backgroundColor: coresChat.balaoDoraBg,
              borderColor: coresChat.balaoDoraBorda,
            },
          ]}
        >
          <DoraStructuredText texto={mensagem.texto} corBase={theme.text} coresChat={coresChat} />

          {mensagem.receita && (
            <View
              style={[
                estilosDora.cartaoReceita,
                {
                  backgroundColor: coresChat.cardInternoBg,
                  borderColor: coresChat.cardInternoBorda,
                },
              ]}
            >
              <Text
                style={[
                  estilosDora.tituloReceita,
                  { color: coresChat.tituloBloco, fontSize: 14 * fontScale },
                ]}
              >
                {mensagem.receita.titulo}
              </Text>

              <View style={estilosDora.badgesReceitaLinha}>
                <View style={[estilosDora.badgeReceita, { borderColor: coresChat.subtituloBloco }]}>
                  <Feather name="clock" size={12} color={coresChat.subtituloBloco} />
                  <Text
                    style={{
                      color: coresChat.subtituloBloco,
                      fontWeight: '700',
                      fontSize: 11 * fontScale,
                    }}
                  >
                    {mensagem.receita.tempoPreparo}
                  </Text>
                </View>
                <View style={[estilosDora.badgeReceita, { borderColor: coresChat.subtituloBloco }]}>
                  <Feather name="users" size={12} color={coresChat.subtituloBloco} />
                  <Text
                    style={{
                      color: coresChat.subtituloBloco,
                      fontWeight: '700',
                      fontSize: 11 * fontScale,
                    }}
                  >
                    {mensagem.receita.rendimento}
                  </Text>
                </View>
              </View>

              <Text
                style={[
                  estilosDora.subtituloBloco,
                  { color: coresChat.tituloBloco, fontSize: 12 * fontScale },
                ]}
              >
                Ingredientes do Estoque (FEFO)
              </Text>
              <DoraStructuredText
                texto={mensagem.receita.ingredientesEstoque}
                corBase={theme.text}
                coresChat={coresChat}
              />

              <Text
                style={[
                  estilosDora.subtituloBloco,
                  { color: coresChat.tituloBloco, fontSize: 12 * fontScale },
                ]}
              >
                Modo de Preparo
              </Text>
              <Text
                style={[
                  estilosDora.topicoReceita,
                  { color: theme.text, fontSize: 12 * fontScale },
                ]}
              >
                {mensagem.receita.modoPreparo}
              </Text>

              <TouchableOpacity
                onPress={() => Linking.openURL(mensagem.receita!.fonteUrl)}
                style={{ minHeight: 48, justifyContent: 'center' }}
                accessibilityRole="link"
              >
                <Text
                  style={[
                    estilosDora.linkFonte,
                    { color: coresChat.tituloBloco, fontSize: 12 * fontScale },
                  ]}
                >
                  Ver fonte: {mensagem.receita.fonteNome}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {Array.isArray(mensagem.predicoes) && mensagem.predicoes.length > 0 && (
            <View
              style={[
                estilosDora.cartaoPredicoes,
                {
                  backgroundColor: coresChat.cardInternoBg,
                  borderColor: coresChat.cardInternoBorda,
                },
              ]}
            >
              <Text
                style={{
                  color: coresChat.tituloBloco,
                  fontWeight: '800',
                  fontSize: 12 * fontScale,
                }}
              >
                Resumo de Autonomia Estimada
              </Text>
              {mensagem.predicoes.map((pred) => {
                const statusCor = pred.riscoVencerAntesDeAcabar
                  ? theme.danger
                  : pred.precisaReposicaoBreve
                    ? '#D97706'
                    : '#10B981';
                const statusTexto = pred.riscoVencerAntesDeAcabar
                  ? 'Risco de vencer'
                  : pred.precisaReposicaoBreve
                    ? 'Repor em breve'
                    : 'Estável';

                return (
                  <View
                    key={pred.nomeProduto}
                    style={[
                      estilosDora.itemPredicao,
                      {
                        backgroundColor: coresChat.itemPredicaoBg,
                        borderColor: pred.riscoVencerAntesDeAcabar ? theme.danger : theme.border,
                      },
                    ]}
                  >
                    <View style={estilosDora.itemPredicaoTopo}>
                      <Text
                        style={{
                          flex: 1,
                          fontWeight: '800',
                          color: theme.text,
                          fontSize: 12 * fontScale,
                        }}
                      >
                        {pred.nomeProduto}
                      </Text>
                      <View style={[estilosDora.badgePredicao, { backgroundColor: statusCor }]}>
                        <Text
                          style={{
                            color: '#FFFFFF',
                            fontWeight: '700',
                            fontSize: 10 * fontScale,
                          }}
                        >
                          {statusTexto}
                        </Text>
                      </View>
                    </View>
                    <Text
                      style={{
                        color: theme.subtext,
                        fontSize: 11 * fontScale,
                        marginTop: 4,
                      }}
                    >
                      • Saldo: {pred.saldoTotal} pcts • ~{pred.consumoDiarioEstimado}/dia • Duração:{' '}
                      {pred.diasAutonomia}d
                    </Text>
                  </View>
                );
              })}
            </View>
          )}

          {mensagem.atalho && (
            <TouchableOpacity
              onPress={() => onNavegarAtalho(mensagem.atalho!.rota)}
              style={[estilosDora.botaoAtalho, { backgroundColor: '#10B981' }]}
              accessibilityRole="button"
              accessibilityLabel={mensagem.atalho.rotulo}
            >
              <Feather
                name={(mensagem.atalho.icone as any) || 'arrow-right'}
                size={17}
                color="#FFFFFF"
              />
              <Text
                style={{
                  color: '#FFFFFF',
                  fontWeight: '800',
                  fontSize: 13 * fontScale,
                }}
              >
                {mensagem.atalho.rotulo}
              </Text>
            </TouchableOpacity>
          )}

          <View style={estilosDora.rodapeBalao}>
            <Text
              style={[
                estilosDora.horarioBalao,
                { color: theme.subtext, fontSize: 10 * fontScale },
              ]}
            >
              {mensagem.horario}
            </Text>
          </View>
        </View>
      </View>

      {ehUltimaMensagem &&
        Array.isArray(mensagem.sugestoesContinuacao) &&
        mensagem.sugestoesContinuacao.length > 0 && (
          <View style={estilosDora.sugestoesContainer}>
            {mensagem.sugestoesContinuacao.map((sug) => (
              <TouchableOpacity
                key={sug}
                onPress={() => onSelecionarSugestao(sug)}
                style={[
                  estilosDora.chipSugestao,
                  {
                    backgroundColor: coresChat.chipSugestaoBg,
                    borderColor: coresChat.chipSugestaoBorda,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel={`Perguntar: ${sug}`}
              >
                <Text
                  style={{
                    color: coresChat.chipSugestaoTexto,
                    fontWeight: '700',
                    fontSize: 12 * fontScale,
                  }}
                >
                  {sug}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
    </View>
  );
}
