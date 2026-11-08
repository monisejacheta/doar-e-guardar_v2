// web/public/js/estoque-publico.js
let dadosCarregados = false;
const API_AWS_ESTOQUE_URL = 'https://zqc7b27zwivnfyczo5kedb3vta0evazc.lambda-url.us-east-2.on.aws/api/estoque';

function escaparHtml(texto) {
  const div = document.createElement('div');
  div.textContent = texto ?? '';
  return div.innerHTML;
}

function toggleItensCriticos() {
  const container = document.getElementById('container-itens-criticos');
  const icone = document.getElementById('icone-expandir');
  if (!container || !icone) return;

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
  if (!loadingDiv || !listaUl) return;

  try {
    const resposta = await fetch(API_AWS_ESTOQUE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ acao: 'consultar_estoque' }),
    });

    const dados = await resposta.json();

    if (dados.sucesso && Array.isArray(dados.lotes)) {
      // Agrupa por produto para verificar o saldo total vs estoque mínimo
      const agrupado = {};
      dados.lotes.forEach((lote) => {
        const qtd = parseInt(lote.quantidade_atual_pacote, 10) || 0;
        if (qtd <= 0) return;
        const chave = (lote.nome_produto || 'Item').trim();
        if (!agrupado[chave]) {
          agrupado[chave] = {
            nome_produto: chave,
            marca_produto: lote.marca_produto || 'Diversas Marcas',
            categoria: lote.categoria || 'Alimentos',
            quantidade_atual_pacote: 0,
            estoque_minimo_pacote: parseInt(lote.estoque_minimo_pacote, 10) || 10,
          };
        }
        agrupado[chave].quantidade_atual_pacote += qtd;
      });

      const todosProdutos = Object.values(agrupado);
      const itensCriticos = todosProdutos.filter(
        (prod) => prod.quantidade_atual_pacote < prod.estoque_minimo_pacote
      );

      renderizarListaCriticos(itensCriticos, todosProdutos);
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

function renderizarListaCriticos(itens, todosProdutos = []) {
  const listaUl = document.getElementById('lista-itens-criticos');
  if (!listaUl) return;
  listaUl.innerHTML = '';

  const listaExibicao = itens.length > 0 ? itens : todosProdutos.slice(0, 4);

  if (listaExibicao.length === 0) {
    listaUl.innerHTML = `
      <div class="col-span-1 sm:col-span-2 p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center text-emerald-800">
        <i class="ph-fill ph-check-circle text-3xl mb-2 text-emerald-600"></i>
        <p class="font-bold">Nosso estoque está regular no momento!</p>
        <p class="text-sm mt-1">Agradecemos o apoio contínuo. Qualquer doação geral continua sendo bem-vinda.</p>
      </div>
    `;
    return;
  }

  listaExibicao.forEach((item) => {
    const li = document.createElement('li');
    li.className =
      'bg-white border border-slate-200 p-4 rounded-2xl flex items-center justify-between gap-3 shadow-sm hover:border-brandBlue transition';

    const nomeSeguro = escaparHtml(item.nome_produto);
    const marcaSegura = escaparHtml(item.marca_produto || 'Diversas Marcas');
    const categoriaSegura = escaparHtml(item.categoria || 'Geral');
    const ehCritico = item.quantidade_atual_pacote < item.estoque_minimo_pacote;

    li.innerHTML = `
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 ${ehCritico ? 'bg-pastelYellow/60 text-yellow-800' : 'bg-pastelBlue text-brandBlue'} rounded-full flex items-center justify-center flex-shrink-0">
          <i class="ph ${ehCritico ? 'ph-warning' : 'ph-package'} text-xl"></i>
        </div>
        <div>
          <p class="font-bold text-slate-800 text-sm">${nomeSeguro}</p>
          <p class="text-xs text-slate-500">${marcaSegura} • ${categoriaSegura} (${item.quantidade_atual_pacote} pcts atuais)</p>
        </div>
      </div>
      <div class="text-right">
        <span class="block text-xs font-bold ${
          ehCritico ? 'text-yellow-800 bg-yellow-100' : 'text-brandBlue bg-blue-100'
        } px-2.5 py-1 rounded-lg">
          ${ehCritico ? 'Prioritário' : 'Bem-vindo'}
        </span>
      </div>
    `;
    listaUl.appendChild(li);
  });
}

window.toggleItensCriticos = toggleItensCriticos;
window.buscarItensCriticosAws = buscarItensCriticosAws;


if (typeof window !== 'undefined') {
  window.escaparHtml = escaparHtml;
  window.renderizarListaCriticos = renderizarListaCriticos;
}
