const fs = require('fs');
const path = require('path');

const WEB_ROOT = path.resolve(__dirname, '../..');

describe('Páginas Administrativas HTML (web/views/admin/*.html)', () => {
  const paginasAdmin = [
    { file: 'views/admin/dashboard.html', ids: ['kpi-total-unidades', 'kpi-abaixo-minimo', 'kpi-fefo-alerta', 'kpi-campanhas-pendentes', 'sidebar-admin-container'] },
    { file: 'views/admin/consulta-avancada.html', ids: ['busca-termo', 'tbody-consulta-lotes', 'filtro-prateleira', 'filtro-categoria'] },
    { file: 'views/admin/locais-armazenamento.html', ids: ['grid-locais-armazenamento', 'busca-local', 'filtro-tipo-local', 'stat-total-locais'] },
    { file: 'views/admin/mensageria.html', ids: ['msg-item-critico', 'lista-campanhas-ativas-wpp', 'feedback-mensageria'] },
    { file: 'views/admin/moderacao-campanhas.html', ids: ['lista-campanhas-moderacao', 'count-pendente', 'count-aprovada'] },
    { file: 'views/admin/relatorios.html', ids: ['tipo-relatorio', 'grafico-principal', 'grafico-secundario', 'thead-relatorio', 'tbody-relatorio'] },
  ];

  test.each(paginasAdmin)(
    '$file deve possuir estrutura válida, scripts existentes em disco e IDs esperados',
    ({ file, ids }) => {
      const fullPath = path.join(WEB_ROOT, file);
      expect(fs.existsSync(fullPath)).toBe(true);
      const html = fs.readFileSync(fullPath, 'utf8');

      expect(html).toMatch(/<!DOCTYPE html>/i);
      expect(html).toMatch(/<html[^>]+lang="pt-BR"/i);
      expect(html).toMatch(/<meta[^>]+name="viewport"/i);
      expect(html).toMatch(/accessibility\.js/);
      expect(html).toMatch(/<main[\s>]/i);
      expect(html).toMatch(/<h1[\s>]/i);

      ids.forEach((id) => {
        expect(html).toContain(`id="${id}"`);
      });

      const pageDir = path.dirname(fullPath);
      const localAssets = [
        ...html.matchAll(/<(?:script|link)[^>]+(?:src|href)="([^"]+)"/gi),
      ]
        .map((m) => m[1])
        .filter((u) => !u.startsWith('http://') && !u.startsWith('https://') && !u.startsWith('#') && !u.startsWith('data:'));

      localAssets.forEach((asset) => {
        const clean = asset.split('?')[0].split('#')[0];
        expect(fs.existsSync(path.resolve(pageDir, clean))).toBe(true);
      });
    }
  );
});
