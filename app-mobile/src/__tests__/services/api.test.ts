import { API_BASE_URL, requisicaoApi } from '../../services/api';

describe('services/api.ts', () => {
  it('deve exportar API_BASE_URL da AWS Lambda', () => {
    expect(API_BASE_URL).toContain('https://');
    expect(API_BASE_URL).toContain('lambda-url');
  });

  it('deve disparar requisição GET com headers corretos', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: () => Promise.resolve(JSON.stringify({ sucesso: true, itens: [1, 2] })),
    });

    const res = await requisicaoApi<{ sucesso: boolean; itens: number[] }>('api/estoque', {
      token: 'jwt-abc',
    });

    expect(res.sucesso).toBe(true);
    expect(res.itens).toEqual([1, 2]);
    expect(global.fetch).toHaveBeenCalledWith(
      `${API_BASE_URL}/api/estoque`,
      expect.objectContaining({
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer jwt-abc',
        },
        body: undefined,
      })
    );
  });

  it('deve disparar requisição POST com payload JSON', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: () => Promise.resolve(JSON.stringify({ sucesso: true })),
    });

    const res = await requisicaoApi<{ sucesso: boolean }>('/api/estoque', {
      metodo: 'POST',
      dados: { acao: 'consultar_estoque' },
    });

    expect(res.sucesso).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith(
      `${API_BASE_URL}/api/estoque`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ acao: 'consultar_estoque' }),
      })
    );
  });

  it('deve tratar erro HTTP com corpo JSON e corpo texto', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 422,
      text: () => Promise.resolve(JSON.stringify({ mensagem: 'Saldo insuficiente' })),
    });

    await expect(requisicaoApi('/api/estoque')).rejects.toThrow('Saldo insuficiente');

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 502,
      text: () => Promise.resolve('Bad Gateway'),
    });

    await expect(requisicaoApi('/api/estoque')).rejects.toThrow('Bad Gateway');
  });

  it('deve tratar falha de rede e AbortError de timeout', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network down'));
    await expect(requisicaoApi('/api/estoque')).rejects.toThrow(
      'Não foi possível conectar. Verifique sua internet.'
    );

    const abortErr = new Error('Aborted');
    abortErr.name = 'AbortError';
    (global.fetch as jest.Mock).mockRejectedValueOnce(abortErr);
    await expect(requisicaoApi('/api/estoque')).rejects.toThrow(
      'A conexão demorou muito para responder. Tente novamente.'
    );
  });
});
