import AsyncStorage from '@react-native-async-storage/async-storage';
import * as apiModule from '../../services/api';
import {
  alternarVisibilidadeCategoria,
  carregarCategoriasComEstado,
  criarEPersistirCategoria,
} from '../../services/categoriesService';

describe('services/categoriesService.ts', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('deve carregar categorias do DynamoDB via AWS e detectar ocultas', async () => {
    const spyApi = jest.spyOn(apiModule, 'requisicaoApi').mockResolvedValueOnce({
      sucesso: true,
      categorias: [
        { id_categoria_alimento: 'cat1', nome_categoria: 'Grãos e Cereais', status_ativo: true },
        { id_categoria_alimento: 'cat2', nome_categoria: 'Doces', oculta: true },
        'Laticínios',
      ],
    });

    const res = await carregarCategoriasComEstado();
    expect(res.origemServidor).toBe(true);
    expect(res.categorias).toHaveLength(3);
    expect(res.categorias[1].oculta).toBe(true);
    spyApi.mockRestore();
  });

  it('deve usar cache offline se AWS falhar', async () => {
    const spyApi = jest.spyOn(apiModule, 'requisicaoApi');
    spyApi.mockResolvedValueOnce({
      sucesso: true,
      categorias: ['Massas', 'Grãos'],
    });
    await carregarCategoriasComEstado();

    spyApi.mockRejectedValue(new Error('offline'));
    const offline = await carregarCategoriasComEstado();
    expect(offline.origemServidor).toBe(false);
    expect(offline.categorias.map((c) => c.nome)).toEqual(['Massas', 'Grãos']);
    spyApi.mockRestore();
  });

  it('deve validar tamanho mínimo ao criar categoria e sincronizar com AWS', async () => {
    const invalida = await criarEPersistirCategoria('A');
    expect(invalida.sucesso).toBe(false);

    const spyApi = jest.spyOn(apiModule, 'requisicaoApi').mockResolvedValueOnce({
      sucesso: true,
    });
    const criada = await criarEPersistirCategoria('Hortifrúti');
    expect(criada.sucesso).toBe(true);
    expect(criada.sincronizadaAws).toBe(true);

    await alternarVisibilidadeCategoria('Hortifrúti', true);
    spyApi.mockRestore();
  });
});
