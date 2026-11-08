const fs = require('fs');
const path = require('path');

describe('Página Web Doador: Estoque Transparente (web/views/donor/estoque.html)', () => {
  const html = fs.readFileSync(path.resolve(__dirname, '../../../views/donor/estoque.html'), 'utf-8');

  it('deve conter a visualização de Estoque Transparente para o doador', () => {
    expect(html).toContain('<title>Estoque Transparente | Casa da Criança</title>');
    expect(html).toContain('Estoque Transparente');
    expect(html).toContain('Painel do Doador');
  });
});
