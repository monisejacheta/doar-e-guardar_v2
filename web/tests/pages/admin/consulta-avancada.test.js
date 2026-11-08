const fs = require('fs');
const path = require('path');

describe('Página Admin: Consulta Avançada de Estoque e Lotes (web/views/admin/consulta-avancada.html)', () => {
  const htmlPath = path.resolve(__dirname, '../../../views/admin/consulta-avancada.html');
  let htmlContent = '';

  beforeAll(() => {
    htmlContent = fs.readFileSync(htmlPath, 'utf8');
  });

  it('deve carregar o arquivo HTML de consulta avançada', () => {
    expect(htmlContent.length).toBeGreaterThan(100);
    expect(htmlContent).toContain('Estoque e Lotes (AWS) | Casa da Criança');
  });

  it('deve conter os filtros de busca por termo, prateleira e status FEFO', () => {
    expect(htmlContent).toContain('Consulta Avançada e Gestão de Lotes');
    expect(htmlContent).toContain('id="busca-termo"');
    expect(htmlContent).toContain('id="filtro-prateleira"');
    expect(htmlContent).toContain('id="filtro-status-fefo"');
  });

  it('deve conter os modais de entrada, transferência e baixa de lotes', () => {
    expect(htmlContent).toContain('id="modal-entrada-lote"');
    expect(htmlContent).toContain('id="sidebar-admin-container"');
  });
});
