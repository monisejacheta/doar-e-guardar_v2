// app-mobile/src/app/stock.tsx
import React from 'react';
import {
  Text,
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAppTheme } from '../context/ThemeContext';

export default function StockScreen() {
  const roteador = useRouter();
  const rotaAtual = usePathname();
  const { theme, tokens, fontScale } = useAppTheme();

  // 4 Operações Oficiais de Gerenciamento de Estoque
  const operacoesEstoque = [
    {
      id: 'entrada',
      titulo: 'Entrada de Alimentos',
      descricao: 'Registro de doações e compras com leitura de código de barras ou cadastro manual.',
      rota: '/stock-add',
      icone: 'plus-circle',
      corDestaque: '#10B981', // Verde Doar
      corFundo: '#ECFDF5',
    },
    {
      id: 'saida',
      titulo: 'Saída / Baixa',
      descricao: 'Retirada de mantimentos para o preparo das refeições ou descarte com trava PERDA.',
      rota: '/stock-remove',
      icone: 'minus-circle',
      corDestaque: '#EF4444', // Vermelho Alerta
      corFundo: '#FEF2F2',
    },
    {
      id: 'mover',
      titulo: 'Movimentação Interna',
      descricao: 'Transferência de lotes entre armários, despensas e geladeiras da instituição.',
      rota: '/stock-move',
      icone: 'repeat',
      corDestaque: '#1E3A8A', // Azul Guardar
      corFundo: '#EFF6FF',
    },
    {
      id: 'lotes',
      titulo: 'Consulta de Lotes',
      descricao: 'Histórico consolidado, datas de validade (FEFO) e compartimentos físicos.',
      rota: '/stock-details',
      icone: 'clipboard',
      corDestaque: '#6B7280', // Neutro Operacional
      corFundo: '#F9FAFB',
    },
  ];

  // Widgets Fixos da Barra Inferior
  const widgetsInferiores = [
    { nome: 'Início', icone: 'home', rota: '/home' },
    { nome: 'Estoque', icone: 'package', rota: '/stock' },
    { nome: 'Dora IA', icone: 'cpu', rota: '/dora' },
    { nome: 'Avisos', icone: 'bell', rota: '/notifications' },
    { nome: 'Perfil', icone: 'user', rota: '/profile' },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView
        contentContainerStyle={{
          padding: 20,
          paddingBottom: 96,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Cabeçalho */}
        <View style={{ marginBottom: 24 }}>
          <Text
            style={{
              color: theme.subtext,
              fontSize: 12 * fontScale,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              fontWeight: '600',
              marginBottom: 4,
            }}
          >
            Gestão Operacional • Doar&Guardar
          </Text>
          <Text
            style={{
              color: theme.primary,
              fontSize: 24 * fontScale,
              fontWeight: '800',
            }}
          >
            Gerenciamento de Estoque
          </Text>
          <Text
            style={{
              color: theme.subtext,
              fontSize: 13 * fontScale,
              marginTop: 4,
              lineHeight: 18,
            }}
          >
            Selecione uma das ações operacionais abaixo para atualizar ou auditar os mantimentos da Casa da Criança.
          </Text>
        </View>

        {/* Os Quatro Botões de Ação Operacional */}
        <View style={{ gap: 14 }}>
          {operacoesEstoque.map((op) => (
            <TouchableOpacity
              key={op.id}
              onPress={() => roteador.push(op.rota as any)}
              activeOpacity={0.75}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={`${op.titulo}. ${op.descricao}`}
              accessibilityHint="Toque para abrir a tela correspondente"
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 16,
                padding: 18,
                borderWidth: 1.5,
                borderColor: theme.border,
                flexDirection: 'row',
                alignItems: 'center',
                minHeight: 88, // WCAG Touch Target
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
                elevation: 2,
              }}
            >
              {/* Ícone com Cor Semântica */}
              <View
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 14,
                  backgroundColor: op.corFundo,
                  borderWidth: 1.5,
                  borderColor: op.corDestaque,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 16,
                }}
              >
                <Feather name={op.icone as any} size={24} color={op.corDestaque} />
              </View>

              {/* Textos Informativos */}
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text
                  style={{
                    fontSize: 16 * fontScale,
                    fontWeight: '700',
                    color: theme.text,
                    marginBottom: 4,
                  }}
                >
                  {op.titulo}
                </Text>
                <Text
                  style={{
                    fontSize: 12 * fontScale,
                    color: theme.subtext,
                    lineHeight: 16,
                  }}
                >
                  {op.descricao}
                </Text>
              </View>

              {/* Seta Direcional de Navegação */}
              <Feather name="chevron-right" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Widgets Inferiores Fixos de Navegação */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 68,
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1.5,
          borderTopColor: '#E5E7EB',
          flexDirection: 'row',
          justifyContent: 'space-around',
          alignItems: 'center',
          paddingBottom: 4,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.08,
          shadowRadius: 4,
          elevation: 8,
        }}
      >
        {widgetsInferiores.map((widget, idx) => {
          const ativo = rotaAtual === widget.rota;
          return (
            <TouchableOpacity
              key={idx}
              onPress={() => roteador.push(widget.rota as any)}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={`Ir para ${widget.nome}`}
              accessibilityState={{ selected: ativo }}
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: 48,
                minHeight: 48,
              }}
            >
              <Feather
                name={widget.icone as any}
                size={20}
                color={ativo ? '#1E3A8A' : '#6B7280'}
                style={{ marginBottom: 2 }}
              />
              <Text
                style={{
                  fontSize: 10 * fontScale,
                  fontWeight: ativo ? '700' : '500',
                  color: ativo ? '#1E3A8A' : '#6B7280',
                }}
              >
                {widget.nome}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}