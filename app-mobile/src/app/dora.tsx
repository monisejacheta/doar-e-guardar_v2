// src/app/dora.tsx
import React, { useState } from 'react';
import { Text, View, SafeAreaView, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { useAppTheme } from '../context/ThemeContext';
import { estilosDora } from '../styles/dora.styles';

export default function DoraScreen() {
  const { theme, tokens, fontScale } = useAppTheme();
  const [mensagem, setMensagem] = useState('');
  const [mensagens, setMensagens] = useState([
    { autor: 'dora', texto: 'Olá! Sou a Dora. Posso consultar o estoque, emitir relatórios ou sugerir receitas com alimentos próximos do vencimento. Como posso ajudar agora?' }
  ]);

  const enviar = () => {
    if (!mensagem.trim()) return;
    const novaMsg = mensagem;
    setMensagem('');
    setMensagens(prev => [
      ...prev,
      { autor: 'usuario', texto: novaMsg },
      { autor: 'dora', texto: `Entendido! Identifiquei seu pedido sobre "${novaMsg}". Temos feijão e legumes que vencem em 4 dias. Recomendo preparar uma sopa nutritiva para as crianças!` }
    ]);
  };

  return (
    <SafeAreaView style={[estilosDora.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={estilosDora.rolagem}>
        <View style={estilosDora.cabecalho}>
          <Text style={[estilosDora.titulo, { color: tokens.colors.accentAmber500, fontSize: tokens.typography.fontSize.xl * fontScale }]}>
            Tela 05 - Assistente Dora
          </Text>
          <Text style={[estilosDora.subtitulo, { color: theme.subtext, fontSize: tokens.typography.fontSize.sm * fontScale }]}>
            Conversa em linguagem natural para consultas e sugestão de receitas.
          </Text>
        </View>

        {mensagens.map((m, idx) => (
          <View
            key={idx}
            style={[
              estilosDora.cartaoPrincipal,
              {
                backgroundColor: m.autor === 'dora' ? theme.surface : `${theme.primary}15`,
                borderColor: m.autor === 'dora' ? tokens.colors.accentAmber500 : theme.primary,
                alignSelf: m.autor === 'dora' ? 'flex-start' : 'flex-end',
                width: '90%'
              }
            ]}
          >
            <Text style={{ fontWeight: 'bold', marginBottom: 4, color: m.autor === 'dora' ? tokens.colors.accentAmber500 : theme.primary }}>
              {m.autor === 'dora' ? '💡 Dora' : '👤 Você'}
            </Text>
            <Text style={{ color: theme.text, lineHeight: 20 }}>{m.texto}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={{ padding: 16, borderTopWidth: 1, borderTopColor: theme.border, flexDirection: 'row', gap: 8 }}>
        <TextInput
          placeholder="Pergunte algo para a Dora..."
          placeholderTextColor={theme.subtext}
          value={mensagem}
          onChangeText={setMensagem}
          style={[estilosDora.campoDigitacao, { flex: 1, marginBottom: 0, backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
        />
        <TouchableOpacity
          onPress={enviar}
          style={{ backgroundColor: tokens.colors.accentAmber500, borderRadius: 12, paddingHorizontal: 16, justifyContent: 'center', minHeight: 48 }}
        >
          <Text style={{ color: '#FFFFFF', fontWeight: 'bold' }}>Enviar</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
