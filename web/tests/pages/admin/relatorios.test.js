const fs = require('fs');
const path = require('path');

describe('Página Admin: Central de Relatórios (web/views/admin/relatorios.html)', () => {
  const htmlPath = path.resolve(__dirname, '../../../views/admin/relatorios.html');
  let htmlContent = '';

  beforeAll(() => {
    htmlContent = fs.readFileSync(htmlPath, 'utf8');
  });

  it('deve carregar o arquivo HTML da central de relatórios', () => {
    expect(htmlContent.length).toBeGreaterThan(100);
    expect(htmlContent).toContain('Central de Relatórios (AWS) | Casa da Criança');
  });

  it('deve conter os seletores de tipo de relatório e botões de exportação CSV/PDF', () => {
    expect(htmlContent).toContain('Central de Relatórios e Prestação de Contas');
    expect(htmlContent).toContain('id="tipo-relatorio"');
    expect(htmlContent).toContain('id="relatorio-prateleira"');
    expect(htmlContent).toContain('exportarRelatorioCsv()');
    expect(htmlContent).toContain('window.print()');
  });
});
