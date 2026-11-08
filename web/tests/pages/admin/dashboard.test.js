const fs = require('fs');
const path = require('path');

describe('Página Admin: Dashboard Administrativo (web/views/admin/dashboard.html)', () => {
  const htmlPath = path.resolve(__dirname, '../../../views/admin/dashboard.html');
  let htmlContent = '';

  beforeAll(() => {
    htmlContent = fs.readFileSync(htmlPath, 'utf8');
  });

  it('deve carregar o arquivo HTML do dashboard administrativo', () => {
    expect(htmlContent.length).toBeGreaterThan(100);
    expect(htmlContent).toContain('Dashboard Administrativo | Casa da Criança');
  });

  it('deve conter os KPIs de monitoramento em tempo real e alertas FEFO', () => {
    expect(htmlContent).toContain('Visão Geral da Instituição');
    expect(htmlContent).toContain('id="kpi-total-unidades"');
    expect(htmlContent).toContain('id="kpi-abaixo-minimo"');
    expect(htmlContent).toContain('id="kpi-fefo-alerta"');
    expect(htmlContent).toContain('id="kpi-campanhas-pendentes"');
  });

  it('deve referenciar os scripts de administração e acessibilidade', () => {
    expect(htmlContent).toContain('../../public/js/admin.js');
    expect(htmlContent).toContain('../../public/js/accessibility.js');
  });
});
