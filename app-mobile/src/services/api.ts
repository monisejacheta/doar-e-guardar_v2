// app-mobile/src/services/api.ts
import { Platform } from 'react-native';

// Se estiver rodando no navegador (Web), usa localhost.
// No emulador Android do Android Studio, usa 10.0.2.2.
const API_BASE_URL = Platform.select({
  web: 'http://localhost:3000',
  android: 'http://10.0.2.2:3000',
  ios: 'http://localhost:3000',
  default: 'http://localhost:3000',
});

interface RequisicaoHttpOptions {
  metodo?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  dados?: any;
  token?: string;
}

export async function requisicaoApi<T>(rota: string, options: RequisicaoHttpOptions = {}): Promise<T> {
  const { metodo = 'GET', dados, token } = options;
  const urlCompleta = `${API_BASE_URL}${rota}`;

  console.log(`[CLIENTE API] Disparando ${metodo} para: ${urlCompleta}`);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const resposta = await fetch(urlCompleta, {
    method: metodo,
    headers,
    body: dados ? JSON.stringify(dados) : undefined,
  });

  const payload = await resposta.json();

  if (!resposta.ok) {
    throw new Error(payload.mensagem || payload.erro || 'Erro na comunicação com o servidor.');
  }

  return payload as T;
}