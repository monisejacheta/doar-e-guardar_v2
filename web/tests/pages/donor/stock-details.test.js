const fs = require('fs');
const path = require('path');

describe('Página Web Doador: Detalhes dos Lotes (web/views/donor/stock-details.html)', () => {
  const html = fs.readFileSync(path.resolve(__dirname, '../../../views/donor/stock-details.html'), 'utf-8');

  it('deve conter o cabeçalho Detalhes dos Lotes e botão de voltar ao estoque geral', () => {
    expect(html).toContain('Detalhes dos Lotes');
    expect(html).toContain('Voltar ao Estoque Geral');
  });
});
