const fs = require('fs');
const path = require('path');

const WEB_ROOT = path.resolve(__dirname, '../..');

describe('Páginas do Portal do Doador HTML (web/views/donor/*.html)', () => {
  const paginasDonor = [
    { file: 'views/donor/dashboardDoador.html', mustContain: ['doador-camp-ativas', 'doador-lista-urgentes', 'sidebar-doador.js'] },
    { file: 'views/donor/campanhas.html', mustContain: ['select-item-estoque-aws', 'lista-metas', 'donor-campanhas.js'] },
    { file: 'views/donor/configuracoes.html', mustContain: ['perfil-nome', 'perfil-whatsapp', 'optin-whatsapp', 'donor-configuracoes.js'] },
    { file: 'views/donor/estoque.html', mustContain: ['lista-estoque', 'busca-alimento', 'donor-estoque.js'] },
    { file: 'views/donor/minhas-campanhas.html', mustContain: ['lista-campanhas', 'count-minhas-todas', 'donor-minhas-campanhas.js'] },
    { file: 'views/donor/stock-details.html', mustContain: ['accessibility.js'] },
  ];

  test.each(paginasDonor)(
    '$file deve possuir estrutura válida, navegação do doador e IDs essenciais',
    ({ file, mustContain }) => {
      const fullPath = path.join(WEB_ROOT, file);
      expect(fs.existsSync(fullPath)).toBe(true);
      const html = fs.readFileSync(fullPath, 'utf8');

      expect(html).toMatch(/<!DOCTYPE html>/i);
      expect(html).toMatch(/<html[^>]+lang="pt-BR"/i);
      expect(html).toMatch(/<meta[^>]+name="viewport"/i);
      expect(html).toMatch(/accessibility\.js/);

      mustContain.forEach((token) => {
        expect(html).toContain(token);
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
