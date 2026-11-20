const { setupWebDom, carregarScriptWeb } = require('../helpers/domMock');

function criarPayloadAwsMock() {
  const futuro = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const distante = new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  return {
    sucesso: true,
    lotes: [
      {
        id_lote_produto: 'l1',
        id_produto: 'p1',
        nome_produto: 'Arroz Branco 5kg',
        marca_produto: 'Camil',
        categoria: 'Grãos',
        codigo_barra_produto: '7891000100103',
        numero_codigo_lote: 'LT-01',
        quantidade_inicial_pacote: 20,
        quantidade_atual_pacote: 4,
        estoque_minimo_pacote: 10,
        data_validade_lote: futuro,
        data_entrada_lote: '2026-10-01',
        local_descricao: 'Armário A - Prat. 1',
      },
      {
        id_lote_produto: 'l2',
        id_produto: 'p2',
        nome_produto: 'Leite Integral UHT',
        marca_produto: 'Italac',
        categoria: 'Laticínios',
        codigo_barra_produto: '7891000200202',
        numero_codigo_lote: 'LT-02',
        quantidade_inicial_pacote: 30,
        quantidade_atual_pacote: 25,
        estoque_minimo_pacote: 10,
        data_validade_lote: distante,
        data_entrada_lote: '2026-10-05',
        local_descricao: 'Geladeira 1 - Prat. Central',
      },
    ],
    locais: [
      {
        id_local_armazenamento: 'loc_1',
        local_descricao: 'Armário A - Prateleira 1',
        nome_local: 'Armário A',
        sublocal_compartimento: 'Prateleira 1',
        tipo_local: 'armário',
        localizacao_ambiente: 'Despensa Principal',
      },
      {
        id_local_armazenamento: 'loc_vazio',
        local_descricao: 'Geladeira 2 - Gaveta Vazia',
        nome_local: 'Geladeira 2',
        sublocal_compartimento: 'Gaveta Vazia',
        tipo_local: 'geladeira',
        localizacao_ambiente: 'Cozinha',
      },
    ],
    campanhas: [
      {
        id_campanha: 'camp_1',
        titulo: 'Arrecadação de Leite',
        meta: '100',
        status_aprovacao: 'Pendente de Análise',
        itens_necessarios: 'Leite (100 un.) [RECEBIDO:20] [INICIO:2026-11-01]',
        data_fim: '2026-12-30',
        responsavel: 'Maria Doadora',
      },
    ],
    movimentacoes: [
      {
        id_movimentacao: 'm1',
        operacao: 'Entrada',
        nome_produto: 'Arroz Branco 5kg',
        numero_codigo_lote: 'LT-01',
        quantidade_movimentada_pacote: 20,
        local_descricao: 'Armário A - Prateleira 1',
        id_usuario_responsavel: 'casadacrianca@adm',
        data_hora_movimentacao: '2026-11-18T10:00:00Z',
      },
    ],
    categorias: ['Grãos', 'Laticínios'],
  };
}

describe('Scripts Admin Core, Dashboard e Locais (admin.js, admin-dashboard.js, admin-locais.js)', () => {
  test('admin.js deve validar autenticação admin, normalizar prateleiras, classificar FEFO e buscar AWS', async () => {
    const ctx = setupWebDom('https://doareguardar.org/views/admin/dashboard.html');
    ctx.registerIds(['sidebar-admin-container']);
    carregarScriptWeb('admin.js');

    // Sem sessão redireciona para login
    expect(global.window.verificarAutenticacaoAdmin()).toBeNull();
    expect(ctx.location.href).toContain('index.html#modal-login');

    // Sessão inválida é limpa
    ctx.localStorage.setItem('dg_sessao_admin', JSON.stringify({ role: 'doador', email: 'x@gmail.com' }));
    expect(global.window.verificarAutenticacaoAdmin()).toBeNull();
    expect(ctx.localStorage.getItem('dg_sessao_admin')).toBeNull();

    // Sessão admin válida
    ctx.localStorage.setItem(
      'dg_sessao_admin',
      JSON.stringify({ nome: 'Admin Casa', email: 'casadacrianca@adm', role: 'administrador' })
    );
    const sessao = global.window.verificarAutenticacaoAdmin();
    expect(sessao.role).toBe('administrador');

    global.window.renderizarSidebarAdmin('dashboard');
    expect(ctx.document.getElementById('sidebar-admin-container').outerHTML).toContain('Dashboard Admin');

    expect(global.window.normalizarNomePrateleira('Armário A - Prat. 1')).toBe('Armário A - Prateleira 1');
    expect(global.window.normalizarNomePrateleira(null)).toBe('Armário A - Prateleira 1');
    expect(global.window.normalizarNomePrateleira('Despensa Prateleira 2')).toBe('Armário Despensa Prateleira 2');
    expect(global.window.escaparHtml('<b>X</b>')).toBe('&lt;b&gt;X&lt;/b&gt;');
    expect(global.window.classificarStatusFefo(-1).codigo).toBe('vencido');
    expect(global.window.classificarStatusFefo(5).codigo).toBe('critico');
    expect(global.window.classificarStatusFefo(20).codigo).toBe('atencao');
    expect(global.window.classificarStatusFefo(90).codigo).toBe('seguro');
    expect(global.window.formatarDataBr('2026-12-25')).toBe('25/12/2026');
    expect(global.window.formatarDataBr('')).toBe('--/--/----');
    expect(global.window.calcularDiasRestantesValidade('')).toBe(999);
    expect(global.window.calcularDiasRestantesValidade('invalido')).toBe(999);
    expect(typeof global.window.calcularDiasRestantesValidade('25/12/2099')).toBe('number');

    const payloadMock = criarPayloadAwsMock();
    ctx.fetch.mockResolvedValue({ ok: true, json: async () => payloadMock });

    const dados = await global.window.carregarDadosEstoqueAws();
    expect(dados.lotes).toHaveLength(2);
    expect(dados.lotes[0].localArmazenamento).toBe('Armário A - Prateleira 1');
    expect(dados.metricas.totalUnidades).toBe(29);
    expect(dados.metricas.qtdAbaixoMinimo).toBeGreaterThanOrEqual(1);

    // Moderação / criação e exclusão de campanha + tratamento de erros AWS
    const resCriar = await global.window.salvarOuModerarCampanhaAdmin(
      {
        idCampanha: 'c_nova',
        titulo: 'Nova Campanha',
        itemFoco: 'Arroz',
        itensDetalhados: [{ nome: 'Arroz', meta: 10, recebido: null }],
        metaUnidades: 10,
        arrecadadoUnidades: 0,
        data_fim: '2027-01-30',
        status: 'aprovada',
      },
      true
    );
    expect(Array.isArray(resCriar)).toBe(true);
    const resExc = await global.window.excluirCampanhaAdmin('c_nova');
    expect(Array.isArray(resExc)).toBe(true);

    ctx.fetch.mockResolvedValueOnce({ ok: false, status: 502, text: async () => 'Bad Gateway' });
    await expect(global.window.executarAcaoEstoqueAws({ acao: 'consultar_estoque' })).rejects.toThrow();

    ctx.fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ sucesso: false, mensagem: 'Falha lógica' }) });
    await expect(global.window.executarAcaoEstoqueAws({ acao: 'consultar_estoque' })).rejects.toThrow('Falha lógica');

    global.window.realizarLogoutAdmin();
    expect(ctx.localStorage.getItem('dg_sessao_admin')).toBeNull();
  });

  test('admin-dashboard.js deve popular KPIs, cards FEFO, estado vazio, erro de rede e alternar listas expansíveis', async () => {
    const ctx = setupWebDom('https://doareguardar.org/views/admin/dashboard.html');
    ctx.registerIds([
      'sidebar-admin-container',
      'icone-sync-aws',
      'alerta-erro-dashboard',
      'kpi-total-unidades',
      'kpi-total-lotes',
      'kpi-abaixo-minimo',
      'kpi-abaixo-minimo-desc',
      'kpi-fefo-alerta',
      'kpi-fefo-vencidos',
      'kpi-campanhas-pendentes',
      'kpi-campanhas-sub',
      'card-lista-estoque-baixo',
      'card-lista-vencendo',
      'lista-volume-expansivel',
      'lista-ocupacao-expansivel',
      'lista-reposicao-expansivel',
      'lista-movimentacoes-expansivel',
    ]);
    ctx.localStorage.setItem(
      'dg_sessao_admin',
      JSON.stringify({ nome: 'Admin', email: 'casadacrianca@adm', role: 'administrador' })
    );

    const payloadMock = criarPayloadAwsMock();
    ctx.fetch.mockResolvedValue({ ok: true, json: async () => payloadMock });

    carregarScriptWeb('admin.js');
    carregarScriptWeb('admin-dashboard.js');

    await global.window.atualizarDashboardCompleto();
    expect(ctx.document.getElementById('kpi-total-unidades').textContent).toBe('29 un.');
    expect(ctx.document.getElementById('kpi-campanhas-pendentes').textContent).toBe('1 pendentes');
    expect(ctx.document.getElementById('card-lista-estoque-baixo').innerHTML).toContain('Arroz Branco 5kg');

    global.window.alternarSecaoLista('lista-volume-expansivel');
    expect(ctx.document.getElementById('lista-volume-expansivel').classList.contains('hidden')).toBe(false);

    // Estado vazio
    ctx.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ sucesso: true, lotes: [], locais: [], campanhas: [], movimentacoes: [] }),
    });
    await global.window.atualizarDashboardCompleto();
    expect(ctx.document.getElementById('kpi-total-unidades').textContent).toBe('0 un.');

    // Erro de comunicação
    ctx.fetch.mockRejectedValue(new Error('Falha Lambda'));
    await global.window.atualizarDashboardCompleto();
    expect(ctx.document.getElementById('alerta-erro-dashboard').classList.contains('hidden')).toBe(false);
  });

  test('admin-locais.js deve filtrar, editar, validar exclusão com lotes, cadastrar novo local e tratar erros', async () => {
    const ctx = setupWebDom('https://doareguardar.org/views/admin/locais-armazenamento.html');
    ctx.registerIds([
      'sidebar-admin-container',
      'alerta-locais',
      'icone-sync-locais',
      'busca-local',
      'filtro-tipo-local',
      'stat-total-locais',
      'stat-em-uso',
      'stat-livres',
      'grid-locais-armazenamento',
      'titulo-modal-local',
      'local-id-edit',
      'local-nome-movel',
      'local-sublocal',
      'local-tipo',
      'local-ambiente',
      'btn-salvar-local',
      'modal-local',
    ]);
    ctx.localStorage.setItem(
      'dg_sessao_admin',
      JSON.stringify({ nome: 'Admin', email: 'casadacrianca@adm', role: 'administrador' })
    );
    ctx.document.getElementById('filtro-tipo-local').value = 'TODOS';
    global.window.abrirModal = jest.fn();
    global.window.fecharModal = jest.fn();

    const payloadMock = criarPayloadAwsMock();
    ctx.fetch.mockResolvedValue({ ok: true, json: async () => payloadMock });

    carregarScriptWeb('admin.js');
    carregarScriptWeb('admin-locais.js');

    await global.window.sincronizarLocaisComAws();
    expect(Number(ctx.document.getElementById('stat-total-locais').textContent)).toBeGreaterThanOrEqual(2);
    expect(ctx.document.getElementById('grid-locais-armazenamento').innerHTML).toContain('Armário A');

    global.window.tentarExcluirLocalComLotes('Armário A - Prateleira 1', 1);
    expect(ctx.document.getElementById('alerta-locais').innerHTML).toMatch(/possui|lote/i);

    ctx.document.getElementById('busca-local').value = 'Geladeira';
    global.window.renderizarGridLocais();
    global.window.limparFiltrosLocais();

    global.window.abrirModalNovoLocal();
    ctx.document.getElementById('local-nome-movel').value = 'Armário C';
    ctx.document.getElementById('local-sublocal').value = 'Prateleira 2';
    ctx.document.getElementById('local-tipo').value = 'armário';
    ctx.document.getElementById('local-ambiente').value = 'Despensa';
    await global.window.salvarLocalAws({ preventDefault: jest.fn() });

    // Edição de local existente + erro de salvamento
    const locEncoded = encodeURIComponent(
      JSON.stringify({
        id_local_armazenamento: 'loc_vazio',
        nome: 'Geladeira 2 - Gaveta Vazia',
        nome_local: 'Geladeira 2',
        sublocal_compartimento: 'Gaveta Vazia',
        tipo_local: 'geladeira',
        ambiente: 'Cozinha',
      })
    );
    global.window.abrirModalEditarLocal(locEncoded);
    await global.window.salvarLocalAws({ preventDefault: jest.fn() });

    ctx.fetch.mockRejectedValueOnce(new Error('Erro ao salvar'));
    await global.window.salvarLocalAws({ preventDefault: jest.fn() });
    expect(ctx.document.getElementById('alerta-locais').innerHTML).toMatch(/Não foi possível salvar/i);

    // Cancelamento e falha ao excluir + sucesso
    ctx.confirm.mockReturnValueOnce(false);
    await global.window.excluirLocalVazioAws('loc_vazio', 'Geladeira 2 - Gaveta Vazia');

    ctx.fetch.mockRejectedValueOnce(new Error('Erro exclusão'));
    await global.window.excluirLocalVazioAws('loc_vazio', 'Geladeira 2 - Gaveta Vazia');
    expect(ctx.document.getElementById('alerta-locais').innerHTML).toMatch(/Não foi possível excluir/i);

    await global.window.excluirLocalVazioAws('loc_vazio', 'Geladeira 2 - Gaveta Vazia');

    ctx.fetch.mockRejectedValueOnce(new Error('Erro sync'));
    await global.window.sincronizarLocaisComAws();
  });
});
