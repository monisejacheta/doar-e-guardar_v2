/**
 * Módulo Minhas Campanhas (Perfil Doador)
 * Conectado em tempo real às ações `listar_campanhas` e `excluir_campanha` da AWS.
 */

const URL_API_MINHAS_CAMPANHAS = 'https://zqc7b27zwivnfyczo5kedb3vta0evazc.lambda-url.us-east-2.on.aws/api/estoque';

let todasCampanhasDoadorCache = [];
let filtroStatusDoador = 'TODAS';
let mostrarSomenteMinhas = true;
let usuarioAtualDoador = { uid: '', nome: '', email: '' };

function escaparHtmlMinhas(texto) {
  const div = document.createElement('div');
  div.textContent = texto ?? '';
  return div.innerHTML;
}

function extrairMetadadosCampanha(textoBruto) {
  const texto = String(textoBruto || '');
  const matchRecebido = texto.match(/\[RECEBIDO:(\d+)\]/);
  const matchParecer = texto.match(/\[PARECER:(.*?)\]/);
  const matchInicio = texto.match(/\[INICIO:(.*?)\]/);
  const matchItens = texto.match(/\[ITENS:([^\]]*)\]/);

  let recebidoPorItens = null;
  if (matchItens && matchItens[1]) {
    try {
      const parsed = JSON.parse(decodeURIComponent(matchItens[1]));
      if (Array.isArray(parsed) && parsed.some((it) => it && it.recebido !== null && it.recebido !== undefined)) {
        recebidoPorItens = parsed.reduce((acc, it) => acc + Math.max(0, Number(it?.recebido || 0)), 0);
      }
    } catch (_) {
      recebidoPorItens = null;
    }
  }

  const textoLimpo = texto
    .replace(/\[RECEBIDO:\d+\]/g, '')
    .replace(/\[PARECER:.*?\]/g, '')
    .replace(/\[INICIO:.*?\]/g, '')
    .replace(/\[COLETAS:.*?\]/g, '')
    .replace(/\[ITENS:[^\]]*\]/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  return {
    itemFoco: textoLimpo || 'Alimentos Não Perecíveis',
    recebido: recebidoPorItens !== null ? recebidoPorItens : (matchRecebido ? Number(matchRecebido[1]) : 0),
    parecer: matchParecer ? matchParecer[1].trim() : '',
    inicio: matchInicio ? matchInicio[1].trim() : ''
  };
}

function normalizarCampanhaDoadorLista(c) {
  const id = String(c.id_campanha_doacao || c.id_campanha || c.id || '');
  const statusRaw = String(c.status_aprovacao || c.status_campanha || 'Pendente de Análise').toLowerCase();
  let status = 'pendente';
  if (statusRaw.includes('aprov') || statusRaw.includes('ativ')) status = 'aprovada';
  else if (statusRaw.includes('reprov') || statusRaw.includes('recus')) status = 'reprovada';
  else if (statusRaw.includes('encerr') || statusRaw.includes('finaliz') || statusRaw.includes('conclu')) status = 'encerrada';

  const parsed = extrairMetadadosCampanha(c.itens_necessarios || c.itemFoco || '');
  const matchMeta = String(c.meta ?? c.metaUnidades ?? 50).match(/\d+/);
  const meta = matchMeta ? (parseInt(matchMeta[0], 10) || 50) : 50;
  const arrecadado = parsed.recebido || Number(c.arrecadadoUnidades ?? 0);
  const pct = meta > 0 ? Math.round((arrecadado / meta) * 100) : 0;

  return {
    id,
    titulo: c.titulo || c.nome_campanha || 'Campanha Solidária',
    descricao: c.descricao || c.objetivo_descricao_campanha || '',
    responsavel: String(c.responsavel || c.nome_proponente || 'Comunidade'),
    dataInicio: parsed.inicio || c.data_inicio_campanha || '',
    dataFim: c.data_fim || c.data_termino_campanha || '',
    itemFoco: parsed.itemFoco,
    parecer: parsed.parecer || c.justificativa_parecer_tecnico || '',
    meta,
    arrecadado,
    pct,
    status
  };
}

function formatarDataBrCamp(dataStr) {
  if (!dataStr) return '--/--/----';
  const partes = String(dataStr).trim().split('T')[0].split('-');
  return partes.length === 3 ? `${partes[2]}/${partes[1]}/${partes[0]}` : dataStr;
}

function calcularDiasRestantes(dataFimStr) {
  if (!dataFimStr) return 0;
  const partes = String(dataFimStr).trim().split('T')[0].split('-');
  const fim = partes.length === 3
    ? new Date(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2]), 23, 59, 59)
    : new Date(dataFimStr);
  if (isNaN(fim.getTime())) return 0;
  return Math.ceil((fim.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

async function buscarMinhasCampanhasAws(user = null) {
  if (user) {
    usuarioAtualDoador = {
      uid: user.uid || '',
      nome: user.displayName || (user.email ? user.email.split('@')[0] : ''),
      email: user.email || ''
    };
  }

  const icone = document.getElementById('icone-sync-minhas');
  const loading = document.getElementById('loading');
  const lista = document.getElementById('lista-campanhas');
  if (icone) icone.classList.add('animate-spin');

  try {
    const resp = await fetch(URL_API_MINHAS_CAMPANHAS, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ acao: 'listar_campanhas' })
    });
    const dados = await resp.json();
    const brutas = Array.isArray(dados.campanhas) ? dados.campanhas : [];
    todasCampanhasDoadorCache = brutas.map(normalizarCampanhaDoadorLista);
    renderizarMinhasCampanhas();
  } catch {
    if (lista) {
      lista.innerHTML = `
        <div class="lg:col-span-2 p-6 bg-red-50 border border-red-200 rounded-2xl text-center text-red-800 text-xs font-bold">
          Não foi possível carregar suas campanhas agora. Tente novamente em instantes.
        </div>
      `;
    }
  } finally {
    if (icone) icone.classList.remove('animate-spin');
    if (loading) loading.classList.add('hidden');
    if (lista) lista.classList.remove('hidden');
  }
}

function alternarEscopoCampanhas(somenteMinhas) {
  mostrarSomenteMinhas = Boolean(somenteMinhas);
  const btnMinhas = document.getElementById('btn-escopo-minhas');
  const btnTodas = document.getElementById('btn-escopo-todas');
  if (btnMinhas && btnTodas) {
    btnMinhas.className = `px-3 py-1.5 rounded-lg text-xs font-bold transition ${mostrarSomenteMinhas ? 'bg-brandBlue text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`;
    btnTodas.className = `px-3 py-1.5 rounded-lg text-xs font-bold transition ${!mostrarSomenteMinhas ? 'bg-brandBlue text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`;
  }
  renderizarMinhasCampanhas();
}

function filtrarMinhasPorStatus(status) {
  filtroStatusDoador = status;
  renderizarMinhasCampanhas();
}

function obterBaseEscopoDoador() {
  if (!mostrarSomenteMinhas) return todasCampanhasDoadorCache;
  const emailLower = usuarioAtualDoador.email.toLowerCase();
  const nomeLower = usuarioAtualDoador.nome.toLowerCase();
  return todasCampanhasDoadorCache.filter((c) => {
    const resp = c.responsavel.toLowerCase();
    return (emailLower && resp.includes(emailLower)) || (nomeLower && resp.includes(nomeLower));
  });
}

function renderizarMinhasCampanhas() {
  const base = obterBaseEscopoDoador();

  document.getElementById('count-minhas-todas').textContent = base.length;
  document.getElementById('count-minhas-pendente').textContent = base.filter((c) => c.status === 'pendente').length;
  document.getElementById('count-minhas-aprovada').textContent = base.filter((c) => c.status === 'aprovada').length;
  document.getElementById('count-minhas-encerrada').textContent = base.filter((c) => c.status === 'encerrada').length;
  document.getElementById('count-minhas-reprovada').textContent = base.filter((c) => c.status === 'reprovada').length;

  ['TODAS', 'pendente', 'aprovada', 'encerrada', 'reprovada'].forEach((st) => {
    const btn = document.getElementById(`tab-minhas-${st}`);
    if (!btn) return;
    btn.classList.toggle('ring-2', st === filtroStatusDoador);
    btn.classList.toggle('ring-brandBlue', st === filtroStatusDoador);
  });

  const filtradas = filtroStatusDoador === 'TODAS'
    ? base
    : base.filter((c) => c.status === filtroStatusDoador);

  const lista = document.getElementById('lista-campanhas');
  if (filtradas.length === 0) {
    lista.innerHTML = `
      <div class="lg:col-span-2 p-8 bg-white border border-slate-200 rounded-2xl text-center text-slate-500 shadow-sm space-y-2">
        <i class="ph ph-folder-open text-3xl text-slate-400"></i>
        <p class="font-bold text-sm text-brandBlue">Nenhuma campanha encontrada aqui.</p>
        <p class="text-xs">${mostrarSomenteMinhas ? 'Você ainda não propôs campanhas neste filtro. Clique em "Nova Proposta" ou veja "Todas da Comunidade".' : 'Nenhuma campanha neste filtro.'}</p>
      </div>
    `;
    return;
  }

  lista.innerHTML = filtradas.map((camp) => {
    const dias = calcularDiasRestantes(camp.dataFim);
    const barra = Math.min(100, camp.pct);
    let badgeStatus = '';
    if (camp.status === 'pendente') {
      badgeStatus = `<span class="px-2.5 py-0.5 rounded-lg bg-pastelYellow text-yellow-900 border border-yellow-300 font-bold text-[10px] inline-flex items-center gap-1 shrink-0"><i class="ph-fill ph-hourglass-medium"></i> Em Análise</span>`;
    } else if (camp.status === 'aprovada') {
      badgeStatus = `<span class="px-2.5 py-0.5 rounded-lg bg-pastelGreen text-emerald-900 border border-emerald-300 font-bold text-[10px] inline-flex items-center gap-1 shrink-0"><i class="ph-fill ph-check-circle"></i> Ativa</span>`;
    } else if (camp.status === 'reprovada') {
      badgeStatus = `<span class="px-2.5 py-0.5 rounded-lg bg-red-100 text-red-700 border border-red-200 font-bold text-[10px] inline-flex items-center gap-1 shrink-0"><i class="ph-fill ph-x-circle"></i> Recusada</span>`;
    } else {
      badgeStatus = `<span class="px-2.5 py-0.5 rounded-lg bg-slate-200 text-slate-800 font-bold text-[10px] inline-flex items-center gap-1 shrink-0"><i class="ph-fill ph-flag-checkered"></i> Finalizada</span>`;
    }

    const badgePrazo = camp.status === 'aprovada'
      ? (dias > 0
          ? `<span class="px-2 py-0.5 rounded-md bg-pastelBlue text-brandBlue font-bold text-[10px] shrink-0">${dias} dia(s) restante(s)</span>`
          : `<span class="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-bold text-[10px] shrink-0">Prazo encerrado</span>`)
      : '';

    const diff = camp.arrecadado - camp.meta;
    const blocoResultado = camp.status === 'encerrada'
      ? `<div class="p-2.5 rounded-xl border ${diff >= 0 ? 'bg-pastelGreen/60 border-emerald-300 text-emerald-900' : 'bg-amber-50 border-amber-300 text-amber-900'} text-xs font-bold flex items-center justify-between">
           <span>Resultado final:</span>
           <span>${diff >= 0 ? `+${diff} un. acima da meta` : `${diff} un. abaixo da meta`} (${camp.pct}%)</span>
         </div>`
      : '';

    const blocoObs = camp.parecer
      ? `<div class="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600">
           <strong class="text-brandBlue">Observação da equipe:</strong> ${escaparHtmlMinhas(camp.parecer)}
         </div>`
      : '';

    const btnCancelar = camp.status === 'pendente' && mostrarSomenteMinhas
      ? `<button type="button" onclick="cancelarPropostaPendente('${escaparHtmlMinhas(camp.id)}', '${escaparHtmlMinhas(camp.titulo)}')" class="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 font-bold text-[11px] inline-flex items-center gap-1 transition">
           <i class="ph-bold ph-trash"></i> Cancelar Proposta
         </button>`
      : '';

    return `
      <article class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-3">
        <div class="space-y-2.5">
          <div class="flex items-start justify-between gap-2">
            <div class="min-w-0 flex-1">
              <span class="text-[10px] font-bold uppercase text-slate-400 block">Até ${formatarDataBrCamp(camp.dataFim)}</span>
              <h2 class="text-sm font-bold text-brandBlue leading-snug break-words">${escaparHtmlMinhas(camp.titulo)}</h2>
            </div>
            <div class="flex flex-wrap items-center gap-1.5 shrink-0">
              ${badgePrazo}
              ${badgeStatus}
            </div>
          </div>

          <p class="text-xs text-slate-600 leading-relaxed break-words">${escaparHtmlMinhas(camp.descricao || 'Campanha solidária.')}</p>

          <div class="p-3 rounded-xl bg-pastelBlue/30 border border-pastelBlue space-y-1.5">
            <div class="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span class="font-semibold text-slate-700 truncate min-w-0 flex-1">Itens: <strong class="text-brandBlue">${escaparHtmlMinhas(camp.itemFoco)}</strong></span>
              <span class="font-bold text-brandBlue shrink-0">${camp.arrecadado} / ${camp.meta} un. (${camp.pct}%)</span>
            </div>
            <div class="w-full h-2 bg-white rounded-full overflow-hidden border border-blue-100">
              <div class="h-full ${camp.arrecadado >= camp.meta ? 'bg-emerald-600' : 'bg-brandBlue'} rounded-full" style="width: ${barra}%"></div>
            </div>
            <p class="text-[11px] text-slate-500 truncate">Responsável: <strong>${escaparHtmlMinhas(camp.responsavel)}</strong></p>
          </div>

          ${blocoResultado}
          ${blocoObs}
        </div>

        ${btnCancelar ? `<div class="pt-2 border-t border-slate-100 flex justify-end">${btnCancelar}</div>` : ''}
      </article>
    `;
  }).join('');
}

async function cancelarPropostaPendente(idCampanha, titulo) {
  if (!confirm(`Deseja cancelar e remover a proposta "${titulo}"?`)) return;
  try {
    await fetch(URL_API_MINHAS_CAMPANHAS, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        acao: 'excluir_campanha',
        id_campanha: idCampanha,
        id_campanha_doacao: idCampanha
      })
    });
    await buscarMinhasCampanhasAws();
  } catch (err) {
    alert('Não foi possível cancelar a proposta: ' + err.message);
  }
}

window.buscarMinhasCampanhasAws = buscarMinhasCampanhasAws;
window.alternarEscopoCampanhas = alternarEscopoCampanhas;
window.filtrarMinhasPorStatus = filtrarMinhasPorStatus;
window.cancelarPropostaPendente = cancelarPropostaPendente;
