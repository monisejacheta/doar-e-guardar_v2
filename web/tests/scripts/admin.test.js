describe('Script Web: Módulo Administrativo (web/public/js/admin.js)', () => {
  let store = {};

  beforeEach(() => {
    jest.resetModules();
    store = {};

    global.localStorage = {
      getItem: jest.fn((k) => (k in store ? store[k] : null)),
      setItem: jest.fn((k, v) => {
        store[k] = String(v);
      }),
      removeItem: jest.fn((k) => {
        delete store[k];
      }),
    };

    global.window = {
      location: {
        replace: jest.fn(),
        href: '',
      },
    };

    global.document = {
      body: { appendChild: jest.fn() },
      createElement: jest.fn(() => ({ id: '', className: '', innerHTML: '' })),
      getElementById: jest.fn((id) => {
        if (id === 'sidebar-admin-container') {
          return { outerHTML: '' };
        }
        return null;
      }),
    };

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        sucesso: true,
        lotes: [
          {
            id_lote_produto: 'lote_1',
            numero_codigo_lote: 'L01',
            nome_produto: 'Feijão Carioca',
            marca_produto: 'Kicaldo',
            categoria: 'Grãos',
            quantidade_atual_pacote: 4,
            estoque_minimo_pacote: 10,
            data_validade_lote: '2027-12-31',
            local_descricao: 'armario a - prat. 1',
          },
        ],
        locais: [],
        movimentacoes: [
          {
            id_movimentacao_estoque: 'mov_1',
            operacao: 'ENTRADA',
            nome_produto: 'Feijão Carioca',
            quantidade_movimentada_pacote: 4,
            data_hora_movimentacao: '2026-04-01T12:00:00Z',
          },
        ],
        campanhas: [
          {
            id_campanha_doacao: 'camp_1',
            nome_campanha: 'Inverno Solidário',
            status_campanha: 'Aprovada',
          },
        ],
        itens: [],
      }),
    });

    require('../../public/js/admin.js');
  });

  it('deve normalizar nomes de prateleiras com sinônimos e prefixos padrão', () => {
    expect(window.normalizarNomePrateleira('armario a - prat. 1')).toBe('Armário A - Prateleira 1');
    expect(window.normalizarNomePrateleira('despensa lateral')).toBe('Armário despensa lateral');
    expect(window.normalizarNomePrateleira(null)).toBe('Armário A - Prateleira 1');
  });

  it('deve validar sessão administrativa e realizar logout', () => {
    expect(window.verificarAutenticacaoAdmin()).toBeNull();
    expect(window.location.replace).toHaveBeenCalledWith('../../index.html#modal-login');

    store['dg_sessao_admin'] = JSON.stringify({
      role: 'administrador',
      email: 'casadacrianca@adm',
      nome: 'Admin Teste',
    });
    const sessao = window.verificarAutenticacaoAdmin();
    expect(sessao).not.toBeNull();
    expect(sessao.email).toBe('casadacrianca@adm');

    window.renderizarSidebarAdmin('dashboard');
    window.realizarLogoutAdmin();
    expect(store['dg_sessao_admin']).toBeUndefined();
  });

  it('deve calcular dias restantes de validade, classificar FEFO e formatar datas BR', () => {
    expect(window.calcularDiasRestantesValidade('')).toBe(999);
    expect(window.calcularDiasRestantesValidade('31/12/2030')).toBeGreaterThan(0);

    expect(window.classificarStatusFefo(-1).codigo).toBe('vencido');
    expect(window.classificarStatusFefo(5).codigo).toBe('critico');
    expect(window.classificarStatusFefo(20).codigo).toBe('atencao');
    expect(window.classificarStatusFefo(60).codigo).toBe('seguro');

    expect(window.formatarDataBr('2026-08-15')).toBe('15/08/2026');
    expect(window.formatarDataBr('15/08/2026')).toBe('15/08/2026');
    expect(window.formatarDataBr('')).toBe('--/--/----');
  });

  it('deve carregar e reconciliar dados de estoque, locais e campanhas da AWS', async () => {
    const dados = await window.carregarDadosEstoqueAws();
    expect(dados.lotes.length).toBe(1);
    expect(dados.lotes[0].localArmazenamento).toBe('Armário A - Prateleira 1');
    expect(dados.metricas.qtdAbaixoMinimo).toBe(1);

    const campanhas = await window.carregarCampanhasReconciliadas();
    expect(campanhas.length).toBe(1);
    expect(campanhas[0].status).toBe('aprovada');

    const atualizadas = await window.salvarOuModerarCampanhaAdmin(
      { id_campanha_doacao: 'camp_2', nome_campanha: 'Natal Sem Fome', status_campanha: 'Reprovada' },
      true
    );
    expect(atualizadas.length).toBeGreaterThanOrEqual(2);
  });
});
