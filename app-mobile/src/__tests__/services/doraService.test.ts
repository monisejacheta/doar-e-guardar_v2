import {
  calcularDiasAteVencimento,
  executarPredicaoConsumoML,
  formatarPrazoAmigavel,
  LoteEstoqueDora,
  responderConversaDora,
  selecionarReceitaVerdadeiraDoEstoque,
} from '../../services/doraService';

const lotesFixture: LoteEstoqueDora[] = [
  {
    id_lote_produto: 'l1',
    nome_produto: 'Leite Integral UHT',
    categoria: 'Laticínios',
    numero_codigo_lote: 'LT-01',
    quantidade_atual_pacote: 12,
    estoque_minimo_pacote: 10,
    data_validade_lote: '2026-11-25',
    local_descricao: 'Geladeira 1 - Prateleira Central',
    diasRestantes: 5,
  },
  {
    id_lote_produto: 'l2',
    nome_produto: 'Arroz Branco Tipo 1',
    categoria: 'Grãos e Cereais',
    numero_codigo_lote: 'LT-02',
    quantidade_atual_pacote: 20,
    estoque_minimo_pacote: 10,
    data_validade_lote: '2027-03-10',
    local_descricao: 'Armário A - Prateleira 1',
    diasRestantes: 110,
  },
  {
    id_lote_produto: 'l3',
    nome_produto: 'Feijão Carioca',
    categoria: 'Grãos e Cereais',
    numero_codigo_lote: 'LT-03',
    quantidade_atual_pacote: 6,
    estoque_minimo_pacote: 10,
    data_validade_lote: '2027-01-20',
    local_descricao: 'Armário A - Prateleira 2',
    diasRestantes: 60,
  },
];

describe('services/doraService.ts', () => {
  it('deve calcular dias até vencimento em formatos BR e ISO e formatar prazo amigável', () => {
    expect(calcularDiasAteVencimento('')).toBe(999);
    expect(calcularDiasAteVencimento('invalido')).toBe(999);
    expect(calcularDiasAteVencimento('2099-12-31')).toBeGreaterThan(100);
    expect(calcularDiasAteVencimento('31/12/2099')).toBeGreaterThan(100);

    expect(formatarPrazoAmigavel(-2)).toContain('venceu há 2 dias');
    expect(formatarPrazoAmigavel(0)).toContain('vence hoje');
    expect(formatarPrazoAmigavel(1)).toContain('vence amanhã');
    expect(formatarPrazoAmigavel(5)).toContain('5 dias');
    expect(formatarPrazoAmigavel(45)).toContain('validade tranquila');
  });

  it('deve sugerir receita gastronômica compatível priorizando FEFO e evitar repetição', () => {
    const rec = selecionarReceitaVerdadeiraDoEstoque(lotesFixture, 'quero um lanche doce com leite');
    expect(rec).not.toBeNull();
    expect(rec?.receita.id).toBe('arroz-doce-cremoso');
    expect(rec?.receita.fonteUrl).toContain('https://');

    const outra = selecionarReceitaVerdadeiraDoEstoque(lotesFixture, 'quero receita para almoço', 'arroz-doce-cremoso');
    expect(outra?.receita.id).toBe('arroz-feijao-caseiro');

    // Exercita as demais receitas (macarronada, mingau, sopa, arroz de forno, caldinho de feijão)
    const loteBase = (nome: string, extra?: Partial<LoteEstoqueDora>): LoteEstoqueDora => ({
      id_lote_produto: `id-${nome}`,
      nome_produto: nome,
      categoria: 'Geral',
      numero_codigo_lote: 'LT-X',
      quantidade_atual_pacote: 5,
      estoque_minimo_pacote: 2,
      data_validade_lote: '2026-12-01',
      local_descricao: 'Armário A',
      diasRestantes: 10,
      ...extra,
    });
    const rMac = selecionarReceitaVerdadeiraDoEstoque([loteBase('Macarrão Espaguete'), loteBase('Molho de Tomate')]);
    expect(rMac?.receita.id).toBe('macarronada-comunitaria');
    const rMingau = selecionarReceitaVerdadeiraDoEstoque([loteBase('Leite'), loteBase('Aveia em Flocos')]);
    expect(rMingau?.receita.id).toBe('mingau-aveia-ou-milho');
    const rSopa = selecionarReceitaVerdadeiraDoEstoque([loteBase('Lentilha'), loteBase('Batata')]);
    expect(rSopa?.receita.id).toBe('sopa-nutritiva-conforto');
    const rRisoto = selecionarReceitaVerdadeiraDoEstoque([loteBase('Arroz'), loteBase('Tomate Pelado')], undefined, 'arroz-feijao-caseiro');
    expect(rRisoto?.receita.id).toBe('risoto-arroz-forno');
    const rCaldo = selecionarReceitaVerdadeiraDoEstoque([loteBase('Feijão Preto'), loteBase('Farinha de Mandioca')], undefined, 'sopa-nutritiva-conforto');
    expect(rCaldo?.receita.id).toBe('caldinho-feijao-nutritivo');
    const rUnico = selecionarReceitaVerdadeiraDoEstoque([loteBase('Palmito em Conserva')]);
    expect(rUnico?.receita.titulo).toContain('Palmito em Conserva');
  });

  it('deve executar predição de consumo ML com histórico EMA e detectar riscos', () => {
    const pred = executarPredicaoConsumoML(lotesFixture, [
      { nome_produto: 'Leite Integral UHT', tipo_movimentacao: 'saída', quantidade: 3 },
      { nome_produto: 'Leite Integral UHT', tipo_movimentacao: 'consumo', quantidade: 4 },
    ]);
    expect(pred).toHaveLength(3);
    const leite = pred.find((p) => p.nomeProduto === 'Leite Integral UHT');
    expect(leite?.riscoVencerAntesDeAcabar).toBe(true);
    const feijao = pred.find((p) => p.nomeProduto === 'Feijão Carioca');
    expect(feijao?.precisaReposicaoBreve).toBe(true);
  });

  it('deve responder todas as intenções de conversa da Dora', () => {
    expect(responderConversaDora('Olá Dora!', lotesFixture).texto).toContain('Dora');
    expect(responderConversaDora('Obrigado!', lotesFixture).texto).toContain('Disponha');
    expect(responderConversaDora('Qual a previsão de consumo?', lotesFixture).predicoes?.length).toBeGreaterThan(0);
    expect(responderConversaDora('Qual a previsão de consumo?', []).atalho?.rota).toBe('/stock-add');
    expect(responderConversaDora('Me sugere uma receita?', lotesFixture).receita).toBeDefined();
    expect(responderConversaDora('Quais produtos vencem primeiro?', lotesFixture).texto).toContain('Monitoramento de Validades');
    expect(responderConversaDora('Quais produtos vencem primeiro?', []).texto).toContain('Controle de Validades');
    expect(responderConversaDora('Como cadastro entrada pelo código de barras?', lotesFixture).atalho?.rota).toBe('/stock-add');
    expect(responderConversaDora('Como posso mover um pacote de prateleira?', lotesFixture).atalho?.rota).toBe('/stock-move');
    expect(responderConversaDora('Como dou baixa ou perda?', lotesFixture).atalho?.rota).toBe('/stock-remove');
    expect(responderConversaDora('Como faço contagem e auditoria?', lotesFixture).atalho?.rota).toBe('/audit');
    expect(responderConversaDora('Como ver o relatório em pdf?', lotesFixture).atalho?.rota).toBe('/reports');
    expect(responderConversaDora('Me mostra o guia do aplicativo?', lotesFixture).texto).toContain('Guia Rápido');
    expect(responderConversaDora('Onde está o Feijão?', lotesFixture).texto).toContain('Feijão Carioca');
    expect(responderConversaDora('O que tem nas prateleiras?', lotesFixture).texto).toContain('Mapa das Prateleiras');
    expect(responderConversaDora('O que tem nas prateleiras?', []).atalho?.rota).toBe('/stock-add');
    expect(responderConversaDora('asdf', lotesFixture).texto).toContain('Como posso ajudar');
    expect(responderConversaDora('receita', []).atalho?.rota).toBe('/stock-add');
  });
});
