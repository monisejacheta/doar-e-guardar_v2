// app-mobile/src/services/authService.ts

export interface UsuarioAutenticado {
  nome: string;
  email: string;
  funcao: string;
  foto?: string;
}

const ENDERECO_SERVICO = process.env.EXPO_PUBLIC_API_URL || '';

export const authService = {
  /**
   * Envia os dados de entrada para confirmação na central
   */
  async entrarComGoogle(tokenIdentificacao: string): Promise<UsuarioAutenticado> {
    try {
      if (!ENDERECO_SERVICO) {
        // Modo de demonstração enquanto o serviço na nuvem estiver sendo configurado
        return {
          nome: 'Colaborador da Casa da Criança',
          email: 'colaborador@casadacrianca.org.br',
          funcao: 'Atendimento e Estoque',
        };
      }

      const resposta = await fetch(ENDERECO_SERVICO, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: tokenIdentificacao }),
      });

      const retorno = await resposta.json();

      if (!resposta.ok) {
        throw new Error(retorno.mensagem || 'Não conseguimos concluir sua entrada agora. Tente novamente em breve.');
      }

      return retorno.usuario;
    } catch (erro: any) {
      if (erro.message.includes('Network') || erro.message.includes('Failed to fetch')) {
        throw new Error('Parece que o celular está sem internet no momento. Verifique sua conexão e tente de novo.');
      }
      throw new Error(erro.message || 'Tivemos uma pequena dificuldade para entrar. Por favor, tente mais uma vez.');
    }
  },
};