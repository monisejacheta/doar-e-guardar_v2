/**
 * Módulo de Proposta de Campanha (Perfil Doador)
 * Permite adicionar itens genéricos OU puxar diretamente do estoque da AWS (priorizando os abaixo do mínimo).
 */

const URL_API_CAMPANHAS_DOADOR = 'https://zqc7b27zwivnfyczo5kedb3vta0evazc.lambda-url.us-east-2.on.aws/api/estoque';

const itensAdicionadosCampanha = [];
let produtosEstoqueAwsCache = [];

function escaparHtmlCampanhaDoador(texto) {
  const div = document.createElement('div');
  div.textContent = texto ?? '';
  return div.innerHTML;
}

async function carregarItensEstoqueParaCampanha() {
  const select = document.getElementById('select-item-estoque-aws');
  const boxUrgentes = document.getElementById('atalhos-itens-urgentes-campanha');
  if (!select) return;

  try {
    const resp = await fetch(URL_API_CAMPANHAS_DOADOR, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ acao: 'consultar_estoque' })
    });
    const dados = await resp.json();
    const lotes = Array.isArray(dados.lotes) ? dados.lotes : [];

    const mapa = new Map();
    lotes.forEach((l) => {
      const qtd = parseInt(l.quantidade_atual_pacote || 0, 10);
      if (qtd <= 0) return;
      const nome = String(l.nome_produto || 'Alimento').trim();
      const chave = nome.toLowerCase();
      if (!mapa.has(chave)) {
        mapa.set(chave, {
          nome,
          categoria: String(l.categoria || 'Alimentos'),
          qtdTotal: 0,
          minimo: parseInt(l.estoque_minimo_pacote || 10, 10)
        });
      }
      mapa.get(chave).qtdTotal += qtd;
    });

    produtosEstoqueAwsCache = Array.from(mapa.values())
      .map((p) => ({
        ...p,
        abaixoMinimo: p.qtdTotal < p.minimo,
        faltam: Math.max(0, p.minimo - p.qtdTotal)
      }))
      .sort((a, b) => {
        if (a.abaixoMinimo !== b.abaixoMinimo) return a.abaixoMinimo ? -1 : 1;
        if (a.abaixoMinimo && b.abaixoMinimo) return b.faltam - a.faltam;
        return a.nome.localeCompare(b.nome);
      });

    if (produtosEstoqueAwsCache.length === 0) {
      select.innerHTML = `<option value="">Nenhum item cadastrado no estoque no momento</option>`;
      if (boxUrgentes) boxUrgentes.innerHTML = '';
      return;
    }

    select.innerHTML = `<option value="">Selecione um alimento do estoque...</option>` +
      produtosEstoqueAwsCache.map((p, idx) => {
        const tag = p.abaixoMinimo
          ? `⚠️ URGENTE (Saldo: ${p.qtdTotal}/${p.minimo} • Faltam ${p.faltam})`
          : `Regular (Saldo: ${p.qtdTotal}/${p.minimo})`;
        return `<option value="${idx}">${escaparHtmlCampanhaDoador(p.nome)} — ${tag}</option>`;
      }).join('');

    if (boxUrgentes) {
      const urgentes = produtosEstoqueAwsCache.filter((p) => p.abaixoMinimo).slice(0, 6);
      if (urgentes.length > 0) {
        boxUrgentes.innerHTML = urgentes.map((p) => {
          const idxReal = produtosEstoqueAwsCache.indexOf(p);
          return `
            <button type="button" onclick="adicionarItemEstoqueRapido(${idxReal})" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-800 border border-red-200 text-[11px] font-bold transition">
              <i class="ph-bold ph-plus"></i>
              <span>${escaparHtmlCampanhaDoador(p.nome)} (Faltam ${p.faltam})</span>
            </button>
          `;
        }).join('');
      } else {
        boxUrgentes.innerHTML = `<span class="text-[11px] text-emerald-800 font-medium">Nenhum item abaixo do mínimo no momento.</span>`;
      }
    }
  } catch {
    select.innerHTML = `<option value="">Não foi possível carregar o estoque agora</option>`;
  }
}

function aoSelecionarItemEstoqueAws() {
  const select = document.getElementById('select-item-estoque-aws');
  const qtdInput = document.getElementById('qtd-estoque-input');
  const idx = select?.value;
  if (idx === '' || idx === undefined || !produtosEstoqueAwsCache[Number(idx)]) return;
  const prod = produtosEstoqueAwsCache[Number(idx)];
  if (qtdInput) {
    qtdInput.value = prod.abaixoMinimo ? Math.max(1, prod.faltam) : 10;
  }
}

function adicionarItemDoEstoqueAws() {
  const select = document.getElementById('select-item-estoque-aws');
  const qtdInput = document.getElementById('qtd-estoque-input');
  const idx = select?.value;
  if (idx === '' || idx === undefined || !produtosEstoqueAwsCache[Number(idx)]) {
    alert('Selecione um alimento do estoque antes de adicionar.');
    return;
  }
  const prod = produtosEstoqueAwsCache[Number(idx)];
  const qtd = parseInt(qtdInput?.value || '0', 10);
  if (!qtd || qtd <= 0) {
    alert('Informe uma quantidade válida.');
    return;
  }

  itensAdicionadosCampanha.push({ nome: prod.nome, qtd, origem: 'estoque' });
  select.value = '';
  if (qtdInput) qtdInput.value = '';
  renderizarTabelaMetasDoador();
}

function adicionarItemEstoqueRapido(idx) {
  const prod = produtosEstoqueAwsCache[idx];
  if (!prod) return;
  const qtdSugerida = prod.abaixoMinimo ? Math.max(1, prod.faltam) : 10;
  itensAdicionadosCampanha.push({ nome: prod.nome, qtd: qtdSugerida, origem: 'estoque' });
  renderizarTabelaMetasDoador();
}

function inicializarFormularioCampanhaDoador() {
  const hoje = new Date();
  const fim = new Date();
  fim.setDate(hoje.getDate() + 30);

  const inputIni = document.getElementById('data-inicio');
  const inputFim = document.getElementById('data-fim');
  if (inputIni && !inputIni.value) inputIni.value = hoje.toISOString().split('T')[0];
  if (inputFim && !inputFim.value) inputFim.value = fim.toISOString().split('T')[0];

  const params = new URLSearchParams(window.location.search);
  const itemUrl = params.get('item');
  const itemInput = document.getElementById('item-input');
  if (itemUrl && itemInput) {
    itemInput.value = itemUrl;
  }

  carregarItensEstoqueParaCampanha();
}

function adicionarProximoItem() {
  const nomeInput = document.getElementById('item-input');
  const qtdInput = document.getElementById('qtd-input');
  const nome = (nomeInput?.value || '').trim();
  const qtd = parseInt(qtdInput?.value || '0', 10);

  if (!nome || !qtd || qtd <= 0) {
    alert('Informe o nome do alimento e uma quantidade válida.');
    return;
  }

  itensAdicionadosCampanha.push({ nome, qtd, origem: 'generico' });
  nomeInput.value = '';
  qtdInput.value = '';
  renderizarTabelaMetasDoador();
}

function removerItemCampanhaDoador(index) {
  itensAdicionadosCampanha.splice(index, 1);
  renderizarTabelaMetasDoador();
}

function renderizarTabelaMetasDoador() {
  const tbody = document.getElementById('lista-metas');
  if (!tbody) return;

  if (itensAdicionadosCampanha.length === 0) {
    tbody.innerHTML = `
      <tr id="linha-vazia">
        <td colspan="3" class="p-6 text-center text-xs text-slate-400 font-medium">
          <i class="ph ph-shopping-cart text-2xl mb-1 text-slate-300 inline-block"></i><br>
          Nenhum alimento adicionado ainda. Selecione do estoque ou adicione um item genérico acima.
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = itensAdicionadosCampanha.map((item, index) => `
    <tr class="hover:bg-slate-50 transition">
      <td class="px-3.5 py-2.5 text-xs">
        <span class="font-bold text-brandBlue">${escaparHtmlCampanhaDoador(item.nome)}</span>
        <span class="ml-1.5 px-2 py-0.5 rounded text-[10px] font-bold ${item.origem === 'estoque' ? 'bg-pastelBlue text-brandBlue' : 'bg-slate-100 text-slate-600'}">
          ${item.origem === 'estoque' ? 'Do Estoque' : 'Genérico'}
        </span>
      </td>
      <td class="px-3.5 py-2.5 text-slate-700 font-semibold text-xs">${item.qtd} un.</td>
      <td class="px-3.5 py-2.5 text-center">
        <button type="button" onclick="removerItemCampanhaDoador(${index})" class="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 p-1.5 rounded-lg font-bold transition" title="Remover item">
          <i class="ph-bold ph-trash text-sm"></i>
        </button>
      </td>
    </tr>
  `).join('');
}

async function submeterCampanha(event) {
  event.preventDefault();

  const dInicio = document.getElementById('data-inicio').value;
  const dFim = document.getElementById('data-fim').value;

  if (new Date(dFim) < new Date(dInicio)) {
    alert('A data de término não pode ser anterior à data de início.');
    return;
  }

  if (itensAdicionadosCampanha.length === 0) {
    alert('Adicione pelo menos um alimento à meta antes de enviar.');
    return;
  }

  const usuario = window.usuarioDoadorLogado ? window.usuarioDoadorLogado() : null;
  const responsavel = usuario
    ? `${usuario.displayName || usuario.email.split('@')[0]} (${usuario.email})`
    : 'Doador Comunitário';

  const btnSubmit = document.getElementById('btn-submit');
  const alerta = document.getElementById('alerta-campanha-doador');
  if (alerta) alerta.classList.add('hidden');

  const pontos = obterPontosColeta();
  if (pontos.length === 0) {
    exibirAlertaCampanhaDoador('Informe pelo menos 1 endereço de ponto de coleta.', 'erro');
    return;
  }

  const pontosSanitizados = pontos.map((p) => p.replace(/[\[\]|]/g, ' ').replace(/\s+/g, ' ').trim());
  const totalMeta = itensAdicionadosCampanha.reduce((acc, it) => acc + it.qtd, 0);
  const resumoItens = itensAdicionadosCampanha.map((it) => `${it.nome} (${it.qtd} un.)`).join(', ');
  const itensCodificados = `${resumoItens} [RECEBIDO:0] [INICIO:${dInicio}] [COLETAS:${pontosSanitizados.join(' | ')}]`;
  const objetivoTexto = document.getElementById('objetivo-campanha').value.trim();

  try {
    btnSubmit.disabled = true;
    btnSubmit.innerHTML = '<i class="ph ph-spinner animate-spin text-base"></i><span>Enviando...</span>';

    const idGerado = `camp_${Date.now()}`;
    const payload = {
      acao: 'cadastrar_campanha',
      id_campanha: idGerado,
      id_campanha_doacao: idGerado,
      titulo: document.getElementById('nome-campanha').value.trim(),
      meta: String(totalMeta),
      descricao: `${objetivoTexto}\nPontos de Coleta: ${pontos.join('; ')}`,
      itens_necessarios: itensCodificados,
      responsavel,
      status_aprovacao: 'Pendente de Análise',
      data_fim: dFim
    };

    const resp = await fetch(URL_API_CAMPANHAS_DOADOR, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await resp.json();
    if (!resp.ok || data.sucesso === false) {
      throw new Error(data.mensagem || data.erro || 'Não foi possível enviar a proposta.');
    }

    alert('Proposta enviada com sucesso! Ela já está aguardando aprovação da equipe.');
    window.location.href = './minhas-campanhas.html';
  } catch (err) {
    if (alerta) {
      alerta.textContent = `Erro ao enviar proposta: ${err.message}`;
      alerta.classList.remove('hidden');
    } else {
      alert('Erro ao enviar proposta: ' + err.message);
    }
    btnSubmit.disabled = false;
    btnSubmit.innerHTML = '<i class="ph-bold ph-paper-plane-right text-base"></i><span>Enviar Proposta</span>';
  }
}

function adicionarPontoColeta() {
  const lista = document.getElementById('lista-pontos-coleta');
  if (!lista) return;

  const item = document.createElement('div');
  item.className = 'ponto-coleta-item flex items-center gap-2';
  item.innerHTML = `
    <div class="relative flex-1">
      <i class="ph-fill ph-map-pin text-emerald-600 absolute left-3 top-1/2 -translate-y-1/2 text-sm pointer-events-none"></i>
      <input type="text" name="ponto-coleta[]" required placeholder="Ex: Av. Brasil, 500 - Bairro Novo (Portaria)" class="input-ponto-coleta w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-brandBlue">
    </div>
    <button type="button" onclick="removerPontoColeta(this)" title="Remover ponto de coleta" class="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors shrink-0">
      <i class="ph-bold ph-trash text-sm"></i>
    </button>
  `;
  lista.appendChild(item);
  const input = item.querySelector('input');
  if (input) input.focus();
}

function removerPontoColeta(btn) {
  const lista = document.getElementById('lista-pontos-coleta');
  if (!lista) return;
  const itens = lista.querySelectorAll('.ponto-coleta-item');
  if (itens.length <= 1) {
    exibirAlertaCampanhaDoador('Pelo menos 1 ponto de coleta é obrigatório.', 'erro');
    return;
  }
  const linha = btn.closest('.ponto-coleta-item');
  if (linha) linha.remove();
}

function obterPontosColeta() {
  const inputs = document.querySelectorAll('#lista-pontos-coleta .input-ponto-coleta');
  const pontos = [];
  inputs.forEach((inp) => {
    const val = (inp.value || '').trim();
    if (val) pontos.push(val);
  });
  return pontos;
}

window.inicializarFormularioCampanhaDoador = inicializarFormularioCampanhaDoador;
window.aoSelecionarItemEstoqueAws = aoSelecionarItemEstoqueAws;
window.adicionarItemDoEstoqueAws = adicionarItemDoEstoqueAws;
window.adicionarItemEstoqueRapido = adicionarItemEstoqueRapido;
window.adicionarProximoItem = adicionarProximoItem;
window.removerItemCampanhaDoador = removerItemCampanhaDoador;
window.adicionarPontoColeta = adicionarPontoColeta;
window.removerPontoColeta = removerPontoColeta;
window.submeterCampanha = submeterCampanha;
