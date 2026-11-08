const fs = require('fs');
const path = require('path');

describe('Página Web Pública: Como e Onde Doar (web/views/public/como-onde-doar.html)', () => {
  const html = fs.readFileSync(path.resolve(__dirname, '../../../views/public/como-onde-doar.html'), 'utf-8');

  it('deve conter o redirecionamento para a seção #como-doar da página unificada', () => {
    expect(html).toContain('index.html#como-doar');
    expect(html).toContain('Doar e Guardar - Como e Onde Doar');
  });
});
