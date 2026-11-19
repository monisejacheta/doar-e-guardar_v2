/**
 * Módulo do Painel Principal Administrativo
 * Dados 100% reais da AWS, linguagem casual e listas expansíveis sob demanda.
 */

if (typeof window.escaparHtml !== 'function') {
  window.escaparHtml = function (texto) {
    const div = document.createElement('div');
    div.textContent = texto ?? '';
    return div.innerHTML;
  };
}

function renderizarResumoTopo(metricas, campanhas, lotes) {
  const pendentes = campanhas.filter((c) => c.status === 'pendente').length;
  const ativas = campanhas.filter((c) => c.status === 'aprovada').length;
  const vencendoOuVencidos = lotes.filter((l) => l.diasRestantes <= 30).length;

  document.getElementById('kpi-total-unidades').textContent = `${metricas.totalUnidades} un.`;
  document.getElementById('kpi-total-lotes').textContent = `${metricas.totalLotesAtivos} lotes em ${metricas.totalLocaisAtivos} locais`;

  document.getElementById('kpi-abaixo-minimo').textContent = `${metricas.qtdAbaixoMinimo} itens`;
  document.getElementById('kpi-abaixo-minimo-desc').textContent =
    metricas.qtdAbaixoMinimo > 0 ? 'Precisam de reposição' : 'Tudo abastecido';

  document.getElementById('kpi-fefo-alerta').textContent = `${vencendoOuVencidos} lotes`;
  document.getElementById('kpi-fefo-vencidos').textContent = `${metricas.qtdVencendo30d} vencendo • ${metricas.qtdVencidos} vencidos`;

  document.getElementById('kpi-campanhas-pendentes').textContent = `${pendentes} pendentes`;
  const subCamp = document.getElementById('kpi-campanhas-sub');
  if (subCamp) subCamp.textContent = `${ativas} campanha(s) ativa(s)`;
}

/**
 * Lista expansível dentro do card "Estoque Baixo"
 */
function renderizarCardListaEstoqueBaixo(produtosAbaixoMinimo, lotes) {
  const container = document.getElementById('card-lista-estoque-baixo');
  if (!container) return;

  if (produtosAbaixoMinimo.length === 0) {
    container.innerHTML = `<p class="text-[11px] font-semibold text-emerald-800 py-1">Tudo abastecido acima do mínimo!</p>`;
    return;
  }

  container.innerHTML = produtosAbaixoMinimo.map((prod) => {
    const faltam = Math.max(1, prod.estoqueMinimo - prod.quantidadeTotal);
    const lotesProd = lotes.filter((l) => l.nomeProduto.toLowerCase() === prod.nomeProduto.toLowerCase());
    const locaisTexto = lotesProd.length > 0
      ? lotesProd.map((l) => `${escaparHtml(l.localArmazenamento)} (${l.quantidadeAtual} un.)`).join(', ')
      : 'Sem lotes ativos';

    return `
      <div class="p-2 rounded-lg bg-white border border-red-100 text-[11px] space-y-0.5">
        <div class="flex items-center justify-between gap-2">
          <span class="font-bold text-brandBlue truncate">${escaparHtml(prod.nomeProduto)}</span>
          <span class="px-1.5 py-0.5 rounded bg-red-600 text-white font-bold text-[10px] shrink-0">Faltam ${faltam}</span>
        </div>
        <p class="text-[10px] text-slate-600">Temos ${prod.quantidadeTotal} / Mínimo ${prod.estoqueMinimo}</p>
        <p class="text-[10px] text-slate-500 truncate">${locaisTexto}</p>
      </div>
    `;
  }).join('');
}

/**
 * Lista expansível dentro do card "Vencendo em até 30 dias"
 */
function renderizarCardListaVencendo(lotes) {
  const container = document.getElementById('card-lista-vencendo');
  if (!container) return;

  const lotesAlerta = lotes.filter((l) => l.diasRestantes <= 30);

  if (lotesAlerta.length === 0) {
    container.innerHTML = `<p class="text-[11px] font-semibold text-emerald-800 py-1">Nenhum produto perto de vencer.</p>`;
    return;
  }

  container.innerHTML = lotesAlerta.map((lote) => {
    const vencido = lote.diasRestantes < 0;
    const textoPrazo = vencido
      ? `Venceu há ${Math.abs(lote.diasRestantes)}d`
      : lote.diasRestantes === 0
        ? 'Vence hoje'
        : `Em ${lote.diasRestantes}d`;

    return `
      <div class="p-2 rounded-lg bg-white border border-yellow-200 text-[11px] space-y-0.5">
        <div class="flex items-center justify-between gap-2">
          <span class="font-bold text-brandBlue truncate">${escaparHtml(lote.nomeProduto)}</span>
          <span class="px-1.5 py-0.5 rounded font-bold text-[10px] border shrink-0 ${lote.statusFefo.classeBadge}">${textoPrazo}</span>
        </div>
        <p class="text-[10px] text-slate-600 truncate">Lote ${escaparHtml(lote.codigoLote)} • ${lote.quantidadeAtual} un.</p>
        <p class="text-[10px] text-slate-500 truncate">${escaparHtml(lote.localArmazenamento)} • Val: ${lote.dataValidadeFormatada}</p>
      </div>
    `;
  }).join('');
}

/**
 * LISTA 1: Volume em Estoque (por produto, expande mostrando os lotes e detalhes)
 */
function renderizarVolumeEstoqueExpansivel(produtosAgrupados, lotes) {
  const container = document.getElementById('lista-volume-expansivel');
  if (!container) return;

  if (produtosAgrupados.length === 0) {
    container.innerHTML = `<p class="text-xs text-slate-500 py-3">Nenhum produto em estoque no momento.</p>`;
    return;
  }

  container.innerHTML = produtosAgrupados.map((prod) => {
    const lotesProd = lotes.filter((l) => l.nomeProduto.toLowerCase() === prod.nomeProduto.toLowerCase());
    const detalhesHtml = lotesProd.map((l) => `
      <div class="flex flex-wrap items-center justify-between gap-2 py-1.5 px-2.5 rounded-lg bg-white border border-slate-200/80 text-[11px]">
        <div class="min-w-0 flex-1">
          <span class="font-bold text-brandBlue">${escaparHtml(l.codigoLote)}</span>
          <span class="text-slate-500 ml-1">• ${escaparHtml(l.localArmazenamento)}</span>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <span class="font-bold text-slate-700">${l.quantidadeAtual} ${escaparHtml(l.unidadeMedida)}</span>
          <span class="text-slate-500">Val: ${l.dataValidadeFormatada}</span>
        </div>
      </div>
    `).join('');

    return `
      <details class="group rounded-xl bg-slate-50 border border-slate-200 overflow-hidden">
        <summary class="flex items-center justify-between gap-2 p-3 cursor-pointer list-none hover:bg-slate-100/70 transition">
          <div class="min-w-0 flex-1">
            <p class="text-xs font-bold text-brandBlue truncate">${escaparHtml(prod.nomeProduto)}</p>
            <p class="text-[11px] text-slate-500 truncate">${escaparHtml(prod.categoria)} • ${prod.lotesCount} lote(s)</p>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <span class="px-2.5 py-0.5 rounded-lg bg-pastelBlue text-brandBlue font-bold text-xs">
              ${prod.quantidadeTotal} ${escaparHtml(prod.unidadeMedida)}
            </span>
            <i class="ph-bold ph-caret-down text-slate-400 transition-transform group-open:rotate-180"></i>
          </div>
        </summary>
        <div class="px-3 pb-3 pt-1.5 border-t border-slate-200/70 space-y-1.5">
          <div class="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600 pb-1">
            <span>Marca: <strong>${escaparHtml(prod.marca)}</strong></span>
            <span>Mínimo recomendado: <strong>${prod.estoqueMinimo}</strong></span>
          </div>
          ${detalhesHtml}
        </div>
      </details>
    `;
  }).join('');
}

/**
 * LISTA 2: Armários e Geladeiras (expande mostrando os produtos guardados)
 */
function renderizarOcupacaoExpansivel(locaisReconciliados, lotes) {
  const container = document.getElementById('lista-ocupacao-expansivel');
  if (!container) return;

  if (locaisReconciliados.length === 0) {
    container.innerHTML = `<p class="text-xs text-slate-500 py-3">Nenhum armário ou geladeira cadastrado.</p>`;
    return;
  }

  const maiorUnidades = Math.max(...locaisReconciliados.map((l) => l.unidadesTotais), 40);

  container.innerHTML = locaisReconciliados.map((loc) => {
    const perc = Math.min(100, Math.round((loc.unidadesTotais / maiorUnidades) * 100));
    const icone = loc.tipo === 'geladeira' ? 'ph-thermometer-cold' : 'ph-archive-box';
    const lotesNoLocal = lotes.filter((l) => l.localArmazenamento === loc.nome);

    const detalhesLocal = lotesNoLocal.length > 0
      ? lotesNoLocal.map((l) => `
          <div class="flex flex-wrap items-center justify-between gap-2 py-1.5 px-2.5 rounded-lg bg-white border border-slate-200/80 text-[11px]">
            <div class="min-w-0 flex-1">
              <span class="font-bold text-brandBlue block truncate">${escaparHtml(l.nomeProduto)}</span>
              <span class="text-slate-500">Lote ${escaparHtml(l.codigoLote)} • Val: ${l.dataValidadeFormatada}</span>
            </div>
            <span class="font-bold text-slate-700 shrink-0">${l.quantidadeAtual} ${escaparHtml(l.unidadeMedida)}</span>
          </div>
        `).join('')
      : `<p class="text-[11px] text-slate-500 py-1">Este espaço está vazio no momento.</p>`;

    return `
      <details class="group rounded-xl bg-slate-50 border border-slate-200 overflow-hidden">
        <summary class="p-3 cursor-pointer list-none hover:bg-slate-100/70 transition space-y-2">
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-2 min-w-0 flex-1">
              <i class="ph-fill ${icone} text-base text-brandBlue shrink-0"></i>
              <span class="text-xs font-bold text-brandBlue truncate">${escaparHtml(loc.nome)}</span>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <span class="text-[11px] font-bold text-slate-700">${loc.lotesAtivos} lotes • ${loc.unidadesTotais} un.</span>
              <i class="ph-bold ph-caret-down text-slate-400 transition-transform group-open:rotate-180"></i>
            </div>
          </div>
          <div class="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div class="h-full bg-brandBlue rounded-full transition-all" style="width: ${Math.max(perc, loc.lotesAtivos > 0 ? 8 : 0)}%"></div>
          </div>
        </summary>
        <div class="px-3 pb-3 pt-2 border-t border-slate-200/70 space-y-1.5">
          <p class="text-[11px] text-slate-500">Ambiente: <strong>${escaparHtml(loc.ambiente)}</strong></p>
          ${detalhesLocal}
        </div>
      </details>
    `;
  }).join('');
}

/**
 * LISTA 3: Reposição Prioritária (expande mostrando detalhes e lotes atuais do produto)
 */
function renderizarReposicaoExpansivel(produtosAbaixoMinimo, lotes) {
  const container = document.getElementById('lista-reposicao-expansivel');
  if (!container) return;

  if (produtosAbaixoMinimo.length === 0) {
    container.innerHTML = `
      <div class="p-3.5 rounded-xl bg-pastelGreen/60 border border-pastelGreen text-emerald-900 text-xs font-semibold flex items-center gap-2">
        <i class="ph-fill ph-check-circle text-lg text-emerald-700 shrink-0"></i>
        <span>Nenhum produto precisando de reposição urgente.</span>
      </div>
    `;
    return;
  }

  container.innerHTML = produtosAbaixoMinimo.map((prod) => {
    const faltam = Math.max(1, prod.estoqueMinimo - prod.quantidadeTotal);
    const lotesProd = lotes.filter((l) => l.nomeProduto.toLowerCase() === prod.nomeProduto.toLowerCase());

    const detalhes = lotesProd.length > 0
      ? lotesProd.map((l) => `
          <div class="flex flex-wrap items-center justify-between gap-2 py-1.5 px-2.5 rounded-lg bg-white border border-red-100 text-[11px]">
            <span class="font-medium text-slate-700 truncate">${escaparHtml(l.localArmazenamento)} (${escaparHtml(l.codigoLote)})</span>
            <span class="font-bold text-brandBlue shrink-0">${l.quantidadeAtual} un. • Val: ${l.dataValidadeFormatada}</span>
          </div>
        `).join('')
      : `<p class="text-[11px] text-red-700">Sem lotes ativos no momento.</p>`;

    return `
      <details class="group rounded-xl bg-red-50/70 border border-red-200 overflow-hidden">
        <summary class="flex items-center justify-between gap-2 p-3 cursor-pointer list-none hover:bg-red-100/50 transition">
          <div class="min-w-0 flex-1">
            <p class="text-xs font-bold text-brandBlue truncate">${escaparHtml(prod.nomeProduto)}</p>
            <p class="text-[11px] text-slate-600">Atual: <strong class="text-red-700">${prod.quantidadeTotal}</strong> • Mínimo: ${prod.estoqueMinimo}</p>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <span class="px-2.5 py-0.5 rounded-lg bg-red-600 text-white font-bold text-[11px]">-${faltam}</span>
            <i class="ph-bold ph-caret-down text-slate-500 transition-transform group-open:rotate-180"></i>
          </div>
        </summary>
        <div class="px-3 pb-3 pt-2 border-t border-red-200/70 space-y-1.5">
          <p class="text-[11px] text-slate-600">Categoria: <strong>${escaparHtml(prod.categoria)}</strong> • Marca: <strong>${escaparHtml(prod.marca)}</strong></p>
          ${detalhes}
        </div>
      </details>
    `;
  }).join('');
}

/**
 * LISTA 4: Últimas Movimentações (expande mostrando motivo, responsável, local e data/hora)
 */
function renderizarMovimentacoesExpansivel(movimentacoes) {
  const container = document.getElementById('lista-movimentacoes-expansivel');
  if (!container) return;

  if (movimentacoes.length === 0) {
    container.innerHTML = `<p class="text-xs text-slate-500 py-3">Nenhuma movimentação registrada ainda.</p>`;
    return;
  }

  container.innerHTML = movimentacoes.slice(0, 10).map((mov) => {
    let corBadge = 'bg-pastelGreen text-emerald-900';
    if (mov.tipo.includes('SAÍDA') || mov.tipo.includes('SAIDA') || mov.tipo.includes('BAIXA')) corBadge = 'bg-red-100 text-red-800';
    if (mov.tipo.includes('MOVIMENTA') || mov.tipo.includes('TRANSFER')) corBadge = 'bg-pastelBlue text-brandBlue';
    if (mov.tipo.includes('AJUSTE')) corBadge = 'bg-pastelYellow text-yellow-900';

    return `
      <details class="group rounded-xl bg-slate-50 border border-slate-200 overflow-hidden">
        <summary class="flex items-center justify-between gap-2 p-3 cursor-pointer list-none hover:bg-slate-100/70 transition">
          <div class="flex items-center gap-2 min-w-0 flex-1">
            <span class="px-2 py-0.5 rounded text-[10px] font-bold ${corBadge} shrink-0">${escaparHtml(mov.tipo)}</span>
            <span class="text-xs font-bold text-brandBlue truncate">${escaparHtml(mov.nomeProduto)}</span>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <span class="text-xs font-bold text-brandBlue">${mov.quantidade} un.</span>
            <i class="ph-bold ph-caret-down text-slate-400 transition-transform group-open:rotate-180"></i>
          </div>
        </summary>
        <div class="px-3 pb-3 pt-2 border-t border-slate-200/70 text-[11px] text-slate-600 space-y-1">
          <p><strong>Lote:</strong> ${escaparHtml(mov.codigoLote)} • <strong>Local:</strong> ${escaparHtml(mov.localArmazenamento)}</p>
          <p><strong>Motivo:</strong> ${escaparHtml(mov.motivo)}</p>
          <p><strong>Quem fez:</strong> ${escaparHtml(mov.responsavel)} • <strong>Quando:</strong> ${escaparHtml(mov.dataHoraFormatada)}</p>
        </div>
      </details>
    `;
  }).join('');
}

const MAPA_SECOES_LISTA = {
  volume: 'lista-volume-expansivel',
  ocupacao: 'lista-ocupacao-expansivel',
  reposicao: 'lista-reposicao-expansivel',
  movimentacoes: 'lista-movimentacoes-expansivel'
};

function alternarSecaoLista(chave, botao) {
  const idContainer = MAPA_SECOES_LISTA[chave];
  const container = idContainer ? document.getElementById(idContainer) : null;
  if (!container) return;

  const estaOculta = container.classList.toggle('hidden');
  if (botao) {
    const icone = botao.querySelector('i');
    const texto = botao.querySelector('span');
    if (icone) icone.className = estaOculta ? 'ph-bold ph-eye text-xs' : 'ph-bold ph-eye-slash text-xs';
    if (texto) texto.textContent = estaOculta ? 'Mostrar itens' : 'Ocultar itens';
  }
}

async function atualizarDashboardCompleto() {
  const iconeSync = document.getElementById('icone-sync-aws');
  const alertaErro = document.getElementById('alerta-erro-dashboard');
  if (iconeSync) iconeSync.classList.add('animate-spin');
  if (alertaErro) alertaErro.classList.add('hidden');

  try {
    const [dadosEstoque, campanhas] = await Promise.all([
      carregarDadosEstoqueAws(),
      carregarCampanhasReconciliadas()
    ]);

    const { lotes, movimentacoes, locaisReconciliados, produtosAgrupados, produtosAbaixoMinimo, metricas } = dadosEstoque;

    renderizarResumoTopo(metricas, campanhas, lotes);
    renderizarCardListaEstoqueBaixo(produtosAbaixoMinimo, lotes);
    renderizarCardListaVencendo(lotes);

    renderizarVolumeEstoqueExpansivel(produtosAgrupados, lotes);
    renderizarOcupacaoExpansivel(locaisReconciliados, lotes);
    renderizarReposicaoExpansivel(produtosAbaixoMinimo, lotes);
    renderizarMovimentacoesExpansivel(movimentacoes);
  } catch (erro) {
    console.error('Erro ao atualizar painel principal:', erro);
    if (alertaErro) {
      alertaErro.textContent = `Não foi possível carregar os dados reais da nuvem: ${erro.message}`;
      alertaErro.classList.remove('hidden');
    }
  } finally {
    if (iconeSync) iconeSync.classList.remove('animate-spin');
  }
}

window.atualizarDashboardCompleto = atualizarDashboardCompleto;
window.alternarSecaoLista = alternarSecaoLista;
