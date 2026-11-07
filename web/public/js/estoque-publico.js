// Variável de controle para não recarregar os dados na AWS desnecessariamente
let dadosCarregados = false;

function escaparHtml(texto) {
  const div = document.createElement('div');
  div.textContent = texto ?? '';
  return div.innerHTML;
}

function toggleItensCriticos() {
  const container = document.getElementById('container-itens-criticos');
  const icone = document.getElementById('icone-expandir');

  if (container.classList.contains('hidden')) {
    container.classList.remove('hidden');
    icone.classList.add('rotate-180');

    if (!dadosCarregados) {
      buscarItensCriticosAws();
    }
  } else {
    container.classList.add('hidden');
    icone.classList.remove('rotate-180');
  }
}

async function buscarItensCriticosAws() {
  const loadingDiv = document.getElementById('loading-criticos');
  const listaUl = document.getElementById('lista-itens-criticos');

  const API_AWS_URL = 'https://zqc7b27zwivnfyczo5kedb3vta0evazc.lambda-url.us-east-2.on.aws/api/estoque';

  try {
    const resposta = await fetch(API_AWS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ acao: 'consultar_estoque' }),
    });

    const dados = await resposta.json();

    if (dados.sucesso && Array.isArray(dados.lotes)) {
      const itensCriticos = dados.lotes.filter((lote) => {
        const saldo = parseInt(lote.quantidade_atual_pacote, 10);
        const minimo = parseInt(lote.estoque_minimo_pacote, 10);
        return saldo < minimo;
      });

      renderizarListaCriticos(itensCriticos);
    } else {
      throw new Error('Formato de dados inesperado');
    }
  } catch (erro) {
    console.error('Falha ao comunicar com o DynamoDB:', erro);
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

  itens.forEach((item) => {
    const li = document.createElement('li');
    li.className =
      'bg-white border border-slate-200 p-4 rounded-2xl flex items-center justify-between gap-3 shadow-sm hover:border-brandBlue transition';

    const nomeSeguro = escaparHtml(item.nome_produto);
    const marcaSegura = escaparHtml(item.marca_produto || 'Diversas Marcas');
    const categoriaSegura = escaparHtml(item.categoria || 'Geral');

    li.innerHTML = `
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 bg-pastelYellow/40 rounded-full flex items-center justify-center flex-shrink-0 text-yellow-700">
          <i class="ph ph-warning text-xl"></i>
        </div>
        <div>
          <p class="font-bold text-slate-800 text-sm">${nomeSeguro}</p>
          <p class="text-xs text-slate-500">${marcaSegura} • ${categoriaSegura}</p>
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
