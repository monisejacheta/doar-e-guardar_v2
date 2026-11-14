import React from 'react';
import { ActivityIndicator, Image, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAppTheme } from '../../context/ThemeContext';
import { estilosDora } from '../../styles/dora.styles';
import { AVATAR_DORA_ASSET, CoresChatDora } from './types';

interface DoraHeaderProps {
  coresChat: CoresChatDora;
  processandoIa: boolean;
  carregandoEstoque: boolean;
  totalPacotesAtivos: number;
  onVoltar: () => void;
  onAbrirSobre: () => void;
  onSincronizar: () => void;
  onLimparConversa: () => void;
}

export function DoraHeader({
  coresChat,
  processandoIa,
  carregandoEstoque,
  totalPacotesAtivos,
  onVoltar,
  onAbrirSobre,
  onSincronizar,
  onLimparConversa,
}: DoraHeaderProps) {
  const { fontScale } = useAppTheme();

  const subtitulo = processandoIa
    ? 'digitando...'
    : carregandoEstoque
      ? 'sincronizando despensa...'
      : `online • ${totalPacotesAtivos} pcts acompanhados`;

  return (
    <View style={[estilosDora.cabecalhoWhatsapp, { backgroundColor: coresChat.cabecalho }]}>
      <View style={estilosDora.cabecalhoEsquerda}>
        <TouchableOpacity
          onPress={onVoltar}
          style={estilosDora.botaoIconeCabecalho}
          accessibilityRole="button"
          accessibilityLabel="Voltar para tela anterior"
        >
          <Feather name="arrow-left" size={22} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={estilosDora.avatarWrapper}>
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
                width: 42,
                height: 42,
                borderRadius: 21,
                borderWidth: 1.5,
                borderColor: '#10B981',
                backgroundColor: '#D1FAE5',
              }}
              resizeMode="cover"
              accessibilityLabel="Avatar da assistente Dora"
            />
          </TouchableOpacity>
          <View
            style={[estilosDora.pontoOnline, { borderColor: coresChat.cabecalho }]}
            pointerEvents="none"
          />
        </View>

        <TouchableOpacity
          onPress={onAbrirSobre}
          activeOpacity={0.85}
          style={estilosDora.cabecalhoInfo}
          accessibilityRole="button"
          accessibilityLabel="Ver informações sobre a Dora"
        >
          <Text
            style={[estilosDora.cabecalhoTitulo, { fontSize: 16 * fontScale }]}
            numberOfLines={1}
          >
            Dora • Assistente IA
          </Text>
          <Text
            style={[estilosDora.cabecalhoSubtitulo, { fontSize: 11.5 * fontScale }]}
            numberOfLines={1}
          >
            {subtitulo}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={estilosDora.cabecalhoAcoes}>
        <TouchableOpacity
          onPress={onSincronizar}
          disabled={carregandoEstoque}
          style={estilosDora.botaoIconeCabecalho}
          accessibilityRole="button"
          accessibilityLabel="Atualizar leitura do estoque"
        >
          {carregandoEstoque ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Feather name="refresh-cw" size={19} color="#FFFFFF" />
          )}
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onLimparConversa}
          style={estilosDora.botaoIconeCabecalho}
          accessibilityRole="button"
          accessibilityLabel="Limpar conversa"
        >
          <Feather name="trash-2" size={19} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
