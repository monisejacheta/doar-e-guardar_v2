import {
  calcularDiasAteVencimento,
  formatarPrazoAmigavel,
  executarPredicaoConsumoML,
  selecionarReceitaVerdadeiraDoEstoque,
  responderConversaDora,
  LoteEstoqueDora,
} from '../../services/doraService';

describe('Serviço da Assistente Virtual Dora (doraService.ts)', () => {
  const lotesExemplo: LoteEstoqueDora[] = [
    {
      id_lote_produto: 'lote_arroz',
      nome_produto: 'Arroz Tipo 1',
      categoria: 'Grãos e Cereais',
      numero_codigo_lote: 'L-01',
      quantidade_atual_pacote: 20,
      data_validade_lote: '2026-12-30',
      local_descricao: 'Armário A - Prateleira 1',
      diasRestantes: 5,
    },
    {
      id_lote_produto: 'lote_feijao',
      nome_produto: 'Feijão Carioca',
      categoria: 'Grãos e Cereais',
      numero_codigo_lote: 'L-02',
      quantidade_atual_pacote: 15,
      data_validade_lote: '2026-12-25',
      local_descricao: 'Armário A - Prateleira 2',
      diasRestantes: 10,
    },
    {
      id_lote_produto: 'lote_leite',
      nome_produto: 'Leite Integral',
      categoria: 'Laticínios',
      numero_codigo_lote: 'L-03',
      quantidade_atual_pacote: 12,
      data_validade_lote: '2026-12-15',
      local_descricao: 'Geladeira 1 - Prateleira Central',
      diasRestantes: 3,
    },
  ];

  it('deve calcular dias até o vencimento e formatar prazos amigáveis', () => {
    expect(calcularDiasAteVencimento('')).toBe(999);
    expect(formatarPrazoAmigavel(-2)).toContain('venceu há 2 dias');
    expect(formatarPrazoAmigavel(0)).toContain('vence hoje');
    expect(formatarPrazoAmigavel(1)).toContain('vence amanhã');
    expect(formatarPrazoAmigavel(5)).toContain('vence em 5 dias');
    expect(formatarPrazoAmigavel(45)).toContain('validade tranquila');
  });

  it('deve executar predição de consumo ML sobre os lotes e histórico de saídas', () => {
    const predicoes = executarPredicaoConsumoML(lotesExemplo, [
      { nome_produto: 'Arroz Tipo 1', tipo_movimentacao: 'SAIDA_CONSUMO', quantidade: 4 },
      { nome_produto: 'Arroz Tipo 1', tipo_movimentacao: 'SAIDA_DOACAO', quantidade: 6 },
    ]);

    expect(predicoes.length).toBe(3);
    expect(predicoes[0]).toHaveProperty('diasAutonomia');
    expect(predicoes[0]).toHaveProperty('consumoDiarioEstimado');
  });

  it('deve selecionar uma receita culinária compatível com os itens do estoque', () => {
    const resultado = selecionarReceitaVerdadeiraDoEstoque(lotesExemplo, 'receita doce com leite');
    expect(resultado).not.toBeNull();
    expect(resultado?.receita.titulo).toContain('Arroz Doce');
  });

  it('deve responder saudações, previsões, receitas, validades e dúvidas de uso do app', () => {
    const saudacao = responderConversaDora('Oi Dora, tudo bem?', lotesExemplo);
    expect(saudacao.texto).toContain('Eu sou a Dora');

    const previsao = responderConversaDora('Qual a previsão de consumo do estoque?', lotesExemplo);
    expect(previsao.predicoes?.length).toBeGreaterThan(0);

    const receita = responderConversaDora('Me sugere uma receita para o almoço?', lotesExemplo);
    expect(receita.receita).toBeDefined();

    const validade = responderConversaDora('O que está vencendo primeiro?', lotesExemplo);
    expect(validade.texto).toContain('Arroz Tipo 1');

    const ajudaEntrada = responderConversaDora('Como faço para cadastrar uma entrada?', lotesExemplo);
    expect(ajudaEntrada.atalho?.rota).toBe('/stock-add');
  });
});
