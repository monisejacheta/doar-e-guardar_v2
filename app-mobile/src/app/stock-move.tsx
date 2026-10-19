// src/app/stock-move.tsx
import React, { useState } from 'react';
import {
  Text,
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAppTheme } from '../context/ThemeContext';
import { AppButton } from '../components/common/AppButton';
import { AppInput } from '../components/common/AppInput';
import { AppIcon } from '../components/common/AppIcon';
import { estilosStockMove } from '../styles/stock-move.styles';

interface LoteMovimentacao {
  id: string;
  produto: string;
  codigoLote: string;
  localAtual: string;
  quantidadeTotal: number;
  validade: string;
}

export default function StockMoveScreen() {
  const roteador = useRouter();
  const { theme, tokens, fontScale } = useAppTheme();

  // Lotes disponíveis para transferência interna
  const [lotes] = useState<LoteMovimentacao[]>([
    {
      id: '1',
      produto: 'Arroz Tipo 1 (1kg)',
      codigoLote: 'LOTE-2026-AR1',
      localAtual: 'Armário A - Prateleira 2',
      quantidadeTotal: 20,
      validade: '10/12/2026',
    },
    {
      id: '2',
      produto: 'Leite Integral UHT (1L)',
      codigoLote: 'LOTE-2026-LT4',
      localAtual: 'Armário B - Prateleira 1',
      quantidadeTotal: 12,
      validade: '24/10/2026',
    },
    {
      id: '3',
      produto: 'Feijão Carioca (1kg)',
      codigoLote: 'LOTE-2026-FJ2',
      localAtual: 'Despensa Prateleira 1',
      quantidadeTotal: 15,
      validade: '18/11/2026',
    },
  ]);

  // Locais físicos homologados da ONG (sem ruas ou corredores)
  const locaisArmazenamento = [
    'Armário A - Prateleira 1',
    'Armário A - Prateleira 2',
    'Armário B - Prateleira 1',
    'Despensa Prateleira 1',
    'Geladeira 1 - Gaveta Superior',
  ];

  const [loteSelecionado, setLoteSelecionado] = useState<LoteMovimentacao>(lotes[0]);
  // Regra Tela 3.3: Por padrão, move todos os itens daquele lote
  const [quantidadeMover, setQuantidadeMover] = useState<string>(String(lotes[0].quantidadeTotal));
  const [novoLocal, setNovoLocal] = useState<string>('Armário B - Prateleira 1');

  const aoSelecionarLote = (lote: LoteMovimentacao) => {
    setLoteSelecionado(lote);
    setQuantidadeMover(String(lote.quantidadeTotal)); // Preenche o total por padrão
  };

  const qtdNumerica = Number(quantidadeMover);
  const vaiDividirLote = qtdNumerica > 0 && qtdNumerica < loteSelecionado.quantidadeTotal;

  const executarTransferencia = () => {
    Alert.alert(
      'Transferência Concluída!',
      `Movimentação auditada com sucesso:\n\n• 1º Registro: "saída - movimentação estoque" (${qtdNumerica} pcts de ${loteSelecionado.localAtual})\n• 2º Registro: Entrada imediata em "${novoLocal}"`,
      [{ text: 'Voltar ao Estoque', onPress: () => roteador.back() }]
    );
  };

  const validarEMover = () => {
    if (!quantidadeMover || isNaN(qtdNumerica) || qtdNumerica <= 0) {
      Alert.alert('Quantidade Inválida', 'Informe uma quantidade maior que zero para mover.');
      return;
    }

    if (qtdNumerica > loteSelecionado.quantidadeTotal) {
      Alert.alert(
        'Quantidade Indisponível',
        `O lote possui apenas ${loteSelecionado.quantidadeTotal} pacotes disponíveis.`
      );
      return;
    }

    if (novoLocal === loteSelecionado.localAtual) {
      Alert.alert(
        'Mesmo Local',
        'Selecione um armário ou geladeira de destino diferente do local atual.'
      );
      return;
    }

    // Regra Tela 3.3: Se mover quantidade menor que a total, exigir confirmação para dividir o lote
    if (vaiDividirLote) {
      Alert.alert(
        'Confirmar Divisão de Lote?',
        `Você está movendo ${qtdNumerica} de ${loteSelecionado.quantidadeTotal} pacotes.\n\nIsso irá dividir o lote "${loteSelecionado.codigoLote}" em dois locais diferentes (${loteSelecionado.localAtual} e ${novoLocal}). Deseja confirmar a divisão?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Sim, Dividir Lote', onPress: executarTransferencia },
        ]
      );
      return;
    }

    executarTransferencia();
  };

  return (
    <SafeAreaView style={[estilosStockMove.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={estilosStockMove.rolagem} keyboardShouldPersistTaps="handled">
        {/* Cabeçalho */}
        <View style={estilosStockMove.cabecalho}>
          <Text
            style={[
              estilosStockMove.titulo,
              { color: theme.primary, fontSize: tokens.typography.fontSize.xl * fontScale },
            ]}
          >
            Mover Produtos de Local
          </Text>
          <Text
            style={[
              estilosStockMove.subtitulo,
              { color: theme.subtext, fontSize: tokens.typography.fontSize.sm * fontScale },
            ]}
          >
            Transfira lotes entre armários e geladeiras mantendo o histórico completo de rastreabilidade.
          </Text>
        </View>

        {/* 1. Seleção do Lote de Origem */}
        <View
          style={[
            estilosStockMove.secaoCard,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <Text
            style={[
              estilosStockMove.tituloSecaoCard,
              { color: theme.text, fontSize: tokens.typography.fontSize.md * fontScale },
            ]}
          >
            1. Selecione o Lote a Transferir
          </Text>

          {lotes.map((item) => {
            const ativo = item.id === loteSelecionado.id;
            return (
              <TouchableOpacity
                key={item.id}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={`${item.produto}. Lote ${item.codigoLote}. Local atual: ${item.localAtual}. Total: ${item.quantidadeTotal} pacotes.`}
                onPress={() => aoSelecionarLote(item)}
                style={[
                  estilosStockMove.cartaoLoteOrigem,
                  {
                    backgroundColor: ativo ? `${theme.primary}15` : theme.background,
                    borderColor: ativo ? theme.primary : theme.border,
                  },
                ]}
              >
                <View style={estilosStockMove.infoLote}>
                  <Text style={[estilosStockMove.nomeProdutoLote, { color: theme.text }]}>
                    {item.produto} ({item.codigoLote})
                  </Text>
                  <Text style={[estilosStockMove.detalheLocalAtual, { color: theme.subtext }]}>
                    Origem: {item.localAtual} • Val: {item.validade}
                  </Text>
                </View>
                <View style={[estilosStockMove.badgeSaldo, { backgroundColor: `${theme.primary}20` }]}>
                  <Text style={{ fontWeight: 'bold', color: theme.primary }}>
                    {item.quantidadeTotal} pcts
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* 2. Quantidade e Alerta de Divisão de Lote */}
        <View
          style={[
            estilosStockMove.secaoCard,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <Text
            style={[
              estilosStockMove.tituloSecaoCard,
              { color: theme.text, fontSize: tokens.typography.fontSize.md * fontScale },
            ]}
          >
            2. Quantidade a Transferir
          </Text>

          <AppInput
            rotulo={`Quantidade de pacotes (Padrão: lote completo de ${loteSelecionado.quantidadeTotal} pcts)`}
            placeholder="Informe a quantidade"
            keyboardType="numeric"
            value={quantidadeMover}
            onChangeText={setQuantidadeMover}
            dicaAcessibilidade="Por padrão transfere todo o lote. Diminua o valor caso queira dividir o lote."
          />

          {vaiDividirLote && (
            <View
              style={[
                estilosStockMove.avisoDivisaoLote,
                {
                  backgroundColor: `${tokens.colors.accentAmber500}15`,
                  borderColor: tokens.colors.accentAmber500,
                },
              ]}
            >
              <AppIcon name="alert-triangle" size={20} variant="amber" />
              <Text style={[estilosStockMove.textoAvisoDivisao, { color: theme.text }]}>
                Atenção: Como a quantidade é menor que o total ({loteSelecionado.quantidadeTotal}), este lote será dividido em dois locais mediante sua confirmação.
              </Text>
            </View>
          )}
        </View>

        {/* 3. Seleção do Novo Local (Destino) */}
        <View
          style={[
            estilosStockMove.secaoCard,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <Text
            style={[
              estilosStockMove.tituloSecaoCard,
              { color: theme.text, fontSize: tokens.typography.fontSize.md * fontScale },
            ]}
          >
            3. Novo Local de Destino
          </Text>

          <View style={estilosStockMove.gradeLocais}>
            {locaisArmazenamento.map((loc) => {
              const selecionado = novoLocal === loc;
              const ehLocalAtual = loc === loteSelecionado.localAtual;

              return (
                <TouchableOpacity
                  key={loc}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={`Transferir para ${loc} ${ehLocalAtual ? '(Local atual)' : ''}`}
                  onPress={() => setNovoLocal(loc)}
                  style={[
                    estilosStockMove.botaoLocal,
                    {
                      backgroundColor: selecionado ? `${theme.secondary}15` : theme.background,
                      borderColor: selecionado ? theme.secondary : theme.border,
                      opacity: ehLocalAtual ? 0.5 : 1,
                    },
                  ]}
                >
                  <Text
                    style={[
                      estilosStockMove.textoBotaoLocal,
                      { color: selecionado ? theme.secondary : theme.text },
                    ]}
                  >
                    {loc} {ehLocalAtual ? '(Atual)' : ''}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Botão de Confirmação Principal em Azul Guardar */}
        <AppButton
          title={vaiDividirLote ? 'Confirmar Divisão e Mover Lote' : 'Confirmar Transferência de Local'}
          variant="primary"
          onPress={validarEMover}
          accessibilityHint="Registra a saída por movimentação na origem e entrada imediata no novo local"
        />
      </ScrollView>
    </SafeAreaView>
  );
}