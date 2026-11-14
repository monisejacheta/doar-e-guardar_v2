// src/app/reports.tsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import Svg, { Circle, G } from 'react-native-svg';
import { useAppTheme } from '../context/ThemeContext';
import { estilosRelatorios } from '../styles/reports.styles';
import { requisicaoApi } from '../services/api';

interface ItemProporcao {
  categoria: string;
  quantidade: number;
  percentual: number;
  cor: string;
}

const PALETA_PROPORCAO = [
  '#1E3A8A', // Azul Guardar
  '#10B981', // Verde Doar
  '#3B82F6',
  '#059669',
  '#F59E0B',
  '#0EA5E9',
  '#DC2626',
  '#64748B',
];

export default function ReportsScreen() {
  const { theme, tokens, fontScale } = useAppTheme();
  const [itensProporcao, setItensProporcao] = useState<ItemProporcao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);

  const carregarProporcaoEstoque = useCallback(async () => {
    try {
      const resp: any = await requisicaoApi('/api/estoque', {
        metodo: 'POST',
        dados: { modulo: 'estoque', acao: 'consultar_estoque' },
      });

      const lotes: any[] = Array.isArray(resp?.lotes)
        ? resp.lotes
        : Array.isArray(resp?.dados)
          ? resp.dados
          : [];

      const agrupado = new Map<string, number>();
      lotes.forEach((lote) => {
        const qtd = Number(lote.quantidade_atual_pacote || 0);
        if (qtd <= 0) return;
        const cat = String(lote.categoria || 'Outros').trim() || 'Outros';
        agrupado.set(cat, (agrupado.get(cat) || 0) + qtd);
      });

      const total = Array.from(agrupado.values()).reduce((s, v) => s + v, 0);
      const listaOrdenada: ItemProporcao[] = Array.from(agrupado.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([categoria, quantidade], idx) => ({
          categoria,
          quantidade,
          percentual: total > 0 ? Math.round((quantidade / total) * 1000) / 10 : 0,
          cor: PALETA_PROPORCAO[idx % PALETA_PROPORCAO.length],
        }));

      setItensProporcao(listaOrdenada);
    } catch {
      setItensProporcao([]);
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void carregarProporcaoEstoque();
    }, 0);
    return () => clearTimeout(timer);
  }, [carregarProporcaoEstoque]);

  const totalGeral = useMemo(
    () => itensProporcao.reduce((acc, item) => acc + item.quantidade, 0),
    [itensProporcao],
  );

  // Parâmetros geométricos do gráfico circular proporcional (Donut SVG)
  const tamanhoSvg = 216;
  const raio = 82;
  const espessura = 28;
  const circunferencia = 2 * Math.PI * raio;

  const fatiasSvg = useMemo(() => {
    return itensProporcao.map((item, idx) => {
      const somaAnterior = itensProporcao
        .slice(0, idx)
        .reduce((acc, prev) => acc + (totalGeral > 0 ? prev.quantidade / totalGeral : 0), 0);
      const fracao = totalGeral > 0 ? item.quantidade / totalGeral : 0;
      const comprimento = fracao * circunferencia;
      const deslocamento = -(somaAnterior * circunferencia);
      return {
        ...item,
        comprimento,
        deslocamento,
      };
    });
  }, [itensProporcao, totalGeral, circunferencia]);

  return (
    <SafeAreaView style={[estilosRelatorios.container, { backgroundColor: 'transparent' }]}>
      <ScrollView
        contentContainerStyle={estilosRelatorios.conteudoScroll}
        refreshControl={
          <RefreshControl
            refreshing={atualizando}
            onRefresh={() => {
              setAtualizando(true);
              carregarProporcaoEstoque();
            }}
            colors={['#1E3A8A', '#10B981']}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={estilosRelatorios.cabecalho}>
          <Text
            style={[
              estilosRelatorios.tituloPagina,
              {
                color: theme.primary,
                fontSize: tokens.typography.fontSize.xl * fontScale,
              },
            ]}
          >
            Relatório de Proporção
          </Text>
          <Text
            style={[
              estilosRelatorios.subtituloPagina,
              {
                color: theme.subtext,
                fontSize: tokens.typography.fontSize.sm * fontScale,
              },
            ]}
          >
            Participação percentual de cada categoria no estoque ativo
          </Text>
        </View>

        <View
          style={[
            estilosRelatorios.cartaoProporcao,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}
        >
          {carregando ? (
            <ActivityIndicator size="large" color={theme.primary} style={{ marginVertical: 40 }} />
          ) : totalGeral === 0 ? (
            <View style={estilosRelatorios.estadoVazio}>
              <Feather name="pie-chart" size={34} color={theme.subtext} />
              <Text
                style={{
                  color: theme.text,
                  fontWeight: '700',
                  fontSize: 14 * fontScale,
                  marginTop: 12,
                }}
              >
                Sem dados proporcionais no estoque
              </Text>
              <Text
                style={{
                  color: theme.subtext,
                  fontSize: 12 * fontScale,
                  textAlign: 'center',
                  marginTop: 4,
                }}
              >
                Cadastre lotes em Entrada de Alimentos para visualizar as proporções.
              </Text>
            </View>
          ) : (
            <>
              <View style={estilosRelatorios.donutContainer}>
                <Svg width={tamanhoSvg} height={tamanhoSvg} viewBox={`0 0 ${tamanhoSvg} ${tamanhoSvg}`}>
                  <G rotation="-90" origin={`${tamanhoSvg / 2}, ${tamanhoSvg / 2}`}>
                    <Circle
                      cx={tamanhoSvg / 2}
                      cy={tamanhoSvg / 2}
                      r={raio}
                      stroke={theme.border}
                      strokeWidth={espessura}
                      fill="transparent"
                    />
                    {fatiasSvg.map((fatia) => (
                      <Circle
                        key={fatia.categoria}
                        cx={tamanhoSvg / 2}
                        cy={tamanhoSvg / 2}
                        r={raio}
                        stroke={fatia.cor}
                        strokeWidth={espessura}
                        strokeDasharray={`${fatia.comprimento} ${circunferencia}`}
                        strokeDashoffset={fatia.deslocamento}
                        strokeLinecap="butt"
                        fill="transparent"
                      />
                    ))}
                  </G>
                </Svg>

                <View style={estilosRelatorios.donutCentroOverlay}>
                  <Text
                    style={[
                      estilosRelatorios.donutTotalValor,
                      { color: theme.primary, fontSize: 24 * fontScale },
                    ]}
                  >
                    {totalGeral}
                  </Text>
                  <Text
                    style={[
                      estilosRelatorios.donutTotalLabel,
                      { color: theme.subtext, fontSize: 10 * fontScale },
                    ]}
                  >
                    pacotes
                  </Text>
                </View>
              </View>

              <View
                style={[
                  estilosRelatorios.barraEmpilhada,
                  { backgroundColor: theme.background },
                ]}
              >
                {itensProporcao.map((item) => (
                  <View
                    key={`seg-${item.categoria}`}
                    style={{
                      flex: item.quantidade,
                      backgroundColor: item.cor,
                    }}
                  />
                ))}
              </View>

              <View style={estilosRelatorios.legendaLista}>
                {itensProporcao.map((item) => (
                  <View
                    key={item.categoria}
                    style={[
                      estilosRelatorios.legendaLinha,
                      { borderBottomColor: theme.border },
                    ]}
                  >
                    <View style={estilosRelatorios.legendaEsquerda}>
                      <View
                        style={[
                          estilosRelatorios.pontoCor,
                          { backgroundColor: item.cor },
                        ]}
                      />
                      <Text
                        style={[
                          estilosRelatorios.nomeCategoria,
                          { color: theme.text, fontSize: 13.5 * fontScale },
                        ]}
                      >
                        {item.categoria}
                      </Text>
                    </View>

                    <View style={estilosRelatorios.valoresDireita}>
                      <Text
                        style={[
                          estilosRelatorios.quantidadeTexto,
                          { color: theme.subtext, fontSize: 12 * fontScale },
                        ]}
                      >
                        {item.quantidade} un.
                      </Text>
                      <Text
                        style={[
                          estilosRelatorios.percentualTexto,
                          { color: item.cor, fontSize: 14 * fontScale },
                        ]}
                      >
                        {item.percentual.toFixed(1)}%
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
