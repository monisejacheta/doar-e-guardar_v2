// app-mobile/src/app/stock-remove.tsx (Trecho principal de comunicação com o backend)
import { requisicaoApi } from '../services/api';

// 1. Carregamento dos lotes reais ao abrir a tela:
const carregarLotesReais = async () => {
  try {
    const resposta: any = await requisicaoApi('/api/estoque', {
      metodo: 'POST',
      dados: { modulo: 'estoque', acao: 'consultar_estoque' },
    });
    if (resposta?.sucesso && Array.isArray(resposta.lotes)) {
      setLotes(resposta.lotes); // Lotes reais do DynamoDB
    }
  } catch (erro) {
    Alert.alert('Erro', 'Não foi possível carregar os lotes do banco de dados.');
  }
};

// 2. Confirmação da baixa de estoque em tempo real na AWS:
const executarBaixaEstoque = async () => {
  try {
    const resposta: any = await requisicaoApi('/api/estoque', {
      metodo: 'POST',
      dados: {
        modulo: 'estoque',
        acao: 'remover_estoque',
        id_lote_produto: loteSelecionado.id_lote_produto,
        quantidade: quantidadeSaida,
        motivo_saida: motivoSelecionado,
        palavra_confirmacao: palavraPerda,
        justificativa: justificativa,
        id_usuario: auth.currentUser?.uid || '',
      },
    });

    if (resposta?.sucesso) {
      Alert.alert('Sucesso', 'Baixa registrada com sucesso no DynamoDB!');
      carregarLotesReais(); // Atualiza a lista na hora
    } else {
      Alert.alert('Atenção', resposta.mensagem || 'Falha ao processar saída.');
    }
  } catch (erro: any) {
    Alert.alert('Erro na operação', erro.message || 'Falha na comunicação.');
  }
};