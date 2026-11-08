const fs = require('fs');
const path = require('path');

describe('Página Admin: Mensageria e LGPD (web/views/admin/mensageria.html)', () => {
  const htmlPath = path.resolve(__dirname, '../../../views/admin/mensageria.html');
  let htmlContent = '';

  beforeAll(() => {
    htmlContent = fs.readFileSync(htmlPath, 'utf8');
  });

  it('deve carregar o arquivo HTML da central de mensageria e LGPD', () => {
    expect(htmlContent.length).toBeGreaterThan(100);
    expect(htmlContent).toContain('Mensageria & LGPD | Casa da Criança');
  });

  it('deve conter o formulário de disparo de alertas e conformidade LGPD', () => {
    expect(htmlContent).toContain('Central de Mensageria e Alertas LGPD');
    expect(htmlContent).toContain('Conformidade LGPD');
    expect(htmlContent).toContain('id="msg-item-critico"');
    expect(htmlContent).toContain('id="msg-canal"');
    expect(htmlContent).toContain('id="msg-texto-personalizado"');
  });
});
