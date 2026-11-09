// app-mobile/src/services/api.ts
export const API_BASE_URL = 'https://zqc7b27zwivnfyczo5kedb3vta0evazc.lambda-url.us-east-2.on.aws';

interface RequisicaoHttpOptions {
  metodo?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  dados?: any;
  token?: string;
  timeoutMs?: number;
}

export async function requisicaoApi<T>(rota: string, options: RequisicaoHttpOptions = {}): Promise<T> {
  const { metodo = 'GET', dados, token, timeoutMs = 12000 } = options;
  const rotaFormatada = rota.startsWith('/') ? rota : `/${rota}`;
  const urlCompleta = `${API_BASE_URL}${rotaFormatada}`;

  console.log(`[CLIENTE AWS REAL] Disparando ${metodo} para: ${urlCompleta}`);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let resposta: Response;
  try {
    resposta = await fetch(urlCompleta, {
      method: metodo,
      headers,
      body: dados ? JSON.stringify(dados) : undefined,
      signal: controller.signal,
    });
  } catch (err: any) {
    clearTimeout(timer);
    if (err?.name === 'AbortError') {
      throw new Error('Tempo limite excedido ao comunicar com o servidor AWS. Tente novamente.');
    }
    throw new Error('Falha de conexão com os serviços AWS. Verifique sua conexão com a internet.');
  } finally {
    clearTimeout(timer);
  }

  // Lê como texto primeiro para proteger contra respostas não-JSON (como 502/504)
  const textoResposta = await resposta.text();
  let payload: any = {};

  try {
    payload = JSON.parse(textoResposta);
  } catch {
    payload = { mensagem: textoResposta || `Erro HTTP ${resposta.status}` };
  }

  if (!resposta.ok) {
    throw new Error(payload.mensagem || payload.erro || `Falha na requisição: status ${resposta.status}`);
  }

  return payload as T;
}
