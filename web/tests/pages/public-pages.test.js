const fs = require('fs');
const path = require('path');

const WEB_ROOT = path.resolve(__dirname, '../..');

describe('Páginas Públicas HTML (index.html e como-onde-doar.html)', () => {
  it('index.html deve validar HTML5, viewport, recursos locais e controles públicos', () => {
    const fullPath = path.join(WEB_ROOT, 'index.html');
    expect(fs.existsSync(fullPath)).toBe(true);
    const html = fs.readFileSync(fullPath, 'utf8');

    expect(html).toMatch(/<!DOCTYPE html>/i);
    expect(html).toMatch(/<html[^>]+lang="pt-BR"/i);
    expect(html).toMatch(/<meta[^>]+name="viewport"/i);
    expect(html).toMatch(/<title>[^<]*(Doar|Casa da Criança)[^<]*<\/title>/i);

    const pageDir = path.dirname(fullPath);
    const localAssets = [
      ...html.matchAll(/<(?:script|link)[^>]+(?:src|href)="([^"]+)"/gi),
    ]
      .map((m) => m[1])
      .filter((u) => !u.startsWith('http://') && !u.startsWith('https://') && !u.startsWith('#') && !u.startsWith('data:'));

    expect(localAssets.length).toBeGreaterThan(0);
    localAssets.forEach((asset) => {
      const clean = asset.split('?')[0].split('#')[0];
      expect(fs.existsSync(path.resolve(pageDir, clean))).toBe(true);
    });

    expect(html).toMatch(/alternarAltoContraste\(\)/);
    expect(html).toMatch(/alternarTamanhoFonte\(\)/);
    expect(html).toMatch(/realizarLoginGoogle/);
    expect(html).toMatch(/realizarLoginCredenciais/);
    expect(html).toMatch(/toggleItensCriticos/);
    expect(html).toMatch(/landing-campanhas-ativas/);
  });

  it('como-onde-doar.html deve redirecionar com segurança para index.html#como-doar', () => {
    const html = fs.readFileSync(
      path.join(WEB_ROOT, 'views/public/como-onde-doar.html'),
      'utf8'
    );
    expect(html).toMatch(/<html[^>]+lang="pt-BR"/i);
    expect(html).toContain('../../index.html#como-doar');
  });
});
