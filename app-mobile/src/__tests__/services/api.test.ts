import { requisicaoApi, API_BASE_URL } from '../../services/api';

describe('Serviço de API (api.ts)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('deve realizar uma requisição GET com sucesso', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: () => Promise.resolve(JSON.stringify({ sucesso: true, dados: [1, 2, 3] })),
    });

    const resultado = await requisicaoApi<{ sucesso: boolean; dados: number[] }>('/api/teste');

    expect(global.fetch).toHaveBeenCalledWith(`${API_BASE_URL}/api/teste`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      body: undefined,
    });
    expect(resultado).toEqual({ sucesso: true, dados: [1, 2, 3] });
  });

  it('deve adicionar barra inicial na rota e enviar token e body em requisição POST', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: () => Promise.resolve(JSON.stringify({ sucesso: true })),
    });

    await requisicaoApi('api/estoque', {
      metodo: 'POST',
      dados: { acao: 'consultar' },
      token: 'meu-token-jwt',
    });

    expect(global.fetch).toHaveBeenCalledWith(`${API_BASE_URL}/api/estoque`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer meu-token-jwt',
      },
      body: JSON.stringify({ acao: 'consultar' }),
    });
  });

  it('deve lançar erro quando a resposta HTTP não for ok (JSON com mensagem)', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 400,
      text: () => Promise.resolve(JSON.stringify({ mensagem: 'Parâmetros inválidos' })),
    });

    await expect(requisicaoApi('/api/erro')).rejects.toThrow('Parâmetros inválidos');
  });

  it('deve tratar respostas não-JSON (ex: erro 502 Bad Gateway)', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 502,
      text: () => Promise.resolve('Bad Gateway'),
    });

    await expect(requisicaoApi('/api/erro-502')).rejects.toThrow('Bad Gateway');
  });
});
