const fs = require('fs');
const path = require('path');

describe('Página Web Doador: Configurações e LGPD (web/views/donor/configuracoes.html)', () => {
  const html = fs.readFileSync(path.resolve(__dirname, '../../../views/donor/configuracoes.html'), 'utf-8');

  it('deve conter o título de Configurações da Conta e opções de Meu Perfil & LGPD', () => {
    expect(html).toContain('<title>Configurações da Conta | Casa da Criança</title>');
    expect(html).toContain('Meu Perfil & LGPD');
    expect(html).toContain('../../public/js/accessibility.js');
  });
});
