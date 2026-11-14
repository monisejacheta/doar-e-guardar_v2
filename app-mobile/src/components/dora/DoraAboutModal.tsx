import React, { useEffect, useState } from 'react';
import { Image, Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useAppTheme } from '../../context/ThemeContext';
import { estilosDora } from '../../styles/dora.styles';
import { AVATAR_DORA_ASSET, CoresChatDora, VIDEO_DORA_GREETING_ASSET } from './types';

interface DoraAboutModalProps {
  visible: boolean;
  coresChat: CoresChatDora;
  onClose: () => void;
}

function DoraGreetingVideo() {
  const [erroVideo, setErroVideo] = useState(false);

  const player = useVideoPlayer(VIDEO_DORA_GREETING_ASSET, (instancia) => {
    instancia.loop = false;
    instancia.muted = false;
    instancia.play();
  });

  useEffect(() => {
    const subFim = player.addListener('playToEnd', () => {
      player.pause();
    });

    const subStatus = player.addListener('statusChange', ({ status }) => {
      if (status === 'error') {
        setErroVideo(true);
      }
    });

    return () => {
      subFim.remove();
      subStatus.remove();
    };
  }, [player]);

  if (erroVideo) {
    return (
      <Image
        source={AVATAR_DORA_ASSET}
        style={estilosDora.modalSobreImagem}
        resizeMode="cover"
        accessibilityLabel="Foto da assistente Dora"
      />
    );
  }

  return (
    <View style={[estilosDora.modalSobreImagem, { overflow: 'hidden' }]}>
      <VideoView
        player={player}
        style={{ width: '100%', height: '100%' }}
        contentFit="cover"
        nativeControls={false}
        allowsPictureInPicture={false}
      />
    </View>
  );
}

export function DoraAboutModal({ visible, coresChat, onClose }: DoraAboutModalProps) {
  const { theme, fontScale } = useAppTheme();

  return (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
      <View style={estilosDora.modalSobreOverlay}>
        <View
          style={[
            estilosDora.modalSobreCard,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <View style={estilosDora.modalSobreTopo}>
            <TouchableOpacity
              onPress={onClose}
              style={estilosDora.modalSobreBotaoFechar}
              accessibilityRole="button"
              accessibilityLabel="Fechar apresentação da Dora"
            >
              <Feather name="x" size={22} color={theme.subtext} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={estilosDora.modalSobreCabecalhoAvatar}>
              {visible && <DoraGreetingVideo />}
              <Text
                style={[
                  estilosDora.modalSobreNome,
                  { color: coresChat.tituloBloco, fontSize: 20 * fontScale },
                ]}
              >
                Oi! Eu sou a Dora 👋
              </Text>
              <Text
                style={[
                  estilosDora.modalSobreCargo,
                  { color: coresChat.subtituloBloco, fontSize: 12.5 * fontScale },
                ]}
              >
                Assistente Inteligente • Doar & Guardar
              </Text>
            </View>

            <View
              style={[
                estilosDora.modalSobreBalaoFala,
                {
                  backgroundColor: coresChat.modalFalaBg,
                  borderColor: coresChat.modalFalaBorda,
                },
              ]}
            >
              <Text
                style={[
                  estilosDora.modalSobreTextoFala,
                  { color: theme.text, fontSize: 13.5 * fontScale },
                ]}
              >
                Eu sou a assistente virtual do{' '}
                <Text style={{ fontWeight: '800', color: coresChat.tituloBloco }}>
                  Doar & Guardar
                </Text>
                , criada para ajudar você e toda a equipe da{' '}
                <Text style={{ fontWeight: '800' }}>Casa da Criança</Text> a cuidar do estoque de
                alimentos com praticidade e sem desperdícios!
              </Text>

              <Text
                style={[
                  estilosDora.modalSobreTextoFala,
                  {
                    color: coresChat.subtituloBloco,
                    fontWeight: '800',
                    fontSize: 13 * fontScale,
                    marginTop: 2,
                  },
                ]}
              >
                Veja o que eu consigo fazer por você no sistema:
              </Text>

              <Text
                style={[
                  estilosDora.modalSobreTextoFala,
                  { color: theme.text, fontSize: 13 * fontScale },
                ]}
              >
                • <Text style={{ fontWeight: '800' }}>Sugerir receitas reais:</Text> olho o que já
                temos na despensa e indico preparos compatíveis usando ingredientes do estoque.
              </Text>
              <Text
                style={[
                  estilosDora.modalSobreTextoFala,
                  { color: theme.text, fontSize: 13 * fontScale },
                ]}
              >
                • <Text style={{ fontWeight: '800' }}>Alertar validades (FEFO):</Text> mostro quais
                produtos e lotes vencem primeiro para garantirmos que nada estrague.
              </Text>
              <Text
                style={[
                  estilosDora.modalSobreTextoFala,
                  { color: theme.text, fontSize: 13 * fontScale },
                ]}
              >
                • <Text style={{ fontWeight: '800' }}>Prever o consumo:</Text> calculo a duração
                estimada dos alimentos e aviso quando algum item precisa de reposição.
              </Text>
              <Text
                style={[
                  estilosDora.modalSobreTextoFala,
                  { color: theme.text, fontSize: 13 * fontScale },
                ]}
              >
                • <Text style={{ fontWeight: '800' }}>Localizar nas prateleiras:</Text> informo
                exatamente em qual armário ou geladeira cada lote está guardado.
              </Text>
              <Text
                style={[
                  estilosDora.modalSobreTextoFala,
                  { color: theme.text, fontSize: 13 * fontScale },
                ]}
              >
                • <Text style={{ fontWeight: '800' }}>Guiar pelo aplicativo:</Text> tiro dúvidas
                sobre cadastros, saídas e movimentações com atalhos diretos para as telas.
              </Text>
            </View>

            <TouchableOpacity
              onPress={onClose}
              style={estilosDora.modalSobreBotaoAcao}
              accessibilityRole="button"
              accessibilityLabel="Entendi, voltar para a conversa com a Dora"
            >
              <Feather name="message-circle" size={18} color="#FFFFFF" />
              <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 14 * fontScale }}>
                Entendi, vamos conversar!
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
