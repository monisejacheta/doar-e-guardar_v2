const { setupWebDom, carregarScriptWeb } = require('../helpers/domMock');

describe('Scripts do Portal do Doador (donor-dashboard, donor-estoque, donor-campanhas, donor-minhas-campanhas, donor-configuracoes)', () => {
  test('donor-dashboard.js deve carregar campanhas, itens urgentes e alternar listas expansíveis', async () => {
    const ctx = setupWebDom('https://doareguardar.org/views/donor/dashboardDoador.html');
    ctx.registerIds([
      'icone-sync-doador',
      'alerta-erro-doador',
      'doador-camp-ativas',
      'doador-camp-pendentes',
      'doador-camp-concluidas',
      'doador-lista-urgentes',
      'doador-lista-campanhas-ativas',
    ]);

    ctx.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        sucesso: true,
        lotes: [
          { nome_produto: 'Leite', categoria: 'Laticínios', quantidade_atual_pacote: 2, estoque_minimo_pacote: 10 },
        ],
        campanhas: [
          { id_campanha: 'c1', titulo: 'Campanha Leite', status_aprovacao: 'Aprovada', meta: '20', itens_necessarios: 'Leite (20 un.) [RECEBIDO:5]', data_fim: '2026-12-30' },
          { id_campanha: 'c2', titulo: 'Minha Pendente', status_aprovacao: 'Pendente de Análise', meta: '10', responsavel: 'Maria (maria@gmail.com)' },
        ],
      }),
    });

    carregarScriptWeb('donor-dashboard.js');
    await global.window.carregarPainelDoadorAws({ displayName: 'Maria', email: 'maria@gmail.com' });

    expect(ctx.document.getElementById('doador-camp-ativas').textContent).toBe('1');
    expect(ctx.document.getElementById('doador-lista-urgentes').innerHTML).toContain('Leite');

    global.window.alternarListaDoador('doador-lista-urgentes');
    expect(ctx.document.getElementById('doador-lista-urgentes').classList.contains('hidden')).toBe(true);
    global.window.alternarListaDoador('doador-lista-urgentes');
    expect(ctx.document.getElementById('doador-lista-urgentes').classList.contains('hidden')).toBe(false);

    // Painel sem itens urgentes e sem campanhas ativas + falha de rede
    ctx.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        sucesso: true,
        lotes: [{ nome_produto: 'Arroz', categoria: 'Grãos', quantidade_atual_pacote: 50, estoque_minimo_pacote: 10 }],
        campanhas: [],
      }),
    });
    await global.window.carregarPainelDoadorAws({ displayName: 'Maria', email: 'maria@gmail.com' });
    expect(ctx.document.getElementById('doador-lista-urgentes').innerHTML).toMatch(/níveis regulares/i);
    expect(ctx.document.getElementById('doador-lista-campanhas-ativas').innerHTML).toMatch(/Nenhuma campanha ativa/i);

    ctx.fetch.mockRejectedValue(new Error('Falha painel'));
    await global.window.carregarPainelDoadorAws({ displayName: 'Maria', email: 'maria@gmail.com' });
    expect(ctx.document.getElementById('alerta-erro-doador').classList.contains('hidden')).toBe(false);
  });

  test('donor-estoque.js deve agrupar estoque transparente, filtrar, paginar, tratar vazio/erro e limpar filtros', async () => {
    const ctx = setupWebDom('https://doareguardar.org/views/donor/estoque.html');
    ctx.registerIds([
      'icone-sync-estoque-doador',
      'loading',
      'tabela-container',
      'resumo-doador-total',
      'resumo-doador-critico',
      'resumo-doador-ok',
      'filtro-categoria-doador',
      'select-itens-doador',
      'busca-alimento',
      'filtro-situacao',
      'contador-doador-estoque',
      'info-pag-doador',
      'ind-pag-doador',
      'btn-ant-doador',
      'btn-prox-doador',
      'lista-estoque',
    ]);

    ctx.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        sucesso: true,
        lotes: [
          { nome_produto: 'Arroz', categoria: 'Grãos', quantidade_atual_pacote: 3, estoque_minimo_pacote: 10 },
          { nome_produto: 'Açúcar', categoria: 'Mercearia', quantidade_atual_pacote: 20, estoque_minimo_pacote: 10 },
        ],
      }),
    });

    ctx.document.getElementById('filtro-categoria-doador').value = 'TODAS';
    ctx.document.getElementById('select-itens-doador').value = '50';
    carregarScriptWeb('donor-estoque.js');
    await global.window.buscarEstoqueDoadorAws();

    expect(ctx.document.getElementById('resumo-doador-total').textContent).toBe('2');
    expect(ctx.document.getElementById('resumo-doador-critico').textContent).toBe('1');

    // Paginação 1 por página
    ctx.document.getElementById('select-itens-doador').value = '1';
    global.window.alterarItensPorPaginaDoador();
    global.window.mudarPaginaEstoqueDoador(1);
    expect(ctx.document.getElementById('ind-pag-doador').textContent).toBe('2 / 2');
    global.window.mudarPaginaEstoqueDoador(-1);
    global.window.mudarPaginaEstoqueDoador(-1); // limite inferior ignorado

    // Filtro sem resultado -> estado vazio
    ctx.document.getElementById('busca-alimento').value = 'InexistenteXYZ';
    global.window.aplicarFiltrosEstoqueDoador(true);
    expect(ctx.document.getElementById('lista-estoque').innerHTML).toMatch(/Nenhum alimento encontrado/i);

    ctx.document.getElementById('busca-alimento').value = 'Arroz';
    ctx.document.getElementById('filtro-situacao').value = 'critico';
    global.window.aplicarFiltrosEstoqueDoador(true);
    expect(ctx.document.getElementById('lista-estoque').innerHTML).toContain('Arroz');

    global.window.limparFiltrosEstoqueDoador();
    expect(ctx.document.getElementById('busca-alimento').value).toBe('');

    ctx.fetch.mockRejectedValueOnce(new Error('Rede Doador'));
    await global.window.buscarEstoqueDoadorAws();
    expect(ctx.document.getElementById('lista-estoque').innerHTML).toMatch(/Não foi possível carregar/i);
  });

  test('donor-campanhas.js deve cobrir atalhos de estoque, pontos de coleta, validações e erros de submissão', async () => {
    const ctx = setupWebDom('https://doareguardar.org/views/donor/campanhas.html?item=Arroz');
    ctx.registerIds([
      'select-item-estoque-aws',
      'atalhos-itens-urgentes-campanha',
      'qtd-estoque-input',
      'data-inicio',
      'data-fim',
      'item-input',
      'qtd-input',
      'lista-metas',
      'btn-submit',
      'alerta-campanha-doador',
      'objetivo-campanha',
      'nome-campanha',
      'lista-pontos-coleta',
    ]);
    const pontoWrap = ctx.registerEl('div', 'wrap-ponto-1', 'ponto-coleta-item');
    const pontoInput = ctx.registerEl('input', 'ponto-1', 'input-ponto-coleta', pontoWrap);
    pontoInput.value = 'Rua Central, 10';
    ctx.document.getElementById('lista-pontos-coleta').appendChild(pontoWrap);
    global.window.usuarioDoadorLogado = () => ({ displayName: 'Ana', email: 'ana@gmail.com' });

    // Caso estoque vazio
    ctx.fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ sucesso: true, lotes: [] }) });
    carregarScriptWeb('donor-campanhas.js');
    global.window.inicializarFormularioCampanhaDoador();
    await new Promise((r) => setTimeout(r, 15));
    expect(ctx.document.getElementById('select-item-estoque-aws').innerHTML).toMatch(/Nenhum item cadastrado/i);

    // Caso erro ao carregar estoque
    ctx.fetch.mockRejectedValueOnce(new Error('Offline'));
    global.window.inicializarFormularioCampanhaDoador();
    await new Promise((r) => setTimeout(r, 15));

    // Estoque real com item urgente e regular
    ctx.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        sucesso: true,
        lotes: [
          { nome_produto: 'Leite UHT', quantidade_atual_pacote: 2, estoque_minimo_pacote: 10 },
          { nome_produto: 'Arroz Branco', quantidade_atual_pacote: 30, estoque_minimo_pacote: 10 },
        ],
      }),
    });
    global.window.inicializarFormularioCampanhaDoador();
    await new Promise((r) => setTimeout(r, 15));
    expect(ctx.document.getElementById('item-input').value).toBe('Arroz');

    // Validações select/genérico e seleção do estoque + atalho rápido
    global.window.adicionarItemDoEstoqueAws();
    expect(ctx.alert).toHaveBeenCalledWith(expect.stringMatching(/Selecione um alimento/));

    ctx.document.getElementById('select-item-estoque-aws').value = '0';
    global.window.aoSelecionarItemEstoqueAws();
    expect(ctx.document.getElementById('qtd-estoque-input').value).toBe(8);
    ctx.document.getElementById('qtd-estoque-input').value = '0';
    global.window.adicionarItemDoEstoqueAws();
    expect(ctx.alert).toHaveBeenCalledWith('Informe uma quantidade válida.');

    ctx.document.getElementById('select-item-estoque-aws').value = '0';
    ctx.document.getElementById('qtd-estoque-input').value = '12';
    global.window.adicionarItemDoEstoqueAws();
    global.window.adicionarItemEstoqueRapido(1);

    // Remover todos itens volta à linha vazia + validação item genérico vazio
    global.window.removerItemCampanhaDoador(0);
    global.window.removerItemCampanhaDoador(0);
    expect(ctx.document.getElementById('lista-metas').innerHTML).toContain('linha-vazia');
    ctx.document.getElementById('item-input').value = '';
    global.window.adicionarProximoItem();

    // Adicionar e remover pontos de coleta (inclui bloqueio ao tentar remover último ponto)
    global.exibirAlertaCampanhaDoador = jest.fn();
    global.window.adicionarPontoColeta();
    const pontosRows = ctx.document.getElementById('lista-pontos-coleta').querySelectorAll('.ponto-coleta-item');
    expect(pontosRows.length).toBe(2);
    const btnRem = pontosRows[1].querySelector('button');
    global.window.removerPontoColeta(btnRem);
    global.window.removerPontoColeta(pontosRows[0]);
    expect(global.exibirAlertaCampanhaDoador).toHaveBeenCalledWith(
      expect.stringMatching(/Pelo menos 1 ponto/),
      'erro'
    );

    // Validações de submeterCampanha: dataFim < dataInicio, sem itens, ponto vazio, API error e sucesso
    ctx.document.getElementById('data-inicio').value = '2026-12-20';
    ctx.document.getElementById('data-fim').value = '2026-11-20';
    await global.window.submeterCampanha({ preventDefault: jest.fn() });
    expect(ctx.alert).toHaveBeenCalledWith(expect.stringMatching(/data de término/));

    ctx.document.getElementById('data-inicio').value = '2026-11-20';
    ctx.document.getElementById('data-fim').value = '2026-12-20';
    await global.window.submeterCampanha({ preventDefault: jest.fn() });
    expect(ctx.alert).toHaveBeenCalledWith(expect.stringMatching(/pelo menos um alimento/i));

    ctx.document.getElementById('item-input').value = 'Leite Integral';
    ctx.document.getElementById('qtd-input').value = '30';
    global.window.adicionarProximoItem();
    pontoInput.value = '';
    await global.window.submeterCampanha({ preventDefault: jest.fn() });
    expect(global.exibirAlertaCampanhaDoador).toHaveBeenCalledWith(
      expect.stringMatching(/ponto de coleta/),
      'erro'
    );

    pontoInput.value = 'Rua Central, 10';
    ctx.document.getElementById('nome-campanha').value = 'Campanha Leite Solidário';
    ctx.document.getElementById('objetivo-campanha').value = 'Atender bebês da Casa da Criança';
    ctx.fetch.mockResolvedValueOnce({ ok: false, json: async () => ({ sucesso: false, mensagem: 'Erro servidor' }) });
    await global.window.submeterCampanha({ preventDefault: jest.fn() });
    expect(ctx.document.getElementById('alerta-campanha-doador').textContent).toMatch(/Erro servidor/);

    ctx.fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ sucesso: true }) });
    await global.window.submeterCampanha({ preventDefault: jest.fn() });
    expect(ctx.location.href).toContain('minhas-campanhas.html');
  });

  test('donor-minhas-campanhas.js e donor-configuracoes.js devem gerenciar campanhas, cancelamento, erros e acessibilidade', async () => {
    const ctx = setupWebDom('https://doareguardar.org/views/donor/minhas-campanhas.html');
    ctx.registerIds([
      'icone-sync-minhas',
      'loading',
      'lista-campanhas',
      'btn-escopo-minhas',
      'btn-escopo-todas',
      'count-minhas-todas',
      'count-minhas-pendente',
      'count-minhas-aprovada',
      'count-minhas-encerrada',
      'count-minhas-reprovada',
      'tab-minhas-TODAS',
      'tab-minhas-pendente',
      'tab-minhas-aprovada',
      'tab-minhas-encerrada',
      'tab-minhas-reprovada',
    ]);

    const itensTag = encodeURIComponent(JSON.stringify([{ nome: 'Arroz', meta: 10, recebido: 12 }]));
    ctx.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        sucesso: true,
        campanhas: [
          {
            id_campanha: 'c_d1',
            titulo: 'Proposta Pendente',
            responsavel: 'Ana (ana@gmail.com)',
            status_aprovacao: 'Pendente de Análise',
            meta: '25',
            data_fim: '2026-12-30',
          },
          {
            id_campanha: 'c_d2',
            titulo: 'Proposta Ativa',
            responsavel: 'Ana (ana@gmail.com)',
            status_aprovacao: 'Aprovada',
            meta: '40',
            itens_necessarios: 'Feijão (40 un.) [RECEBIDO:10]',
            data_fim: '2020-01-01',
          },
          {
            id_campanha: 'c_d3',
            titulo: 'Proposta Encerrada',
            responsavel: 'Ana (ana@gmail.com)',
            status_aprovacao: 'Encerrada',
            meta: '10',
            itens_necessarios: `Arroz (10 un.) [ITENS:${itensTag}] [RECEBIDO:12] [PARECER:Excelente]`,
            data_fim: '2026-10-01',
          },
          {
            id_campanha: 'c_d4',
            titulo: 'Proposta Recusada',
            responsavel: 'Comunidade',
            status_aprovacao: 'Reprovada',
            meta: '15',
            itens_necessarios: 'Sal [PARECER:Duplicada]',
            data_fim: '2026-11-01',
          },
        ],
      }),
    });

    carregarScriptWeb('donor-minhas-campanhas.js');
    await global.window.buscarMinhasCampanhasAws({ displayName: 'Ana', email: 'ana@gmail.com' });
    expect(ctx.document.getElementById('count-minhas-pendente').textContent).toBe('1');
    expect(ctx.document.getElementById('lista-campanhas').innerHTML).toContain('Proposta Pendente');

    // Todos os filtros (inclui filtro sem resultado) e escopo comunidade
    global.window.filtrarMinhasPorStatus('reprovada');
    expect(ctx.document.getElementById('lista-campanhas').innerHTML).toMatch(/Nenhuma campanha encontrada/i);
    global.window.alternarEscopoCampanhas(false);
    global.window.filtrarMinhasPorStatus('TODAS');
    expect(ctx.document.getElementById('lista-campanhas').innerHTML).toContain('Proposta Recusada');

    // Cancelar proposta (cancelado, erro e sucesso)
    ctx.confirm.mockReturnValueOnce(false);
    await global.window.cancelarPropostaPendente('c_d1', 'Proposta Pendente');
    ctx.fetch.mockRejectedValueOnce(new Error('Falha ao excluir'));
    await global.window.cancelarPropostaPendente('c_d1', 'Proposta Pendente');
    expect(ctx.alert).toHaveBeenCalledWith(expect.stringMatching(/Não foi possível cancelar/));
    await global.window.cancelarPropostaPendente('c_d1', 'Proposta Pendente');

    // Erro geral ao buscar minhas campanhas
    ctx.fetch.mockRejectedValueOnce(new Error('Rede offline'));
    await global.window.buscarMinhasCampanhasAws({ displayName: 'Ana', email: 'ana@gmail.com' });
    expect(ctx.document.getElementById('lista-campanhas').innerHTML).toMatch(/Não foi possível carregar suas campanhas/i);

    // Configurações & Opt-in LGPD & Acessibilidade
    ctx.registerIds([
      'feedback-config-doador',
      'perfil-nome',
      'perfil-email',
      'timestamp-consentimento',
      'perfil-whatsapp',
      'optin-whatsapp',
      'btn-salvar-config-doador',
      'status-alto-contraste',
      'btn-fonte-normal',
      'btn-fonte-media',
      'btn-fonte-grande',
    ]);
    carregarScriptWeb('accessibility.js');
    carregarScriptWeb('donor-configuracoes.js');

    ctx.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        sucesso: true,
        doadores: [{ email: 'ana@gmail.com', telefone_whatsapp: '19999998888', optin_mensageria: true }],
      }),
    });
    await global.window.carregarDadosPerfilDoador({ displayName: 'Ana', email: 'ana@gmail.com' });

    ctx.document.getElementById('perfil-whatsapp').value = '(19) 99999-8888';
    ctx.document.getElementById('optin-whatsapp').checked = true;
    ctx.fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ sucesso: true }) });
    await global.window.salvarConfiguracoesDoador({ preventDefault: jest.fn() });

    ctx.fetch.mockResolvedValueOnce({ ok: false, json: async () => ({ sucesso: false, mensagem: 'Erro perfil' }) });
    await global.window.salvarConfiguracoesDoador({ preventDefault: jest.fn() });
    expect(ctx.document.getElementById('feedback-config-doador').innerHTML).toMatch(/Erro ao salvar/i);

    global.window.alternarAltoContrastePagina();
    global.window.definirTamanhoFontePagina('media');
    expect(ctx.localStorage.getItem('dg_fonte')).toBe('media');
    global.window.definirTamanhoFontePagina('grande');
    expect(ctx.localStorage.getItem('dg_fonte')).toBe('grande');
    global.window.restaurarAcessibilidadePadrao();
    expect(ctx.localStorage.getItem('dg_fonte')).toBe('normal');
  });
});
