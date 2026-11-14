// app-mobile/src/app/stock.tsx
import React, { useEffect, useState } from 'react';
import {
  Text,
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAppTheme } from '../context/ThemeContext';
import { carregarPrateleirasAws } from '../services/storageLocations';

export default function StockScreen() {
  const roteador = useRouter();
  const { theme, fontScale } = useAppTheme();
  const [resumoPrateleiras, setResumoPrateleiras] = useState({ totalLocais: 7, totalPacotes: 0 });

  useEffect(() => {
    let ativo = true;
    carregarPrateleirasAws()
      .then((res) => {
        if (!ativo) return;
        const pacotes = res.locais.reduce((acc, l) => acc + (l.quantidade_pacotes_alocados || 0), 0);
        setResumoPrateleiras({ totalLocais: res.locais.length, totalPacotes: pacotes });
      })
      .catch(() => {});
    return () => {
      ativo = false;
    };
  }, []);

  const operacoesEstoque = [
    {
      id: 'entrada',
      titulo: 'Entrada de Alimentos',
      descricao: 'Registro de doações e compras com leitura de código de barras (3 APIs em cascata) ou cadastro manual.',
      rota: '/stock-add',
      icone: 'plus-circle',
      corDestaque: '#10B981',
      corFundo: '#ECFDF5',
    },
    {
      id: 'saida',
      titulo: 'Saída / Baixa',
      descricao: 'Retirada de mantimentos para o preparo das refeições ou descarte com trava de segurança PERDA.',
      rota: '/stock-remove',
      icone: 'minus-circle',
      corDestaque: '#EF4444',
      corFundo: '#FEF2F2',
    },
    {
      id: 'mover',
      titulo: 'Movimentação Interna',
      descricao: `Transferência de lotes entre as ${resumoPrateleiras.totalLocais} prateleiras (armários e geladeiras) cadastradas na AWS.`,
      rota: '/stock-move',
      icone: 'repeat',
      corDestaque: '#1E3A8A',
      corFundo: '#EFF6FF',
    },
    {
      id: 'relatorios',
      titulo: 'Relatórios',
      descricao: 'Gráfico de proporção por categoria e visão consolidada dos mantimentos ativos.',
      rota: '/reports',
      icone: 'bar-chart-2',
      corDestaque: '#EF4444',
      corFundo: '#FEF2F2',
    },
    {
      id: 'prateleiras',
      titulo: 'Prateleiras e Armários (AWS)',
      descricao: 'Gerenciamento e homologação dos compartimentos físicos conectados ao banco de dados.',
      rota: '/settings-storage',
      icone: 'layers',
      corDestaque: '#0284C7',
      corFundo: '#E0F2FE',
    },
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
            Gestão Operacional • Doar & Guardar
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
            Selecione uma das ações operacionais abaixo para atualizar, transferir ou auditar os mantimentos na AWS ({resumoPrateleiras.totalPacotes} pacotes alocados em {resumoPrateleiras.totalLocais} prateleiras).
          </Text>
        </View>

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
                backgroundColor: theme.surface,
                borderRadius: 16,
                padding: 18,
                borderWidth: 1.5,
                borderColor: theme.border,
                flexDirection: 'row',
                alignItems: 'center',
                minHeight: 88,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
                elevation: 2,
              }}
            >
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

              <Feather name="chevron-right" size={20} color={theme.subtext} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
