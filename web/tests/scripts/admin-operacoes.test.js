const { setupWebDom, carregarScriptWeb } = require('../helpers/domMock');

function criarMockCompletoAdmin() {
  const futuro = new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const vencido = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const multiItensTag = encodeURIComponent(
    JSON.stringify([
      { nome: 'Arroz Tipo 1', meta: 20, recebido: null },
      { nome: 'Feijão Preto', meta: 30, recebido: null },
    ])
  );
  return {
    sucesso: true,
    lotes: [
      {
        id_lote_produto: 'l1',
        id_produto: 'p1',
        nome_produto: 'Feijão Carioca',
        marca_produto: 'Kicaldo',
        categoria: 'Grãos',
        codigo_barra_produto: '7891000300301',
        numero_codigo_lote: 'FEJ-01',
        quantidade_inicial_pacote: 20,
        quantidade_atual_pacote: 12,
        estoque_minimo_pacote: 10,
        data_validade_lote: futuro,
        data_entrada_lote: '2026-10-01',
        local_descricao: 'Armário A - Prateleira 1',
      },
      {
        id_lote_produto: 'l2',
        id_produto: 'p2',
        nome_produto: 'Achocolatado Pó',
        marca_produto: 'Toddy',
        categoria: 'Matinais',
        codigo_barra_produto: '7891000999999',
        numero_codigo_lote: 'ACH-02',
        quantidade_inicial_pacote: 8,
        quantidade_atual_pacote: 5,
        estoque_minimo_pacote: 10,
        data_validade_lote: vencido,
        data_entrada_lote: '2026-09-01',
        local_descricao: 'Armário B - Prateleira 2',
      },
    ],
    locais: [
      {
        id_local_armazenamento: 'loc_1',
        local_descricao: 'Armário A - Prateleira 1',
        tipo_local: 'armário',
      },
      {
        id_local_armazenamento: 'loc_2',
        local_descricao: 'Armário B - Prateleira 2',
        tipo_local: 'armário',
      },
    ],
    categorias: ['Grãos', 'Laticínios'],
    motivos_saida: ['Saida Regular', 'perda de produto'],
    campanhas: [
      {
        id_campanha: 'c_pend',
        id_campanha_doacao: 'c_pend',
        titulo: 'Campanha Feijão Solidário',
        meta: '50',
        status_aprovacao: 'Pendente de Análise',
        itens_necessarios: 'Feijão (50 un.) [RECEBIDO:10]',
        data_fim: '2026-12-20',
        responsavel: 'Maria Doadora',
      },
      {
        id_campanha: 'c_aprov',
        id_campanha_doacao: 'c_aprov',
        titulo: 'Campanha Cesta Multi',
        meta: '50',
        status_aprovacao: 'Aprovada',
        itens_necessarios: `Arroz Tipo 1 (20 un.), Feijão Preto (30 un.) [ITENS:${multiItensTag}]`,
        data_fim: '2026-12-28',
        responsavel: 'Casa da Criança',
      },
      {
        id_campanha: 'c_enc',
        id_campanha_doacao: 'c_enc',
        titulo: 'Campanha Encerrada',
        meta: '20',
        status_aprovacao: 'Encerrada',
        itens_necessarios: 'Óleo (20 un.) [RECEBIDO:25] [PARECER:Superada]',
        data_fim: '2026-10-15',
      },
      {
        id_campanha: 'c_rep',
        id_campanha_doacao: 'c_rep',
        titulo: 'Campanha Recusada',
        meta: '10',
        status_aprovacao: 'Reprovada',
        itens_necessarios: 'Sal (10 un.) [PARECER:Estoque cheio]',
        data_fim: '2026-11-01',
      },
    ],
    movimentacoes: [
      {
        id_movimentacao: 'm1',
        operacao: 'Entrada',
        nome_produto: 'Feijão Carioca',
        numero_codigo_lote: 'FEJ-01',
        quantidade_movimentada_pacote: 20,
        local_descricao: 'Armário A - Prateleira 1',
        id_usuario_responsavel: 'casadacrianca@adm',
        data_hora_movimentacao: '2026-11-18T10:00:00Z',
      },
      {
        id_movimentacao: 'm2',
        operacao: 'Saída',
        motivo_saida: 'perda - descarte',
        nome_produto: 'Achocolatado Pó',
        numero_codigo_lote: 'ACH-02',
        quantidade_movimentada_pacote: 3,
        local_descricao: 'Armário B - Prateleira 2',
        id_usuario_responsavel: 'op',
        data_hora_movimentacao: '2026-11-19T10:00:00Z',
      },
    ],
    logs_auditoria: [
      {
        id_log_auditoria: 'log1',
        acao: 'CAMPANHA_APROVADA',
        detalhes: { titulo: 'Campanha Cesta Multi' },
        id_usuario: 'casadacrianca@adm',
        data_hora: '2026-11-19T12:00:00Z',
      },
    ],
    doadores: [
      {
        id_doador: 'd1',
        nome_completo: 'João Apoiador',
        tipo_doador: 'PF',
        telefone: '19999990000',
        status_ativo: true,
      },
    ],
    instituicoes: [
      {
        id_instituicao: 'i1',
        nome_fantasia: 'Casa da Criança - Matriz',
        cnpj: '12345678000199',
        status_ativo: true,
      },
    ],
  };
}

describe('Scripts de Operações Admin (admin-campanhas, admin-consulta-avancada, admin-relatorios)', () => {
  test('admin-campanhas.js deve moderar, exigir parecer na reprovação, criar nova campanha e dar baixa de meta', async () => {
    const ctx = setupWebDom('https://doareguardar.org/views/admin/moderacao-campanhas.html');
    ctx.registerIds([
      'sidebar-admin-container',
      'feedback-moderacao',
      'icone-sync-campanhas',
      'count-pendente',
      'count-aprovada',
      'count-encerrada',
      'count-reprovada',
      'count-todas',
      'tab-status-TODAS',
      'tab-status-pendente',
      'tab-status-aprovada',
      'tab-status-encerrada',
      'tab-status-reprovada',
      'lista-campanhas-moderacao',
      'nova-camp-itens-container',
      'nova-camp-meta-total-label',
      'nova-camp-data',
      'nova-camp-titulo',
      'nova-camp-desc',
      'nova-camp-resp',
      'nova-camp-coletas',
      'btn-salvar-nova-campanha',
      'btn-publicar-camp',
      'reprovar-id-campanha',
      'subtitulo-reprovar-campanha',
      'reprovar-parecer',
      'baixa-camp-id',
      'baixa-camp-meta',
      'subtitulo-baixa-campanha',
      'baixa-camp-item-rotulo',
      'baixa-camp-item',
      'baixa-camp-meta-label',
      'baixa-camp-itens-instrucao',
      'baixa-camp-obs',
      'baixa-camp-itens-container',
      'preview-resultado-meta',
      'baixa-camp-total-parcial',
      'baixa-camp-arrecadado',
      'baixa-camp-encerrar',
      'btn-confirmar-baixa-camp',
    ]);
    ctx.localStorage.setItem(
      'dg_sessao_admin',
      JSON.stringify({ nome: 'Admin', email: 'casadacrianca@adm', role: 'administrador' })
    );
    global.window.abrirModal = jest.fn();
    global.window.fecharModal = jest.fn();

    const mockData = criarMockCompletoAdmin();
    ctx.fetch.mockResolvedValue({ ok: true, json: async () => mockData });

    carregarScriptWeb('admin.js');
    carregarScriptWeb('admin-campanhas.js');

    await global.window.carregarTelaModeracao();
    expect(ctx.document.getElementById('count-pendente').textContent).toBe('1');
    expect(ctx.document.getElementById('count-aprovada').textContent).toBe('1');
    expect(ctx.document.getElementById('lista-campanhas-moderacao').innerHTML).toContain('Campanha Feijão Solidário');

    // Aprovar campanha direto (sucesso e erro) e reprovar registrando parecer técnico (sucesso e erro)
    await global.window.aprovarCampanhaDireto('c_pend');
    ctx.fetch.mockRejectedValueOnce(new Error('Erro Aprovar'));
    await global.window.aprovarCampanhaDireto('c_pend');
    expect(ctx.document.getElementById('feedback-moderacao').innerHTML).toMatch(/Erro ao aprovar/i);

    global.window.abrirModalReprovacao('c_pend');
    ctx.document.getElementById('reprovar-parecer').value = 'Meta duplicada neste mês';
    await global.window.confirmarReprovacaoCampanha({ preventDefault: jest.fn() });
    expect(ctx.document.getElementById('feedback-moderacao').innerHTML).toMatch(/recusada|justificativa/i);
    ctx.fetch.mockRejectedValueOnce(new Error('Erro Recusar'));
    await global.window.confirmarReprovacaoCampanha({ preventDefault: jest.fn() });
    expect(ctx.document.getElementById('feedback-moderacao').innerHTML).toMatch(/Erro ao recusar/i);

    // Modal de nova campanha (linhas múltiplas, remoção, validação vazia, publicação válida e erro)
    global.window.abrirModalNovaCampanha();
    ctx.document.getElementById('nova-camp-titulo').value = 'Campanha Especial Inverno';
    ctx.document.getElementById('nova-camp-desc').value = 'Cestas básicas';
    ctx.document.getElementById('nova-camp-resp').value = 'Coordenação';
    global.window.adicionarLinhaItemNovaCampanha('Feijão', 20);
    const rowsNova = ctx.document.getElementById('nova-camp-itens-container').querySelectorAll('.nova-camp-item-row');
    expect(rowsNova.length).toBe(2);
    // Valida item vazio na linha 0 antes de preencher
    await global.window.salvarNovaCampanhaInstitucional({ preventDefault: jest.fn() });
    expect(ctx.document.getElementById('feedback-moderacao').innerHTML).toMatch(/nome e uma meta válida/i);
    // Remove linha extra, adiciona outra, preenche tudo e publica
    global.window.removerLinhaItemNovaCampanha(rowsNova[1].querySelector('button'));
    rowsNova[0].querySelector('.nova-camp-item-nome').value = 'Arroz';
    rowsNova[0].querySelector('.nova-camp-item-meta').value = '40';
    global.window.adicionarLinhaItemNovaCampanha('Feijão', 20);
    await global.window.salvarNovaCampanhaInstitucional({ preventDefault: jest.fn() });
    expect(ctx.document.getElementById('feedback-moderacao').innerHTML).toMatch(/publicada com sucesso/i);
    ctx.fetch.mockRejectedValueOnce(new Error('Falha publicar'));
    await global.window.salvarNovaCampanhaInstitucional({ preventDefault: jest.fn() });

    // Todas as abas de filtro de status
    for (const st of ['pendente', 'aprovada', 'encerrada', 'reprovada', 'TODAS']) {
      global.window.filtrarStatusCampanha(st);
    }

    // Baixa de meta multi-item: preview (vazio, inválido, acima/exata/abaixo da meta) e confirmação
    global.window.abrirModalBaixaCampanha('c_aprov');
    const in0 = ctx.document.getElementById('baixa-item-recebido-0');
    const in1 = ctx.document.getElementById('baixa-item-recebido-1');
    in0.value = '';
    in1.value = '-2';
    global.window.atualizarPreviewResultadoMeta();
    await global.window.confirmarBaixaCampanha({ preventDefault: jest.fn() });
    expect(ctx.document.getElementById('feedback-moderacao').innerHTML).toMatch(/quantidade inteira válida/i);

    in0.value = '20';
    in1.value = '30';
    global.window.atualizarPreviewResultadoMeta(); // meta exata
    in0.value = '10';
    in1.value = '15';
    global.window.atualizarPreviewResultadoMeta(); // abaixo da meta
    in0.value = '25';
    in1.value = '35';
    global.window.atualizarPreviewResultadoMeta(); // acima da meta
    ctx.document.getElementById('baixa-camp-obs').value = 'Entrega conferida';
    await global.window.confirmarBaixaCampanha({ preventDefault: jest.fn() });
    expect(ctx.document.getElementById('feedback-moderacao').innerHTML).toMatch(/Baixa confirmada/i);

    ctx.fetch.mockRejectedValueOnce(new Error('Erro Baixa'));
    await global.window.confirmarBaixaCampanha({ preventDefault: jest.fn() });

    // Exclusão (cancelada, erro e confirmada)
    ctx.confirm.mockReturnValueOnce(false);
    await global.window.confirmarExclusaoCampanha('c_pend', 'Campanha Feijão Solidário');
    ctx.fetch.mockRejectedValueOnce(new Error('Erro Excluir'));
    await global.window.confirmarExclusaoCampanha('c_pend', 'Campanha Feijão Solidário');
    await global.window.confirmarExclusaoCampanha('c_pend', 'Campanha Feijão Solidário');
  });

  test('admin-consulta-avancada.js deve filtrar lotes, consultar EAN, submeter entrada, baixa e ajuste', async () => {
    const ctx = setupWebDom('https://doareguardar.org/views/admin/consulta-avancada.html');
    ctx.registerIds([
      'sidebar-admin-container',
      'feedback-operacao-estoque',
      'icone-refresh-lotes',
      'resumo-lotes-ativos',
      'resumo-unidades-totais',
      'resumo-fefo-30d',
      'resumo-vencidos',
      'filtro-prateleira',
      'entrada-prateleira',
      'transf-destino',
      'filtro-categoria',
      'entrada-categoria',
      'baixa-motivo',
      'select-itens-por-pagina',
      'busca-termo',
      'filtro-status-fefo',
      'select-ordem-lotes',
      'contador-resultados-lotes',
      'info-paginacao-lotes',
      'indicador-pagina-atual',
      'btn-pag-anterior',
      'btn-pag-proxima',
      'tbody-consulta-lotes',
      'entrada-url-foto',
      'container-preview-foto-entrada',
      'preview-foto-entrada',
      'preview-url-foto-texto',
      'titulo-modal-lote',
      'entrada-id-lote-edit',
      'entrada-id-produto-edit',
      'entrada-qtd-inicial-edit',
      'entrada-qtd-anterior-edit',
      'entrada-ean',
      'entrada-nome',
      'entrada-marca',
      'entrada-quantidade',
      'entrada-minimo',
      'entrada-validade',
      'entrada-codigo-lote',
      'status-busca-ean',
      'btn-salvar-entrada',
      'baixa-id-lote',
      'baixa-max-qtd',
      'subtitulo-baixa-lote',
      'baixa-quantidade',
      'baixa-justificativa',
      'baixa-confirmacao-perda',
      'bloco-trava-perda',
      'btn-confirmar-baixa',
      'ajuste-id-lote',
      'subtitulo-ajuste-lote',
      'ajuste-nova-qtd',
      'ajuste-justificativa',
      'btn-confirmar-ajuste',
      'transf-id-lote',
      'subtitulo-transf-lote',
      'transf-origem',
      'transf-quantidade',
      'btn-confirmar-transf',
    ]);
    ctx.localStorage.setItem(
      'dg_sessao_admin',
      JSON.stringify({ nome: 'Admin', email: 'casadacrianca@adm', role: 'administrador' })
    );
    global.window.abrirModal = jest.fn();
    global.window.fecharModal = jest.fn();

    const mockData = criarMockCompletoAdmin();
    ctx.fetch.mockResolvedValue({ ok: true, json: async () => mockData });

    ctx.document.getElementById('filtro-prateleira').value = 'TODAS';
    ctx.document.getElementById('filtro-categoria').value = 'TODAS';
    ctx.document.getElementById('filtro-status-fefo').value = 'TODOS';
    ctx.document.getElementById('select-ordem-lotes').value = 'alfabetica';
    ctx.document.getElementById('select-itens-por-pagina').value = '50';

    carregarScriptWeb('admin.js');
    carregarScriptWeb('admin-consulta-avancada.js');

    await global.window.carregarTabelaLotesAws();
    expect(ctx.document.getElementById('tbody-consulta-lotes').innerHTML).toContain('Feijão Carioca');

    ctx.document.getElementById('busca-termo').value = 'Feijão';
    global.window.aplicarFiltrosLotes();
    global.window.limparFiltrosLotes();

    // Paginação (1 por página) e todas as ordenações
    ctx.document.getElementById('select-itens-por-pagina').value = '1';
    global.window.alterarItensPorPagina();
    global.window.mudarPaginaLotes(1);
    expect(ctx.document.getElementById('indicador-pagina-atual').textContent).toBe('2 / 2');
    global.window.mudarPaginaLotes(-1);
    global.window.mudarPaginaLotes(-1);

    for (const ordem of ['alfabetica_za', 'vencimento_asc', 'vencimento_desc', 'quantidade_desc', 'quantidade_asc', 'categoria_az', 'local_az', 'alfabetica_az']) {
      ctx.document.getElementById('select-ordem-lotes').value = ordem;
      global.window.aplicarFiltrosLotes(true);
    }

    // Baixa com perda exigindo confirmação 'PERDA' (recebe JSON serializado como na UI) e lote vencido
    const loteEncoded = encodeURIComponent(
      JSON.stringify({
        id_lote_produto: 'l1',
        id_produto: 'p1',
        nomeProduto: 'Feijão Carioca',
        marca: 'Kicaldo',
        categoria: 'Grãos',
        codigoBarras: '7891000300301',
        codigoLote: 'FEJ-01',
        quantidadeAtual: 12,
        estoqueMinimo: 10,
        dataValidade: '2026-12-30',
        localArmazenamento: 'Armário A - Prateleira 1',
        unidadeMedida: 'pcts',
        diasRestantes: -2,
      })
    );
    global.window.abrirModalBaixa(loteEncoded);
    ctx.document.getElementById('baixa-motivo').value = 'perda de produto';
    global.window.alternarTravaPerdaBaixa();
    ctx.document.getElementById('baixa-quantidade').value = '2';
    ctx.document.getElementById('baixa-confirmacao-perda').value = 'perda';
    await global.window.submeterBaixaLoteAws({ preventDefault: jest.fn() });

    ctx.document.getElementById('baixa-confirmacao-perda').value = 'PERDA';
    ctx.document.getElementById('baixa-justificativa').value = 'Embalagem rasgada';
    await global.window.submeterBaixaLoteAws({ preventDefault: jest.fn() });

    // Ajuste de contagem, consulta EAN (vazio, encontrado nova cat, não encontrado, erro), entrada/edição e transferência
    global.window.abrirModalAjuste(loteEncoded);
    ctx.document.getElementById('ajuste-nova-qtd').value = '10';
    ctx.document.getElementById('ajuste-justificativa').value = 'Conferência de inventário';
    await global.window.submeterAjusteAws({ preventDefault: jest.fn() });

    global.window.abrirModalNovaEntrada();
    ctx.document.getElementById('entrada-ean').value = '';
    await global.window.consultarEanNaAws();
    expect(ctx.document.getElementById('status-busca-ean').textContent).toMatch(/Informe o código/i);

    ctx.document.getElementById('entrada-ean').value = '7891000300301';
    ctx.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        sucesso: true,
        produto: {
          nome_produto: 'Suco Natural',
          marca_produto: 'Del Valle',
          categoria: 'Bebidas',
          url_foto_produto: 'https://img.example/suco.png',
        },
      }),
    });
    await global.window.consultarEanNaAws();
    expect(ctx.document.getElementById('entrada-nome').value).toBe('Suco Natural');
    expect(ctx.document.getElementById('container-preview-foto-entrada').classList.contains('hidden')).toBe(false);
    ctx.document.getElementById('preview-foto-entrada').onerror();

    ctx.fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ sucesso: true, mensagem: 'Não localizado' }) });
    await global.window.consultarEanNaAws();
    ctx.fetch.mockRejectedValueOnce(new Error('Timeout EAN'));
    await global.window.consultarEanNaAws();

    // Cadastro novo lote e edição de lote + erro
    await global.window.submeterEntradaOuEdicaoLoteAws({ preventDefault: jest.fn() });
    global.window.abrirModalEdicaoLote(loteEncoded);
    ctx.document.getElementById('entrada-quantidade').value = '15';
    await global.window.submeterEntradaOuEdicaoLoteAws({ preventDefault: jest.fn() });
    ctx.fetch.mockRejectedValueOnce(new Error('Erro entrada'));
    await global.window.submeterEntradaOuEdicaoLoteAws({ preventDefault: jest.fn() });

    // Transferência: mesma prateleira, integral, parcial e erro
    global.window.abrirModalTransferencia(loteEncoded);
    ctx.document.getElementById('transf-destino').value = 'loc_1';
    await global.window.submeterTransferenciaAws({ preventDefault: jest.fn() });
    expect(ctx.alert).toHaveBeenCalledWith(expect.stringMatching(/local de destino diferente/i));

    ctx.document.getElementById('transf-destino').value = 'loc_2';
    ctx.document.getElementById('transf-quantidade').value = '12';
    await global.window.submeterTransferenciaAws({ preventDefault: jest.fn() });

    ctx.document.getElementById('transf-quantidade').value = '4';
    await global.window.submeterTransferenciaAws({ preventDefault: jest.fn() });

    ctx.fetch.mockRejectedValueOnce(new Error('Falha transf'));
    await global.window.submeterTransferenciaAws({ preventDefault: jest.fn() });
  });

  test('admin-relatorios.js deve renderizar KPIs, gráficos Chart.js e exportar CSV', async () => {
    const ctx = setupWebDom('https://doareguardar.org/views/admin/relatorios.html');
    ctx.registerIds([
      'sidebar-admin-container',
      'icone-sync-relatorio',
      'alerta-erro-relatorios',
      'relatorio-prateleira',
      'relatorio-categoria',
      'rel-kpi-1-label',
      'rel-kpi-1',
      'rel-kpi-2-label',
      'rel-kpi-2',
      'rel-kpi-3-label',
      'rel-kpi-3',
      'rel-kpi-4-label',
      'rel-kpi-4',
      'titulo-tabela-relatorio',
      'titulo-grafico-1',
      'titulo-grafico-2',
      'tipo-grafico-preferido',
      'tipo-relatorio',
      'relatorio-data-inicio',
      'relatorio-data-fim',
      'data-emissao-relatorio',
      'thead-relatorio',
      'tbody-relatorio',
      'titulo-modal-doador-rel',
      'rel-doador-id',
      'rel-doador-nome',
      'rel-doador-tipo',
      'rel-doador-doc',
      'rel-doador-tel',
      'rel-doador-obs',
      'rel-doador-ativo',
      'btn-salvar-doador-rel',
      'titulo-modal-inst-rel',
      'rel-inst-id',
      'rel-inst-fantasia',
      'rel-inst-razao',
      'rel-inst-cnpj',
      'rel-inst-tipo',
      'rel-inst-resp',
      'rel-inst-tel',
      'rel-inst-end',
      'rel-inst-ativo',
      'btn-salvar-inst-rel',
      'wpp-destinatario-select',
      'wpp-rel-item-select',
      'wpp-rel-campanhas-ativas',
      'wpp-numero-destino',
      'wpp-rel-itens-chips',
      'wpp-mensagem-texto',
      'area-exportavel-relatorio',
      'btn-baixar-pdf',
    ]);
    global.window.abrirModal = jest.fn();
    global.window.fecharModal = jest.fn();
    const canvas1 = ctx.registerEl('canvas', 'grafico-principal');
    canvas1.getContext = () => ({ canvas: canvas1 });
    const canvas2 = ctx.registerEl('canvas', 'grafico-secundario');
    canvas2.getContext = () => ({ canvas: canvas2 });
    ctx.document.getElementById('tipo-relatorio').value = 'VISAO_GERAL';
    ctx.document.getElementById('relatorio-prateleira').value = 'TODAS';
    ctx.document.getElementById('relatorio-categoria').value = 'TODAS';
    ctx.document.getElementById('tipo-grafico-preferido').value = 'bar';
    ctx.localStorage.setItem(
      'dg_sessao_admin',
      JSON.stringify({ nome: 'Admin', email: 'casadacrianca@adm', role: 'administrador' })
    );

    const mockData = criarMockCompletoAdmin();
    ctx.fetch.mockResolvedValue({ ok: true, json: async () => mockData });

    carregarScriptWeb('admin.js');
    carregarScriptWeb('admin-relatorios.js');

    await global.window.carregarDadosRelatorioAws();
    expect(ctx.Chart).toHaveBeenCalled();
    expect(ctx.document.getElementById('tbody-relatorio').innerHTML).toContain('Grãos');

    // Outros tipos de gráficos e filtros de data
    ctx.document.getElementById('relatorio-data-inicio').value = '2026-01-01';
    ctx.document.getElementById('relatorio-data-fim').value = '2026-12-31';
    for (const chartType of ['doughnut', 'line', 'pie']) {
      ctx.document.getElementById('tipo-grafico-preferido').value = chartType;
      global.window.renderizarRelatorioSelecionado();
    }
    ctx.document.getElementById('tipo-grafico-preferido').value = 'bar';

    for (const tipo of ['INVENTARIO_FEFO', 'MOVIMENTACOES', 'PERDAS_DESCARTES', 'BALANCO_MINIMO', 'OCUPACAO_LOCAIS', 'LOGS_AUDITORIA', 'CAMPANHAS_FINALIZADAS', 'DOADORES', 'INSTITUICOES']) {
      ctx.document.getElementById('tipo-relatorio').value = tipo;
      global.window.renderizarRelatorioSelecionado();
    }
    ctx.document.getElementById('tipo-relatorio').value = 'INVENTARIO_FEFO';
    global.window.renderizarRelatorioSelecionado();
    expect(ctx.document.getElementById('tbody-relatorio').innerHTML).toContain('Feijão Carioca');

    // CRUD Doador no Relatório (criar, editar, erro, excluir)
    global.window.abrirModalDoadorRelatorio();
    ctx.document.getElementById('rel-doador-nome').value = 'Supermercado Sol';
    ctx.document.getElementById('rel-doador-tel').value = '(19) 98888-7777';
    await global.window.salvarDoadorRelatorio({ preventDefault: jest.fn() });
    const dEnc = encodeURIComponent(
      JSON.stringify({ id: 'd1', nome_completo: 'João Apoiador', tipo: 'PF', documento: '', telefone: '19999990000', observacoes: '', status_ativo: true })
    );
    global.window.abrirModalDoadorRelatorio(dEnc);
    await global.window.salvarDoadorRelatorio({ preventDefault: jest.fn() });
    ctx.fetch.mockRejectedValueOnce(new Error('Erro doador'));
    await global.window.salvarDoadorRelatorio({ preventDefault: jest.fn() });
    expect(ctx.alert).toHaveBeenCalledWith(expect.stringMatching(/Erro ao salvar doador/));

    ctx.confirm.mockReturnValueOnce(false);
    await global.window.excluirDoadorRelatorio('d1', 'João');
    ctx.fetch.mockRejectedValueOnce(new Error('Erro exc'));
    await global.window.excluirDoadorRelatorio('d1', 'João');
    await global.window.excluirDoadorRelatorio('d1', 'João');

    // CRUD Instituição no Relatório (criar, editar, erro, excluir)
    global.window.abrirModalInstituicaoRelatorio();
    ctx.document.getElementById('rel-inst-fantasia').value = 'Creche Alegria';
    ctx.document.getElementById('rel-inst-tel').value = '19977776666';
    await global.window.salvarInstituicaoRelatorio({ preventDefault: jest.fn() });
    const iEnc = encodeURIComponent(
      JSON.stringify({ id: 'i1', nome_fantasia: 'Matriz', razao_social: 'Associação', cnpj: '', tipo_unidade: 'Matriz', responsavel: '', telefone: '', endereco: '', status_ativo: true })
    );
    global.window.abrirModalInstituicaoRelatorio(iEnc);
    await global.window.salvarInstituicaoRelatorio({ preventDefault: jest.fn() });
    ctx.fetch.mockRejectedValueOnce(new Error('Erro inst'));
    await global.window.salvarInstituicaoRelatorio({ preventDefault: jest.fn() });

    ctx.confirm.mockReturnValueOnce(false);
    await global.window.excluirInstituicaoRelatorio('i1', 'Matriz');
    ctx.fetch.mockRejectedValueOnce(new Error('Erro exc inst'));
    await global.window.excluirInstituicaoRelatorio('i1', 'Matriz');
    await global.window.excluirInstituicaoRelatorio('i1', 'Matriz');

    // Modal WhatsApp: contatos, itens, campanhas, validação e window.open
    global.window.abrirModalWhatsAppRelatorio('19999990000', 'João');
    ctx.document.getElementById('wpp-destinatario-select').value = '19999990000';
    global.window.selecionarContatoWhatsApp();
    ctx.document.getElementById('wpp-rel-item-select').value = 'Feijão Carioca (12 un.)';
    global.window.adicionarItemWhatsAppRelatorio();
    global.window.alternarCampanhaWhatsAppRel('c_aprov', true);
    global.window.alternarCampanhaWhatsAppRel('c_aprov', false);
    global.window.removerItemWhatsAppRelatorio(0);
    ctx.document.getElementById('wpp-numero-destino').value = '123';
    global.window.enviarMensagemWhatsAppRelatorio({ preventDefault: jest.fn() });
    expect(ctx.alert).toHaveBeenCalledWith(expect.stringMatching(/WhatsApp válido/));
    ctx.document.getElementById('wpp-numero-destino').value = '19999990000';
    global.window.enviarMensagemWhatsAppRelatorio({ preventDefault: jest.fn() });
    expect(ctx.open).toHaveBeenCalledWith(expect.stringContaining('https://wa.me/5519999990000'), '_blank', 'noopener,noreferrer');

    // Exportar PDF (html2pdf mock e fallback window.print) + CSV + erro carregar
    global.html2pdf = jest.fn(() => ({
      set: () => ({ from: () => ({ save: () => Promise.resolve() }) }),
    }));
    global.window.exportarRelatorioPdfLocal();
    await Promise.resolve();
    expect(global.html2pdf).toHaveBeenCalled();

    global.html2pdf = undefined;
    global.window.exportarRelatorioPdfLocal();
    expect(ctx.print).toHaveBeenCalled();

    global.window.exportarRelatorioCsv();
    expect(global.URL.createObjectURL).toHaveBeenCalled();

    ctx.fetch.mockRejectedValueOnce(new Error('Erro rede relatorio'));
    await global.window.carregarDadosRelatorioAws();
    expect(ctx.document.getElementById('alerta-erro-relatorios').classList.contains('hidden')).toBe(false);
  });
});
