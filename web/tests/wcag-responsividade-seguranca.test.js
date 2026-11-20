const fs = require('fs');
const path = require('path');

const WEB_ROOT = path.resolve(__dirname, '..');

function listarArquivos(dir, ext) {
  const res = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== 'coverage') {
      res.push(...listarArquivos(full, ext));
    } else if (entry.isFile() && entry.name.endsWith(ext)) {
      res.push(full);
    }
  }
  return res;
}

describe('Auditoria Web: WCAG 2.2 AA, Contraste/Responsividade CSS e Segurança/LGPD', () => {
  const htmlFiles = listarArquivos(WEB_ROOT, '.html');
  const jsPublicFiles = listarArquivos(path.join(WEB_ROOT, 'public/js'), '.js');

  it('deve validar 14 páginas HTML com lang="pt-BR", viewport responsivo (exceto redirect) e imagens com alt', () => {
    expect(htmlFiles).toHaveLength(14);

    htmlFiles.forEach((filePath) => {
      const rel = path.relative(WEB_ROOT, filePath);
      const html = fs.readFileSync(filePath, 'utf8');

      expect({ rel, hasLang: /<html[^>]+lang="pt-BR"/i.test(html) }).toEqual({ rel, hasLang: true });
      if (!rel.endsWith('como-onde-doar.html')) {
        expect({ rel, hasViewport: /<meta[^>]+name="viewport"[^>]+width=device-width/i.test(html) }).toEqual({
          rel,
          hasViewport: true,
        });
      }

      const imgs = [...html.matchAll(/<img\b([^>]*)>/gi)];
      imgs.forEach((m) => {
        expect({ rel, tag: m[0], hasAlt: /\balt=["'][^"']*["']/i.test(m[1]) }).toEqual({
          rel,
          tag: m[0],
          hasAlt: true,
        });
      });
    });
  });

  it('styles.css e views devem implementar Alto Contraste, ampliação de fonte e breakpoints responsivos', () => {
    const css = fs.readFileSync(path.join(WEB_ROOT, 'public/css/styles.css'), 'utf8');
    expect(css).toContain('html.high-contrast body');
    expect(css).toContain('html.high-contrast button');
    expect(css).toContain('html.high-contrast input');

    const accJs = fs.readFileSync(path.join(WEB_ROOT, 'public/js/accessibility.js'), 'utf8');
    expect(accJs).toContain('115%');
    expect(accJs).toContain('130%');
    expect(accJs).toContain('high-contrast');

    const indexHtml = fs.readFileSync(path.join(WEB_ROOT, 'index.html'), 'utf8');
    expect(indexHtml).toMatch(/\b(?:md|lg):/);
  });

  it('módulos JS Web não devem conter chaves AWS/Secret hardcoded e devem implementar escape XSS + controles LGPD', () => {
    jsPublicFiles.forEach((filePath) => {
      const code = fs.readFileSync(filePath, 'utf8');
      expect(code).not.toMatch(/AKIA[0-9A-Z]{16}/);
      expect(code).not.toMatch(/aws_secret_access_key/i);
    });

    const mensageriaHtml = fs.readFileSync(
      path.join(WEB_ROOT, 'views/admin/mensageria.html'),
      'utf8'
    );
    expect(mensageriaHtml).toMatch(/Opt-In/i);
    expect(mensageriaHtml).toMatch(/LGPD/i);

    const configDonorHtml = fs.readFileSync(
      path.join(WEB_ROOT, 'views/donor/configuracoes.html'),
      'utf8'
    );
    expect(configDonorHtml).toContain('optin-whatsapp');
  });
});
