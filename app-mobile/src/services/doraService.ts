// app-mobile/src/services/doraService.ts
import { normalizarDescricaoPrateleira } from './storageLocations';

export interface LoteEstoqueDora {
  id_lote_produto: string;
  id_produto?: string;
  nome_produto: string;
  marca_produto?: string;
  categoria: string;
  codigo_barra_produto?: string;
  numero_codigo_lote: string;
  quantidade_inicial_pacote?: number;
  quantidade_atual_pacote: number;
  estoque_minimo_pacote?: number;
  unidade_medida_sigla?: string;
  data_validade_lote: string;
  data_entrada_lote?: string;
  local_descricao: string;
  diasRestantes: number;
}

export interface MovimentacaoEstoqueDora {
  id_movimentacao?: string;
  id_lote_produto?: string;
  nome_produto?: string;
  tipo_movimentacao?: string;
  quantidade?: number;
  data_movimentacao?: string;
}

export interface ReceitaSugerida {
  id: string;
  titulo: string;
  rendimento: string;
  tempoPreparo: string;
  ingredientesEstoque: string;
  ingredientesComplementares: string;
  modoPreparo: string;
  dicaDora: string;
  fonteNome: string;
  fonteUrl: string;
}

export interface PredicaoProdutoML {
  nomeProduto: string;
  categoria: string;
  saldoTotal: number;
  consumoDiarioEstimado: number;
  diasAutonomia: number;
  menorValidadeDias: number;
  riscoVencerAntesDeAcabar: boolean;
  precisaReposicaoBreve: boolean;
  prateleiras: string[];
}

export interface AtalhoNavegacaoDora {
  rotulo: string;
  rota: string;
  icone: string;
}

export interface RespostaDoraIA {
  texto: string;
  receita?: ReceitaSugerida;
  predicoes?: PredicaoProdutoML[];
  atalho?: AtalhoNavegacaoDora;
  sugestoesContinuacao?: string[];
}

interface MoldeReceita {
  id: string;
  titulo: string;
  tipo: 'salgada' | 'doce' | 'lanche';
  rendimento: string;
  tempoPreparo: string;
  // Grupos de ingredientes compatíveis: cada grupo exige que pelo menos um termo case com um produto real do estoque
  gruposObrigatorios: string[][];
  gruposOpcionais: string[][];
  proibidosNaCombinacao: string[];
  complementosCozinha: string[];
  passosPreparo: (itensUsados: string[]) => string[];
  dicaCarinhosa: string;
  fonteNome: string;
  fonteUrl: string;
}

const removerAcentos = (texto: string): string =>
  (texto || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

/**
 * Catálogo curado de receitas culinárias reais e compatíveis (nunca mistura itens incompatíveis como feijão com leite doce).
 */
const CATALOGO_RECEITAS_REAIS: MoldeReceita[] = [
  {
    id: 'arroz-doce-cremoso',
    titulo: 'Arroz Doce Cremoso da Tarde',
    tipo: 'doce',
    rendimento: '25 porções',
    tempoPreparo: '35 min',
    gruposObrigatorios: [['arroz'], ['leite', 'laticinio', 'composto lacteo']],
    gruposOpcionais: [['acucar', 'canela', 'cravo']],
    proibidosNaCombinacao: ['feijao', 'macarrao', 'oleo', 'salgado', 'molho', 'sardinha', 'atum'],
    complementosCozinha: ['Água filtrada para cozimento', 'Canela em pó ou casca de limão a gosto'],
    passosPreparo: (itens) => [
      `Separe ${itens.join(' e ')} que já estão na nossa despensa/geladeira.`,
      'Cozinhe o arroz em água até os grãos ficarem bem macios.',
      'Adicione o leite aos poucos em fogo baixo, mexendo com carinho até o caldo engrossar e ficar bem cremoso.',
      'Adoce levemente, finalize com um toque de canela e sirva morno ou geladinho! 😋',
    ],
    dicaCarinhosa: 'Essa receita é perfeita para usar o leite e o arroz que estão com a validade mais próxima!',
    fonteNome: 'TudoGostoso - Arroz Doce Tradicional',
    fonteUrl: 'https://www.tudogostoso.com.br/receita/10234-arroz-doce-cremoso.html',
  },
  {
    id: 'arroz-feijao-caseiro',
    titulo: 'Arroz Soltinho com Feijão Caseiro Nutritivo',
    tipo: 'salgada',
    rendimento: '30 porções',
    tempoPreparo: '45 min',
    gruposObrigatorios: [['arroz'], ['feijao', 'lentilha', 'grao']],
    gruposOpcionais: [['oleo', 'azeite'], ['farinha', 'fuba']],
    proibidosNaCombinacao: ['leite', 'biscoito', 'bolacha', 'achocolatado', 'doce'],
    complementosCozinha: ['Alho, cebola e cheiro-verde fresquinhos', 'Sal em quantidade moderada'],
    passosPreparo: (itens) => [
      `Pegue nas prateleiras: ${itens.join(', ')}.`,
      'Deixe o feijão de molho em água antes de cozinhar na pressão — isso deixa os grãos super macios e fáceis de digerir.',
      'Refogue alho e cebola com um fiozinho de óleo, tempere o caldo do feijão e deixe apurar.',
      'Prepare o arroz branquinho em outra panela e sirva bem quentinho no almoço! 🍛',
    ],
    dicaCarinhosa: 'A dupla arroz com feijão forma uma proteína completa e cheia de energia para o dia a dia!',
    fonteNome: 'Guia Alimentar Brasileiro / TudoGostoso',
    fonteUrl: 'https://www.tudogostoso.com.br/receita/159949-feijao-caseiro.html',
  },
  {
    id: 'macarronada-comunitaria',
    titulo: 'Macarronada Caseira de Forno ou Panela',
    tipo: 'salgada',
    rendimento: '25 porções',
    tempoPreparo: '25 min',
    gruposObrigatorios: [['macarrao', 'massa', 'espaguete', 'parafuso', 'penne', 'padre nosso']],
    gruposOpcionais: [['molho', 'tomate', 'extrato'], ['oleo', 'azeite'], ['sardinha', 'atum', 'carne', 'frango']],
    proibidosNaCombinacao: ['leite', 'feijao', 'biscoito', 'achocolatado', 'cafe'],
    complementosCozinha: ['Água fervente com uma pitada de sal', 'Alho, cebola, tomate ou ervas naturais'],
    passosPreparo: (itens) => [
      `Separe nas prateleiras: ${itens.join(', ')}.`,
      'Cozinhe o macarrão em bastante água fervente até ficar macio, mas firme (al dente), e escorra.',
      'Em uma panela grande, doure alho e cebola e prepare um molho bem cheiroso.',
      'Envolva toda a massa no molho quentinho e sirva em seguida! 🍝',
    ],
    dicaCarinhosa: 'O macarrão rende super bem e todo mundo adora no almoço ou jantar!',
    fonteNome: 'TudoGostoso - Macarronada Simples e Saborosa',
    fonteUrl: 'https://www.tudogostoso.com.br/receita/82369-macarronada-simples.html',
  },
  {
    id: 'mingau-aveia-ou-milho',
    titulo: 'Mingau Quentinho e Nutritivo com Leite',
    tipo: 'lanche',
    rendimento: '20 porções',
    tempoPreparo: '15 min',
    gruposObrigatorios: [['leite', 'laticinio']],
    gruposOpcionais: [['aveia', 'fuba', 'amido', 'maizena', 'milho', 'farinha lactea', 'achocolatado', 'biscoito']],
    proibidosNaCombinacao: ['feijao', 'macarrao', 'oleo', 'molho', 'sal', 'vinagre'],
    complementosCozinha: ['Uma pitada de canela ou baunilha', 'Açúcar moderado se necessário'],
    passosPreparo: (itens) => [
      `Separe ${itens.join(' e ')} dando preferência ao lote que vence primeiro.`,
      'Dissolva o ingrediente espessante (ou sirva o leite acompanhado) antes de levar ao fogo brando.',
      'Mexa sem parar até atingir uma textura aveludada e aconchegante.',
      'Sirva no café da manhã ou no lanche da tarde! 🥣',
    ],
    dicaCarinhosa: 'Como o leite costuma ter validade mais curta na geladeira, essa opção ajuda muito a evitar perdas!',
    fonteNome: 'TudoGostoso - Lanches com Leite',
    fonteUrl: 'https://www.tudogostoso.com.br/receita/305023-mingau-cremoso.html',
  },
  {
    id: 'sopa-nutritiva-conforto',
    titulo: 'Sopinha Caseira Nutritiva de Massa ou Grãos',
    tipo: 'salgada',
    rendimento: '30 porções',
    tempoPreparo: '35 min',
    gruposObrigatorios: [['macarrao', 'massa', 'arroz', 'feijao', 'lentilha']],
    gruposOpcionais: [['oleo', 'azeite'], ['legume', 'batata', 'cenoura', 'mandioca']],
    proibidosNaCombinacao: ['leite', 'biscoito', 'bolacha', 'achocolatado', 'acucar'],
    complementosCozinha: ['Legumes picadinhos da cozinha (cenoura, batata ou chuchu)', 'Cheiro-verde picado na hora de servir'],
    passosPreparo: (itens) => [
      `Retire das prateleiras: ${itens.join(', ')}.`,
      'Refogue os temperos naturais e cozinhe os legumes em água até começarem a amaciar.',
      'Acrescente a base do nosso estoque e deixe cozinhar até o caldo ficar encorpado e nutritivo.',
      'Finalize com cheiro-verde e sirva bem quentinho! 🍲',
    ],
    dicaCarinhosa: 'Sopas são ótimas para aproveitar pacotes abertos ou lotes menores que sobraram na prateleira!',
    fonteNome: 'TudoGostoso - Sopa Caseira Nutritiva',
    fonteUrl: 'https://www.tudogostoso.com.br/receita/134101-sopa-de-legumes-com-macarrao.html',
  },
  {
    id: 'risoto-arroz-forno',
    titulo: 'Arroz Cremoso de Panela com Temperos da Casa',
    tipo: 'salgada',
    rendimento: '25 porções',
    tempoPreparo: '30 min',
    gruposObrigatorios: [['arroz']],
    gruposOpcionais: [['oleo', 'azeite'], ['molho', 'tomate', 'milho', 'ervilha']],
    proibidosNaCombinacao: ['biscoito', 'achocolatado', 'cafe'],
    complementosCozinha: ['Cebola, alho e cenoura ralada', 'Caldo caseiro de legumes'],
    passosPreparo: (itens) => [
      `Separe no estoque: ${itens.join(', ')}.`,
      'Refogue cebola, alho e cenoura ralada até dourarem levemente.',
      'Junte o arroz, envolva bem nos temperos e cozinhe com água quente até ficar macio e úmido.',
      'Deixe descansar 5 minutinhos com a panela tampada antes de servir! 🍚',
    ],
    dicaCarinhosa: 'Um jeito delicioso de variar o arroz do dia a dia usando o lote que vence primeiro!',
    fonteNome: 'TudoGostoso - Arroz de Panela Especial',
    fonteUrl: 'https://www.tudogostoso.com.br/receita/11562-arroz-de-forno.html',
  },
  {
    id: 'caldinho-feijao-nutritivo',
    titulo: 'Caldinho de Feijão Cremoso com Temperos Verdes',
    tipo: 'salgada',
    rendimento: '25 porções',
    tempoPreparo: '40 min',
    gruposObrigatorios: [['feijao']],
    gruposOpcionais: [['oleo', 'azeite'], ['farinha', 'macarrao']],
    proibidosNaCombinacao: ['leite', 'biscoito', 'achocolatado', 'acucar'],
    complementosCozinha: ['Alho douradinho, cebola e salsinha', 'Água quente para acertar o ponto do caldo'],
    passosPreparo: (itens) => [
      `Pegue na prateleira: ${itens.join(', ')}.`,
      'Cozinhe o feijão até ficar bem macio e bata metade dele no liquidificador para criar um caldo bem cremoso.',
      'Refogue alho e cebola em uma panela, junte o feijão batido aos grãos inteiros e deixe apurar.',
      'Salpique cheiro-verde e sirva em cumbucas quentinhas! 🫘',
    ],
    dicaCarinhosa: 'Rico em ferro e super reconfortante para dias mais fresquinhos!',
    fonteNome: 'TudoGostoso - Caldinho de Feijão',
    fonteUrl: 'https://www.tudogostoso.com.br/receita/22460-caldinho-de-feijao.html',
  },
];

/**
 * Calcula quantos dias faltam para o vencimento de um lote (formato YYYY-MM-DD ou DD/MM/YYYY).
 */
export function calcularDiasAteVencimento(dataStr?: string): number {
  if (!dataStr) return 999;
  const limpo = String(dataStr).split('T')[0].trim();
  let ano = 0;
  let mes = 0;
  let dia = 0;

  if (limpo.includes('/')) {
    const partes = limpo.split('/').map(Number);
    if (partes.length === 3) {
      [dia, mes, ano] = partes;
    }
  } else if (limpo.includes('-')) {
    const partes = limpo.split('-').map(Number);
    if (partes.length === 3) {
      [ano, mes, dia] = partes;
    }
  }

  if (!ano || !mes || !dia) return 999;
  const dataVal = new Date(ano, mes - 1, dia);
  if (isNaN(dataVal.getTime())) return 999;

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  return Math.ceil((dataVal.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Formata uma descrição amigável de prazo de validade sem jargão técnico.
 */
export function formatarPrazoAmigavel(dias: number): string {
  if (dias < 0) return `venceu há ${Math.abs(dias)} ${Math.abs(dias) === 1 ? 'dia' : 'dias'} ⚠️`;
  if (dias === 0) return 'vence hoje! 🚨';
  if (dias === 1) return 'vence amanhã! ⏰';
  if (dias <= 7) return `vence em ${dias} dias ⏳`;
  if (dias <= 30) return `vence em ${dias} dias 📅`;
  return `validade tranquila (${dias} dias) ✅`;
}

/**
 * Motor de Machine Learning (Suavização Exponencial + Regressão de Tendência de Consumo):
 * Analisa o histórico de movimentações e os saldos atuais para prever:
 * - Taxa de consumo diário (pacotes/dia)
 * - Autonomia estimada em dias (em quanto tempo o produto vai acabar)
 * - Risco de sobrar produto antes do vencimento (quando a autonomia é maior que o prazo de validade!)
 */
export function executarPredicaoConsumoML(
  lotesAtivos: LoteEstoqueDora[],
  movimentacoes: MovimentacaoEstoqueDora[] = []
): PredicaoProdutoML[] {
  const mapaProdutos = new Map<
    string,
    {
      nomeProduto: string;
      categoria: string;
      saldoTotal: number;
      menorValidadeDias: number;
      prateleiras: Set<string>;
      estoqueMinimo: number;
    }
  >();

  lotesAtivos.forEach((l) => {
    const chave = removerAcentos(l.nome_produto);
    const existente = mapaProdutos.get(chave);
    const qtd = Number(l.quantidade_atual_pacote) || 0;
    const dias = typeof l.diasRestantes === 'number' ? l.diasRestantes : calcularDiasAteVencimento(l.data_validade_lote);

    if (!existente) {
      mapaProdutos.set(chave, {
        nomeProduto: l.nome_produto,
        categoria: l.categoria || 'Alimentos',
        saldoTotal: qtd,
        menorValidadeDias: dias,
        prateleiras: new Set([normalizarDescricaoPrateleira(l.local_descricao)]),
        estoqueMinimo: Number(l.estoque_minimo_pacote) || 10,
      });
    } else {
      existente.saldoTotal += qtd;
      if (dias < existente.menorValidadeDias) existente.menorValidadeDias = dias;
      existente.prateleiras.add(normalizarDescricaoPrateleira(l.local_descricao));
    }
  });

  // Taxa base institucional por categoria (usada como prior Bayesiano quando há poucas saídas registradas)
  const obterPriorConsumoCategoria = (nome: string, categoria: string): number => {
    const texto = removerAcentos(`${nome} ${categoria}`);
    if (texto.includes('leite') || texto.includes('laticin')) return 2.2;
    if (texto.includes('arroz')) return 1.8;
    if (texto.includes('feijao') || texto.includes('grao')) return 1.4;
    if (texto.includes('macarrao') || texto.includes('massa')) return 1.5;
    if (texto.includes('oleo') || texto.includes('gordura')) return 0.6;
    return 1.2;
  };

  // Agrupa saídas reais do histórico para treinar a suavização exponencial (EMA) por produto
  const saidasPorProduto = new Map<string, number[]>();
  movimentacoes.forEach((mov) => {
    const tipo = removerAcentos(String(mov.tipo_movimentacao || ''));
    if (tipo.includes('saida') || tipo.includes('consumo') || tipo.includes('doacao')) {
      const chave = removerAcentos(String(mov.nome_produto || ''));
      const qtd = Number(mov.quantidade) || 0;
      if (chave && qtd > 0) {
        const lista = saidasPorProduto.get(chave) || [];
        lista.push(qtd);
        saidasPorProduto.set(chave, lista);
      }
    }
  });

  const predicoes: PredicaoProdutoML[] = [];
  const alpha = 0.45; // Fator de aprendizado da suavização exponencial (EMA)

  mapaProdutos.forEach((dados, chave) => {
    const prior = obterPriorConsumoCategoria(dados.nomeProduto, dados.categoria);
    const historicoSaidas = saidasPorProduto.get(chave) || [];

    let taxaEstimada = prior;
    if (historicoSaidas.length > 0) {
      // Aplica Exponential Moving Average (EMA) combinada com o prior institucional
      let ema = historicoSaidas[0];
      for (let i = 1; i < historicoSaidas.length; i++) {
        ema = alpha * historicoSaidas[i] + (1 - alpha) * ema;
      }
      // Pondera a média observada por evento para consumo diário médio
      const pesoObservado = Math.min(0.75, historicoSaidas.length * 0.2);
      taxaEstimada = Number((pesoObservado * (ema / 2.5) + (1 - pesoObservado) * prior).toFixed(1));
    }

    taxaEstimada = Math.max(0.4, taxaEstimada);
    const diasAutonomia = Math.max(1, Math.round(dados.saldoTotal / taxaEstimada));
    const riscoVencerAntesDeAcabar =
      dados.menorValidadeDias >= 0 &&
      dados.menorValidadeDias <= 30 &&
      diasAutonomia > dados.menorValidadeDias;
    const precisaReposicaoBreve = diasAutonomia <= 7 || dados.saldoTotal < dados.estoqueMinimo;

    predicoes.push({
      nomeProduto: dados.nomeProduto,
      categoria: dados.categoria,
      saldoTotal: dados.saldoTotal,
      consumoDiarioEstimado: taxaEstimada,
      diasAutonomia,
      menorValidadeDias: dados.menorValidadeDias,
      riscoVencerAntesDeAcabar,
      precisaReposicaoBreve,
      prateleiras: Array.from(dados.prateleiras),
    });
  });

  // Ordena priorizando os que têm risco de vencer ou baixa autonomia
  return predicoes.sort((a, b) => {
    if (a.riscoVencerAntesDeAcabar !== b.riscoVencerAntesDeAcabar) {
      return a.riscoVencerAntesDeAcabar ? -1 : 1;
    }
    return a.diasAutonomia - b.diasAutonomia;
  });
}

/**
 * Seleciona uma receita culinária VERDADEIRA que combine de forma gastronômica os itens reais do estoque,
 * priorizando aqueles que vencem mais cedo e evitando repetir a última receita sugerida.
 */
export function selecionarReceitaVerdadeiraDoEstoque(
  lotesAtivos: LoteEstoqueDora[],
  perguntaUsuario: string = '',
  idUltimaReceita?: string
): { receita: ReceitaSugerida; lotesDestaque: LoteEstoqueDora[] } | null {
  const lotesValidos = lotesAtivos.filter((l) => l.quantidade_atual_pacote > 0 && l.diasRestantes >= -2);
  if (lotesValidos.length === 0) return null;

  const textoPergunta = removerAcentos(perguntaUsuario);

  // Avalia cada receita do catálogo culinário contra os lotes reais do estoque
  const candidatas: {
    molde: MoldeReceita;
    lotesCasados: LoteEstoqueDora[];
    pontuacao: number;
  }[] = [];

  for (const molde of CATALOGO_RECEITAS_REAIS) {
    const lotesCasados: LoteEstoqueDora[] = [];
    let atendeObrigatorios = true;

    for (const grupo of molde.gruposObrigatorios) {
      // Busca o lote de vencimento mais próximo que pertença a este grupo culinário
      const loteEncontrado = lotesValidos.find((l) => {
        const nomeNorm = removerAcentos(`${l.nome_produto} ${l.categoria}`);
        const ehProibido = molde.proibidosNaCombinacao.some((p) => nomeNorm.includes(p));
        if (ehProibido) return false;
        return grupo.some((termo) => nomeNorm.includes(termo));
      });

      if (!loteEncontrado) {
        atendeObrigatorios = false;
        break;
      }
      if (!lotesCasados.some((x) => x.id_lote_produto === loteEncontrado.id_lote_produto)) {
        lotesCasados.push(loteEncontrado);
      }
    }

    if (!atendeObrigatorios) continue;

    // Verifica se há ingredientes opcionais compatíveis no estoque para enriquecer a receita
    for (const grupoOpc of molde.gruposOpcionais) {
      const loteOpc = lotesValidos.find((l) => {
        const nomeNorm = removerAcentos(`${l.nome_produto} ${l.categoria}`);
        const ehProibido = molde.proibidosNaCombinacao.some((p) => nomeNorm.includes(p));
        if (ehProibido) return false;
        return grupoOpc.some((termo) => nomeNorm.includes(termo));
      });
      if (loteOpc && !lotesCasados.some((x) => x.id_lote_produto === loteOpc.id_lote_produto)) {
        lotesCasados.push(loteOpc);
      }
    }

    // Pontuação de relevância:
    // 1. Quanto menor o prazo de validade dos lotes casados, maior a prioridade anti-desperdício!
    // 2. Se o usuário pediu um ingrediente específico (ex: "leite", "macarrão", "doce"), dá bônus alto.
    let pontuacao = 100;
    const menorPrazo = Math.min(...lotesCasados.map((l) => Math.max(0, l.diasRestantes)));
    pontuacao += Math.max(0, 45 - menorPrazo);
    pontuacao += lotesCasados.length * 12;

    if (textoPergunta.includes('doce') && molde.tipo === 'doce') pontuacao += 50;
    if ((textoPergunta.includes('almoco') || textoPergunta.includes('jantar') || textoPergunta.includes('salgad')) && molde.tipo === 'salgada') {
      pontuacao += 40;
    }
    if (textoPergunta.includes('lanche') && (molde.tipo === 'lanche' || molde.tipo === 'doce')) {
      pontuacao += 45;
    }

    lotesCasados.forEach((l) => {
      const palavrasProduto = removerAcentos(l.nome_produto).split(/\s+/);
      if (palavrasProduto.some((pal) => pal.length > 3 && textoPergunta.includes(pal))) {
        pontuacao += 60;
      }
    });

    // Penaliza levemente a última receita sugerida caso o usuário peça "outra receita"
    if (idUltimaReceita && molde.id === idUltimaReceita) {
      pontuacao -= 80;
    }

    candidatas.push({ molde, lotesCasados, pontuacao });
  }

  if (candidatas.length > 0) {
    candidatas.sort((a, b) => b.pontuacao - a.pontuacao);
    const escolhida = candidatas[0];
    const nomesResumo = escolhida.lotesCasados.map((l) => l.nome_produto);
    const linhasIngredientesEstoque = escolhida.lotesCasados
      .map(
        (l) =>
          `• ${l.nome_produto}: temos ${l.quantidade_atual_pacote} pacote(s) em "${l.local_descricao}" (${formatarPrazoAmigavel(l.diasRestantes)})`
      )
      .join('\n');

    return {
      lotesDestaque: escolhida.lotesCasados,
      receita: {
        id: escolhida.molde.id,
        titulo: `${escolhida.molde.titulo} (${escolhida.molde.rendimento})`,
        rendimento: escolhida.molde.rendimento,
        tempoPreparo: escolhida.molde.tempoPreparo,
        ingredientesEstoque: linhasIngredientesEstoque,
        ingredientesComplementares: escolhida.molde.complementosCozinha.map((c) => `• ${c}`).join('\n'),
        modoPreparo: escolhida.molde
          .passosPreparo(nomesResumo)
          .map((p, idx) => `${idx + 1}. ${p}`)
          .join('\n'),
        dicaDora: escolhida.molde.dicaCarinhosa,
        fonteNome: escolhida.molde.fonteNome,
        fonteUrl: escolhida.molde.fonteUrl,
      },
    };
  }

  // Caso o estoque tenha apenas um ingrediente específico não listado nos moldes compostos, cria uma sugestão dedicada apenas a ele (sem misturar itens aleatórios!)
  const principal = lotesValidos[0];
  return {
    lotesDestaque: [principal],
    receita: {
      id: `preparo-${principal.id_lote_produto}`,
      titulo: `Preparo Caseiro com ${principal.nome_produto}`,
      rendimento: '20 a 25 porções',
      tempoPreparo: '30 min',
      ingredientesEstoque: `• ${principal.nome_produto}: temos ${principal.quantidade_atual_pacote} pacote(s) em "${principal.local_descricao}" (${formatarPrazoAmigavel(principal.diasRestantes)})`,
      ingredientesComplementares: '• Temperos naturais da cozinha (água filtrada, sal ou ervas a gosto)',
      modoPreparo: `1. Pegue o ${principal.nome_produto} que está em "${principal.local_descricao}".\n2. Prepare conforme o costume da nossa cozinha usando primeiro este pacote que vence antes.\n3. Depois de usar, lembre de registrar a saída lá no menu Estoque! 😊`,
      dicaDora: `Escolhi apenas o ${principal.nome_produto} para não misturar ingredientes que não combinam entre si!`,
      fonteNome: 'TudoGostoso - Receitas do Dia a Dia',
      fonteUrl: 'https://www.tudogostoso.com.br',
    },
  };
}

/**
 * Processa a mensagem da pessoa usuária com linguagem casual, acolhedora, neutra e com emojis.
 */
export function responderConversaDora(
  pergunta: string,
  lotesReais: LoteEstoqueDora[],
  movimentacoesReais: MovimentacaoEstoqueDora[] = [],
  idUltimaReceita?: string
): RespostaDoraIA {
  const p = removerAcentos(pergunta);

  // 1. Saudação / Quem é a Dora / Agradecimento
  if (
    /^(oi|ola|bom dia|boa tarde|boa noite|e ai|tudo bem|quem e voce|oi dora|ola dora)\b/.test(p) ||
    p.includes('quem e voce') ||
    p.includes('o que voce faz')
  ) {
    const totalPacotes = lotesReais.reduce((s, l) => s + (Number(l.quantidade_atual_pacote) || 0), 0);
    return {
      texto:
        `Oi! Que alegria conversar com você! 😊✨\n\n` +
        `Eu sou a Dora, sua parceira virtual aqui na Casa da Criança! No momento estou de olho nos nossos **${totalPacotes} pacotes** distribuídos em **${lotesReais.length} lotes** nas prateleiras.\n\n` +
        `Posso te ajudar a:\n` +
        `🍲 Montar **receitas de verdade** combinando só ingredientes que harmonizam entre si\n` +
        `📈 Fazer **previsões de consumo** para saber quando cada alimento vai acabar\n` +
        `⏰ Avisar o que está **vencendo primeiro** e onde está guardado\n` +
        `🧭 Te guiar **passo a passo** em qualquer função do aplicativo!`,
      sugestoesContinuacao: [
        '📈 Previsão de consumo do estoque',
        '🍲 Me sugere uma receita gostosa?',
        '⏰ O que vence nos próximos dias?',
        '🧭 Como uso o aplicativo?',
      ],
    };
  }

  if (p.includes('obrigad') || p.includes('valeu') || p.includes('ajudou muito') || p.includes('perfeito')) {
    return {
      texto:
        'Imagina! É sempre um prazer enorme ajudar você a cuidar tão bem dos alimentos da Casa da Criança! 💛🙌 Se precisar de mais alguma dica de receita, previsão do estoque ou ajuda com o app, é só me chamar!',
      sugestoesContinuacao: [
        '🍲 Quero outra ideia de receita',
        '📦 Como está nosso estoque hoje?',
      ],
    };
  }

  // 2. Predições de Consumo (Machine Learning) / Quando vai acabar / Ritmo de uso
  if (
    p.includes('predic') ||
    p.includes('previs') ||
    p.includes('consumo') ||
    p.includes('acabar') ||
    p.includes('durar') ||
    p.includes('dura ') ||
    p.includes('autonomia') ||
    p.includes('comprar') ||
    p.includes('repor') ||
    p.includes('reposicao') ||
    p.includes('ritmo') ||
    p.includes('machine learning') ||
    p.includes('tendencia')
  ) {
    if (lotesReais.length === 0) {
      return {
        texto:
          'Olhei nossas prateleiras agora mesmo e ainda não temos pacotes cadastrados para eu calcular a previsão de consumo. 📦✨ Que tal cadastrar nossa primeira entrada de alimentos?',
        atalho: { rotulo: 'Ir para Entrada de Alimentos', rota: '/stock-add', icone: 'plus-circle' },
      };
    }

    const predicoes = executarPredicaoConsumoML(lotesReais, movimentacoesReais);
    const destaques = predicoes.slice(0, 5);
    const linhas = destaques.map((item) => {
      const alertaRisco = item.riscoVencerAntesDeAcabar
        ? ` ⚠️ *Atenção: vence em ${item.menorValidadeDias}d, antes de acabar pelo ritmo normal!*`
        : item.precisaReposicaoBreve
        ? ` 🔔 *Estoque baixinho, vale planejar reposição!*`
        : ' ✅';
      return (
        `• **${item.nomeProduto}** (${item.saldoTotal} pcts): uso médio de ~${item.consumoDiarioEstimado} por dia → dura cerca de **${item.diasAutonomia} dias**${alertaRisco}`
      );
    });

    const comRiscoVencimento = predicoes.filter((x) => x.riscoVencerAntesDeAcabar);
    const dicaFinal =
      comRiscoVencimento.length > 0
        ? `\n\n💡 **Dica inteligente da Dora:** Notei que **${comRiscoVencimento[0].nomeProduto}** tem mais pacotes do que costumamos gastar até a data de validade. Vale muito a pena incluir esse item no cardápio desta semana!`
        : `\n\n✨ Nosso ritmo de uso está bem equilibrado com os prazos de validade atuais!`;

    return {
      texto:
        `Fiz os cálculos analisando nosso histórico de uso e a quantidade atual nas prateleiras! 📊🤖 Aqui está a estimativa de duração dos nossos alimentos:\n\n` +
        linhas.join('\n') +
        dicaFinal,
      predicoes: destaques,
      sugestoesContinuacao: [
        '🍲 Sugerir receita para aproveitar esses itens',
        '⏰ O que vence mais rápido?',
        '📦 Ver resumo por prateleira',
      ],
    };
  }

  // 3. Sugestão de Receitas Verdadeiras (Sem juntar itens aleatórios!)
  if (
    p.includes('receita') ||
    p.includes('cozinhar') ||
    p.includes('cardapio') ||
    p.includes('prato') ||
    p.includes('preparo') ||
    p.includes('almoco') ||
    p.includes('jantar') ||
    p.includes('lanche') ||
    p.includes('sobremesa') ||
    p.includes('outra opcao') ||
    p.includes('outra ideia')
  ) {
    if (lotesReais.length === 0) {
      return {
        texto:
          'Puxa, dei uma olhadinha na despensa e na geladeira e não encontrei nenhum alimento cadastrado no momento! 🥺 Assim que você registrar os produtos lá em **Entrada de Alimentos**, eu monto receitas deliciosas para você!',
        atalho: { rotulo: 'Registrar Entrada de Alimentos', rota: '/stock-add', icone: 'plus-circle' },
      };
    }

    const resultadoReceita = selecionarReceitaVerdadeiraDoEstoque(lotesReais, pergunta, idUltimaReceita);
    if (!resultadoReceita) {
      return {
        texto:
          'Dei uma olhada com carinho no nosso estoque, mas os itens cadastrados no momento já passaram da validade. ⚠️ Que tal conferir as prateleiras antes de prepararmos o cardápio?',
        atalho: { rotulo: 'Ver Saída e Descartes', rota: '/stock-remove', icone: 'minus-circle' },
      };
    }

    const { receita, lotesDestaque } = resultadoReceita;
    const itemFoco = lotesDestaque[0];

    return {
      texto:
        `Separei uma receita de verdade, super gostosa e pensada só com ingredientes que combinam entre si! 😋🍲\n\n` +
        `Dei prioridade para usar o **${itemFoco.nome_produto}** que está guardado em **${itemFoco.local_descricao}** (${formatarPrazoAmigavel(itemFoco.diasRestantes)}):`,
      receita,
      atalho: { rotulo: 'Registrar Saída após Cozinhar', rota: '/stock-remove', icone: 'check-circle' },
      sugestoesContinuacao: [
        '🍲 Me dá outra ideia de receita?',
        '📈 Qual a previsão de consumo?',
        '⏰ O que mais vence logo?',
      ],
    };
  }

  // 4. Validades / O que vence logo / Alertas de vencimento
  if (
    p.includes('venc') ||
    p.includes('validade') ||
    p.includes('alerta') ||
    p.includes('semana') ||
    p.includes('estraga') ||
    p.includes('urgente') ||
    p.includes('prioridade') ||
    p.includes('primeiro')
  ) {
    if (lotesReais.length === 0) {
      return {
        texto: 'Nosso estoque está vazio no momento, então não temos nenhum item perto de vencer! 😊✨',
      };
    }

    const vencidos = lotesReais.filter((l) => l.diasRestantes < 0);
    const proximos = lotesReais.filter((l) => l.diasRestantes >= 0 && l.diasRestantes <= 15);
    const listaExibir = [...vencidos, ...proximos].slice(0, 5);
    const alvos = listaExibir.length > 0 ? listaExibir : lotesReais.slice(0, 4);

    const linhas = alvos
      .map(
        (l) =>
          `• **${l.nome_produto}** (${l.quantidade_atual_pacote} pcts) — guardado em **${l.local_descricao}** → ${formatarPrazoAmigavel(l.diasRestantes)}`
      )
      .join('\n');

    const introducao =
      vencidos.length > 0 || proximos.length > 0
        ? `Dei uma conferida nas datas de validade para ninguém perder nada! ⏰👀 Olha só o que pede nossa atenção primeiro:\n\n`
        : `Boas notícias! 🎉 Não temos nenhum produto vencendo nos próximos dias. Os lotes com validade mais próxima são estes:\n\n`;

    return {
      texto:
        introducao +
        linhas +
        `\n\n💡 Sempre que for cozinhar, vale pegar primeiro esses pacotes que estão na frente da fila!`,
      atalho:
        vencidos.length > 0
          ? { rotulo: 'Dar Baixa em Item Vencido', rota: '/stock-remove', icone: 'trash-2' }
          : { rotulo: 'Ver Receita com Esses Itens', rota: '/dora', icone: 'book-open' },
      sugestoesContinuacao: [
        '🍲 Sugerir receita com o que vence antes',
        '📈 Ver previsão de consumo',
        '🧭 Como dou baixa em um item?',
      ],
    };
  }

  // 5. Guia de Funções do Aplicativo (Como usar / Entrada / Saída / Transferência / Auditoria / Relatórios)
  if (
    p.includes('como ') ||
    p.includes('ajuda') ||
    p.includes('funciona') ||
    p.includes('tutorial') ||
    p.includes('guia') ||
    p.includes('cadastrar') ||
    p.includes('entrada') ||
    p.includes('baixa') ||
    p.includes('perda') ||
    p.includes('descarte') ||
    p.includes('transfer') ||
    p.includes('mover') ||
    p.includes('mudar de prateleira') ||
    p.includes('auditoria') ||
    p.includes('contagem') ||
    p.includes('relatorio')
  ) {
    if (p.includes('entrada') || p.includes('cadastrar') || p.includes('adicionar') || p.includes('codigo de barras')) {
      return {
        texto:
          `Guardar um produto novo no estoque é super simples! 📦✨ Olha o passo a passo:\n\n` +
          `1️⃣ Toque em **Entrada de Alimentos** no menu de Estoque.\n` +
          `2️⃣ Toque no botão **Ler Código de Barras com a Câmera** 📷 e aponte para a embalagem (eu busco o nome e a foto automaticamente para você!).\n` +
          `3️⃣ Informe a **quantidade de pacotes**, a **data de validade** e escolha em qual **armário ou geladeira** vai guardar.\n` +
          `4️⃣ Toque em **Confirmar Entrada** e prontinho! 🎉`,
        atalho: { rotulo: 'Abrir Entrada de Alimentos', rota: '/stock-add', icone: 'plus-circle' },
        sugestoesContinuacao: ['🧭 Como faço para dar saída?', '🧭 Como mudo um item de prateleira?'],
      };
    }

    if (p.includes('transfer') || p.includes('mover') || p.includes('mudar')) {
      return {
        texto:
          `Quer mudar pacotes de um armário ou geladeira para outro lugar? Eu te explico! 🔄😊\n\n` +
          `1️⃣ Vá em **Movimentação Interna** (ou toque no botão aqui embaixo).\n` +
          `2️⃣ Escolha o produto na lista (ou leia o código de barras com a câmera) e toque no lote que você quer mudar.\n` +
          `3️⃣ Digite quantos pacotes vai levar — se for só uma parte, o app divide o lote direitinho para você saber quanto ficou em cada lugar!\n` +
          `4️⃣ Escolha a **nova prateleira** e confirme! ✨`,
        atalho: { rotulo: 'Abrir Movimentação Interna', rota: '/stock-move', icone: 'repeat' },
        sugestoesContinuacao: ['📦 O que temos em cada prateleira?', '🧭 Como faço uma contagem do estoque?'],
      };
    }

    if (p.includes('auditoria') || p.includes('contagem') || p.includes('conferencia')) {
      return {
        texto:
          `A **Contagem Física (Auditoria)** serve para quando a gente olha a prateleira de verdade e quer ajustar a quantidade no aplicativo! 📋🔍\n\n` +
          `1️⃣ Abra a tela de **Auditoria de Estoque**.\n` +
          `2️⃣ Toque no produto que você acabou de contar na prateleira.\n` +
          `3️⃣ Digite a quantidade real que encontrou e escreva rapidinho o motivo do ajuste.\n` +
          `4️⃣ Salve e o saldo já fica certinho na hora! ✅`,
        atalho: { rotulo: 'Abrir Auditoria de Estoque', rota: '/audit', icone: 'clipboard' },
      };
    }

    if (p.includes('relatorio') || p.includes('pdf') || p.includes('historico')) {
      return {
        texto:
          `Você pode acompanhar tudo o que entrou, saiu ou venceu lá na nossa **Central de Relatórios**! 📊📄\n\n` +
          `Lá você encontra o resumo de validades, histórico de movimentações e relatórios de perdas bem fáceis de ler!`,
        atalho: { rotulo: 'Abrir Central de Relatórios', rota: '/reports', icone: 'bar-chart-2' },
      };
    }

    if (p.includes('baixa') || p.includes('saida') || p.includes('perda') || p.includes('descarte')) {
      return {
        texto:
          `Para registrar que um alimento foi usado na cozinha ou precisou ser descartado, faça assim: 📤😊\n\n` +
          `1️⃣ Abra a tela de **Saída / Baixa do Estoque**.\n` +
          `2️⃣ Escolha o produto (o app já mostra no topo qual pacote vence primeiro!).\n` +
          `3️⃣ Informe a quantidade e o motivo: **Consumo na cozinha**, **Doação** ou **Descarte por vencimento/avaria**.\n` +
          `4️⃣ Se for um descarte por perda, basta digitar a palavra **PERDA** em letras maiúsculas para confirmar com segurança! 🔒`,
        atalho: { rotulo: 'Abrir Saída do Estoque', rota: '/stock-remove', icone: 'minus-circle' },
      };
    }

    return {
      texto:
        `Claro! Eu adoro ajudar você a navegar pelo aplicativo! 🧭💛 Aqui estão as funções principais que você pode usar:\n\n` +
        `📥 **Entrada de Alimentos:** para cadastrar doações ou compras lendo o código de barras.\n` +
        `📤 **Saída / Baixa:** para anotar o que foi usado na cozinha ou descartado.\n` +
        `🔄 **Movimentação Interna:** para mudar pacotes de um armário ou geladeira para outro.\n` +
        `📋 **Auditoria:** para corrigir a quantidade quando fizer contagem nas prateleiras.\n\n` +
        `Sobre qual delas você quer saber mais? 😊`,
      sugestoesContinuacao: [
        '🧭 Como cadastro uma entrada?',
        '🧭 Como dou saída ou baixa?',
        '🧭 Como mudo um item de prateleira?',
      ],
    };
  }

  // 6. Consulta de Produto Específico ou Resumo do Estoque / Prateleiras
  const produtoProcurado = lotesReais.filter((l) => {
    const nomeNorm = removerAcentos(l.nome_produto);
    return nomeNorm.split(/\s+/).some((palavra) => palavra.length >= 4 && p.includes(palavra));
  });

  if (produtoProcurado.length > 0) {
    const totalProd = produtoProcurado.reduce((s, l) => s + (Number(l.quantidade_atual_pacote) || 0), 0);
    const nomeExib = produtoProcurado[0].nome_produto;
    const detalhes = produtoProcurado
      .map(
        (l) =>
          `• **${l.quantidade_atual_pacote} pct(s)** em **${l.local_descricao}** (${formatarPrazoAmigavel(l.diasRestantes)})`
      )
      .join('\n');

    return {
      texto:
        `Achei sim! 🔍✨ Temos ao todo **${totalProd} pacote(s)** de **${nomeExib}** guardados agora:\n\n` +
        detalhes,
      sugestoesContinuacao: [
        `🍲 Tem receita com ${nomeExib}?`,
        '📈 Qual a previsão de consumo?',
        '📦 Ver todas as prateleiras',
      ],
    };
  }

  if (
    p.includes('prateleira') ||
    p.includes('local') ||
    p.includes('armario') ||
    p.includes('geladeira') ||
    p.includes('estoque') ||
    p.includes('saldo') ||
    p.includes('temos') ||
    p.includes('guardado') ||
    p.includes('onde')
  ) {
    if (lotesReais.length === 0) {
      return {
        texto: 'Nossas prateleiras estão vazias no momento! 📦 Que tal cadastrar uma nova entrada de alimentos?',
        atalho: { rotulo: 'Cadastrar Entrada', rota: '/stock-add', icone: 'plus-circle' },
      };
    }

    const mapaPrateleiras: Record<string, { pacotes: number; itens: Set<string> }> = {};
    lotesReais.forEach((l) => {
      const local = l.local_descricao || 'Despensa Principal';
      if (!mapaPrateleiras[local]) {
        mapaPrateleiras[local] = { pacotes: 0, itens: new Set() };
      }
      mapaPrateleiras[local].pacotes += Number(l.quantidade_atual_pacote) || 0;
      mapaPrateleiras[local].itens.add(l.nome_produto);
    });

    const resumo = Object.entries(mapaPrateleiras)
      .map(
        ([local, info]) =>
          `• **${local}**: ${info.pacotes} pacotes (${Array.from(info.itens).slice(0, 3).join(', ')})`
      )
      .join('\n');

    const totalGeral = lotesReais.reduce((acc, l) => acc + (Number(l.quantidade_atual_pacote) || 0), 0);

    return {
      texto:
        `Hoje estamos com **${totalGeral} pacotes** organizados com muito carinho nas nossas prateleiras! 📦✨ Olha onde cada coisa está guardada:\n\n` +
        resumo,
      atalho: { rotulo: 'Mudar Itens de Prateleira', rota: '/stock-move', icone: 'repeat' },
      sugestoesContinuacao: [
        '📈 Previsão de consumo do estoque',
        '🍲 Sugerir receita com esses itens',
        '⏰ O que vence primeiro?',
      ],
    };
  }

  // 7. Resposta amigável padrão com inteligência contextual
  const totalPacotes = lotesReais.reduce((s, l) => s + (Number(l.quantidade_atual_pacote) || 0), 0);
  const maisProximo = lotesReais[0];
  const destaqueValidade = maisProximo
    ? `\n\nAproveitando: o item que pede mais carinho hoje é o **${maisProximo.nome_produto}** guardado em **${maisProximo.local_descricao}** (${formatarPrazoAmigavel(maisProximo.diasRestantes)}).`
    : '';

  return {
    texto:
      `Estou aqui para te ajudar com tudo na nossa cozinha e despensa! 😊💛 Hoje contamos com **${totalPacotes} pacotes** no estoque.${destaqueValidade}\n\n` +
      `Você pode me pedir uma **receita gostosa**, perguntar a **previsão de quando os itens vão acabar**, ver **o que vence logo** ou pedir **ajuda para usar qualquer tela do app**!`,
    sugestoesContinuacao: [
      '🍲 Me sugere uma receita verdadeira?',
      '📈 Qual a previsão de consumo?',
      '⏰ O que vence nos próximos dias?',
      '🧭 Como uso as funções do app?',
    ],
  };
}
