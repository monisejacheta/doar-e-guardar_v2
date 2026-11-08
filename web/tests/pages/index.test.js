const fs = require('fs');
const path = require('path');

describe('Página Web: Portal Institucional Principal (web/index.html)', () => {
  const html = fs.readFileSync(path.resolve(__dirname, '../../index.html'), 'utf-8');

  it('deve conter o título institucional e menus de navegação público e doador', () => {
    expect(html).toContain('<title>Casa da Criança | Doar & Guardar</title>');
    expect(html).toContain('id="menu-publico"');
    expect(html).toContain('id="menu-doador"');
    expect(html).toContain('id="nome-usuario"');
  });

  it('deve importar os scripts de acessibilidade, carrossel e estoque público', () => {
    expect(html).toContain('./public/js/accessibility.js');
    expect(html).toContain('./public/js/carousel.js');
    expect(html).toContain('./public/js/estoque-publico.js');
  });
});
