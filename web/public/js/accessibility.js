function alternarAltoContraste() {
  const htmlElement = document.documentElement;
  htmlElement.classList.toggle('high-contrast');
  
  const ativo = htmlElement.classList.contains('high-contrast');
  localStorage.setItem('dg_alto_contraste', ativo ? 'true' : 'false');
}

function alternarTamanhoFonte() {
  const htmlElement = document.documentElement;
  let estadoAtual = localStorage.getItem('dg_fonte') || 'normal';

  // Ciclo: Normal -> Grande -> Extra -> Normal
  if (estadoAtual === 'normal') {
    htmlElement.style.fontSize = '115%'; // Aumenta tudo proporcionalmente
    localStorage.setItem('dg_fonte', 'large');
  } else if (estadoAtual === 'large') {
    htmlElement.style.fontSize = '130%'; 
    localStorage.setItem('dg_fonte', 'extra');
  } else {
    htmlElement.style.fontSize = '100%'; 
    localStorage.setItem('dg_fonte', 'normal');
  }
}

// Carregar preferências ao entrar na página
window.addEventListener('DOMContentLoaded', () => {
  const htmlElement = document.documentElement;
  
  if (localStorage.getItem('dg_alto_contraste') === 'true') {
    htmlElement.classList.add('high-contrast');
  }
  
  const fonteSalva = localStorage.getItem('dg_fonte');
  if (fonteSalva === 'large') {
    htmlElement.style.fontSize = '115%';
  } else if (fonteSalva === 'extra') {
    htmlElement.style.fontSize = '130%';
  }
});


if (typeof window !== 'undefined') {
  window.alternarAltoContraste = alternarAltoContraste;
  window.alternarTamanhoFonte = alternarTamanhoFonte;
}
