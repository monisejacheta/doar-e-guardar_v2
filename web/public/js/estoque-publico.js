// Variável de controle para não recarregar os dados na AWS desnecessariamente
let dadosCarregados = false; 

function toggleItensCriticos() {
  const container = document.getElementById('container-itens-criticos');
  const icone = document.getElementById('icone-expandir');
  
  if (container.classList.contains('hidden')) {
    // Abrir o acordeão
    container.classList.remove('hidden');
    icone.classList.add('rotate-180');
    
    // Disparar a requisição apenas na primeira vez que abrir
    if (!dadosCarregados) {
      buscarItensCriticosAws();
    }
  } else {
    // Fechar o acordeão
    container.classList.add('hidden');
    icone.classList.remove('rotate-180');
  }
}

async function buscarItensCriticosAws() {
  const loadingDiv = document.getElementById('loading-criticos');
  const listaUl = document.getElementById('lista-itens-criticos');
  
  // URL Oficial do Backend Serverless no AWS Lambda do Projeto Doar&Guardar
  const API_AWS_URL = 'https://zqc7b27zwivnfyczo5kedb3vta0evazc.lambda-url.us-east-2.on.aws/api/estoque';

  try {
    const resposta = await fetch(API_AWS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // Corpo formatado conforme o handler Python configurado
      body: JSON.stringify({ acao: 'consultar_estoque' })
    });

    const dados = await resposta.json();

    if (dados.sucesso && Array.isArray(dados.lotes)) {
      // Filtrar apenas lotes que estejam com quantidade inferior ao estoque mínimo
      const itensCriticos = dados.lotes.filter(lote => {
        const saldo = parseInt(lote.quantidade_atual_pacote, 10);
        const minimo = parseInt(lote.estoque_minimo_pacote, 10);
        return saldo < minimo;
      });

      renderizarListaCriticos(itensCriticos);
    } else {
      throw new Error("Formato de dados inesperado");
    }

  } catch (erro) {
    console.error("Falha ao comunicar com o DynamoDB:", erro);
    listaUl.innerHTML = `
      <div class="col-span-1 sm:col-span-2 p-4 bg-red-50 border border-red-200 rounded-2xl text-center text-red-800 text-sm">
        <i class="ph ph-warning-circle text-2xl mb-1"></i><br>
        Não foi possível carregar o status do estoque no momento.
      </div>
    `;
  } finally {
    loadingDiv.classList.add('hidden');
    listaUl.classList.remove('hidden');
    dadosCarregados = true;
  }
}

function renderizarListaCriticos(itens) {
  const listaUl = document.getElementById('lista-itens-criticos');
  listaUl.innerHTML = '';

  if (itens.length === 0) {
    listaUl.innerHTML = `
      <div class="col-span-1 sm:col-span-2 p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center text-emerald-800">
        <i class="ph-fill ph-check-circle text-3xl mb-2 text-emerald-600"></i>
        <p class="font-bold">Nosso estoque está regular no momento!</p>
        <p class="text-sm mt-1">Agradecemos o apoio contínuo. Qualquer doação geral continua sendo bem-vinda.</p>
      </div>
    `;
    return;
  }

  // Agrupar e Renderizar os cards
  itens.forEach(item => {
    const li = document.createElement('li');
    li.className = 'bg-white border border-slate-200 p-4 rounded-2xl flex items-center justify-between gap-3 shadow-sm hover:border-brandBlue transition';
    
    // Identidade Visual de Aviso (Amarelo)
    li.innerHTML = `
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 bg-pastelYellow/40 rounded-full flex items-center justify-center flex-shrink-0 text-yellow-700">
          <i class="ph ph-warning text-xl"></i>
        </div>
        <div>
          <p class="font-bold text-slate-800 text-sm">${item.nome_produto}</p>
          <p class="text-xs text-slate-500">${item.marca_produto || 'Diversas Marcas'} • ${item.categoria}</p>
        </div>
      </div>
      <div class="text-right">
        <span class="block text-xs font-bold text-yellow-700 bg-yellow-100 px-2 py-1 rounded">
          Faltam itens
        </span>
      </div>
    `;
    listaUl.appendChild(li);
  });
}