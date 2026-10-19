// src/app/stock-details.tsx
import React, { useState, useMemo } from 'react';
import {
  Text,
  View,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { useAppTheme } from '../context/ThemeContext';
import { AppIcon } from '../components/common/AppIcon';
import { estilosStockDetails } from '../styles/stock-details.styles';

interface LoteDetalhado {
  id: string;
  codigoLote: string;
  dataEntrada: string;
  dataValidade: string;
  diasParaVencer: number;
  localizacao: string;
  quantidadePacotes: number;
}

interface ProdutoCatalogo {
  id: string;
  nome: string;
  codigoBarras: string;
  categoria: string;
  subcategoria: string;
  lotes: LoteDetalhado[];
}

export default function StockDetailsScreen() {
  const { theme, tokens, fontScale } = useAppTheme();

  // Base simulada de produtos e respetivos lotes ativos
  const [catalogo] = useState<ProdutoCatalogo[]>([
    {
      id: 'prod-1',
      nome: 'Leite Integral UHT 1L',
      codigoBarras: '7891000100103',
      categoria: 'Laticínios',
      subcategoria: 'Leites Fluidos',
      lotes: [
        {
          id: 'L1',
          codigoLote: 'LOTE-2026-A1',
          dataEntrada: '01/10/2026',
          dataValidade: '23/10/2026',
          diasParaVencer: 4, // Próximo do vencimento (< 7 dias)
          localizacao: 'Geladeira 1',
          quantidadePacotes: 8,
        },
        {
          id: 'L2',
          codigoLote: 'LOTE-2026-B3',
          dataEntrada: '10/10/2026',
          dataValidade: '18/11/2026',
          diasParaVencer: 30, // Regular
          localizacao: 'Armário A',
          quantidadePacotes: 16,
        },
        {
          id: 'L3',
          codigoLote: 'LOTE-2026-V0',
          dataEntrada: '15/08/2026',
          dataValidade: '15/10/2026',
          diasParaVencer: -4, // Vencido
          localizacao: 'Armário A',
          quantidadePacotes: 2,
        },
      ],
    },
    {
      id: 'prod-2',
      nome: 'Arroz Tipo 1 (Pacote 1kg)',
      codigoBarras: '7896006711114',
      categoria: 'Alimentos não perecíveis',
      subcategoria: 'Grãos',
      lotes: [
        {
          id: 'L4',
          codigoLote: 'LOTE-2026-AR1',
          dataEntrada: '05/09/2026',
          dataValidade: '10/12/2026',
          diasParaVencer: 52,
          localizacao: 'Armário B',
          quantidadePacotes: 30,
        },
        {
          id: 'L5',
          codigoLote: 'LOTE-2026-AR2',
          dataEntrada: '12/10/2026',
          dataValidade: '20/03/2027',
          diasParaVencer: 152,
          localizacao: 'Armário A',
          quantidadePacotes: 15,
        },
      ],
    },
  ]);

  const [pesquisa, setPesquisa] = useState('');
  const [produtoSelecionadoId, setProdutoSelecionadoId] = useState('prod-1');
  const [filtroLocal, setFiltroLocal] = useState<string>('TODOS');
  const [criterioOrdenacao, setCriterioOrdenacao] = useState<'VALIDADE_ASC' | 'QTD_DESC' | 'LOCAL'>('VALIDADE_ASC');

  const produtosFiltrados = catalogo.filter(
    (p) =>
      p.nome.toLowerCase().includes(pesquisa.toLowerCase()) ||
      p.codigoBarras.includes(pesquisa)
  );

  const produtoAtual =
    catalogo.find((p) => p.id === produtoSelecionadoId) || catalogo[0];

  // Cálculo do Resumo Consolidado exigido na Tela 3.4
  const resumoConsolidado = useMemo(() => {
    const lotes = produtoAtual.lotes;
    const totalPacotes = lotes.reduce((acc, l) => acc + l.quantidadePacotes, 0);
    const ordenadosPorValidade = [...lotes].sort(
      (a, b) => a.diasParaVencer - b.diasParaVencer
    );

    return {
      totalPacotes,
      quantidadeLotesAtivos: lotes.length,
      validadeMaisProxima: ordenadosPorValidade[0]?.dataValidade || '-',
      validadeMaisDistante:
        ordenadosPorValidade[ordenadosPorValidade.length - 1]?.dataValidade || '-',
    };
  }, [produtoAtual]);

  // Aplicação de filtros avançados e ordenação de lotes
  const lotesExibidos = useMemo(() => {
    let lista = [...produtoAtual.lotes];

    if (filtroLocal !== 'TODOS') {
      lista = lista.filter((l) => l.localizacao === filtroLocal);
    }

    if (criterioOrdenacao === 'VALIDADE_ASC') {
      lista.sort((a, b) => a.diasParaVencer - b.diasParaVencer);
    } else if (criterioOrdenacao === 'QTD_DESC') {
      lista.sort((a, b) => b.quantidadePacotes - a.quantidadePacotes);
    } else if (criterioOrdenacao === 'LOCAL') {
      lista.sort((a, b) => a.localizacao.localeCompare(b.localizacao));
    }

    return lista;
  }, [produtoAtual, filtroLocal, criterioOrdenacao]);

  return (
    <SafeAreaView style={[estilosStockDetails.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={estilosStockDetails.rolagem}>
        {/* Cabeçalho */}
        <View style={estilosStockDetails.cabecalho}>
          <Text
            style={[
              estilosStockDetails.titulo,
              { color: theme.primary, fontSize: tokens.typography.fontSize.xl * fontScale },
            ]}
          >
            Consulta Detalhada de Lotes
          </Text>
          <Text
            style={[
              estilosStockDetails.subtitulo,
              { color: theme.subtext, fontSize: tokens.typography.fontSize.sm * fontScale },
            ]}
          >
            Analise o resumo consolidado do produto, filtre por armário e verifique prioridades de vencimento.
          </Text>
        </View>

        {/* Barra de Pesquisa de Produtos */}
        <View
          style={[
            estilosStockDetails.barraBusca,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <AppIcon name="search" size={18} variant="neutral" />
          <TextInput
            placeholder="Pesquisar produto por nome ou código de barras..."
            placeholderTextColor={theme.subtext}
            value={pesquisa}
            onChangeText={setPesquisa}
            accessible={true}
            accessibilityLabel="Pesquisar produto para consulta detalhada"
            style={[
              estilosStockDetails.inputBusca,
              { color: theme.text, fontSize: tokens.typography.fontSize.sm * fontScale },
            ]}
          />
        </View>

        {/* Grelha de Seleção Rápida de Produtos */}
        <View style={estilosStockDetails.seletorProdutos}>
          {produtosFiltrados.map((prod) => {
            const ativo = prod.id === produtoAtual.id;
            return (
              <TouchableOpacity
                key={prod.id}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={`Selecionar produto ${prod.nome}`}
                onPress={() => setProdutoSelecionadoId(prod.id)}
                style={[
                  estilosStockDetails.pilulaProduto,
                  {
                    backgroundColor: ativo ? theme.primary : theme.surface,
                    borderColor: ativo ? theme.primary : theme.border,
                  },
                ]}
              >
                <Text
                  style={[
                    estilosStockDetails.textoPilula,
                    { color: ativo ? '#FFFFFF' : theme.text },
                  ]}
                >
                  {prod.nome}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Painel de Resumo Consolidado do Produto */}
        <View
          style={[
            estilosStockDetails.painelConsolidado,
            { backgroundColor: theme.surface, borderColor: theme.primary },
          ]}
        >
          <Text
            style={[
              estilosStockDetails.tituloProdutoConsolidado,
              { color: theme.primary, fontSize: tokens.typography.fontSize.md * fontScale },
            ]}
          >
            {produtoAtual.nome}
          </Text>
          <Text
            style={[
              estilosStockDetails.subtituloProdutoConsolidado,
              { color: theme.subtext, fontSize: tokens.typography.fontSize.xs * fontScale },
            ]}
          >
            EAN: {produtoAtual.codigoBarras} • {produtoAtual.categoria} ({produtoAtual.subcategoria})
          </Text>

          <View style={estilosStockDetails.gradeConsolidada}>
            <View style={[estilosStockDetails.blocoMetrica, { backgroundColor: theme.background, borderColor: theme.border }]}>
              <Text style={[estilosStockDetails.rotuloMetrica, { color: theme.subtext }]}>
                Total em Estoque
              </Text>
              <Text style={[estilosStockDetails.valorMetrica, { color: theme.primary }]}>
                {resumoConsolidado.totalPacotes} pacotes
              </Text>
            </View>

            <View style={[estilosStockDetails.blocoMetrica, { backgroundColor: theme.background, borderColor: theme.border }]}>
              <Text style={[estilosStockDetails.rotuloMetrica, { color: theme.subtext }]}>
                Lotes Ativos
              </Text>
              <Text style={[estilosStockDetails.valorMetrica, { color: theme.text }]}>
                {resumoConsolidado.quantidadeLotesAtivos} lote(s)
              </Text>
            </View>

            <View style={[estilosStockDetails.blocoMetrica, { backgroundColor: theme.background, borderColor: tokens.colors.accentAmber500 }]}>
              <Text style={[estilosStockDetails.rotuloMetrica, { color: theme.subtext }]}>
                Vencimento Mais Próximo
              </Text>
              <Text style={[estilosStockDetails.valorMetrica, { color: tokens.colors.accentAmber500 }]}>
                {resumoConsolidado.validadeMaisProxima}
              </Text>
            </View>

            <View style={[estilosStockDetails.blocoMetrica, { backgroundColor: theme.background, borderColor: theme.border }]}>
              <Text style={[estilosStockDetails.rotuloMetrica, { color: theme.subtext }]}>
                Vencimento Mais Distante
              </Text>
              <Text style={[estilosStockDetails.valorMetrica, { color: theme.secondary }]}>
                {resumoConsolidado.validadeMaisDistante}
              </Text>
            </View>
          </View>
        </View>

        {/* Controles de Filtro por Localização e Ordenação */}
        <View style={estilosStockDetails.secaoFiltros}>
          <Text style={[estilosStockDetails.rotuloFiltro, { color: theme.text, fontSize: 13 * fontScale }]}>
            Filtrar por Local Físico:
          </Text>
          <View style={estilosStockDetails.linhaBotoesFiltro}>
            {['TODOS', 'Armário A', 'Armário B', 'Geladeira 1'].map((loc) => (
              <TouchableOpacity
                key={loc}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={`Filtrar lotes no local ${loc}`}
                onPress={() => setFiltroLocal(loc)}
                style={[
                  estilosStockDetails.botaoFiltro,
                  {
                    backgroundColor: filtroLocal === loc ? `${theme.primary}15` : theme.surface,
                    borderColor: filtroLocal === loc ? theme.primary : theme.border,
                  },
                ]}
              >
                <Text style={{ fontWeight: '600', color: filtroLocal === loc ? theme.primary : theme.text, fontSize: 12 }}>
                  {loc}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[estilosStockDetails.rotuloFiltro, { color: theme.text, fontSize: 13 * fontScale }]}>
            Ordenar Lotes por:
          </Text>
          <View style={estilosStockDetails.linhaBotoesFiltro}>
            {[
              { id: 'VALIDADE_ASC', label: 'Validade (Mais urgente)' },
              { id: 'QTD_DESC', label: 'Maior Quantidade' },
              { id: 'LOCAL', label: 'Localização' },
            ].map((ord) => (
              <TouchableOpacity
                key={ord.id}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={`Ordenar lista por ${ord.label}`}
                onPress={() => setCriterioOrdenacao(ord.id as any)}
                style={[
                  estilosStockDetails.botaoFiltro,
                  {
                    backgroundColor: criterioOrdenacao === ord.id ? `${theme.secondary}15` : theme.surface,
                    borderColor: criterioOrdenacao === ord.id ? theme.secondary : theme.border,
                  },
                ]}
              >
                <Text style={{ fontWeight: '600', color: criterioOrdenacao === ord.id ? theme.secondary : theme.text, fontSize: 12 }}>
                  {ord.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Lista de Lotes Individuais com Alertas Visuais e Textuais (WCAG 1.4.1) */}
        {lotesExibidos.map((lote) => {
          const vencido = lote.diasParaVencer < 0;
          const proximoVencimento = lote.diasParaVencer >= 0 && lote.diasParaVencer <= 7;

          const corDestaque = vencido
            ? theme.danger
            : proximoVencimento
            ? tokens.colors.accentAmber500
            : theme.secondary;

          const rotuloStatus = vencido
            ? `Vencido há ${Math.abs(lote.diasParaVencer)} dias`
            : proximoVencimento
            ? `Vence em ${lote.diasParaVencer} dias`
            : 'Regular';

          return (
            <View
              key={lote.id}
              accessible={true}
              accessibilityLabel={`Lote ${lote.codigoLote}. Status: ${rotuloStatus}. Validade: ${lote.dataValidade}. Local: ${lote.localizacao}. Quantidade: ${lote.quantidadePacotes} pacotes.`}
              style={[
                estilosStockDetails.cartaoLoteDetalhe,
                {
                  backgroundColor: theme.surface,
                  borderColor: vencido || proximoVencimento ? corDestaque : theme.border,
                },
              ]}
            >
              <View style={estilosStockDetails.topoCartaoLote}>
                <Text style={[estilosStockDetails.codigoLoteTexto, { color: theme.text, fontSize: 14 * fontScale }]}>
                  {lote.codigoLote}
                </Text>

                <View style={[estilosStockDetails.badgeStatusLote, { backgroundColor: `${corDestaque}20` }]}>
                  <AppIcon
                    name={vencido ? 'alert-triangle' : 'clock'}
                    size={14}
                    color={corDestaque}
                  />
                  <Text style={[estilosStockDetails.textoBadgeStatus, { color: corDestaque }]}>
                    {rotuloStatus}
                  </Text>
                </View>
              </View>

              <View style={estilosStockDetails.linhaMetadadosLote}>
                <Text style={{ color: theme.subtext, fontSize: 12 * fontScale }}>
                  Entrada: {lote.dataEntrada} • Validade: <Text style={{ fontWeight: 'bold', color: theme.text }}>{lote.dataValidade}</Text>
                </Text>
              </View>

              <View style={estilosStockDetails.linhaMetadadosLote}>
                <Text style={{ color: theme.subtext, fontSize: 12 * fontScale }}>
                  Local: <Text style={{ fontWeight: '600', color: theme.text }}>{lote.localizacao}</Text>
                </Text>
                <Text style={{ fontWeight: 'bold', color: theme.primary, fontSize: 13 * fontScale }}>
                  {lote.quantidadePacotes} pacotes
                </Text>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}