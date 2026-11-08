const fs = require('fs');
const path = require('path');

describe('Página Web Doador: Propor Campanha (web/views/donor/campanhas.html)', () => {
  const html = fs.readFileSync(path.resolve(__dirname, '../../../views/donor/campanhas.html'), 'utf-8');

  it('deve conter o cabeçalho Propor Campanha, menu lateral do doador e botão de contraste', () => {
    expect(html).toContain('<title>Criar Campanha | Casa da Criança</title>');
    expect(html).toContain('Propor Campanha');
    expect(html).toContain('alternarAltoContraste()');
    expect(html).toContain('realizarLogout()');
  });
});
