const fs = require('fs');
const path = require('path');

describe('Página Admin: Locais de Armazenamento (web/views/admin/locais-armazenamento.html)', () => {
  const htmlPath = path.resolve(__dirname, '../../../views/admin/locais-armazenamento.html');
  let htmlContent = '';

  beforeAll(() => {
    htmlContent = fs.readFileSync(htmlPath, 'utf8');
  });

  it('deve carregar o arquivo HTML de locais de armazenamento', () => {
    expect(htmlContent.length).toBeGreaterThan(100);
    expect(htmlContent).toContain('Armários e Geladeiras (AWS) | Casa da Criança');
  });

  it('deve conter a diretriz US06 e a reconciliação com AWS', () => {
    expect(htmlContent).toContain('Diretriz US06');
    expect(htmlContent).toContain('sincronizarLocaisComAws()');
    expect(htmlContent).toContain('cadastrarNovoLocalAws(event)');
  });

  it('deve conter o formulário de cadastro/edição de prateleira ou compartimento', () => {
    expect(htmlContent).toContain('id="local-nome-movel"');
    expect(htmlContent).toContain('id="local-sublocal"');
    expect(htmlContent).toContain('id="local-tipo"');
  });
});
