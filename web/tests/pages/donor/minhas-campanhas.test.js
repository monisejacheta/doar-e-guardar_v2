const fs = require('fs');
const path = require('path');

describe('Página Web Doador: Minhas Campanhas (web/views/donor/minhas-campanhas.html)', () => {
  const html = fs.readFileSync(path.resolve(__dirname, '../../../views/donor/minhas-campanhas.html'), 'utf-8');

  it('deve conter a estrutura de acompanhamento de Minhas Campanhas do doador', () => {
    expect(html).toContain('<title>Minhas Campanhas | Casa da Criança</title>');
    expect(html).toContain('Minhas Campanhas');
    expect(html).toContain('alternarAltoContraste()');
  });
});
