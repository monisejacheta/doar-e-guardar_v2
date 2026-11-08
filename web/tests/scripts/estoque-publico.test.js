describe('Script Web: Estoque Público (web/public/js/estoque-publico.js)', () => {
  let containerEl;
  let iconeEl;
  let loadingEl;
  let listaUlEl;

  beforeEach(() => {
    jest.resetModules();

    const makeClassList = (initial = []) => {
      const set = new Set(initial);
      return {
        contains: (c) => set.has(c),
        add: (c) => set.add(c),
        remove: (c) => set.delete(c),
      };
    };

    containerEl = { classList: makeClassList(['hidden']) };
    iconeEl = { classList: makeClassList([]) };
    loadingEl = { classList: makeClassList([]) };
    listaUlEl = {
      innerHTML: '',
      children: [],
      classList: makeClassList(['hidden']),
      appendChild: jest.fn(function (el) {
        this.children.push(el);
      }),
    };

    global.window = {};
    global.document = {
      createElement: jest.fn((tag) => {
        const el = { tagName: tag, className: '', innerHTML: '' };
        Object.defineProperty(el, 'textContent', {
          set(val) {
            this.innerHTML = String(val)
              .replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;');
          },
        });
        return el;
      }),
      getElementById: jest.fn((id) => {
        if (id === 'container-itens-criticos') return containerEl;
        if (id === 'icone-expandir') return iconeEl;
        if (id === 'loading-criticos') return loadingEl;
        if (id === 'lista-itens-criticos') return listaUlEl;
        return null;
      }),
    };

    global.fetch = jest.fn().mockResolvedValue({
      json: async () => ({
        sucesso: true,
        lotes: [
          {
            nome_produto: 'Arroz Tipo 1',
            marca_produto: 'Camil',
            categoria: 'Grãos',
            quantidade_atual_pacote: 3,
            estoque_minimo_pacote: 10,
          },
        ],
      }),
    });

    require('../../public/js/estoque-publico.js');
  });

  it('deve escapar caracteres especiais HTML com escaparHtml', () => {
    expect(window.escaparHtml('<script>alert(1)</script>')).toBe('&lt;script&gt;alert(1)&lt;/script&gt;');
  });

  it('deve expandir e recolher a seção de itens críticos com toggleItensCriticos', async () => {
    window.toggleItensCriticos();
    expect(containerEl.classList.contains('hidden')).toBe(false);
    expect(iconeEl.classList.contains('rotate-180')).toBe(true);

    window.toggleItensCriticos();
    expect(containerEl.classList.contains('hidden')).toBe(true);
  });

  it('deve buscar e renderizar itens críticos da AWS Lambda com buscarItensCriticosAws', async () => {
    await window.buscarItensCriticosAws();
    expect(global.fetch).toHaveBeenCalled();
    expect(listaUlEl.appendChild).toHaveBeenCalled();
    expect(loadingEl.classList.contains('hidden')).toBe(true);
  });

  it('deve exibir mensagem de estoque regular quando não houver produtos cadastrados', () => {
    window.renderizarListaCriticos([], []);
    expect(listaUlEl.innerHTML).toContain('Nosso estoque está regular no momento!');
  });
});
