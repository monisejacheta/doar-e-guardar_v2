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
              <span class="font-semibold text-slate-700 min-w-0 truncate">Item: <strong class="text-brandBlue">${escaparHtml(camp.itemFoco)}</strong></span>
              <span class="font-bold text-brandBlue shrink-0">${camp.arrecadadoUnidades} / ${camp.metaUnidades} un. (${camp.percentualAtingido}%)</span>
            </div>
            <div class="w-full h-2 bg-white rounded-full overflow-hidden border border-blue-100">
              <div class="h-full ${camp.arrecadadoUnidades >= camp.metaUnidades ? 'bg-emerald-600' : 'bg-brandBlue'} rounded-full" style="width: ${progressoBarra}%"></div>
            </div>
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

function abrirModalNovaCampanha() {
  const dt = new Date();
  dt.setDate(dt.getDate() + 30);
  document.getElementById('nova-camp-data').value = dt.toISOString().split('T')[0];
  document.getElementById('nova-camp-titulo').value = '';
  document.getElementById('nova-camp-item').value = '';
  document.getElementById('nova-camp-meta').value = 100;
  document.getElementById('nova-camp-desc').value = '';
  abrirModal('modal-nova-campanha-admin');
}

async function aprovarCampanhaDireto(idCampanha) {
  const camp = campanhasCache.find((c) => c.idCampanha === idCampanha);
  if (!camp) return;
  try {
    camp.status = 'aprovada';
    camp.status_aprovacao = 'Aprovada';
    camp.parecerTecnico = 'Campanha aprovada pela equipe administrativa.';
    await salvarOuModerarCampanhaAdmin(camp, false);
    mostrarFeedbackModeracao(`Campanha "${camp.titulo}" aprovada e publicada!`, true);
    await carregarTelaModeracao();
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
    camp.status = 'reprovada';
    camp.status_aprovacao = 'Reprovada';
    camp.parecerTecnico = parecer;
    await salvarOuModerarCampanhaAdmin(camp, false);
    fecharModal('modal-reprovar-campanha');
    mostrarFeedbackModeracao(`Campanha "${camp.titulo}" recusada com justificativa salva.`, true);
    await carregarTelaModeracao();
  } catch (erro) {
    mostrarFeedbackModeracao(`Erro ao recusar campanha: ${erro.message}`, false);
  }
}

function abrirModalBaixaCampanha(idCampanha) {
  const camp = campanhasCache.find((c) => c.idCampanha === idCampanha);
  if (!camp) return;
  document.getElementById('baixa-camp-id').value = camp.idCampanha;
  document.getElementById('baixa-camp-meta').value = camp.metaUnidades;
  document.getElementById('subtitulo-baixa-campanha').textContent = camp.titulo;
  document.getElementById('baixa-camp-item').textContent = camp.itemFoco;
  document.getElementById('baixa-camp-meta-label').textContent = `${camp.metaUnidades} un.`;
  document.getElementById('baixa-camp-recebido').value = camp.arrecadadoUnidades || camp.metaUnidades;
  document.getElementById('baixa-camp-obs').value = '';
  atualizarPreviewResultadoMeta();
  abrirModal('modal-baixa-campanha');
}

function atualizarPreviewResultadoMeta() {
  const meta = Number(document.getElementById('baixa-camp-meta').value || 0);
  const recebido = Number(document.getElementById('baixa-camp-recebido').value || 0);
  const box = document.getElementById('preview-resultado-meta');
  const diff = recebido - meta;
  const pct = meta > 0 ? Math.round((recebido / meta) * 100) : 0;

  if (diff > 0) {
    box.className = 'p-3 rounded-xl border bg-pastelGreen/70 border-emerald-300 text-emerald-900 text-xs font-bold flex items-center justify-between';
    box.innerHTML = `<span><i class="ph-bold ph-trend-up mr-1"></i> Acima da meta!</span><span>+${diff} un. (${pct}%)</span>`;
  } else if (diff === 0) {
    box.className = 'p-3 rounded-xl border bg-pastelGreen/70 border-emerald-300 text-emerald-900 text-xs font-bold flex items-center justify-between';
    box.innerHTML = `<span><i class="ph-bold ph-check-circle mr-1"></i> Meta exata atingida!</span><span>0 diferença (100%)</span>`;
  } else {
    box.className = 'p-3 rounded-xl border bg-amber-50 border-amber-300 text-amber-900 text-xs font-bold flex items-center justify-between';
    box.innerHTML = `<span><i class="ph-bold ph-trend-down mr-1"></i> Abaixo da meta</span><span>${diff} un. (${pct}%)</span>`;
  }
}

async function confirmarBaixaCampanha(event) {
  event.preventDefault();
  const idCampanha = document.getElementById('baixa-camp-id').value;
  const recebidoReal = Math.max(0, Number(document.getElementById('baixa-camp-recebido').value));
  const obs = document.getElementById('baixa-camp-obs').value.trim();
  const camp = campanhasCache.find((c) => c.idCampanha === idCampanha);
  if (!camp) return;

  const btn = document.getElementById('btn-confirmar-baixa-camp');
  btn.disabled = true;
  btn.textContent = 'Salvando...';

  try {
    const diff = recebidoReal - camp.metaUnidades;
    const pct = camp.metaUnidades > 0 ? Math.round((recebidoReal / camp.metaUnidades) * 100) : 0;
    const resumoTexto = diff >= 0
      ? `Meta atingida/superada: ${recebidoReal}/${camp.metaUnidades} un. (+${diff} un. | ${pct}%).`
      : `Abaixo da meta: ${recebidoReal}/${camp.metaUnidades} un. (${diff} un. | ${pct}%).`;

    camp.status = 'encerrada';
    camp.status_aprovacao = 'Encerrada';
    camp.arrecadadoUnidades = recebidoReal;
    camp.parecerTecnico = obs ? `${resumoTexto} ${obs}` : resumoTexto;

    await salvarOuModerarCampanhaAdmin(camp, false);
    fecharModal('modal-baixa-campanha');
    mostrarFeedbackModeracao(
      `Baixa confirmada em "${camp.titulo}"! Recebido: ${recebidoReal} un. (${diff >= 0 ? `+${diff} acima` : `${diff} abaixo`} da meta).`,
      true
    );
    await carregarTelaModeracao();
  } catch (erro) {
    mostrarFeedbackModeracao(`Erro ao confirmar baixa: ${erro.message}`, false);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Confirmar Baixa e Encerrar';
  }
}

async function salvarNovaCampanhaInstitucional(event) {
  event.preventDefault();
  const btn = document.getElementById('btn-publicar-camp');
  btn.disabled = true;
  btn.textContent = 'Publicando...';

  try {
    const nova = {
      id_campanha: `camp_${Date.now()}`,
      titulo: document.getElementById('nova-camp-titulo').value.trim(),
      itemFoco: document.getElementById('nova-camp-item').value.trim(),
      metaUnidades: Number(document.getElementById('nova-camp-meta').value),
      arrecadadoUnidades: 0,
      dataInicio: new Date().toISOString().split('T')[0],
      data_fim: document.getElementById('nova-camp-data').value,
      descricao: document.getElementById('nova-camp-desc').value.trim(),
      responsavel: document.getElementById('nova-camp-resp').value.trim() || 'Administração Casa da Criança',
      status_aprovacao: 'Aprovada',
      parecerTecnico: 'Campanha oficial criada pela equipe administrativa.'
    };

    await salvarOuModerarCampanhaAdmin(nova, true);
    fecharModal('modal-nova-campanha-admin');
    mostrarFeedbackModeracao(`Campanha "${nova.titulo}" publicada com sucesso!`, true);
    await carregarTelaModeracao();
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
    await excluirCampanhaAdmin(idCampanha);
    mostrarFeedbackModeracao(`Campanha "${titulo}" removida com sucesso.`, true);
    await carregarTelaModeracao();
  } catch (erro) {
    mostrarFeedbackModeracao(`Erro ao excluir campanha: ${erro.message}`, false);
  }
}

window.carregarTelaModeracao = carregarTelaModeracao;
window.filtrarStatusCampanha = filtrarStatusCampanha;
window.abrirModalNovaCampanha = abrirModalNovaCampanha;
window.aprovarCampanhaDireto = aprovarCampanhaDireto;
window.abrirModalReprovacao = abrirModalReprovacao;
window.confirmarReprovacaoCampanha = confirmarReprovacaoCampanha;
window.abrirModalBaixaCampanha = abrirModalBaixaCampanha;
window.atualizarPreviewResultadoMeta = atualizarPreviewResultadoMeta;
window.confirmarBaixaCampanha = confirmarBaixaCampanha;
window.salvarNovaCampanhaInstitucional = salvarNovaCampanhaInstitucional;
window.confirmarExclusaoCampanha = confirmarExclusaoCampanha;
