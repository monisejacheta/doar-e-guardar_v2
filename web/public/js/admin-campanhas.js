/**
 * Módulo de Moderação e Baixa de Campanhas
 * Modularizado no padrão do Painel Principal, 100% conectado à nuvem AWS.
 */

if (typeof window.escaparHtml !== 'function') {
  window.escaparHtml = function (texto) {
    const div = document.createElement('div');
    div.textContent = texto ?? '';
    return div.innerHTML;
  };
}

let campanhasCache = [];
let filtroStatusAtual = 'TODAS';

function mostrarFeedbackModeracao(msg, sucesso = true) {
  const el = document.getElementById('feedback-moderacao');
  if (!el) return;
  el.className = `p-3 rounded-xl border font-semibold text-xs flex items-center justify-between gap-3 ${
    sucesso ? 'bg-pastelGreen/70 border-emerald-300 text-emerald-900' : 'bg-red-50 border-red-200 text-red-800'
  }`;
  el.innerHTML = `
    <span class="min-w-0 flex-1 break-words">${escaparHtml(msg)}</span>
    <button type="button" onclick="this.parentElement.classList.add('hidden')" class="font-bold underline text-xs shrink-0">Fechar</button>
  `;
  el.classList.remove('hidden');
}

async function carregarTelaModeracao() {
  const icone = document.getElementById('icone-sync-campanhas');
  if (icone) icone.classList.add('animate-spin');
  try {
    campanhasCache = await carregarCampanhasReconciliadas();
    atualizarContadoresStatus();
    renderizarCardsCampanhas();
  } catch (erro) {
    mostrarFeedbackModeracao(`Não foi possível carregar as campanhas: ${erro.message}`, false);
  } finally {
    if (icone) icone.classList.remove('animate-spin');
  }
}

function atualizarContadoresStatus() {
  const pendentes = campanhasCache.filter((c) => c.status === 'pendente').length;
  const aprovadas = campanhasCache.filter((c) => c.status === 'aprovada').length;
  const encerradas = campanhasCache.filter((c) => c.status === 'encerrada').length;
  const reprovadas = campanhasCache.filter((c) => c.status === 'reprovada').length;

  document.getElementById('count-pendente').textContent = pendentes;
  document.getElementById('count-aprovada').textContent = aprovadas;
  document.getElementById('count-encerrada').textContent = encerradas;
  document.getElementById('count-reprovada').textContent = reprovadas;
  document.getElementById('count-todas').textContent = campanhasCache.length;

  ['TODAS', 'pendente', 'aprovada', 'encerrada', 'reprovada'].forEach((st) => {
    const btn = document.getElementById(`tab-status-${st}`);
    if (!btn) return;
    btn.classList.toggle('ring-2', st === filtroStatusAtual);
    btn.classList.toggle('ring-brandBlue', st === filtroStatusAtual);
  });
}

function filtrarStatusCampanha(novoStatus) {
  filtroStatusAtual = novoStatus;
  atualizarContadoresStatus();
  renderizarCardsCampanhas();
}

function formatarResumoDesempenhoMeta(camp) {
  const diff = camp.arrecadadoUnidades - camp.metaUnidades;
  const pct = camp.percentualAtingido;
  if (diff > 0) {
    return {
      classe: 'bg-pastelGreen text-emerald-900 border-emerald-300',
      icone: 'ph-trend-up',
      texto: `+${diff} un. acima da meta (${pct}%)`
    };
  }
  if (diff === 0) {
    return {
      classe: 'bg-pastelGreen text-emerald-900 border-emerald-300',
      icone: 'ph-check-circle',
      texto: `Meta exata atingida (100%)`
    };
  }
  return {
    classe: 'bg-amber-100 text-amber-900 border-amber-300',
    icone: 'ph-trend-down',
    texto: `${diff} un. abaixo da meta (${pct}%)`
  };
}

function renderizarCardsCampanhas() {
  const container = document.getElementById('lista-campanhas-moderacao');
  const lista = filtroStatusAtual === 'TODAS'
    ? campanhasCache
    : campanhasCache.filter((c) => c.status === filtroStatusAtual);

  if (lista.length === 0) {
    container.innerHTML = `
      <div class="lg:col-span-2 bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-1.5 shadow-sm">
        <i class="ph ph-folder-open text-3xl text-slate-400"></i>
        <p class="text-sm font-bold text-brandBlue">Nenhuma campanha encontrada neste filtro.</p>
        <p class="text-xs text-slate-500">Crie uma nova campanha ou escolha outro status acima.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = lista.map((camp) => {
    const progressoBarra = Math.min(100, camp.percentualAtingido);
    let badgeStatus = '';
    if (camp.status === 'pendente') {
      badgeStatus = `<span class="px-2.5 py-0.5 rounded-lg bg-pastelYellow text-yellow-900 border border-yellow-300 font-bold text-[10px] inline-flex items-center gap-1 shrink-0"><i class="ph-fill ph-hourglass-medium"></i> Pendente</span>`;
    } else if (camp.status === 'aprovada') {
      badgeStatus = `<span class="px-2.5 py-0.5 rounded-lg bg-pastelGreen text-emerald-900 border border-emerald-300 font-bold text-[10px] inline-flex items-center gap-1 shrink-0"><i class="ph-fill ph-check-circle"></i> Ativa</span>`;
    } else if (camp.status === 'reprovada') {
      badgeStatus = `<span class="px-2.5 py-0.5 rounded-lg bg-red-100 text-red-700 border border-red-200 font-bold text-[10px] inline-flex items-center gap-1 shrink-0"><i class="ph-fill ph-x-circle"></i> Recusada</span>`;
    } else {
      badgeStatus = `<span class="px-2.5 py-0.5 rounded-lg bg-slate-200 text-slate-800 font-bold text-[10px] inline-flex items-center gap-1 shrink-0"><i class="ph-fill ph-flag-checkered"></i> Finalizada</span>`;
    }

    const resumoMeta = formatarResumoDesempenhoMeta(camp);
    const blocoDesempenhoFinal = camp.status === 'encerrada' ? `
      <div class="p-2.5 rounded-xl border ${resumoMeta.classe} flex flex-wrap items-center justify-between gap-2 text-xs font-bold">
        <span class="inline-flex items-center gap-1.5"><i class="ph-bold ${resumoMeta.icone} text-sm"></i> Resultado da baixa:</span>
        <span>${resumoMeta.texto}</span>
      </div>
    ` : '';

    const blocoParecer = camp.parecerTecnico ? `
      <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px]">
        <span class="font-bold text-brandBlue block mb-0.5">Observação:</span>
        <p class="text-slate-600 break-words">${escaparHtml(camp.parecerTecnico)}</p>
      </div>
    ` : '';

    let botoesAcao = '';
    if (camp.status === 'pendente') {
      botoesAcao = `
        <button type="button" onclick="aprovarCampanhaDireto('${escaparHtml(camp.idCampanha)}')" class="flex-1 py-1.5 px-3 rounded-lg bg-pastelGreen hover:bg-[#b5ead5] text-emerald-900 border border-emerald-200 font-bold text-xs inline-flex items-center justify-center gap-1 transition">
          <i class="ph-bold ph-check-circle"></i> Aprovar
        </button>
        <button type="button" onclick="abrirModalReprovacao('${escaparHtml(camp.idCampanha)}')" class="flex-1 py-1.5 px-3 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 font-bold text-xs inline-flex items-center justify-center gap-1 transition">
          <i class="ph-bold ph-x-circle"></i> Recusar
        </button>
      `;
    } else if (camp.status === 'aprovada') {
      botoesAcao = `
        <button type="button" onclick="abrirModalBaixaCampanha('${escaparHtml(camp.idCampanha)}')" class="flex-1 py-1.5 px-3 rounded-lg bg-brandBlue hover:bg-blue-900 text-white font-bold text-xs inline-flex items-center justify-center gap-1.5 transition">
          <i class="ph-bold ph-check-square-offset"></i> Dar Baixa / Confirmar Recebimento
        </button>
      `;
    } else {
      botoesAcao = `
        <button type="button" onclick="aprovarCampanhaDireto('${escaparHtml(camp.idCampanha)}')" class="flex-1 py-1.5 px-3 rounded-lg bg-pastelBlue hover:bg-blue-200 text-brandBlue font-bold text-xs transition">
          Reabrir Campanha
        </button>
      `;
    }

    const itens = Array.isArray(camp.itensDetalhados) && camp.itensDetalhados.length > 0
      ? camp.itensDetalhados
      : [{ nome: camp.itemFoco, meta: camp.metaUnidades, recebido: camp.arrecadadoUnidades }];
    const multiItens = itens.length > 1;
    const listaItensHtml = multiItens ? `
      <ul class="space-y-1 pt-1 border-t border-blue-100/80">
        ${itens.map((it) => {
          const temValor = typeof it.recebido === 'number';
          const statusItem = temValor
            ? (it.recebido >= it.meta ? 'text-emerald-700' : 'text-amber-700')
            : 'text-slate-600';
          const textoQtd = temValor
            ? `${it.recebido} / ${it.meta} un.`
            : `Meta: ${it.meta} un.`;
          return `
            <li class="flex items-center justify-between gap-2 text-[11px]">
              <span class="text-slate-700 font-medium truncate">${escaparHtml(it.nome)}</span>
              <span class="font-bold ${statusItem} shrink-0">${textoQtd}</span>
            </li>
          `;
        }).join('')}
      </ul>
    ` : '';

    return `
      <article class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-3">
        <div class="space-y-2.5">
          <div class="flex items-start justify-between gap-2">
            <div class="min-w-0 flex-1">
              <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Término: ${formatarDataBr(camp.dataLimite)}</span>
              <h3 class="text-sm font-bold text-brandBlue leading-snug break-words">${escaparHtml(camp.titulo)}</h3>
            </div>
            ${badgeStatus}
          </div>

          <p class="text-xs text-slate-600 leading-relaxed break-words">${escaparHtml(camp.descricao || 'Campanha de arrecadação de alimentos.')}</p>

          <div class="p-3 rounded-xl bg-pastelBlue/30 border border-pastelBlue space-y-1.5">
            <div class="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span class="font-semibold text-slate-700 min-w-0 truncate">${multiItens ? `Itens (${itens.length})` : `Item: <strong class="text-brandBlue">${escaparHtml(camp.itemFoco)}</strong>`}</span>
              <span class="font-bold text-brandBlue shrink-0">${camp.arrecadadoUnidades} / ${camp.metaUnidades} un. (${camp.percentualAtingido}%)</span>
            </div>
            <div class="w-full h-2 bg-white rounded-full overflow-hidden border border-blue-100">
              <div class="h-full ${camp.arrecadadoUnidades >= camp.metaUnidades ? 'bg-emerald-600' : 'bg-brandBlue'} rounded-full" style="width: ${progressoBarra}%"></div>
            </div>
            ${listaItensHtml}
            <p class="text-[11px] font-medium text-slate-500 truncate">Responsável: <strong class="text-slate-700">${escaparHtml(camp.criadorNome)}</strong></p>
          </div>

          ${blocoDesempenhoFinal}
          ${blocoParecer}
        </div>

        <div class="flex items-center gap-2 pt-2.5 border-t border-slate-100">
          ${botoesAcao}
          <button type="button" onclick="confirmarExclusaoCampanha('${escaparHtml(camp.idCampanha)}', '${escaparHtml(camp.titulo)}')" class="w-9 h-8 inline-flex items-center justify-center rounded-lg bg-slate-100 hover:bg-red-100 text-slate-500 hover:text-red-700 font-bold text-xs transition shrink-0" title="Excluir Campanha">
            <i class="ph-bold ph-trash"></i>
          </button>
        </div>
      </article>
    `;
  }).join('');
}

function criarHtmlLinhaItemNovaCampanha(nome = '', meta = '', removivel = false) {
  return `
    <div class="nova-camp-item-row grid grid-cols-12 gap-2 items-center p-2 rounded-xl bg-slate-50 border border-slate-200">
      <div class="${removivel ? 'col-span-7' : 'col-span-8'}">
        <input type="text" required placeholder="Ex: Leite UHT Integral 1L" value="${escaparHtml(nome)}" class="nova-camp-item-nome w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-brandBlue">
      </div>
      <div class="col-span-4">
        <input type="number" required min="1" step="1" placeholder="Meta" value="${escaparHtml(meta)}" oninput="atualizarMetaTotalNovaCampanha()" class="nova-camp-item-meta w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-brandBlue focus:outline-none focus:border-brandBlue">
      </div>
      ${removivel ? `
        <div class="col-span-1 flex justify-end">
          <button type="button" onclick="removerLinhaItemNovaCampanha(this)" class="w-7 h-7 inline-flex items-center justify-center rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition" title="Remover item">
            <i class="ph-bold ph-trash text-xs"></i>
          </button>
        </div>
      ` : ''}
    </div>
  `;
}

function adicionarLinhaItemNovaCampanha(nome = '', meta = '') {
  const container = document.getElementById('nova-camp-itens-container');
  if (!container) return;
  const removivel = container.querySelectorAll('.nova-camp-item-row').length > 0;
  container.insertAdjacentHTML('beforeend', criarHtmlLinhaItemNovaCampanha(nome, meta, removivel));
  atualizarMetaTotalNovaCampanha();
}

function removerLinhaItemNovaCampanha(botao) {
  const container = document.getElementById('nova-camp-itens-container');
  const linha = botao?.closest('.nova-camp-item-row');
  if (!container || !linha) return;
  if (container.querySelectorAll('.nova-camp-item-row').length <= 1) return;
  linha.remove();
  atualizarMetaTotalNovaCampanha();
}

function atualizarMetaTotalNovaCampanha() {
  const metas = Array.from(document.querySelectorAll('.nova-camp-item-meta'))
    .map((el) => Math.max(0, parseInt(el.value || '0', 10) || 0));
  const total = metas.reduce((acc, v) => acc + v, 0);
  const label = document.getElementById('nova-camp-meta-total-label');
  if (label) label.textContent = `Meta total: ${total} un.`;
}

function abrirModalNovaCampanha() {
  const dt = new Date();
  dt.setDate(dt.getDate() + 30);
  document.getElementById('nova-camp-data').value = dt.toISOString().split('T')[0];
  document.getElementById('nova-camp-titulo').value = '';
  document.getElementById('nova-camp-desc').value = '';
  const container = document.getElementById('nova-camp-itens-container');
  if (container) {
    container.innerHTML = criarHtmlLinhaItemNovaCampanha('', 100, false);
  }
  atualizarMetaTotalNovaCampanha();
  abrirModal('modal-nova-campanha-admin');
}

async function aprovarCampanhaDireto(idCampanha) {
  const camp = campanhasCache.find((c) => c.idCampanha === idCampanha);
  if (!camp) return;
  try {
    const atualizada = {
      ...camp,
      status: 'aprovada',
      status_aprovacao: 'Aprovada',
      parecerTecnico: 'Campanha aprovada pela equipe administrativa.'
    };
    campanhasCache = await salvarOuModerarCampanhaAdmin(atualizada, false);
    atualizarContadoresStatus();
    renderizarCardsCampanhas();
    mostrarFeedbackModeracao(`Campanha "${camp.titulo}" aprovada e publicada!`, true);
  } catch (erro) {
    mostrarFeedbackModeracao(`Erro ao aprovar campanha: ${erro.message}`, false);
  }
}

function abrirModalReprovacao(idCampanha) {
  const camp = campanhasCache.find((c) => c.idCampanha === idCampanha);
  if (!camp) return;
  document.getElementById('reprovar-id-campanha').value = camp.idCampanha;
  document.getElementById('subtitulo-reprovar-campanha').textContent = camp.titulo;
  document.getElementById('reprovar-parecer').value = '';
  abrirModal('modal-reprovar-campanha');
}

async function confirmarReprovacaoCampanha(event) {
  event.preventDefault();
  const idCampanha = document.getElementById('reprovar-id-campanha').value;
  const parecer = document.getElementById('reprovar-parecer').value.trim();
  const camp = campanhasCache.find((c) => c.idCampanha === idCampanha);
  if (!camp) return;

  try {
    const atualizada = {
      ...camp,
      status: 'reprovada',
      status_aprovacao: 'Reprovada',
      parecerTecnico: parecer
    };
    campanhasCache = await salvarOuModerarCampanhaAdmin(atualizada, false);
    fecharModal('modal-reprovar-campanha');
    atualizarContadoresStatus();
    renderizarCardsCampanhas();
    mostrarFeedbackModeracao(`Campanha "${camp.titulo}" recusada com justificativa salva.`, true);
  } catch (erro) {
    mostrarFeedbackModeracao(`Erro ao recusar campanha: ${erro.message}`, false);
  }
}

function abrirModalBaixaCampanha(idCampanha) {
  const camp = campanhasCache.find((c) => c.idCampanha === idCampanha);
  if (!camp) return;

  const itens = Array.isArray(camp.itensDetalhados) && camp.itensDetalhados.length > 0
    ? camp.itensDetalhados
    : [{ nome: camp.itemFoco, meta: camp.metaUnidades, recebido: camp.arrecadadoUnidades }];
  const multiItens = itens.length > 1;
  const metaTotal = multiItens
    ? itens.reduce((acc, it) => acc + Math.max(1, Number(it.meta) || 1), 0)
    : camp.metaUnidades;

  document.getElementById('baixa-camp-id').value = camp.idCampanha;
  document.getElementById('baixa-camp-meta').value = metaTotal;
  document.getElementById('subtitulo-baixa-campanha').textContent = camp.titulo;
  document.getElementById('baixa-camp-item-rotulo').textContent = multiItens ? `Itens (${itens.length})` : 'Item';
  document.getElementById('baixa-camp-item').textContent = multiItens
    ? itens.map((it) => `${it.nome} (${it.meta} un.)`).join(', ')
    : (itens[0]?.nome || camp.itemFoco);
  document.getElementById('baixa-camp-meta-label').textContent = `${metaTotal} un.`;
  document.getElementById('baixa-camp-itens-instrucao').textContent = multiItens
    ? 'Informe a quantidade arrecadada de cada item *'
    : 'Quantos produtos reais foram recebidos? *';
  document.getElementById('baixa-camp-obs').value = '';

  const container = document.getElementById('baixa-camp-itens-container');
  container.innerHTML = itens.map((it, idx) => {
    let valorInicial = '';
    if (typeof it.recebido === 'number') {
      valorInicial = String(it.recebido);
    } else if (!multiItens && (camp.status === 'encerrada' || camp.arrecadadoUnidades > 0)) {
      valorInicial = String(camp.arrecadadoUnidades);
    }

    return `
      <div class="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
        <div class="flex items-center justify-between gap-2 text-xs">
          <label for="baixa-item-recebido-${idx}" class="font-bold text-brandBlue min-w-0 break-words flex-1">
            ${escaparHtml(it.nome)}
          </label>
          <div class="flex items-center gap-2 shrink-0">
            <span class="text-[11px] font-semibold text-slate-500">Meta: <strong class="text-slate-700">${it.meta} un.</strong></span>
            <span id="baixa-item-diff-${idx}" class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">Pendente</span>
          </div>
        </div>
        <input
          type="number"
          id="baixa-item-recebido-${idx}"
          data-item-idx="${idx}"
          data-item-meta="${it.meta}"
          data-item-nome="${escaparHtml(it.nome)}"
          value="${escaparHtml(valorInicial)}"
          placeholder="Qtd. recebida (meta: ${it.meta})"
          required
          min="0"
          step="1"
          oninput="atualizarPreviewResultadoMeta()"
          class="input-baixa-item-recebido w-full px-3.5 py-2 bg-white border-2 border-brandBlue/30 rounded-xl text-sm font-extrabold text-brandBlue focus:outline-none focus:border-brandBlue"
        >
      </div>
    `;
  }).join('');

  atualizarPreviewResultadoMeta();
  abrirModal('modal-baixa-campanha');
}

function atualizarPreviewResultadoMeta() {
  const meta = Number(document.getElementById('baixa-camp-meta').value || 0);
  const inputs = Array.from(document.querySelectorAll('.input-baixa-item-recebido'));
  const box = document.getElementById('preview-resultado-meta');
  const totalLabel = document.getElementById('baixa-camp-total-parcial');

  let somaRecebida = 0;
  let preenchidos = 0;

  inputs.forEach((input, idx) => {
    const raw = String(input.value || '').trim();
    const metaItem = Number(input.dataset.itemMeta || 0);
    const badge = document.getElementById(`baixa-item-diff-${idx}`);

    if (raw === '') {
      if (badge) {
        badge.className = 'text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-600';
        badge.textContent = 'Pendente';
      }
      return;
    }

    const val = Number(raw);
    if (!Number.isFinite(val) || val < 0) {
      if (badge) {
        badge.className = 'text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700';
        badge.textContent = 'Inválido';
      }
      return;
    }

    preenchidos += 1;
    somaRecebida += val;

    if (badge) {
      const diffItem = val - metaItem;
      if (diffItem > 0) {
        badge.className = 'text-[10px] font-bold px-2 py-0.5 rounded-full bg-pastelGreen text-emerald-900';
        badge.textContent = `+${diffItem} un.`;
      } else if (diffItem === 0) {
        badge.className = 'text-[10px] font-bold px-2 py-0.5 rounded-full bg-pastelGreen text-emerald-900';
        badge.textContent = 'Meta exata';
      } else {
        badge.className = 'text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900';
        badge.textContent = `${diffItem} un.`;
      }
    }
  });

  if (totalLabel) {
    totalLabel.textContent = `Total: ${somaRecebida} / ${meta} un.`;
  }

  if (inputs.length > 0 && preenchidos < inputs.length) {
    box.className = 'p-3 rounded-xl border bg-pastelBlue/40 border-blue-200 text-brandBlue text-xs font-bold flex items-center justify-between gap-2';
    box.innerHTML = `<span><i class="ph-bold ph-info mr-1"></i> Preencha todos os itens (${preenchidos}/${inputs.length})</span><span>Parcial: ${somaRecebida} un.</span>`;
    return;
  }

  const diff = somaRecebida - meta;
  const pct = meta > 0 ? Math.round((somaRecebida / meta) * 100) : 0;

  if (diff > 0) {
    box.className = 'p-3 rounded-xl border bg-pastelGreen/70 border-emerald-300 text-emerald-900 text-xs font-bold flex items-center justify-between gap-2';
    box.innerHTML = `<span><i class="ph-bold ph-trend-up mr-1"></i> Acima da meta!</span><span>+${diff} un. (${pct}%)</span>`;
  } else if (diff === 0) {
    box.className = 'p-3 rounded-xl border bg-pastelGreen/70 border-emerald-300 text-emerald-900 text-xs font-bold flex items-center justify-between gap-2';
    box.innerHTML = `<span><i class="ph-bold ph-check-circle mr-1"></i> Meta exata atingida!</span><span>0 diferença (100%)</span>`;
  } else {
    box.className = 'p-3 rounded-xl border bg-amber-50 border-amber-300 text-amber-900 text-xs font-bold flex items-center justify-between gap-2';
    box.innerHTML = `<span><i class="ph-bold ph-trend-down mr-1"></i> Abaixo da meta</span><span>${diff} un. (${pct}%)</span>`;
  }
}

async function confirmarBaixaCampanha(event) {
  event.preventDefault();
  const idCampanha = document.getElementById('baixa-camp-id').value;
  const obs = document.getElementById('baixa-camp-obs').value.trim();
  const camp = campanhasCache.find((c) => c.idCampanha === idCampanha);
  if (!camp) return;

  const inputs = Array.from(document.querySelectorAll('.input-baixa-item-recebido'));
  const itensBase = Array.isArray(camp.itensDetalhados) && camp.itensDetalhados.length > 0
    ? camp.itensDetalhados
    : [{ nome: camp.itemFoco, meta: camp.metaUnidades, recebido: null }];

  const itensAtualizados = [];
  for (let i = 0; i < inputs.length; i += 1) {
    const input = inputs[i];
    const raw = String(input.value || '').trim();
    const val = Number(raw);
    if (raw === '' || !Number.isFinite(val) || val < 0 || !Number.isInteger(val)) {
      input.focus();
      mostrarFeedbackModeracao('Informe uma quantidade inteira válida (0 ou maior) para cada item da campanha.', false);
      return;
    }
    const base = itensBase[i] || { nome: input.dataset.itemNome || 'Item', meta: Number(input.dataset.itemMeta || 1) };
    itensAtualizados.push({
      nome: base.nome,
      meta: Math.max(1, Number(base.meta) || 1),
      recebido: val
    });
  }

  const recebidoReal = itensAtualizados.reduce((acc, it) => acc + it.recebido, 0);
  const metaTotal = itensAtualizados.length > 1
    ? itensAtualizados.reduce((acc, it) => acc + it.meta, 0)
    : camp.metaUnidades;

  const btn = document.getElementById('btn-confirmar-baixa-camp');
  btn.disabled = true;
  btn.textContent = 'Salvando...';

  try {
    const diff = recebidoReal - metaTotal;
    const pct = metaTotal > 0 ? Math.round((recebidoReal / metaTotal) * 100) : 0;
    const detalheItensTexto = itensAtualizados.length > 1
      ? ` Itens: ${itensAtualizados.map((it) => `${it.nome}: ${it.recebido}/${it.meta} un.`).join('; ')}.`
      : '';
    const resumoTexto = diff >= 0
      ? `Meta atingida/superada: ${recebidoReal}/${metaTotal} un. (+${diff} un. | ${pct}%).${detalheItensTexto}`
      : `Abaixo da meta: ${recebidoReal}/${metaTotal} un. (${diff} un. | ${pct}%).${detalheItensTexto}`;

    const atualizada = {
      ...camp,
      status: 'encerrada',
      status_aprovacao: 'Encerrada',
      metaUnidades: metaTotal,
      arrecadadoUnidades: recebidoReal,
      itensDetalhados: itensAtualizados,
      parecerTecnico: obs ? `${resumoTexto} ${obs}` : resumoTexto
    };

    campanhasCache = await salvarOuModerarCampanhaAdmin(atualizada, false);
    fecharModal('modal-baixa-campanha');
    atualizarContadoresStatus();
    renderizarCardsCampanhas();
    mostrarFeedbackModeracao(
      `Baixa confirmada em "${camp.titulo}"! Recebido: ${recebidoReal} un. (${diff >= 0 ? `+${diff} acima` : `${diff} abaixo`} da meta).`,
      true
    );
  } catch (erro) {
    mostrarFeedbackModeracao(`Erro ao confirmar baixa: ${erro.message}`, false);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Confirmar Baixa e Encerrar';
  }
}

async function salvarNovaCampanhaInstitucional(event) {
  event.preventDefault();
  const linhas = Array.from(document.querySelectorAll('.nova-camp-item-row'));
  const itens = [];
  for (const linha of linhas) {
    const inputNome = linha.querySelector('.nova-camp-item-nome');
    const inputMeta = linha.querySelector('.nova-camp-item-meta');
    const nome = String(inputNome?.value || '').trim();
    const meta = parseInt(inputMeta?.value || '0', 10);
    if (!nome || !Number.isFinite(meta) || meta < 1) {
      (nome ? inputMeta : inputNome)?.focus();
      mostrarFeedbackModeracao('Preencha o nome e uma meta válida (mínimo 1) para cada item.', false);
      return;
    }
    itens.push({ nome, meta, recebido: null });
  }

  const metaTotal = itens.reduce((acc, it) => acc + it.meta, 0);
  const itemFoco = itens.length > 1
    ? itens.map((it) => `${it.nome} (${it.meta} un.)`).join(', ')
    : itens[0].nome;

  const btn = document.getElementById('btn-publicar-camp');
  btn.disabled = true;
  btn.textContent = 'Publicando...';

  try {
    const nova = {
      id_campanha: `camp_${Date.now()}`,
      titulo: document.getElementById('nova-camp-titulo').value.trim(),
      itemFoco,
      itensDetalhados: itens,
      metaUnidades: metaTotal,
      arrecadadoUnidades: 0,
      dataInicio: new Date().toISOString().split('T')[0],
      data_fim: document.getElementById('nova-camp-data').value,
      descricao: document.getElementById('nova-camp-desc').value.trim(),
      responsavel: document.getElementById('nova-camp-resp').value.trim() || 'Administração Casa da Criança',
      status_aprovacao: 'Aprovada',
      parecerTecnico: 'Campanha oficial criada pela equipe administrativa.'
    };

    campanhasCache = await salvarOuModerarCampanhaAdmin(nova, true);
    fecharModal('modal-nova-campanha-admin');
    atualizarContadoresStatus();
    renderizarCardsCampanhas();
    mostrarFeedbackModeracao(`Campanha "${nova.titulo}" publicada com sucesso!`, true);
  } catch (erro) {
    mostrarFeedbackModeracao(`Erro ao criar campanha: ${erro.message}`, false);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Publicar Campanha';
  }
}

async function confirmarExclusaoCampanha(idCampanha, titulo) {
  if (!confirm(`Deseja excluir permanentemente a campanha "${titulo}"?`)) return;
  try {
    campanhasCache = await excluirCampanhaAdmin(idCampanha);
    atualizarContadoresStatus();
    renderizarCardsCampanhas();
    mostrarFeedbackModeracao(`Campanha "${titulo}" removida com sucesso.`, true);
  } catch (erro) {
    mostrarFeedbackModeracao(`Erro ao excluir campanha: ${erro.message}`, false);
  }
}

window.carregarTelaModeracao = carregarTelaModeracao;
window.filtrarStatusCampanha = filtrarStatusCampanha;
window.abrirModalNovaCampanha = abrirModalNovaCampanha;
window.adicionarLinhaItemNovaCampanha = adicionarLinhaItemNovaCampanha;
window.removerLinhaItemNovaCampanha = removerLinhaItemNovaCampanha;
window.atualizarMetaTotalNovaCampanha = atualizarMetaTotalNovaCampanha;
window.aprovarCampanhaDireto = aprovarCampanhaDireto;
window.abrirModalReprovacao = abrirModalReprovacao;
window.confirmarReprovacaoCampanha = confirmarReprovacaoCampanha;
window.abrirModalBaixaCampanha = abrirModalBaixaCampanha;
window.atualizarPreviewResultadoMeta = atualizarPreviewResultadoMeta;
window.confirmarBaixaCampanha = confirmarBaixaCampanha;
window.salvarNovaCampanhaInstitucional = salvarNovaCampanhaInstitucional;
window.confirmarExclusaoCampanha = confirmarExclusaoCampanha;
