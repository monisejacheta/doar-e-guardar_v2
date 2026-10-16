// src/app/stock.tsx
import React, { useState } from 'react';
import {
  Text,
  View,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAppTheme } from '../context/ThemeContext';
import { estilosEstoque } from '../styles/stock.styles';

interface ProdutoEstoque {
  id: string;
  nome: string;
  categoria: string;
  localizacao: string;
  quantidadeTotal: number;
  unidade: string;
  diasParaVencerMenorLote: number;
}

export default function StockScreen() {
  const roteador = useRouter();
  const { theme, tokens, fontScale } = useAppTheme();
  const [busca, setBusca] = useState('');

  // Dados preliminares de demonstração do estoque da ONG
  const [produtos] = useState<ProdutoEstoque[]>([
    {
      id: '1',
      nome: 'Arroz Tipo 1',
      categoria: 'Grãos e Cereais',
      localizacao: 'Armário A - Prateleira 2',
      quantidadeTotal: 45,
      unidade: 'pcts (1kg)',
      diasParaVencerMenorLote: 60,
    },
    {
      id: '2',
      nome: 'Leite Integral',
      categoria: 'Laticínios',
      localizacao: 'Geladeira 1',
      quantidadeTotal: 12,
      unidade: 'litros',
      diasParaVencerMenorLote: 4, // Alerta FEFO < 7 dias
    },
    {
      id: '3',
      nome: 'Feijão Carioca',
      categoria: 'Grãos e Cereais',
      localizacao: 'Armário B - Prateleira 1',
      quantidadeTotal: 6,
      unidade: 'pcts (1kg)',
      diasParaVencerMenorLote: 15,
    },
    {
      id: '4',
      nome: 'Óleo de Soja',
      categoria: 'Óleos e Gorduras',
      localizacao: 'Armário A - Prateleira 1',
      quantidadeTotal: 20,
      unidade: 'garrafas (900ml)',
      diasParaVencerMenorLote: 90,
    },
  ]);

  const abrirAvisoOperacao = (operacao: string) => {
    Alert.alert(
      operacao,
      'A funcionalidade detalhada com leitor de câmera e validação de segurança será vinculada no próximo passo.'
    );
  };

  const produtosFiltrados = produtos.filter((p) =>
    p.nome.toLowerCase().includes(busca.toLowerCase()) ||
    p.categoria.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <SafeAreaView style={[estilosEstoque.container, { backgroundColor: theme.background }]}>
      {/* Barra de Busca e Atalhos Operacionais da Tela 03 */}
      <View style={[estilosEstoque.cabecalhoFixo, { borderBottomColor: theme.border }]}>
        <View
          style={[
            estilosEstoque.areaBusca,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <Text style={{ fontSize: 16 }}>🔍</Text>
          <TextInput
            placeholder="Buscar por nome do produto ou categoria..."
            placeholderTextColor={theme.subtext}
            value={busca}
            onChangeText={setBusca}
            accessible={true}
            accessibilityLabel="Campo de busca de mantimentos no estoque"
            style={[
              estilosEstoque.campoBusca,
              { color: theme.text, fontSize: tokens.typography.fontSize.sm * fontScale },
            ]}
          />
          {busca.length > 0 && (
            <TouchableOpacity
              onPress={() => setBusca('')}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Limpar busca"
            >
              <Text style={{ color: theme.subtext, fontWeight: 'bold' }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Botões Operacionais das Subtelas (3.1, 3.2, 3.3, 3.4) */}
        <View style={estilosEstoque.gradeBotoesAcao}>
          {/* Tela 3.1 - Adicionar com Código de Barras (Verde Doar) */}
          <TouchableOpacity
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Entrada de produto. Ler código de barras ou cadastrar lote"
            onPress={() => roteador.push('/stock-add')}
            style={[
              estilosEstoque.botaoAcaoEstoque,
              { backgroundColor: theme.surface, borderColor: theme.secondary },
            ]}
          >
            <Text style={estilosEstoque.iconeAcao}>📷</Text>
            <Text style={[estilosEstoque.textoAcao, { color: theme.secondary, fontSize: 13 * fontScale }]}>
              + Entrada
            </Text>
          </TouchableOpacity>

          {/* Tela 3.2 - Remover Produtos / Baixa com "PERDA" */}
          <TouchableOpacity
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Saída de produto. Registrar consumo ou descarte por perda"
            onPress={() => roteador.push('/stock-remove')}
            style={[
              estilosEstoque.botaoAcaoEstoque,
              { backgroundColor: theme.surface, borderColor: theme.danger },
            ]}
          >
            <Text style={estilosEstoque.iconeAcao}>📤</Text>
            <Text style={[estilosEstoque.textoAcao, { color: theme.danger, fontSize: 13 * fontScale }]}>
              - Saída
            </Text>
          </TouchableOpacity>

          {/* Tela 3.3 - Mudar Localização */}
          <TouchableOpacity
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Transferir produtos de armário ou geladeira"
            onPress={() => roteador.push('/stock-move')}
            style={[
              estilosEstoque.botaoAcaoEstoque,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <Text style={estilosEstoque.iconeAcao}>🔄</Text>
            <Text style={[estilosEstoque.textoAcao, { color: theme.text, fontSize: 13 * fontScale }]}>
              Mover
            </Text>
          </TouchableOpacity>

          {/* Tela 3.4 - Consulta Detalhada */}
          <TouchableOpacity
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Consulta detalhada de todos os lotes e validades"
            onPress={() => roteador.push('/stock-details')}
            style={[
              estilosEstoque.botaoAcaoEstoque,
              { backgroundColor: theme.surface, borderColor: theme.primary },
            ]}
          >
            <Text style={estilosEstoque.iconeAcao}>📋</Text>
            <Text style={[estilosEstoque.textoAcao, { color: theme.primary, fontSize: 13 * fontScale }]}>
              Lotes
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Grid de Itens em Estoque */}
      <ScrollView contentContainerStyle={estilosEstoque.rolagemLista}>
        <Text
          style={[
            estilosEstoque.tituloSecao,
            { color: theme.primary, fontSize: tokens.typography.fontSize.md * fontScale },
          ]}
        >
          Mantimentos no Inventário ({produtosFiltrados.length})
        </Text>

        {produtosFiltrados.length === 0 ? (
          <View style={estilosEstoque.listaVazia}>
            <Text style={{ fontSize: 32 }}>📦</Text>
            <Text style={{ color: theme.subtext, marginTop: 8 }}>
              Nenhum alimento encontrado com esse nome.
            </Text>
          </View>
        ) : (
          produtosFiltrados.map((item) => {
            const venceEmBreve = item.diasParaVencerMenorLote <= 7; // Regra FEFO alerta visual

            return (
              <TouchableOpacity
                key={item.id}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={`${item.nome}. Categoria: ${item.categoria}. Local: ${item.localizacao}. Quantidade: ${item.quantidadeTotal} ${item.unidade}. ${venceEmBreve ? 'Atenção: lote próximo do vencimento.' : ''}`}
                accessibilityHint="Toque duas vezes para abrir os detalhes e lotes deste produto"
                activeOpacity={0.8}
                onPress={() => abrirAvisoOperacao(`Detalhes do produto: ${item.nome}`)}
                style={[
                  estilosEstoque.cartaoProduto,
                  {
                    backgroundColor: theme.surface,
                    borderColor: venceEmBreve ? tokens.colors.accentAmber500 : theme.border,
                  },
                ]}
              >
                <View
                  style={[
                    estilosEstoque.areaIconeProduto,
                    {
                      borderColor: venceEmBreve ? tokens.colors.accentAmber500 : theme.border,
                      backgroundColor: theme.background,
                    },
                  ]}
                >
                  <Text style={estilosEstoque.iconeProduto}>🥫</Text>
                </View>

                <View style={estilosEstoque.infoProduto}>
                  <Text
                    style={[
                      estilosEstoque.nomeProduto,
                      { color: theme.text, fontSize: tokens.typography.fontSize.sm * fontScale },
                    ]}
                  >
                    {item.nome}
                  </Text>
                  <Text
                    style={[
                      estilosEstoque.detalhesProduto,
                      { color: theme.subtext, fontSize: tokens.typography.fontSize.xs * fontScale },
                    ]}
                  >
                    {item.categoria} • {item.localizacao}
                  </Text>

                  {venceEmBreve && (
                    <View
                      style={[
                        estilosEstoque.alertaVencimento,
                        { backgroundColor: `${tokens.colors.accentAmber500}20` },
                      ]}
                    >
                      <Text style={[estilosEstoque.textoAlerta, { color: tokens.colors.accentAmber500 }]}>
                        ⚠️ Lote vence em {item.diasParaVencerMenorLote} dias
                      </Text>
                    </View>
                  )}
                </View>

                <View style={estilosEstoque.resumoQuantidade}>
                  <Text
                    style={[
                      estilosEstoque.valorQuantidade,
                      { color: theme.primary, fontSize: tokens.typography.fontSize.md * fontScale },
                    ]}
                  >
                    {item.quantidadeTotal}
                  </Text>
                  <Text style={{ color: theme.subtext, fontSize: 11 * fontScale }}>
                    {item.unidade}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}