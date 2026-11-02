let slideAtual = 0;
const totalSlides = 2; // Slide 1 (Boas-vindas) e Slide 2 (Institucional)

function moverSlide(direcao) {
  slideAtual += direcao;
  
  if (slideAtual < 0) {
    slideAtual = 0;
  } else if (slideAtual >= totalSlides) {
    slideAtual = totalSlides - 1;
  }
  
  atualizarCarrossel();
}

function irParaSlide(indice) {
  slideAtual = indice;
  atualizarCarrossel();
}

function atualizarCarrossel() {
  const container = document.getElementById('carousel-container');
  // Move o container X vezes 100% para a esquerda
  container.style.transform = `translateX(-${slideAtual * 100}%)`;
}