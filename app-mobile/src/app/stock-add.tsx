// src/app/stock-add.tsx
import React, { useState } from 'react';
import {
  Text,
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAppTheme } from '../context/ThemeContext';
import { AppButton } from '../components/common/AppButton';
import { AppInput } from '../components/common/AppInput';
import { AppIcon } from '../components/common/AppIcon';
import { estilosStockAdd } from '../styles/stock-add.styles';

export default function StockAddScreen() {
  const roteador = useRouter();
  const { theme, tokens, fontScale } = useAppTheme();

  // Estados do formulário
  const [codigoBarras, setCodigoBarras] = useState('');
  const [nomeProduto, setNomeProduto] = useState('');
  const [categoria, setCategoria] = useState('Grãos e Cereais');
  const [quantidadePacotes, setQuantidadePacotes] = useState('');
  const [estoqueMinimo, setEstoqueMinimo] = useState('5');
  const [dataValidade, setDataValidade] = useState('');
  const [localArmazenamento, setLocalArmazenamento] = useState('Armário A');
  const [consultandoApi, setConsultandoApi] = useState(false);
  const [origemIdentificacao, setOrigemIdentificacao] = useState<string | null>(null);

  // Categorias padronizadas da instituição (Tela 6.4)
  const categoriasDisponiveis = [
    'Grãos e Cereais',
    'Laticínios',
    'Enlatados',
    'Óleos e Temperos',
    'Higiene e Limpeza',
  ];

  // Locais físicos reais da Casa da Criança (sem ruas/corredores - Tela 6.5)
  const locaisDisponiveis = [
    'Armário A',
    'Armário B',
    'Despensa Prateleira 1',
    'Geladeira 1',
  ];

  // Simulação do barramento com 3 APIs em cascata para identificação de produto
  const simularLeituraCameraOuApi = async (codigoFornecido?: string) => {
    const ean = codigoFornecido || '7891000100103';
    setCodigoBarras(ean);
    setConsultandoApi(true);

    try {
      // Simula a consulta sequencial às APIs em cascata
      await new Promise((resolve) => setTimeout(resolve, 800));

      if (ean === '7891000100103') {
        setNomeProduto('Leite Integral UHT 1L');
        setCategoria('Laticínios');
        setEstoqueMinimo('10');
        setOrigemIdentificacao('Produto identificado na API 1 (Cosmos/Bluesoft)');
      } else {
        setNomeProduto('Alimento Não Cadastrado');
        setOrigemIdentificacao('Identificado na API 2 (Open Food Facts)');
      }

      Alert.alert(
        'Código Reconhecido',
        'As informações básicas do produto foram preenchidas automaticamente. Verifique os dados e informe a validade e quantidade.'
      );
    } catch {
      setOrigemIdentificacao('APIs externas offline. Cadastro manual habilitado.');
    } finally {
      setConsultandoApi(false);
    }
  };

  const salvarEntradaLote = () => {
    if (!codigoBarras.trim()) {
      Alert.alert('Código Faltando', 'Por favor, leia o código pela câmera ou digite o número.');
      return;
    }
    if (!nomeProduto.trim()) {
      Alert.alert('Nome Obrigatório', 'Por favor, informe a descrição do produto.');
      return;
    }
    if (!quantidadePacotes.trim() || Number(quantidadePacotes) <= 0) {
      Alert.alert('Quantidade Inválida', 'Informe o número de pacotes ou unidades que estão entrando.');
      return;
    }
    if (!dataValidade.trim()) {
      Alert.alert('Validade Obrigatória', 'Informe a data de vencimento do lote para o controle de alertas.');
      return;
    }

    Alert.alert(
      'Entrada Concluída!',
      `Lote cadastrado com sucesso:\n• ${quantidadePacotes} pacotes de "${nomeProduto}"\n• Local: ${localArmazenamento}\n• Vencimento: ${dataValidade}`,
      [
        {
          text: 'Concluir',
          onPress: () => roteador.back(),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[estilosStockAdd.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={estilosStockAdd.rolagem} keyboardShouldPersistTaps="handled">
        {/* Cabeçalho */}
        <View style={estilosStockAdd.cabecalho}>
          <Text
            style={[
              estilosStockAdd.titulo,
              { color: theme.primary, fontSize: tokens.typography.fontSize.xl * fontScale },
            ]}
          >
            Entrada de Alimentos
          </Text>
          <Text
            style={[
              estilosStockAdd.subtitulo,
              { color: theme.subtext, fontSize: tokens.typography.fontSize.sm * fontScale },
            ]}
          >
            Registre doações recebidas no estoque utilizando a câmera ou o número do código de barras.
          </Text>
        </View>

        {/* 1. Área de Identificação por Código de Barras (Câmera + Digitação) */}
        <View
          style={[
            estilosStockAdd.secaoCard,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <Text
            style={[
              estilosStockAdd.tituloSecaoCard,
              { color: theme.text, fontSize: tokens.typography.fontSize.md * fontScale },
            ]}
          >
            1. Código de Barras
          </Text>

          {/* Botão de Câmera (Ação Operacional em Verde Doar) */}
          <AppButton
            title="📷 Usar Câmera do Celular"
            variant="secondary"
            loading={consultandoApi}
            onPress={() => simularLeituraCameraOuApi('7891000100103')}
            accessibilityHint="Abre a câmera para ler o código na embalagem"
          />

          <View style={estilosStockAdd.divisorOu}>
            <View style={[estilosStockAdd.linhaDivisor, { backgroundColor: theme.border }]} />
            <Text style={[estilosStockAdd.textoDivisor, { color: theme.subtext }]}>OU DIGITE O NÚMERO</Text>
            <View style={[estilosStockAdd.linhaDivisor, { backgroundColor: theme.border }]} />
          </View>

          <AppInput
            rotulo="Número do código de barras"
            placeholder="Ex: 7891000100103"
            keyboardType="numeric"
            value={codigoBarras}
            onChangeText={(texto) => {
              setCodigoBarras(texto);
              if (texto.length >= 12) simularLeituraCameraOuApi(texto);
            }}
            dicaAcessibilidade="Digite os dígitos numéricos presentes na embalagem"
          />

          {origemIdentificacao && (
            <View
              style={[
                estilosStockAdd.bannerStatusApi,
                { backgroundColor: `${theme.secondary}15`, borderColor: theme.secondary },
              ]}
            >
              <AppIcon name="clipboard" size={16} variant="secondary" />
              <Text style={[estilosStockAdd.textoStatusApi, { color: theme.text }]}>
                {origemIdentificacao}
              </Text>
            </View>
          )}
        </View>

        {/* 2. Dados do Produto */}
        <View
          style={[
            estilosStockAdd.secaoCard,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <Text
            style={[
              estilosStockAdd.tituloSecaoCard,
              { color: theme.text, fontSize: tokens.typography.fontSize.md * fontScale },
            ]}
          >
            2. Descrição e Categoria
          </Text>

          <AppInput
            rotulo="Nome do alimento ou produto"
            placeholder="Ex: Feijão Carioca 1kg"
            value={nomeProduto}
            onChangeText={setNomeProduto}
            dicaAcessibilidade="Nome de identificação do alimento"
          />

          <Text style={[estilosStockAdd.rotuloSeletor, { color: theme.text, fontSize: tokens.typography.fontSize.sm * fontScale }]}>
            Categoria do Alimento
          </Text>
          <View style={estilosStockAdd.gradeSelecao}>
            {categoriasDisponiveis.map((cat) => (
              <TouchableOpacity
                key={cat}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={`Selecionar categoria ${cat}`}
                onPress={() => setCategoria(cat)}
                style={[
                  estilosStockAdd.botaoOpcao,
                  {
                    backgroundColor: categoria === cat ? `${theme.primary}15` : theme.background,
                    borderColor: categoria === cat ? theme.primary : theme.border,
                  },
                ]}
              >
                <Text
                  style={[
                    estilosStockAdd.textoOpcao,
                    { color: categoria === cat ? theme.primary : theme.text },
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 3. Lote, Validade e Armazenamento */}
        <View
          style={[
            estilosStockAdd.secaoCard,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <Text
            style={[
              estilosStockAdd.tituloSecaoCard,
              { color: theme.text, fontSize: tokens.typography.fontSize.md * fontScale },
            ]}
          >
            3. Quantidade, Validade e Local
          </Text>

          <View style={estilosStockAdd.linhaDoisCampos}>
            <View style={estilosStockAdd.colunaCampo}>
              <AppInput
                rotulo="Quantidade (pacotes)"
                placeholder="Ex: 12"
                keyboardType="numeric"
                value={quantidadePacotes}
                onChangeText={setQuantidadePacotes}
                dicaAcessibilidade="Total de pacotes ou unidades que estão entrando"
              />
            </View>
            <View style={estilosStockAdd.colunaCampo}>
              <AppInput
                rotulo="Estoque mínimo de segurança"
                placeholder="Ex: 5"
                keyboardType="numeric"
                value={estoqueMinimo}
                onChangeText={setEstoqueMinimo}
                dicaAcessibilidade="Alerta disparado se o total ficar menor que este valor"
              />
            </View>
          </View>

          <AppInput
            rotulo="Data de vencimento (DD/MM/AAAA)"
            placeholder="Ex: 28/11/2026"
            value={dataValidade}
            onChangeText={setDataValidade}
            dicaAcessibilidade="Data de validade indicada no rótulo"
          />

          <Text style={[estilosStockAdd.rotuloSeletor, { color: theme.text, fontSize: tokens.typography.fontSize.sm * fontScale }]}>
            Local de Armazenamento
          </Text>
          <View style={estilosStockAdd.gradeSelecao}>
            {locaisDisponiveis.map((loc) => (
              <TouchableOpacity
                key={loc}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={`Guardar no compartimento ${loc}`}
                onPress={() => setLocalArmazenamento(loc)}
                style={[
                  estilosStockAdd.botaoOpcao,
                  {
                    backgroundColor: localArmazenamento === loc ? `${theme.secondary}15` : theme.background,
                    borderColor: localArmazenamento === loc ? theme.secondary : theme.border,
                  },
                ]}
              >
                <Text
                  style={[
                    estilosStockAdd.textoOpcao,
                    { color: localArmazenamento === loc ? theme.secondary : theme.text },
                  ]}
                >
                  {loc}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Botão de Finalização em Verde Doar */}
        <AppButton
          title="Confirmar Entrada no Estoque"
          variant="secondary"
          onPress={salvarEntradaLote}
          accessibilityHint="Salva a entrada do novo lote de mantimentos no sistema"
        />
      </ScrollView>
    </SafeAreaView>
  );
}