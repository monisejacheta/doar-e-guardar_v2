const fs = require('fs');
const path = require('path');

describe('Página Admin: Moderação de Campanhas (web/views/admin/moderacao-campanhas.html)', () => {
  const htmlPath = path.resolve(__dirname, '../../../views/admin/moderacao-campanhas.html');
  let htmlContent = '';

  beforeAll(() => {
    htmlContent = fs.readFileSync(htmlPath, 'utf8');
  });

  it('deve carregar o arquivo HTML de moderação de campanhas', () => {
    expect(htmlContent.length).toBeGreaterThan(100);
    expect(htmlContent).toContain('Moderação de Campanhas | Casa da Criança');
  });

  it('deve conter as abas de status de campanha e contadores de curadoria', () => {
    expect(htmlContent).toContain('Moderação de Campanhas Solidárias');
    expect(htmlContent).toContain('id="tab-status-pendente"');
    expect(htmlContent).toContain('id="tab-status-aprovada"');
    expect(htmlContent).toContain('id="tab-status-reprovada"');
    expect(htmlContent).toContain('id="tab-status-TODAS"');
  });

  it('deve conter o modal de criação de campanha oficial pela instituição', () => {
    expect(htmlContent).toContain('id="modal-nova-campanha-admin"');
  });
});
