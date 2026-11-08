describe('Script Web: Carrossel Institucional (web/public/js/carousel.js)', () => {
  let containerEl;
  let dots;
  let navLinks;
  let domHandlers = {};

  beforeEach(() => {
    jest.resetModules();
    domHandlers = {};
    containerEl = { style: { transform: '' } };
    dots = [
      { className: '' },
      { className: '' },
      { className: '' },
    ];
    navLinks = [
      { getAttribute: () => '0', className: '' },
      { getAttribute: () => '1', className: '' },
      { getAttribute: () => '2', className: '' },
    ];

    global.localStorage = {
      getItem: jest.fn(() => null),
    };

    global.window = {
      location: { hash: '#nossa-historia', pathname: '/index.html' },
      history: { replaceState: jest.fn() },
      abrirModal: jest.fn(),
    };

    global.document = {
      activeElement: { tagName: 'BODY' },
      getElementById: jest.fn((id) => {
        if (id === 'carousel-container') return containerEl;
        if (id === 'carousel-dot-0') return dots[0];
        if (id === 'carousel-dot-1') return dots[1];
        if (id === 'carousel-dot-2') return dots[2];
        return null;
      }),
      querySelectorAll: jest.fn(() => navLinks),
      addEventListener: jest.fn((evt, cb) => {
        domHandlers[evt] = cb;
      }),
    };

    require('../../public/js/carousel.js');
  });

  it('deve navegar para um slide específico com irParaSlide e ignorar índices inválidos', () => {
    window.irParaSlide(2);
    expect(containerEl.style.transform).toBe('translateX(-200%)');
    expect(dots[2].className).toContain('bg-brandBlue');

    window.irParaSlide(-1);
    expect(containerEl.style.transform).toBe('translateX(-200%)');

    window.irParaSlide(99);
    expect(containerEl.style.transform).toBe('translateX(-200%)');
  });

  it('deve avançar e retroceder ciclicamente com moverSlide', () => {
    window.irParaSlide(0);
    window.moverSlide(1);
    expect(containerEl.style.transform).toBe('translateX(-100%)');

    window.moverSlide(-1);
    expect(containerEl.style.transform).toBe('translateX(-0%)');

    window.moverSlide(-1);
    expect(containerEl.style.transform).toBe('translateX(-200%)');
  });

  it('deve processar hash inicial e navegação por setas no DOMContentLoaded', () => {
    if (domHandlers['DOMContentLoaded']) {
      domHandlers['DOMContentLoaded']();
    }
    expect(containerEl.style.transform).toBe('translateX(-100%)');

    if (domHandlers['keydown']) {
      domHandlers['keydown']({ key: 'ArrowRight' });
      expect(containerEl.style.transform).toBe('translateX(-200%)');
      domHandlers['keydown']({ key: 'ArrowLeft' });
      expect(containerEl.style.transform).toBe('translateX(-100%)');
    }
  });
});
