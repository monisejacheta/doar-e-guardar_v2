const fs = require('fs');
const path = require('path');

describe('Página Web Doador: Dashboard do Doador (web/views/donor/dashboardDoador.html)', () => {
  const html = fs.readFileSync(path.resolve(__dirname, '../../../views/donor/dashboardDoador.html'), 'utf-8');

  it('deve conter a estrutura do Painel do Doador, identificação do parceiro e navegação', () => {
    expect(html).toContain('<title>Painel do Doador | Casa da Criança</title>');
    expect(html).toContain('id="sidebar-nome-doador"');
    expect(html).toContain('Doador Parceiro');
    expect(html).toContain('Dashboard Doador');
  });
});
