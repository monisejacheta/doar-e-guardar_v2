describe('Script Web: Acessibilidade (web/public/js/accessibility.js)', () => {
  let store = {};
  let classes = new Set();
  let domLoadedHandler = null;

  beforeEach(() => {
    jest.resetModules();
    store = {};
    classes = new Set();
    domLoadedHandler = null;

    global.localStorage = {
      getItem: jest.fn((k) => (k in store ? store[k] : null)),
      setItem: jest.fn((k, v) => {
        store[k] = String(v);
      }),
    };

    global.document = {
      documentElement: {
        style: { fontSize: '100%' },
        classList: {
          toggle: jest.fn((cls) => {
            if (classes.has(cls)) classes.delete(cls);
            else classes.add(cls);
          }),
          contains: jest.fn((cls) => classes.has(cls)),
          add: jest.fn((cls) => classes.add(cls)),
        },
      },
    };

    global.window = {
      addEventListener: jest.fn((evt, cb) => {
        if (evt === 'DOMContentLoaded') domLoadedHandler = cb;
      }),
    };

    require('../../public/js/accessibility.js');
  });

  it('deve alternar o modo de alto contraste e persistir no localStorage', () => {
    window.alternarAltoContraste();
    expect(classes.has('high-contrast')).toBe(true);
    expect(store['dg_alto_contraste']).toBe('true');

    window.alternarAltoContraste();
    expect(classes.has('high-contrast')).toBe(false);
    expect(store['dg_alto_contraste']).toBe('false');
  });

  it('deve ciclar o tamanho da fonte entre normal -> large -> extra -> normal', () => {
    window.alternarTamanhoFonte();
    expect(document.documentElement.style.fontSize).toBe('115%');
    expect(store['dg_fonte']).toBe('large');

    window.alternarTamanhoFonte();
    expect(document.documentElement.style.fontSize).toBe('130%');
    expect(store['dg_fonte']).toBe('extra');

    window.alternarTamanhoFonte();
    expect(document.documentElement.style.fontSize).toBe('100%');
    expect(store['dg_fonte']).toBe('normal');
  });

  it('deve restaurar as preferências salvas ao disparar DOMContentLoaded', () => {
    store['dg_alto_contraste'] = 'true';
    store['dg_fonte'] = 'large';
    if (domLoadedHandler) domLoadedHandler();
    expect(classes.has('high-contrast')).toBe(true);
    expect(document.documentElement.style.fontSize).toBe('115%');

    store['dg_fonte'] = 'extra';
    if (domLoadedHandler) domLoadedHandler();
    expect(document.documentElement.style.fontSize).toBe('130%');
  });
});
