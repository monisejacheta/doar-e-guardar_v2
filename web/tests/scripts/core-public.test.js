const { setupWebDom, carregarScriptWeb } = require('../helpers/domMock');

describe('Scripts Públicos & Compartilhados (accessibility, carousel, estoque-publico, index-publico, sidebar-doador)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('accessibility.js deve alternar alto contraste, tamanho da fonte (115%/130%/100%) e restaurar no DOMContentLoaded', () => {
    const ctx = setupWebDom();
    carregarScriptWeb('accessibility.js');

    global.window.alternarAltoContraste();
    expect(ctx.document.documentElement.classList.contains('high-contrast')).toBe(true);
    expect(ctx.localStorage.getItem('dg_alto_contraste')).toBe('true');

    global.window.alternarAltoContraste();
    expect(ctx.document.documentElement.classList.contains('high-contrast')).toBe(false);
    expect(ctx.localStorage.getItem('dg_alto_contraste')).toBe('false');

    global.window.alternarTamanhoFonte();
    expect(ctx.localStorage.getItem('dg_fonte')).toBe('large');
    expect(ctx.document.documentElement.style.fontSize).toBe('115%');
    global.window.alternarTamanhoFonte();
    expect(ctx.localStorage.getItem('dg_fonte')).toBe('extra');
    expect(ctx.document.documentElement.style.fontSize).toBe('130%');
    global.window.alternarTamanhoFonte();
    expect(ctx.localStorage.getItem('dg_fonte')).toBe('normal');
    expect(ctx.document.documentElement.style.fontSize).toBe('100%');

    // Restauração 'large' e 'extra' no DOMContentLoaded
    ctx.localStorage.setItem('dg_alto_contraste', 'true');
    ctx.localStorage.setItem('dg_fonte', 'large');
    global.window.dispatchEvent({ type: 'DOMContentLoaded' });
    expect(ctx.document.documentElement.classList.contains('high-contrast')).toBe(true);
    expect(ctx.document.documentElement.style.fontSize).toBe('115%');

    ctx.localStorage.setItem('dg_fonte', 'extra');
    global.window.dispatchEvent({ type: 'DOMContentLoaded' });
    expect(ctx.document.documentElement.style.fontSize).toBe('130%');
  });

  test('carousel.js deve avançar/retroceder slides, atualizar indicadores, responder a ArrowLeft/ArrowRight e hashes', () => {
    const ctx = setupWebDom('https://doareguardar.org/index.html#como-doar');
    const container = ctx.registerEl('div', 'carousel-container');
    for (let i = 0; i < 3; i++) {
      ctx.registerEl('div', `carousel-dot-${i}`);
      const navLink = ctx.registerEl('a', `nav-${i}`);
      navLink.setAttribute('data-slide-nav', String(i));
    }

    carregarScriptWeb('carousel.js');
    ctx.dispararDOMContentLoaded();

    expect(typeof global.window.moverSlide).toBe('function');
    expect(typeof global.window.irParaSlide).toBe('function');
    expect(container.style.transform).toBe('translateX(-200%)');

    global.window.moverSlide(1);
    expect(container.style.transform).toBe('translateX(-0%)');

    global.window.irParaSlide(1);
    expect(container.style.transform).toBe('translateX(-100%)');

    ctx.document.dispatchEvent({ type: 'keydown', key: 'ArrowRight' });
    expect(container.style.transform).toBe('translateX(-200%)');
    ctx.document.dispatchEvent({ type: 'keydown', key: 'ArrowLeft' });
    expect(container.style.transform).toBe('translateX(-100%)');

    // Ignora setas quando foco está em INPUT
    ctx.document.activeElement = { tagName: 'INPUT' };
    ctx.document.dispatchEvent({ type: 'keydown', key: 'ArrowLeft' });
    expect(container.style.transform).toBe('translateX(-100%)');

    // Testa hash #nossa-historia (recarrega script isoladamente para disparar DOMContentLoaded)
    jest.resetModules();
    const ctxHist = setupWebDom('https://doareguardar.org/index.html#nossa-historia');
    const contHist = ctxHist.registerEl('div', 'carousel-container');
    carregarScriptWeb('carousel.js');
    ctxHist.dispararDOMContentLoaded();
    expect(contHist.style.transform).toBe('translateX(-100%)');

    // Testa hash #modal-login sem sessão e com sessão admin
    jest.resetModules();
    const ctxLogin1 = setupWebDom('https://doareguardar.org/index.html#modal-login');
    ctxLogin1.registerEl('div', 'carousel-container');
    global.window.abrirModal = jest.fn();
    carregarScriptWeb('carousel.js');
    ctxLogin1.dispararDOMContentLoaded();
    expect(global.window.abrirModal).toHaveBeenCalledWith('modal-login');

    jest.resetModules();
    const ctxLogin2 = setupWebDom('https://doareguardar.org/index.html#modal-login');
    ctxLogin2.registerEl('div', 'carousel-container');
    ctxLogin2.localStorage.setItem('dg_sessao_admin', '1');
    global.window.abrirModal = jest.fn();
    carregarScriptWeb('carousel.js');
    ctxLogin2.dispararDOMContentLoaded();
    expect(ctxLogin2.history.replaceState).toHaveBeenCalled();
  });

  test('estoque-publico.js deve consultar AWS, calcular críticos, alternar painel, tratar vazio/erro e escapar XSS', async () => {
    const ctx = setupWebDom();
    ctx.registerEl('div', 'container-itens-criticos', 'hidden');
    ctx.registerEl('i', 'icone-expandir');
    ctx.registerEl('div', 'loading-criticos');
    ctx.registerEl('div', 'lista-itens-criticos', 'hidden');

    ctx.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        sucesso: true,
        lotes: [
          {
            nome_produto: '<script>alert(1)</script>Arroz',
            categoria: 'Grãos',
            quantidade_atual_pacote: 2,
            estoque_minimo_pacote: 10,
          },
          {
            nome_produto: 'Óleo de Soja',
            categoria: 'Óleos',
            quantidade_atual_pacote: 20,
            estoque_minimo_pacote: 10,
          },
        ],
      }),
    });

    carregarScriptWeb('estoque-publico.js');
    global.window.toggleItensCriticos();
    await new Promise((r) => setTimeout(r, 20));

    const html = ctx.document.getElementById('lista-itens-criticos').innerHTML;
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');

    // Recolhe o painel
    global.window.toggleItensCriticos();
    expect(ctx.document.getElementById('container-itens-criticos').classList.contains('hidden')).toBe(true);

    // Todos itens regulares (nenhum crítico)
    ctx.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        sucesso: true,
        lotes: [{ nome_produto: 'Açúcar', categoria: 'Mercearia', quantidade_atual_pacote: 30, estoque_minimo_pacote: 10 }],
      }),
    });
    await global.window.buscarItensCriticosAws();
    expect(ctx.document.getElementById('lista-itens-criticos').innerHTML).toContain('Açúcar');
    expect(ctx.document.getElementById('lista-itens-criticos').innerHTML).toContain('Bem-vindo');

    // Caso de erro HTTP !ok / rede
    ctx.fetch.mockResolvedValueOnce({ ok: false, status: 500 });
    await global.window.buscarItensCriticosAws();
    expect(ctx.document.getElementById('lista-itens-criticos').innerHTML).toMatch(/Não foi possível|Erro/i);

    ctx.fetch.mockRejectedValueOnce(new Error('Network down'));
    await global.window.buscarItensCriticosAws();
    expect(ctx.document.getElementById('lista-itens-criticos').innerHTML).toMatch(/Não foi possível|Erro/i);
  });

  test('index-publico.js deve carregar campanhas ativas (vazio, [ITENS:], erro) na landing e abrir modais', async () => {
    const ctx = setupWebDom();
    ctx.registerIds([
      'landing-campanhas-ativas',
      'avatar-visitante',
      'avatar-modal-boas-vindas',
      'detalhe-camp-titulo',
      'detalhe-camp-data',
      'detalhe-camp-responsavel',
      'detalhe-camp-descricao',
      'detalhe-camp-locais',
      'detalhe-camp-itens',
    ]);
    ctx.document.getElementById('avatar-visitante').src = 'https://img.example/avatar.png';
    global.window.abrirModal = jest.fn();

    const itensCod = encodeURIComponent(JSON.stringify([{ nome: 'Feijão', meta: 15 }]));
    ctx.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        sucesso: true,
        campanhas: [
          {
            id_campanha: 'c1',
            titulo: 'Campanha Inverno',
            status_aprovacao: 'Aprovada',
            data_fim: '2026-12-30',
            responsavel: 'Coordenação',
            itens_necessarios: `[ITENS:${itensCod}] [COLETAS:Sede Centro|Filial Sul]`,
            descricao: 'Arrecadação emergencial\nPontos de Coleta: Ponto A; Ponto B',
          },
          {
            id_campanha: 'c_sem_extra',
            titulo: 'Campanha Sem Detalhes',
            status_aprovacao: 'Ativa',
            itens_necessarios: '',
            descricao: 'Pontos de Coleta: Portaria Principal; Anexo B',
          },
          {
            id_campanha: 'c2',
            titulo: 'Campanha Pendente',
            status_aprovacao: 'Pendente',
          },
        ],
      }),
    });

    carregarScriptWeb('index-publico.js');
    await global.window.carregarCampanhasAtivasLanding();

    const listaHtml = ctx.document.getElementById('landing-campanhas-ativas').innerHTML;
    expect(listaHtml).toContain('Campanha Inverno');
    expect(listaHtml).not.toContain('Campanha Pendente');

    global.window.abrirModalBoasVindasPublico();
    expect(ctx.document.getElementById('avatar-modal-boas-vindas').src).toBe('https://img.example/avatar.png');
    expect(global.window.abrirModal).toHaveBeenCalledWith('modal-boas-vindas-publico');

    global.window.abrirDetalhesCampanhaPublico(0);
    expect(ctx.document.getElementById('detalhe-camp-titulo').textContent).toBe('Campanha Inverno');
    expect(ctx.document.getElementById('detalhe-camp-itens').innerHTML).toContain('Feijão');
    expect(global.window.abrirModal).toHaveBeenCalledWith('modal-detalhes-campanha-publico');

    // Campanha sem responsável e sem itens
    global.window.abrirDetalhesCampanhaPublico(1);
    expect(ctx.document.getElementById('detalhe-camp-responsavel').classList.contains('hidden')).toBe(true);
    expect(ctx.document.getElementById('detalhe-camp-itens').innerHTML).toContain('Alimentos não perecíveis');

    // Lista vazia de campanhas ativas e falha de rede
    ctx.fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ sucesso: true, campanhas: [] }) });
    await global.window.carregarCampanhasAtivasLanding();
    expect(ctx.document.getElementById('landing-campanhas-ativas').innerHTML).toMatch(/Nenhuma campanha ativa/i);

    ctx.fetch.mockRejectedValueOnce(new Error('Offline'));
    await global.window.carregarCampanhasAtivasLanding();
    expect(ctx.document.getElementById('landing-campanhas-ativas').innerHTML).toMatch(/Consulte nossas campanhas/i);
  });

  test('sidebar-doador.js deve renderizar menu lateral do doador e atualizar nome do usuário', () => {
    const ctx = setupWebDom('https://doareguardar.org/views/donor/dashboardDoador.html');
    ctx.registerEl('div', 'sidebar-doador-container');
    ctx.registerEl('span', 'sidebar-nome-doador');
    carregarScriptWeb('sidebar-doador.js');

    global.window.renderizarSidebarDoador('dashboard', {
      displayName: 'Maria Doadora',
      email: 'maria@gmail.com',
    });

    const html = ctx.document.getElementById('sidebar-doador-container').outerHTML;
    expect(html).toContain('dashboardDoador.html');
    expect(html).toContain('Maria Doadora');

    global.window.atualizarUsuarioSidebarDoador({
      displayName: 'João Apoiador',
      email: 'joao@gmail.com',
    });
    expect(ctx.document.getElementById('sidebar-nome-doador').textContent).toBe('João Apoiador');

    // Fallback sem displayName (usa parte do e-mail)
    global.window.atualizarUsuarioSidebarDoador({ email: 'apoiador@teste.org' });
    expect(ctx.document.getElementById('sidebar-nome-doador').textContent).toBe('apoiador');
  });
});
