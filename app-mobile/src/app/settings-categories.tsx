// src/app/settings-categories.tsx
import React, { useState, useEffect } from 'react';
import { Text, View, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAppTheme } from '../context/ThemeContext';
import { requisicaoApi } from '../services/api';

const CATEGORIAS_HOMOLOGADAS = [
  { nome: 'Grãos e Cereais', descricao: 'Arroz, feijão, lentilha, milho e farináceos básicos.' },
  { nome: 'Laticínios', descricao: 'Leite integral UHT, leite em pó, derivados refrigerados.' },
  { nome: 'Massas e Padaria', descricao: 'Macarrão, biscoitos, pães e misturas de panificação.' },
  { nome: 'Óleos e Temperos', descricao: 'Óleo de soja, azeite, sal, açúcar e condimentos.' },
  { nome: 'Enlatados e Conservas', descricao: 'Extrato de tomate, milho, ervilha, sardinha e atum.' },
  { nome: 'Bebidas e Sucos', descricao: 'Sucos integrais, achocolatados e bebidas lácteas.' },
  { nome: 'Higiene e Limpeza', descricao: 'Sabonete, detergente, água sanitária e itens de apoio.' },
  { nome: 'Outros Alimentos', descricao: 'Itens diversos não classificados nas categorias anteriores.' },
];

export default function SettingsCategoriesScreen() {
  const roteador = useRouter();
  const { theme, tokens, fontScale } = useAppTheme();
  const [carregando, setCarregando] = useState(true);
  const [contagemPorCategoria, setContagemPorCategoria] = useState<Record<string, number>>({});

  useEffect(() => {
    const carregarContagemReal = async () => {
      try {
        setCarregando(true);
        const resp: any = await requisicaoApi('/api/estoque', {
          metodo: 'POST',
          dados: { modulo: 'estoque', acao: 'consultar_estoque' },
        });
        const mapa: Record<string, number> = {};
        if (resp?.sucesso && Array.isArray(resp.lotes)) {
          resp.lotes.forEach((l: any) => {
            const qtd = Number(l.quantidade_atual_pacote) || 0;
            if (qtd > 0) {
              const cat = l.categoria || 'Outros Alimentos';
              mapa[cat] = (mapa[cat] || 0) + qtd;
            }
          });
        }
        setContagemPorCategoria(mapa);
      } catch {
        // Mantém zero caso offline
      } finally {
        setCarregando(false);
      }
    };
    carregarContagemReal();
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 105 }}>
        <TouchableOpacity
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Voltar para Configurações"
          onPress={() => roteador.back()}
          style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16, minHeight: 44 }}
        >
          <Feather name="arrow-left" size={20} color={theme.primary} />
          <Text style={{ color: theme.primary, fontWeight: 'bold', marginLeft: 8, fontSize: 15 * fontScale }}>
            Voltar às Configurações
          </Text>
        </TouchableOpacity>

        <Text style={{ fontWeight: '800', color: theme.primary, fontSize: tokens.typography.fontSize.xl * fontScale, marginBottom: 6 }}>
          6.4 Categorias de Alimentos
        </Text>
        <Text style={{ color: theme.subtext, fontSize: 13 * fontScale, marginBottom: 16 }}>
          Categorias padronizadas pela cascata de código de barras e total atual de pacotes na AWS.
        </Text>

        {carregando ? (
          <ActivityIndicator size="large" color={theme.primary} style={{ marginVertical: 40 }} />
        ) : (
          CATEGORIAS_HOMOLOGADAS.map((cat) => {
            const total = contagemPorCategoria[cat.nome] || 0;
            return (
              <View
                key={cat.nome}
                style={{
                  backgroundColor: theme.surface,
                  borderRadius: 14,
                  borderWidth: 1.5,
                  borderColor: total > 0 ? theme.secondary : theme.border,
                  padding: 14,
                  marginBottom: 10,
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontWeight: 'bold', color: theme.text, fontSize: 14 * fontScale }}>{cat.nome}</Text>
                  <Text style={{ fontWeight: '800', color: total > 0 ? theme.secondary : theme.subtext, fontSize: 12 * fontScale }}>
                    {total} pacotes na AWS
                  </Text>
                </View>
                <Text style={{ color: theme.subtext, fontSize: 12 * fontScale, marginTop: 4 }}>{cat.descricao}</Text>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

