// web/public/js/carousel.js
let slideAtual = 0;
const totalSlides = 3; // 0: Início, 1: Nossa História, 2: Como e Onde Doar

function moverSlide(direcao) {
  slideAtual = (slideAtual + direcao + totalSlides) % totalSlides;
  atualizarCarrossel();
}

function irParaSlide(indice) {
  if (indice < 0 || indice >= totalSlides) return;
  slideAtual = indice;
  atualizarCarrossel();
}

function atualizarCarrossel() {
  const container = document.getElementById('carousel-container');
  if (container) {
    container.style.transform = `translateX(-${slideAtual * 100}%)`;
  }

  // Atualiza os indicadores inferiores (bolinhas do carrossel)
  for (let i = 0; i < totalSlides; i++) {
    const dot = document.getElementById(`carousel-dot-${i}`);
    if (dot) {
      if (i === slideAtual) {
        dot.className = 'w-8 h-3 rounded-full bg-brandBlue transition-all duration-300 shadow-sm';
      } else {
        dot.className = 'w-3 h-3 rounded-full bg-white/80 hover:bg-white border border-blue-200 transition-all duration-300';
      }
    }
  }

  // Atualiza o destaque dos links nos menus laterais (público, doador e admin)
  document.querySelectorAll('[data-slide-nav]').forEach((link) => {
    const idx = parseInt(link.getAttribute('data-slide-nav'), 10);
    if (idx === slideAtual) {
      link.className =
        'flex items-center gap-3 px-4 py-3 bg-white rounded-xl text-brandBlue shadow-sm font-semibold transition hover:bg-blue-50';
    } else {
      link.className =
        'flex items-center gap-3 px-4 py-3 rounded-xl text-blue-900 hover:bg-white/60 transition font-medium';
    }
  });
}

window.moverSlide = moverSlide;
window.irParaSlide = irParaSlide;

document.addEventListener('DOMContentLoaded', () => {
  const hash = (window.location.hash || '').toLowerCase();
  if (hash === '#nossa-historia' || hash === '#historia') {
    irParaSlide(1);
  } else if (hash === '#como-doar' || hash === '#como-onde-doar' || hash === '#doar') {
    irParaSlide(2);
  } else {
    atualizarCarrossel();
  }

  if (hash === '#modal-login' && typeof window.abrirModal === 'function') {
    const temSessaoAdmin = !!localStorage.getItem('dg_sessao_admin');
    if (!temSessaoAdmin) {
      window.abrirModal('modal-login');
    } else if (window.history && window.history.replaceState) {
      window.history.replaceState(null, '', window.location.pathname);
    }
  }

  // Navegação acessível pelas setas do teclado quando não estiver digitando em um input
  document.addEventListener('keydown', (e) => {
    const tag = (document.activeElement?.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
    if (e.key === 'ArrowLeft') moverSlide(-1);
    if (e.key === 'ArrowRight') moverSlide(1);
  });
});
