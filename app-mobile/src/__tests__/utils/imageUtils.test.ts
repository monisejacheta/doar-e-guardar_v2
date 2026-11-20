import { obterPlaceholderLocalPorCategoria, resolverFotoProduto } from '../../utils/imageUtils';

describe('utils/imageUtils.ts', () => {
  it('deve mapear categorias para placeholders locais oficiais', () => {
    expect(obterPlaceholderLocalPorCategoria('Laticínios')).toBe('test-file-stub');
    expect(obterPlaceholderLocalPorCategoria('Grãos e Cereais')).toBe('test-file-stub');
    expect(obterPlaceholderLocalPorCategoria('Massas')).toBe('test-file-stub');
    expect(obterPlaceholderLocalPorCategoria('Óleos e Temperos')).toBe('test-file-stub');
    expect(obterPlaceholderLocalPorCategoria('Outros')).toBe('test-file-stub');
  });

  it('deve filtrar placeholders remotos S3/placeholder.com e preservar fotos HTTPS reais', () => {
    expect(resolverFotoProduto(null, 'Grãos')).toBe('test-file-stub');
    expect(resolverFotoProduto('https://via.placeholder.com/150', 'Grãos')).toBe('test-file-stub');
    expect(resolverFotoProduto('https://bucket.s3.amazonaws.com/img.png', 'Massas')).toBe(
      'test-file-stub'
    );
    expect(resolverFotoProduto('https://images.openfoodfacts.org/foto.jpg', 'Laticínios')).toEqual({
      uri: 'https://images.openfoodfacts.org/foto.jpg',
    });
  });
});
