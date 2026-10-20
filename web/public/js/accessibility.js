// web/public/js/accessibility.js
function alternarAltoContraste() {
  document.body.classList.toggle('high-contrast');
  const ativo = document.body.classList.contains('high-contrast');
  localStorage.setItem('dg_alto_contraste', ativo ? 'true' : 'false');
}

function alternarTamanhoFonte() {
  if (document.body.classList.contains('font-extra')) {
    document.body.classList.remove('font-large', 'font-extra');
    localStorage.setItem('dg_fonte', 'normal');
  } else if (document.body.classList.contains('font-large')) {
    document.body.classList.remove('font-large');
    document.body.classList.add('font-extra');
    localStorage.setItem('dg_fonte', 'extra');
  } else {
    document.body.classList.add('font-large');
    localStorage.setItem('dg_fonte', 'large');
  }
}

// Carregar preferências salvas do usuário
window.addEventListener('DOMContentLoaded', () => {
  if (localStorage.getItem('dg_alto_contraste') === 'true') {
    document.body.classList.add('high-contrast');
  }
  const fonteSalva = localStorage.getItem('dg_fonte');
  if (fonteSalva === 'large') document.body.classList.add('font-large');
  if (fonteSalva === 'extra') document.body.classList.add('font-extra');
});