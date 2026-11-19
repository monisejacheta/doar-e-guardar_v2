/**
 * Central de Relatórios, Gráficos e Métricas
 * 100% conectado aos dados reais da AWS, com geração local de PDF e CSV (sem envio por e-mail).
 */

if (typeof window.escaparHtml !== 'function') {
  window.escaparHtml = function (texto) {
    const div = document.createElement('div');
    div.textContent = texto ?? '';
    return div.innerHTML;
  };
}

let dadosAwsRelatorio = null;
let campanhasAwsRelatorio = [];
let logsAuditoriaAws = [];
let doadoresAwsRelatorio = [];
let instituicoesAwsRelatorio = [];
let linhasExportacaoCsv = [];
let ultimoResumoTextoWhatsApp = '';

let graficoPrincipalInstancia = null;
let graficoSecundarioInstancia = null;

const PALETA_CORES = [
  '#1E3A8A', '#10B981', '#F59E0B', '#DC2626',
  '#3B82F6', '#059669', '#D97706', '#6366F1'
];

function formatarNumero(val) {
  return Number(val || 0).toLocaleString('pt-BR');
}

function dentroDoPeriodo(dataStr, inicio, fim) {
  if (!inicio && !fim) return true;
  if (!dataStr) return true;
  const limpo = String(dataStr).trim().split('T')[0];
  if (inicio && limpo < inicio) return false;
  if (fim && limpo > fim) return false;
  return true;
}

async function carregarDadosRelatorioAws() {
  const icone = document.getElementById('icone-sync-relatorio');
  const alerta = document.getElementById('alerta-erro-relatorios');
  if (icone) icone.classList.add('animate-spin');
  if (alerta) alerta.classList.add('hidden');

  try {
    const [dadosEstoque, campanhas, respLogs, respDoadores, respInsts] = await Promise.all([
      carregarDadosEstoqueAws(),
      carregarCampanhasReconciliadas().catch(() => []),
      executarAcaoEstoqueAws({ acao: 'consultar_logs_auditoria' }).catch(() => ({ logs: [] })),
      executarAcaoEstoqueAws({ acao: 'consultar_doadores' }).catch(() => ({ doadores: [] })),
      executarAcaoEstoqueAws({ acao: 'consultar_instituicoes' }).catch(() => ({ instituicoes: [] }))
    ]);

    dadosAwsRelatorio = dadosEstoque;
    campanhasAwsRelatorio = campanhas;
    logsAuditoriaAws = Array.isArray(respLogs.logs) ? respLogs.logs : [];
    doadoresAwsRelatorio = (Array.isArray(respDoadores.doadores) ? respDoadores.doadores : []).map((d) => ({
      id: String(d.id_doador || d.id || ''),
      nome_completo: String(d.nome_completo || d.nome_completo_doador || d.nome || 'Doador').trim(),
      tipo: String(d.tipo || 'PF').toUpperCase() === 'PJ' ? 'PJ' : 'PF',
      documento: String(d.documento || d.cpf_doador || ''),
      telefone: String(d.telefone || d.telefone_doador || '').replace(/\D/g, ''),
      data_cadastro: String(d.data_cadastro || ''),
      observacoes: String(d.observacoes || d.endereco || ''),
      status_ativo: d.status_ativo !== false
    }));
    instituicoesAwsRelatorio = (Array.isArray(respInsts.instituicoes) ? respInsts.instituicoes : []).map((i) => ({
      id: String(i.id_instituicao || i.id || ''),
      nome_fantasia: String(i.nome_fantasia || i.nome_instituicao || i.nome || 'Instituição').trim(),
      razao_social: String(i.razao_social || i.nome_fantasia || ''),
      cnpj: String(i.cnpj || i.cnpj_instituicao || ''),
      tipo_unidade: String(i.tipo_unidade || 'Unidade Parceira'),
      endereco: String(i.endereco || ''),
      telefone: String(i.telefone || '').replace(/\D/g, ''),
      responsavel: String(i.responsavel || ''),
      data_fundacao: String(i.data_fundacao || ''),
      status_ativo: i.status_ativo !== false
    }));

    // Popula filtro de locais
    const selLocal = document.getElementById('relatorio-prateleira');
    const localAtual = selLocal.value || 'TODAS';
    selLocal.innerHTML = `<option value="TODAS">Todos os locais (${dadosAwsRelatorio.locaisReconciliados.length})</option>` +
      dadosAwsRelatorio.locaisReconciliados.map((l) => `<option value="${escaparHtml(l.nome)}">${escaparHtml(l.nome)}</option>`).join('');
    selLocal.value = localAtual;

    // Popula filtro de categorias
    const selCat = document.getElementById('relatorio-categoria');
    const catAtual = selCat.value || 'TODAS';
    const catsUnicas = Array.from(new Set(dadosAwsRelatorio.lotes.map((l) => l.categoria).filter(Boolean))).sort();
    selCat.innerHTML = `<option value="TODAS">Todas as categorias</option>` +
      catsUnicas.map((c) => `<option value="${escaparHtml(c)}">${escaparHtml(c)}</option>`).join('');
    selCat.value = catAtual;

    renderizarRelatorioSelecionado();
  } catch (erro) {
    console.error('Erro ao carregar relatórios:', erro);
    if (alerta) {
      alerta.textContent = `Não foi possível carregar os dados para os relatórios: ${erro.message}`;
      alerta.classList.remove('hidden');
    }
  } finally {
    if (icone) icone.classList.remove('animate-spin');
  }
}

function atualizarKpisRelatorio(k1Label, k1Val, k2Label, k2Val, k3Label, k3Val, k4Label, k4Val) {
  document.getElementById('rel-kpi-1-label').textContent = k1Label;
  document.getElementById('rel-kpi-1').textContent = k1Val;
  document.getElementById('rel-kpi-2-label').textContent = k2Label;
  document.getElementById('rel-kpi-2').textContent = k2Val;
  document.getElementById('rel-kpi-3-label').textContent = k3Label;
  document.getElementById('rel-kpi-3').textContent = k3Val;
  document.getElementById('rel-kpi-4-label').textContent = k4Label;
  document.getElementById('rel-kpi-4').textContent = k4Val;

  const tituloAtual = document.getElementById('titulo-tabela-relatorio')?.textContent || 'Relatório';
  ultimoResumoTextoWhatsApp =
    `📊 *${tituloAtual}* — Casa da Criança\n` +
    `• ${k1Label}: ${k1Val}\n` +
    `• ${k2Label}: ${k2Val}\n` +
    `• ${k3Label}: ${k3Val}\n` +
    `• ${k4Label}: ${k4Val}\n` +
    `Emitido em ${new Date().toLocaleString('pt-BR')}`;
}

function renderizarGraficosRelatorio(configPrincipal, configSecundario) {
  if (typeof Chart === 'undefined') return;

  const ctx1 = document.getElementById('grafico-principal')?.getContext('2d');
  const ctx2 = document.getElementById('grafico-secundario')?.getContext('2d');
  if (!ctx1 || !ctx2) return;

  if (graficoPrincipalInstancia) graficoPrincipalInstancia.destroy();
  if (graficoSecundarioInstancia) graficoSecundarioInstancia.destroy();

  const tipoPreferido = document.getElementById('tipo-grafico-preferido')?.value || 'bar';
  const tipoPrincipal = tipoPreferido === 'horizontalBar' ? 'bar' : tipoPreferido;
  const indexAxis = tipoPreferido === 'horizontalBar' ? 'y' : 'x';

  document.getElementById('titulo-grafico-1').textContent = configPrincipal.titulo;
  document.getElementById('titulo-grafico-2').textContent = configSecundario.titulo;

  graficoPrincipalInstancia = new Chart(ctx1, {
    type: tipoPrincipal === 'doughnut' ? 'bar' : tipoPrincipal,
    data: {
      labels: configPrincipal.labels,
      datasets: configPrincipal.datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis,
      plugins: {
        legend: { display: configPrincipal.datasets.length > 1, position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } }
      },
      scales: {
        x: { ticks: { font: { size: 10 } }, grid: { display: false } },
        y: { beginAtZero: true, ticks: { font: { size: 10 } } }
      }
    }
  });

  graficoSecundarioInstancia = new Chart(ctx2, {
    type: 'doughnut',
    data: {
      labels: configSecundario.labels,
      datasets: [{
        data: configSecundario.valores,
        backgroundColor: configSecundario.cores || PALETA_CORES,
        borderWidth: 2,
        borderColor: '#ffffff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } }
      }
    }
  });
}

function renderizarRelatorioSelecionado() {
  if (!dadosAwsRelatorio) return;

  const tipo = document.getElementById('tipo-relatorio').value;
  const localFiltro = document.getElementById('relatorio-prateleira').value;
  const catFiltro = document.getElementById('relatorio-categoria').value;
  const dataInicio = document.getElementById('relatorio-data-inicio').value;
  const dataFim = document.getElementById('relatorio-data-fim').value;

  const agoraStr = new Date().toLocaleString('pt-BR');
  document.getElementById('data-emissao-relatorio').textContent = `Emitido em ${agoraStr}`;

  const thead = document.getElementById('thead-relatorio');
  const tbody = document.getElementById('tbody-relatorio');
  const tituloEl = document.getElementById('titulo-tabela-relatorio');

  const lotesFiltrados = dadosAwsRelatorio.lotes.filter((l) =>
    (localFiltro === 'TODAS' || l.localArmazenamento === localFiltro) &&
    (catFiltro === 'TODAS' || l.categoria === catFiltro)
  );

  // 1. CAMPANHAS FINALIZADAS (SUCESSO / FALHA)
  if (tipo === 'CAMPANHAS_FINALIZADAS') {
    tituloEl.textContent = 'Campanhas Finalizadas — Métricas de Sucesso e Falha';
    const finalizadas = campanhasAwsRelatorio
      .filter((c) => c.status === 'encerrada')
      .filter((c) => dentroDoPeriodo(c.dataLimite, dataInicio, dataFim));

    const sucessos = finalizadas.filter((c) => c.arrecadadoUnidades >= c.metaUnidades).length;
    const falhas = finalizadas.length - sucessos;
    const taxaSucesso = finalizadas.length > 0 ? Math.round((sucessos / finalizadas.length) * 100) : 0;
    const totalMeta = finalizadas.reduce((acc, c) => acc + c.metaUnidades, 0);
    const totalRecebido = finalizadas.reduce((acc, c) => acc + c.arrecadadoUnidades, 0);
    const saldoGeral = totalRecebido - totalMeta;

    atualizarKpisRelatorio(
      'Campanhas Finalizadas', `${finalizadas.length} (${sucessos} sucesso / ${falhas} abaixo)`,
      'Taxa de Sucesso', `${taxaSucesso}%`,
      'Meta vs. Recebido Real', `${formatarNumero(totalRecebido)} / ${formatarNumero(totalMeta)} un.`,
      'Saldo Líquido vs. Metas', `${saldoGeral >= 0 ? `+${saldoGeral}` : saldoGeral} un.`
    );

    renderizarGraficosRelatorio(
      {
        titulo: 'Meta vs. Recebido Real por Campanha',
        labels: finalizadas.length > 0 ? finalizadas.map((c) => c.titulo.slice(0, 22)) : ['Sem campanhas'],
        datasets: [
          { label: 'Meta', data: finalizadas.length > 0 ? finalizadas.map((c) => c.metaUnidades) : [0], backgroundColor: '#93C5FD', borderRadius: 6 },
          { label: 'Recebido Real', data: finalizadas.length > 0 ? finalizadas.map((c) => c.arrecadadoUnidades) : [0], backgroundColor: '#1E3A8A', borderRadius: 6 }
        ]
      },
      {
        titulo: 'Taxa de Sucesso vs. Abaixo da Meta',
        labels: ['Sucesso (Meta atingida)', 'Abaixo da Meta'],
        valores: finalizadas.length > 0 ? [sucessos, falhas] : [1, 0],
        cores: ['#10B981', '#DC2626']
      }
    );

    thead.innerHTML = `
      <tr>
        <th class="px-3 py-2.5">Campanha</th>
        <th class="px-3 py-2.5">Item Foco</th>
        <th class="px-3 py-2.5">Responsável</th>
        <th class="px-3 py-2.5 text-center">Término</th>
        <th class="px-3 py-2.5 text-center">Meta</th>
        <th class="px-3 py-2.5 text-center">Recebido Real</th>
        <th class="px-3 py-2.5 text-center">Diferença</th>
        <th class="px-3 py-2.5 text-center">% Atingido</th>
        <th class="px-3 py-2.5 text-center">Resultado</th>
      </tr>
    `;

    linhasExportacaoCsv = [
      ['Campanha', 'Item Foco', 'Responsavel', 'Termino', 'Meta', 'Recebido Real', 'Diferenca', 'Percentual', 'Resultado'],
      ...finalizadas.map((c) => {
        const diff = c.arrecadadoUnidades - c.metaUnidades;
        return [
          c.titulo, c.itemFoco, c.criadorNome, formatarDataBr(c.dataLimite),
          c.metaUnidades, c.arrecadadoUnidades, diff >= 0 ? `+${diff}` : diff, `${c.percentualAtingido}%`,
          diff >= 0 ? 'SUCESSO' : 'ABAIXO DA META'
        ];
      })
    ];

    tbody.innerHTML = finalizadas.length === 0
      ? `<tr><td colspan="9" class="p-8 text-center text-slate-500">Nenhuma campanha finalizada encontrada no período.</td></tr>`
      : finalizadas.map((c) => {
        const diff = c.arrecadadoUnidades - c.metaUnidades;
        const sucesso = diff >= 0;
        return `
          <tr class="hover:bg-slate-50">
            <td class="px-3 py-2.5 font-bold text-brandBlue">${escaparHtml(c.titulo)}</td>
            <td class="px-3 py-2.5">${escaparHtml(c.itemFoco)}</td>
            <td class="px-3 py-2.5 text-slate-600">${escaparHtml(c.criadorNome)}</td>
            <td class="px-3 py-2.5 text-center">${formatarDataBr(c.dataLimite)}</td>
            <td class="px-3 py-2.5 text-center font-semibold">${c.metaUnidades}</td>
            <td class="px-3 py-2.5 text-center font-extrabold text-brandBlue">${c.arrecadadoUnidades}</td>
            <td class="px-3 py-2.5 text-center font-bold ${sucesso ? 'text-emerald-700' : 'text-red-700'}">${diff >= 0 ? `+${diff}` : diff}</td>
            <td class="px-3 py-2.5 text-center font-bold">${c.percentualAtingido}%</td>
            <td class="px-3 py-2.5 text-center">
              <span class="inline-flex items-center justify-center w-28 py-1 rounded-lg text-[10px] font-bold border ${sucesso ? 'bg-pastelGreen text-emerald-900 border-emerald-300' : 'bg-red-100 text-red-800 border-red-200'}">
                ${sucesso ? 'SUCESSO' : 'ABAIXO DA META'}
              </span>
            </td>
          </tr>
        `;
      }).join('');
    return;
  }

  // 2. VISÃO GERAL EXECUTIVA
  if (tipo === 'VISAO_GERAL') {
    tituloEl.textContent = 'Resumo Executivo Geral da Instituição';
    const totalUnidades = lotesFiltrados.reduce((acc, l) => acc + l.quantidadeAtual, 0);
    const criticos = dadosAwsRelatorio.produtosAbaixoMinimo.length;
    const vencendo = lotesFiltrados.filter((l) => l.diasRestantes <= 30).length;

    const porCategoria = {};
    lotesFiltrados.forEach((l) => {
      porCategoria[l.categoria] = (porCategoria[l.categoria] || 0) + l.quantidadeAtual;
    });
    const catLabels = Object.keys(porCategoria);
    const catValores = Object.values(porCategoria);

    const vencOk = lotesFiltrados.filter((l) => l.diasRestantes > 30).length;
    const vencAtencao = lotesFiltrados.filter((l) => l.diasRestantes >= 0 && l.diasRestantes <= 30).length;
    const vencVencido = lotesFiltrados.filter((l) => l.diasRestantes < 0).length;

    atualizarKpisRelatorio(
      'Total em Estoque', `${formatarNumero(totalUnidades)} un.`,
      'Lotes Ativos', `${lotesFiltrados.length} lotes`,
      'Estoque Baixo', `${criticos} itens`,
      'Atenção à Validade', `${vencendo} lotes`
    );

    renderizarGraficosRelatorio(
      {
        titulo: 'Volume em Estoque por Categoria',
        labels: catLabels.length > 0 ? catLabels : ['Sem dados'],
        datasets: [{ label: 'Unidades', data: catValores.length > 0 ? catValores : [0], backgroundColor: '#1E3A8A', borderRadius: 6 }]
      },
      {
        titulo: 'Situação de Validade dos Lotes',
        labels: ['Normal (> 30d)', 'Vencendo (<= 30d)', 'Vencidos'],
        valores: [vencOk, vencAtencao, vencVencido],
        cores: ['#10B981', '#F59E0B', '#DC2626']
      }
    );

    thead.innerHTML = `
      <tr>
        <th class="px-3 py-2.5">Categoria</th>
        <th class="px-3 py-2.5 text-center">Produtos Distintos</th>
        <th class="px-3 py-2.5 text-center">Lotes Ativos</th>
        <th class="px-3 py-2.5 text-center">Quantidade Total</th>
        <th class="px-3 py-2.5 text-center">Participação</th>
      </tr>
    `;

    const resumoCats = catLabels.map((cat) => {
      const lotesCat = lotesFiltrados.filter((l) => l.categoria === cat);
      const prodsUnicos = new Set(lotesCat.map((l) => l.nomeProduto.toLowerCase())).size;
      const qtd = porCategoria[cat];
      const perc = totalUnidades > 0 ? Math.round((qtd / totalUnidades) * 100) : 0;
      return { cat, prodsUnicos, lotesCount: lotesCat.length, qtd, perc };
    });

    linhasExportacaoCsv = [
      ['Categoria', 'Produtos Distintos', 'Lotes Ativos', 'Quantidade Total', 'Participacao (%)'],
      ...resumoCats.map((r) => [r.cat, r.prodsUnicos, r.lotesCount, r.qtd, `${r.perc}%`])
    ];

    tbody.innerHTML = resumoCats.length === 0
      ? `<tr><td colspan="5" class="p-8 text-center text-slate-500">Nenhum dado em estoque.</td></tr>`
      : resumoCats.map((r) => `
        <tr class="hover:bg-slate-50">
          <td class="px-3 py-2.5 font-bold text-brandBlue">${escaparHtml(r.cat)}</td>
          <td class="px-3 py-2.5 text-center">${r.prodsUnicos}</td>
          <td class="px-3 py-2.5 text-center">${r.lotesCount}</td>
          <td class="px-3 py-2.5 text-center font-bold text-brandBlue">${r.qtd} un.</td>
          <td class="px-3 py-2.5 text-center font-semibold">${r.perc}%</td>
        </tr>
      `).join('');
    return;
  }

  // 3. INVENTÁRIO ATUAL / RISCO DE PERDAS
  if (tipo === 'INVENTARIO_FEFO' || tipo === 'RISCO_PERDAS') {
    const lista = tipo === 'RISCO_PERDAS'
      ? lotesFiltrados.filter((l) => l.diasRestantes <= 30)
      : lotesFiltrados;
    tituloEl.textContent = tipo === 'RISCO_PERDAS'
      ? 'Lotes com Risco de Vencimento (Até 30 dias ou vencidos)'
      : 'Posição Completa de Estoque e Validades';

    const somaUnidades = lista.reduce((acc, l) => acc + l.quantidadeAtual, 0);
    const vencidosCount = lista.filter((l) => l.diasRestantes < 0).length;
    const urgentesCount = lista.filter((l) => l.diasRestantes >= 0 && l.diasRestantes <= 15).length;

    atualizarKpisRelatorio(
      'Lotes Listados', `${lista.length} lotes`,
      'Volume Total', `${formatarNumero(somaUnidades)} un.`,
      'Urgentes (<= 15d)', `${urgentesCount} lotes`,
      'Já Vencidos', `${vencidosCount} lotes`
    );

    const topGrafico = lista.slice(0, 8);
    const porCat = {};
    lista.forEach((l) => { porCat[l.categoria] = (porCat[l.categoria] || 0) + l.quantidadeAtual; });

    renderizarGraficosRelatorio(
      {
        titulo: 'Quantidade por Lote (Top 8 mais próximos do vencimento)',
        labels: topGrafico.length > 0 ? topGrafico.map((l) => l.nomeProduto.slice(0, 20)) : ['Sem lotes'],
        datasets: [{ label: 'Quantidade', data: topGrafico.length > 0 ? topGrafico.map((l) => l.quantidadeAtual) : [0], backgroundColor: '#1E3A8A', borderRadius: 6 }]
      },
      {
        titulo: 'Distribuição por Categoria',
        labels: Object.keys(porCat).length > 0 ? Object.keys(porCat) : ['Vazio'],
        valores: Object.values(porCat).length > 0 ? Object.values(porCat) : [1]
      }
    );

    thead.innerHTML = `
      <tr>
        <th class="px-3 py-2.5">Lote</th>
        <th class="px-3 py-2.5">Produto</th>
        <th class="px-3 py-2.5">Categoria</th>
        <th class="px-3 py-2.5">Local</th>
        <th class="px-3 py-2.5 text-center">Quantidade</th>
        <th class="px-3 py-2.5 text-center">Validade</th>
        <th class="px-3 py-2.5 text-center">Situação</th>
      </tr>
    `;

    linhasExportacaoCsv = [
      ['Lote', 'Codigo Barras', 'Produto', 'Categoria', 'Local', 'Quantidade', 'Validade', 'Dias Restantes', 'Situacao'],
      ...lista.map((l) => [l.codigoLote, l.codigoBarras, l.nomeProduto, l.categoria, l.localArmazenamento, l.quantidadeAtual, l.dataValidadeFormatada, l.diasRestantes, l.statusFefo.rotulo])
    ];

    tbody.innerHTML = lista.length === 0
      ? `<tr><td colspan="7" class="p-8 text-center text-slate-500">Nenhum lote encontrado.</td></tr>`
      : lista.map((l) => `
        <tr class="hover:bg-slate-50">
          <td class="px-3 py-2.5 font-bold text-brandBlue">${escaparHtml(l.codigoLote)}</td>
          <td class="px-3 py-2.5 font-bold text-brandBlue">${escaparHtml(l.nomeProduto)}</td>
          <td class="px-3 py-2.5">${escaparHtml(l.categoria)}</td>
          <td class="px-3 py-2.5">${escaparHtml(l.localArmazenamento)}</td>
          <td class="px-3 py-2.5 text-center font-bold text-brandBlue">${l.quantidadeAtual}</td>
          <td class="px-3 py-2.5 text-center">${l.dataValidadeFormatada}</td>
          <td class="px-3 py-2.5 text-center"><span class="inline-flex items-center justify-center w-32 px-2 py-0.5 rounded-md text-[10px] font-bold border ${l.statusFefo.classeBadge}">${l.statusFefo.rotulo}</span></td>
        </tr>
      `).join('');
    return;
  }

  // 4. MOVIMENTAÇÕES E PERDAS
  if (tipo === 'MOVIMENTACOES' || tipo === 'PERDAS_DESCARTES') {
    let movs = dadosAwsRelatorio.movimentacoes.filter((m) =>
      (localFiltro === 'TODAS' || m.localArmazenamento.includes(localFiltro)) &&
      dentroDoPeriodo(m.dataHora, dataInicio, dataFim)
    );

    if (tipo === 'PERDAS_DESCARTES') {
      movs = movs.filter((m) =>
        m.tipo.includes('SAÍDA') || m.tipo.includes('SAIDA')
      ).filter((m) =>
        m.motivo.toLowerCase().includes('perda') ||
        m.motivo.toLowerCase().includes('descarte') ||
        m.motivo.toLowerCase().includes('vencid') ||
        m.motivo.toLowerCase().includes('avaria')
      );
      tituloEl.textContent = 'Relatório de Perdas e Descartes';
    } else {
      tituloEl.textContent = 'Movimentações de Entrada, Saída e Ajustes';
    }

    const totalMov = movs.reduce((acc, m) => acc + m.quantidade, 0);
    const entradas = movs.filter((m) => m.tipo.includes('ENTRADA')).reduce((acc, m) => acc + m.quantidade, 0);
    const saidas = movs.filter((m) => m.tipo.includes('SAÍDA') || m.tipo.includes('SAIDA')).reduce((acc, m) => acc + m.quantidade, 0);
    const ajustes = movs.filter((m) => m.tipo.includes('AJUSTE')).length;

    atualizarKpisRelatorio(
      'Operações no Período', `${movs.length} registros`,
      'Volume Movimentado', `${formatarNumero(totalMov)} un.`,
      'Entradas / Saídas', `+${entradas} / -${saidas}`,
      'Ajustes de Contagem', `${ajustes} ajustes`
    );

    const contagemPorTipo = {};
    movs.forEach((m) => {
      contagemPorTipo[m.tipo] = (contagemPorTipo[m.tipo] || 0) + m.quantidade;
    });

    const topMovs = movs.slice(0, 8);
    renderizarGraficosRelatorio(
      {
        titulo: 'Volume por Operação Recente',
        labels: topMovs.length > 0 ? topMovs.map((m) => `${m.nomeProduto.slice(0, 15)} (${m.tipo})`) : ['Sem registros'],
        datasets: [{ label: 'Quantidade', data: topMovs.length > 0 ? topMovs.map((m) => m.quantidade) : [0], backgroundColor: '#1E3A8A', borderRadius: 6 }]
      },
      {
        titulo: 'Distribuição por Tipo de Movimentação',
        labels: Object.keys(contagemPorTipo).length > 0 ? Object.keys(contagemPorTipo) : ['Sem dados'],
        valores: Object.values(contagemPorTipo).length > 0 ? Object.values(contagemPorTipo) : [1]
      }
    );

    thead.innerHTML = `
      <tr>
        <th class="px-3 py-2.5">Operação</th>
        <th class="px-3 py-2.5">Produto / Lote</th>
        <th class="px-3 py-2.5">Local</th>
        <th class="px-3 py-2.5 text-center">Qtd</th>
        <th class="px-3 py-2.5">Motivo / Detalhe</th>
        <th class="px-3 py-2.5">Responsável / Data</th>
      </tr>
    `;

    linhasExportacaoCsv = [
      ['Operacao', 'Produto', 'Lote', 'Local', 'Quantidade', 'Motivo', 'Responsavel', 'Data Hora'],
      ...movs.map((m) => [m.tipo, m.nomeProduto, m.codigoLote, m.localArmazenamento, m.quantidade, m.motivo, m.responsavel, m.dataHoraFormatada])
    ];

    tbody.innerHTML = movs.length === 0
      ? `<tr><td colspan="6" class="p-8 text-center text-slate-500">Nenhuma movimentação encontrada para este filtro.</td></tr>`
      : movs.map((m) => `
        <tr class="hover:bg-slate-50">
          <td class="px-3 py-2.5"><span class="px-2.5 py-0.5 rounded-md bg-pastelBlue text-brandBlue font-bold text-[10px]">${escaparHtml(m.tipo)}</span></td>
          <td class="px-3 py-2.5 font-bold text-brandBlue">${escaparHtml(m.nomeProduto)} <span class="text-slate-400 font-normal">(${escaparHtml(m.codigoLote)})</span></td>
          <td class="px-3 py-2.5">${escaparHtml(m.localArmazenamento)}</td>
          <td class="px-3 py-2.5 text-center font-bold text-brandBlue">${m.quantidade}</td>
          <td class="px-3 py-2.5 text-slate-600">${escaparHtml(m.motivo)}</td>
          <td class="px-3 py-2.5 text-slate-600">${escaparHtml(m.responsavel)} <span class="text-[10px] text-slate-400 block">${escaparHtml(m.dataHoraFormatada)}</span></td>
        </tr>
      `).join('');
    return;
  }

  // 5. BALANÇO DE ESTOQUE MÍNIMO
  if (tipo === 'BALANCO_MINIMO') {
    tituloEl.textContent = 'Balanço de Segurança: Saldo Atual vs. Estoque Mínimo';
    const prods = dadosAwsRelatorio.produtosAgrupados.filter((p) => catFiltro === 'TODAS' || p.categoria === catFiltro);
    const criticos = prods.filter((p) => p.quantidadeTotal < p.estoqueMinimo).length;
    const okCount = prods.length - criticos;
    const totalFaltante = prods.reduce((acc, p) => acc + Math.max(0, p.estoqueMinimo - p.quantidadeTotal), 0);

    atualizarKpisRelatorio(
      'Produtos Analisados', `${prods.length} itens`,
      'Abaixo do Mínimo', `${criticos} críticos`,
      'Abastecidos', `${okCount} regulares`,
      'Déficit Total', `${totalFaltante} un. faltando`
    );

    const topProds = prods.slice(0, 8);
    renderizarGraficosRelatorio(
      {
        titulo: 'Saldo Atual vs. Meta Mínima por Produto',
        labels: topProds.length > 0 ? topProds.map((p) => p.nomeProduto.slice(0, 18)) : ['Sem dados'],
        datasets: [
          { label: 'Saldo Atual', data: topProds.length > 0 ? topProds.map((p) => p.quantidadeTotal) : [0], backgroundColor: '#1E3A8A', borderRadius: 6 },
          { label: 'Meta Mínima', data: topProds.length > 0 ? topProds.map((p) => p.estoqueMinimo) : [0], backgroundColor: '#F59E0B', borderRadius: 6 }
        ]
      },
      {
        titulo: 'Proporção de Abastecimento',
        labels: ['Abastecidos', 'Abaixo do Mínimo'],
        valores: prods.length > 0 ? [okCount, criticos] : [1, 0],
        cores: ['#10B981', '#DC2626']
      }
    );

    thead.innerHTML = `
      <tr>
        <th class="px-3 py-2.5">Produto</th>
        <th class="px-3 py-2.5">Categoria</th>
        <th class="px-3 py-2.5 text-center">Lotes</th>
        <th class="px-3 py-2.5 text-center">Saldo Atual</th>
        <th class="px-3 py-2.5 text-center">Mínimo</th>
        <th class="px-3 py-2.5 text-center">Situação</th>
      </tr>
    `;

    linhasExportacaoCsv = [
      ['Produto', 'Categoria', 'Lotes', 'Saldo Atual', 'Minimo', 'Situacao'],
      ...prods.map((p) => [p.nomeProduto, p.categoria, p.lotesCount, p.quantidadeTotal, p.estoqueMinimo, p.quantidadeTotal < p.estoqueMinimo ? 'ABAIXO DO MINIMO' : 'ABASTECIDO'])
    ];

    tbody.innerHTML = prods.map((p) => {
      const critico = p.quantidadeTotal < p.estoqueMinimo;
      return `
        <tr class="hover:bg-slate-50">
          <td class="px-3 py-2.5 font-bold text-brandBlue">${escaparHtml(p.nomeProduto)}</td>
          <td class="px-3 py-2.5">${escaparHtml(p.categoria)}</td>
          <td class="px-3 py-2.5 text-center">${p.lotesCount}</td>
          <td class="px-3 py-2.5 text-center font-bold text-brandBlue">${p.quantidadeTotal}</td>
          <td class="px-3 py-2.5 text-center">${p.estoqueMinimo}</td>
          <td class="px-3 py-2.5 text-center">
            <span class="inline-flex items-center justify-center w-36 py-0.5 rounded-md text-[10px] font-bold border ${critico ? 'bg-red-100 text-red-700 border-red-200' : 'bg-pastelGreen text-emerald-900 border-emerald-200'}">
              ${critico ? `Faltam ${p.estoqueMinimo - p.quantidadeTotal}` : 'Abastecido'}
            </span>
          </td>
        </tr>
      `;
    }).join('');
    return;
  }

  // 6. OCUPAÇÃO POR LOCAL (ARMÁRIOS E GELADEIRAS)
  if (tipo === 'OCUPACAO_LOCAIS') {
    tituloEl.textContent = 'Ocupação por Armário e Geladeira';
    const locais = dadosAwsRelatorio.locaisReconciliados.filter((l) => localFiltro === 'TODAS' || l.nome === localFiltro);
    const totalUn = locais.reduce((acc, l) => acc + l.unidadesTotais, 0);
    const emUso = locais.filter((l) => l.lotesAtivos > 0).length;
    const armarios = locais.filter((l) => l.tipo !== 'geladeira').length;
    const geladeiras = locais.filter((l) => l.tipo === 'geladeira').length;

    atualizarKpisRelatorio(
      'Locais Cadastrados', `${locais.length} espaços`,
      'Em Uso / Livres', `${emUso} / ${locais.length - emUso}`,
      'Armários / Geladeiras', `${armarios} / ${geladeiras}`,
      'Unidades Guardadas', `${formatarNumero(totalUn)} un.`
    );

    renderizarGraficosRelatorio(
      {
        titulo: 'Unidades Armazenadas por Local',
        labels: locais.length > 0 ? locais.map((l) => l.nome) : ['Sem locais'],
        datasets: [{ label: 'Unidades', data: locais.length > 0 ? locais.map((l) => l.unidadesTotais) : [0], backgroundColor: '#1E3A8A', borderRadius: 6 }]
      },
      {
        titulo: 'Distribuição por Tipo de Local',
        labels: ['Armários', 'Geladeiras'],
        valores: [armarios, geladeiras],
        cores: ['#F59E0B', '#3B82F6']
      }
    );

    thead.innerHTML = `
      <tr>
        <th class="px-3 py-2.5">Local</th>
        <th class="px-3 py-2.5">Tipo</th>
        <th class="px-3 py-2.5">Ambiente</th>
        <th class="px-3 py-2.5 text-center">Lotes Ativos</th>
        <th class="px-3 py-2.5 text-center">Unidades</th>
      </tr>
    `;

    linhasExportacaoCsv = [
      ['Local', 'Tipo', 'Ambiente', 'Lotes Ativos', 'Unidades'],
      ...locais.map((l) => [l.nome, l.tipo_local, l.ambiente, l.lotesAtivos, l.unidadesTotais])
    ];

    tbody.innerHTML = locais.map((l) => `
      <tr class="hover:bg-slate-50">
        <td class="px-3 py-2.5 font-bold text-brandBlue">${escaparHtml(l.nome)}</td>
        <td class="px-3 py-2.5 capitalize">${escaparHtml(l.tipo_local)}</td>
        <td class="px-3 py-2.5">${escaparHtml(l.ambiente)}</td>
        <td class="px-3 py-2.5 text-center">${l.lotesAtivos}</td>
        <td class="px-3 py-2.5 text-center font-bold text-brandBlue">${l.unidadesTotais} un.</td>
      </tr>
    `).join('');
    return;
  }

  // 7. LOGS DE AUDITORIA
  if (tipo === 'LOGS_AUDITORIA') {
    tituloEl.textContent = 'Histórico de Auditoria do Sistema';
    const combinados = [
      ...logsAuditoriaAws.map((l) => ({
        acao: l.tipo_acao_executada,
        detalhe: l.detalhe_operacao,
        usuario: l.id_usuario_responsavel,
        data: l.data_hora_acao
      })),
      ...dadosAwsRelatorio.movimentacoes.map((m) => ({
        acao: m.tipo,
        detalhe: `${m.nomeProduto} (${m.quantidade} un.) — ${m.motivo}`,
        usuario: m.responsavel,
        data: m.dataHoraFormatada
      }))
    ];

    const webCount = combinados.filter((i) => String(i.usuario).toLowerCase().includes('web') || String(i.detalhe).toLowerCase().includes('web')).length;

    atualizarKpisRelatorio(
      'Total de Registros', `${combinados.length}`,
      'Ações Módulo Web', `${webCount}`,
      'Logs Dedicados', `${logsAuditoriaAws.length}`,
      'Movimentações', `${dadosAwsRelatorio.movimentacoes.length}`
    );

    renderizarGraficosRelatorio(
      {
        titulo: 'Registros por Origem',
        labels: ['Movimentações de Estoque', 'Logs de Auditoria', 'Módulo Web'],
        datasets: [{ label: 'Registros', data: [dadosAwsRelatorio.movimentacoes.length, logsAuditoriaAws.length, webCount], backgroundColor: '#1E3A8A', borderRadius: 6 }]
      },
      {
        titulo: 'Módulo Web vs. Outros Canais',
        labels: ['Módulo Web', 'App / Outros'],
        valores: [webCount, Math.max(0, combinados.length - webCount)],
        cores: ['#1E3A8A', '#10B981']
      }
    );

    thead.innerHTML = `
      <tr>
        <th class="px-3 py-2.5">Ação</th>
        <th class="px-3 py-2.5">Detalhe</th>
        <th class="px-3 py-2.5">Responsável</th>
        <th class="px-3 py-2.5">Data / Hora</th>
      </tr>
    `;

    linhasExportacaoCsv = [
      ['Acao', 'Detalhe', 'Responsavel', 'Data Hora'],
      ...combinados.map((i) => [i.acao, i.detalhe, i.usuario, i.data])
    ];

    tbody.innerHTML = combinados.length === 0
      ? `<tr><td colspan="4" class="p-8 text-center text-slate-500">Nenhum registro de auditoria encontrado.</td></tr>`
      : combinados.map((i) => `
        <tr class="hover:bg-slate-50">
          <td class="px-3 py-2.5 font-bold text-brandBlue">${escaparHtml(i.acao)}</td>
          <td class="px-3 py-2.5 text-slate-700">${escaparHtml(i.detalhe)}</td>
          <td class="px-3 py-2.5">${escaparHtml(i.usuario)}</td>
          <td class="px-3 py-2.5 text-slate-500">${escaparHtml(i.data)}</td>
        </tr>
      `).join('');
    return;
  }

  // 8. DOADORES (CONSULTA E CADASTRO IGUAL AO MOBILE)
  if (tipo === 'DOADORES') {
    tituloEl.textContent = 'Relatório e Cadastro de Doadores';
    const total = doadoresAwsRelatorio.length;
    const ativos = doadoresAwsRelatorio.filter((d) => d.status_ativo).length;
    const pf = doadoresAwsRelatorio.filter((d) => d.tipo === 'PF').length;
    const pj = total - pf;

    atualizarKpisRelatorio(
      'Total de Doadores', `${total} cadastrados`,
      'Ativos / Inativos', `${ativos} / ${total - ativos}`,
      'Pessoa Física (PF)', `${pf}`,
      'Pessoa Jurídica (PJ)', `${pj}`
    );

    renderizarGraficosRelatorio(
      {
        titulo: 'Doadores por Tipo (PF vs. PJ)',
        labels: ['Pessoa Física (PF)', 'Pessoa Jurídica (PJ)'],
        datasets: [{ label: 'Doadores', data: [pf, pj], backgroundColor: ['#1E3A8A', '#10B981'], borderRadius: 6 }]
      },
      {
        titulo: 'Status dos Doadores',
        labels: ['Ativos', 'Inativos'],
        valores: total > 0 ? [ativos, total - ativos] : [1, 0],
        cores: ['#10B981', '#94A3B8']
      }
    );

    thead.innerHTML = `
      <tr>
        <th class="px-3 py-2.5">Nome Completo</th>
        <th class="px-3 py-2.5 text-center">Tipo</th>
        <th class="px-3 py-2.5">CPF / CNPJ</th>
        <th class="px-3 py-2.5">WhatsApp</th>
        <th class="px-3 py-2.5">Observações</th>
        <th class="px-3 py-2.5 text-center">Status</th>
        <th class="px-3 py-2.5 text-right">Ações</th>
      </tr>
    `;

    linhasExportacaoCsv = [
      ['Nome Completo', 'Tipo', 'Documento', 'WhatsApp', 'Observacoes', 'Status'],
      ...doadoresAwsRelatorio.map((d) => [d.nome_completo, d.tipo, d.documento, d.telefone, d.observacoes, d.status_ativo ? 'Ativo' : 'Inativo'])
    ];

    tbody.innerHTML = total === 0
      ? `<tr><td colspan="7" class="p-8 text-center text-slate-500">Nenhum doador cadastrado. Clique em <strong>+ Doador</strong> para cadastrar.</td></tr>`
      : doadoresAwsRelatorio.map((d) => {
        const dJson = encodeURIComponent(JSON.stringify(d));
        return `
          <tr class="hover:bg-slate-50">
            <td class="px-3 py-2.5 font-bold text-brandBlue">${escaparHtml(d.nome_completo)}</td>
            <td class="px-3 py-2.5 text-center"><span class="px-2 py-0.5 rounded bg-pastelBlue text-brandBlue font-bold text-[10px]">${escaparHtml(d.tipo)}</span></td>
            <td class="px-3 py-2.5 text-slate-600">${escaparHtml(d.documento || '--')}</td>
            <td class="px-3 py-2.5 text-slate-700">${escaparHtml(d.telefone || '--')}</td>
            <td class="px-3 py-2.5 text-slate-500 max-w-[180px] truncate">${escaparHtml(d.observacoes || '--')}</td>
            <td class="px-3 py-2.5 text-center">
              <span class="px-2 py-0.5 rounded text-[10px] font-bold ${d.status_ativo ? 'bg-pastelGreen text-emerald-900' : 'bg-slate-100 text-slate-500'}">${d.status_ativo ? 'Ativo' : 'Inativo'}</span>
            </td>
            <td class="px-3 py-2.5 text-right">
              <div class="inline-flex items-center gap-1">
                ${d.telefone ? `<button type="button" onclick="abrirModalWhatsAppRelatorio('${escaparHtml(d.telefone)}', '${escaparHtml(d.nome_completo)}')" class="p-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 transition" title="Enviar WhatsApp"><i class="ph-fill ph-whatsapp-logo text-sm"></i></button>` : ''}
                <button type="button" onclick="abrirModalDoadorRelatorio('${dJson}')" class="p-1.5 rounded-lg bg-pastelBlue hover:bg-blue-200 text-brandBlue transition" title="Editar"><i class="ph-bold ph-pencil-simple text-sm"></i></button>
                <button type="button" onclick="excluirDoadorRelatorio('${escaparHtml(d.id)}', '${escaparHtml(d.nome_completo)}')" class="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 transition" title="Excluir"><i class="ph-bold ph-trash text-sm"></i></button>
              </div>
            </td>
          </tr>
        `;
      }).join('');
    return;
  }

  // 9. INSTITUIÇÕES (CONSULTA E CADASTRO IGUAL AO MOBILE)
  if (tipo === 'INSTITUICOES') {
    tituloEl.textContent = 'Relatório e Cadastro de Instituições Parceiras';
    const total = instituicoesAwsRelatorio.length;
    const ativas = instituicoesAwsRelatorio.filter((i) => i.status_ativo).length;
    const porTipo = {};
    instituicoesAwsRelatorio.forEach((i) => {
      porTipo[i.tipo_unidade] = (porTipo[i.tipo_unidade] || 0) + 1;
    });

    atualizarKpisRelatorio(
      'Total de Instituições', `${total} cadastradas`,
      'Ativas / Inativas', `${ativas} / ${total - ativas}`,
      'Tipos de Unidade', `${Object.keys(porTipo).length}`,
      'Com WhatsApp', `${instituicoesAwsRelatorio.filter((i) => i.telefone).length}`
    );

    renderizarGraficosRelatorio(
      {
        titulo: 'Instituições por Tipo de Unidade',
        labels: Object.keys(porTipo).length > 0 ? Object.keys(porTipo) : ['Sem dados'],
        datasets: [{ label: 'Instituições', data: Object.values(porTipo).length > 0 ? Object.values(porTipo) : [0], backgroundColor: '#1E3A8A', borderRadius: 6 }]
      },
      {
        titulo: 'Status das Instituições',
        labels: ['Ativas', 'Inativas'],
        valores: total > 0 ? [ativas, total - ativas] : [1, 0],
        cores: ['#10B981', '#94A3B8']
      }
    );

    thead.innerHTML = `
      <tr>
        <th class="px-3 py-2.5">Nome Fantasia</th>
        <th class="px-3 py-2.5">CNPJ</th>
        <th class="px-3 py-2.5">Tipo</th>
        <th class="px-3 py-2.5">Responsável</th>
        <th class="px-3 py-2.5">WhatsApp</th>
        <th class="px-3 py-2.5 text-center">Status</th>
        <th class="px-3 py-2.5 text-right">Ações</th>
      </tr>
    `;

    linhasExportacaoCsv = [
      ['Nome Fantasia', 'Razao Social', 'CNPJ', 'Tipo Unidade', 'Responsavel', 'WhatsApp', 'Endereco', 'Status'],
      ...instituicoesAwsRelatorio.map((i) => [i.nome_fantasia, i.razao_social, i.cnpj, i.tipo_unidade, i.responsavel, i.telefone, i.endereco, i.status_ativo ? 'Ativa' : 'Inativa'])
    ];

    tbody.innerHTML = total === 0
      ? `<tr><td colspan="7" class="p-8 text-center text-slate-500">Nenhuma instituição cadastrada. Clique em <strong>+ Instituição</strong> para cadastrar.</td></tr>`
      : instituicoesAwsRelatorio.map((i) => {
        const iJson = encodeURIComponent(JSON.stringify(i));
        return `
          <tr class="hover:bg-slate-50">
            <td class="px-3 py-2.5 font-bold text-brandBlue">${escaparHtml(i.nome_fantasia)}</td>
            <td class="px-3 py-2.5 text-slate-600">${escaparHtml(i.cnpj || '--')}</td>
            <td class="px-3 py-2.5">${escaparHtml(i.tipo_unidade)}</td>
            <td class="px-3 py-2.5">${escaparHtml(i.responsavel || '--')}</td>
            <td class="px-3 py-2.5 text-slate-700">${escaparHtml(i.telefone || '--')}</td>
            <td class="px-3 py-2.5 text-center">
              <span class="px-2 py-0.5 rounded text-[10px] font-bold ${i.status_ativo ? 'bg-pastelGreen text-emerald-900' : 'bg-slate-100 text-slate-500'}">${i.status_ativo ? 'Ativa' : 'Inativa'}</span>
            </td>
            <td class="px-3 py-2.5 text-right">
              <div class="inline-flex items-center gap-1">
                ${i.telefone ? `<button type="button" onclick="abrirModalWhatsAppRelatorio('${escaparHtml(i.telefone)}', '${escaparHtml(i.nome_fantasia)}')" class="p-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 transition" title="Enviar WhatsApp"><i class="ph-fill ph-whatsapp-logo text-sm"></i></button>` : ''}
                <button type="button" onclick="abrirModalInstituicaoRelatorio('${iJson}')" class="p-1.5 rounded-lg bg-pastelBlue hover:bg-blue-200 text-brandBlue transition" title="Editar"><i class="ph-bold ph-pencil-simple text-sm"></i></button>
                <button type="button" onclick="excluirInstituicaoRelatorio('${escaparHtml(i.id)}', '${escaparHtml(i.nome_fantasia)}')" class="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 transition" title="Excluir"><i class="ph-bold ph-trash text-sm"></i></button>
              </div>
            </td>
          </tr>
        `;
      }).join('');
  }
}

// ==========================================
// CRUD DOADORES E INSTITUIÇÕES (IGUAL MOBILE)
// ==========================================
function abrirModalDoadorRelatorio(dEncoded = null) {
  const d = dEncoded ? JSON.parse(decodeURIComponent(dEncoded)) : null;
  document.getElementById('titulo-modal-doador-rel').textContent = d ? `Editar ${d.nome_completo}` : 'Cadastrar Doador';
  document.getElementById('rel-doador-id').value = d ? d.id : '';
  document.getElementById('rel-doador-nome').value = d ? d.nome_completo : '';
  document.getElementById('rel-doador-tipo').value = d ? d.tipo : 'PF';
  document.getElementById('rel-doador-doc').value = d ? d.documento : '';
  document.getElementById('rel-doador-tel').value = d ? d.telefone : '';
  document.getElementById('rel-doador-obs').value = d ? d.observacoes : '';
  document.getElementById('rel-doador-ativo').checked = d ? d.status_ativo : true;
  abrirModal('modal-doador-relatorio');
}

async function salvarDoadorRelatorio(event) {
  event.preventDefault();
  const id = document.getElementById('rel-doador-id').value;
  const nome = document.getElementById('rel-doador-nome').value.trim();
  const tipo = document.getElementById('rel-doador-tipo').value;
  const documento = document.getElementById('rel-doador-doc').value.trim();
  const telefone = document.getElementById('rel-doador-tel').value.replace(/\D/g, '');
  const observacoes = document.getElementById('rel-doador-obs').value.trim();
  const statusAtivo = document.getElementById('rel-doador-ativo').checked;

  const btn = document.getElementById('btn-salvar-doador-rel');
  btn.disabled = true;
  try {
    await executarAcaoEstoqueAws({
      acao: id ? 'atualizar_doador' : 'cadastrar_doador',
      id_doador: id || undefined,
      nome,
      nome_completo: nome,
      tipo,
      cpf: documento,
      documento,
      telefone,
      endereco: observacoes,
      observacoes,
      status_ativo: statusAtivo
    });
    fecharModal('modal-doador-relatorio');
    document.getElementById('tipo-relatorio').value = 'DOADORES';
    await carregarDadosRelatorioAws();
  } catch (erro) {
    alert(`Erro ao salvar doador: ${erro.message}`);
  } finally {
    btn.disabled = false;
  }
}

async function excluirDoadorRelatorio(id, nome) {
  if (!confirm(`Deseja excluir o doador "${nome}"?`)) return;
  try {
    await executarAcaoEstoqueAws({ acao: 'excluir_doador', id_doador: id });
    await carregarDadosRelatorioAws();
  } catch (erro) {
    alert(`Erro ao excluir doador: ${erro.message}`);
  }
}

function abrirModalInstituicaoRelatorio(iEncoded = null) {
  const inst = iEncoded ? JSON.parse(decodeURIComponent(iEncoded)) : null;
  document.getElementById('titulo-modal-inst-rel').textContent = inst ? `Editar ${inst.nome_fantasia}` : 'Cadastrar Instituição';
  document.getElementById('rel-inst-id').value = inst ? inst.id : '';
  document.getElementById('rel-inst-fantasia').value = inst ? inst.nome_fantasia : '';
  document.getElementById('rel-inst-razao').value = inst ? inst.razao_social : '';
  document.getElementById('rel-inst-cnpj').value = inst ? inst.cnpj : '';
  document.getElementById('rel-inst-tipo').value = inst ? inst.tipo_unidade : 'Unidade Parceira';
  document.getElementById('rel-inst-resp').value = inst ? inst.responsavel : '';
  document.getElementById('rel-inst-tel').value = inst ? inst.telefone : '';
  document.getElementById('rel-inst-end').value = inst ? inst.endereco : '';
  document.getElementById('rel-inst-ativo').checked = inst ? inst.status_ativo : true;
  abrirModal('modal-instituicao-relatorio');
}

async function salvarInstituicaoRelatorio(event) {
  event.preventDefault();
  const id = document.getElementById('rel-inst-id').value;
  const nomeFantasia = document.getElementById('rel-inst-fantasia').value.trim();
  const razaoSocial = document.getElementById('rel-inst-razao').value.trim() || nomeFantasia;
  const cnpj = document.getElementById('rel-inst-cnpj').value.trim();
  const tipoUnidade = document.getElementById('rel-inst-tipo').value.trim() || 'Unidade Parceira';
  const responsavel = document.getElementById('rel-inst-resp').value.trim();
  const telefone = document.getElementById('rel-inst-tel').value.replace(/\D/g, '');
  const endereco = document.getElementById('rel-inst-end').value.trim();
  const statusAtivo = document.getElementById('rel-inst-ativo').checked;

  const btn = document.getElementById('btn-salvar-inst-rel');
  btn.disabled = true;
  try {
    await executarAcaoEstoqueAws({
      acao: id ? 'atualizar_instituicao' : 'cadastrar_instituicao',
      id_instituicao: id || undefined,
      nome: nomeFantasia,
      nome_fantasia: nomeFantasia,
      razao_social: razaoSocial,
      cnpj,
      tipo_unidade: tipoUnidade,
      responsavel,
      telefone,
      endereco,
      status_ativo: statusAtivo
    });
    fecharModal('modal-instituicao-relatorio');
    document.getElementById('tipo-relatorio').value = 'INSTITUICOES';
    await carregarDadosRelatorioAws();
  } catch (erro) {
    alert(`Erro ao salvar instituição: ${erro.message}`);
  } finally {
    btn.disabled = false;
  }
}

async function excluirInstituicaoRelatorio(id, nome) {
  if (!confirm(`Deseja excluir a instituição "${nome}"?`)) return;
  try {
    await executarAcaoEstoqueAws({ acao: 'excluir_instituicao', id_instituicao: id });
    await carregarDadosRelatorioAws();
  } catch (erro) {
    alert(`Erro ao excluir instituição: ${erro.message}`);
  }
}

// ==========================================
// ENVIO DE MENSAGENS VIA WHATSAPP (SEM E-MAIL)
// ==========================================
let wppRelItensSelecionados = [];
let wppRelCampanhasSelecionadas = new Set();
let wppRelNomePre = '';

function abrirModalWhatsAppRelatorio(telefonePre = '', nomePre = '') {
  wppRelItensSelecionados = [];
  wppRelCampanhasSelecionadas = new Set();
  wppRelNomePre = nomePre || '';

  const selectDest = document.getElementById('wpp-destinatario-select');
  const contatos = [
    ...doadoresAwsRelatorio.filter((d) => d.telefone).map((d) => ({
      nome: `Doador: ${d.nome_completo}`,
      tel: d.telefone
    })),
    ...instituicoesAwsRelatorio.filter((i) => i.telefone).map((i) => ({
      nome: `Instituição: ${i.nome_fantasia}`,
      tel: i.telefone
    }))
  ];

  selectDest.innerHTML = `<option value="">-- Selecionar contato cadastrado ou digitar abaixo --</option>` +
    contatos.map((c) => `<option value="${escaparHtml(c.tel)}">${escaparHtml(c.nome)} (${escaparHtml(c.tel)})</option>`).join('');

  const selectItem = document.getElementById('wpp-rel-item-select');
  const prods = dadosAwsRelatorio?.produtosAgrupados || [];
  if (selectItem) {
    selectItem.innerHTML = prods.length > 0
      ? prods.map((p) => {
          const faltam = Math.max(0, p.estoqueMinimo - p.quantidadeTotal);
          const texto = faltam > 0 ? `${p.nomeProduto} (Faltam ${faltam} un.)` : `${p.nomeProduto} (${p.quantidadeTotal} un.)`;
          return `<option value="${escaparHtml(texto)}">${escaparHtml(texto)}</option>`;
        }).join('')
      : `<option value="Alimentos Não Perecíveis">Alimentos Não Perecíveis</option>`;
  }

  const containerCamps = document.getElementById('wpp-rel-campanhas-ativas');
  const ativas = campanhasAwsRelatorio.filter((c) => c.status === 'aprovada');
  if (containerCamps) {
    containerCamps.innerHTML = ativas.length > 0
      ? ativas.map((c) => `
          <label class="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer text-[11px]">
            <span class="flex items-center gap-1.5 min-w-0 flex-1">
              <input type="checkbox" onchange="alternarCampanhaWhatsAppRel('${escaparHtml(c.idCampanha)}', this.checked)" class="w-3.5 h-3.5 accent-brandBlue shrink-0">
              <span class="font-bold text-brandBlue truncate">${escaparHtml(c.titulo)}</span>
            </span>
            <span class="text-[10px] text-slate-500 shrink-0">${c.arrecadadoUnidades}/${c.metaUnidades} un.</span>
          </label>
        `).join('')
      : `<p class="text-[11px] text-slate-400">Nenhuma campanha ativa no momento.</p>`;
  }

  document.getElementById('wpp-numero-destino').value = telefonePre ? telefonePre.replace(/\D/g, '') : '';
  renderizarChipsWhatsAppRelatorio();
  atualizarTextoMensagemWhatsAppRel();
  abrirModal('modal-whatsapp-relatorio');
}

function adicionarItemWhatsAppRelatorio() {
  const select = document.getElementById('wpp-rel-item-select');
  const val = (select?.value || '').trim();
  if (!val || wppRelItensSelecionados.includes(val)) return;
  wppRelItensSelecionados.push(val);
  renderizarChipsWhatsAppRelatorio();
  atualizarTextoMensagemWhatsAppRel();
}

function removerItemWhatsAppRelatorio(idx) {
  wppRelItensSelecionados.splice(idx, 1);
  renderizarChipsWhatsAppRelatorio();
  atualizarTextoMensagemWhatsAppRel();
}

function renderizarChipsWhatsAppRelatorio() {
  const box = document.getElementById('wpp-rel-itens-chips');
  if (!box) return;
  box.innerHTML = wppRelItensSelecionados.map((item, idx) => `
    <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-pastelBlue text-brandBlue font-bold text-[10px]">
      <span>${escaparHtml(item)}</span>
      <button type="button" onclick="removerItemWhatsAppRelatorio(${idx})" class="hover:text-red-600"><i class="ph-bold ph-x"></i></button>
    </span>
  `).join('');
}

function alternarCampanhaWhatsAppRel(idCampanha, marcada) {
  if (marcada) wppRelCampanhasSelecionadas.add(idCampanha);
  else wppRelCampanhasSelecionadas.delete(idCampanha);
  atualizarTextoMensagemWhatsAppRel();
}

function atualizarTextoMensagemWhatsAppRel() {
  const partes = [];
  if (wppRelNomePre) partes.push(`Olá, ${wppRelNomePre}!\n`);
  partes.push(ultimoResumoTextoWhatsApp);

  if (wppRelItensSelecionados.length > 0) {
    partes.push('\n📦 *Itens solicitados:*\n' + wppRelItensSelecionados.map((i) => `• ${i}`).join('\n'));
  }

  const camps = campanhasAwsRelatorio.filter((c) => wppRelCampanhasSelecionadas.has(c.idCampanha));
  if (camps.length > 0) {
    partes.push('\n📢 *Campanhas ativas:*\n' + camps.map((c) => `• *${c.titulo}* — ${c.itemFoco} (Meta: ${c.metaUnidades} un.)`).join('\n'));
  }

  document.getElementById('wpp-mensagem-texto').value = partes.join('\n');
}

function selecionarContatoWhatsApp() {
  const val = document.getElementById('wpp-destinatario-select').value;
  if (val) document.getElementById('wpp-numero-destino').value = val;
}

function enviarMensagemWhatsAppRelatorio(event) {
  event.preventDefault();
  const num = document.getElementById('wpp-numero-destino').value.replace(/\D/g, '');
  const msg = document.getElementById('wpp-mensagem-texto').value.trim();
  if (!num || num.length < 10) {
    alert('Informe um número de WhatsApp válido com DDD.');
    return;
  }
  const fone = num.startsWith('55') ? num : `55${num}`;
  window.open(`https://wa.me/${fone}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener,noreferrer');
  fecharModal('modal-whatsapp-relatorio');
}

function exportarRelatorioPdfLocal() {
  const areaPdf = document.getElementById('area-exportavel-relatorio');
  const tipo = document.getElementById('tipo-relatorio').value.toLowerCase();
  const nomeArquivo = `relatorio_${tipo}_casadacrianca_${new Date().toISOString().split('T')[0]}.pdf`;

  if (typeof html2pdf !== 'undefined' && areaPdf) {
    const btnPdf = document.getElementById('btn-baixar-pdf');
    if (btnPdf) {
      btnPdf.disabled = true;
      btnPdf.innerHTML = '<i class="ph ph-spinner-gap animate-spin text-base"></i><span>Gerando PDF...</span>';
    }

    const opcoes = {
      margin: [8, 8, 8, 8],
      filename: nomeArquivo,
      image: { type: 'jpeg', quality: 0.96 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
    };

    html2pdf().set(opcoes).from(areaPdf).save().finally(() => {
      if (btnPdf) {
        btnPdf.disabled = false;
        btnPdf.innerHTML = '<i class="ph-bold ph-file-pdf text-base"></i><span>Baixar PDF</span>';
      }
    });
  } else {
    window.print();
  }
}

function exportarRelatorioCsv() {
  if (!linhasExportacaoCsv || linhasExportacaoCsv.length === 0) {
    alert('Aguarde o carregamento dos dados antes de exportar.');
    return;
  }
  const tipo = document.getElementById('tipo-relatorio').value.toLowerCase();
  const conteudoCsv = '\uFEFF' + linhasExportacaoCsv.map((linha) =>
    linha.map((celula) => `"${String(celula ?? '').replace(/"/g, '""')}"`).join(';')
  ).join('\r\n');

  const blob = new Blob([conteudoCsv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `relatorio_${tipo}_casadacrianca_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

window.carregarDadosRelatorioAws = carregarDadosRelatorioAws;
window.renderizarRelatorioSelecionado = renderizarRelatorioSelecionado;
window.exportarRelatorioPdfLocal = exportarRelatorioPdfLocal;
window.exportarRelatorioCsv = exportarRelatorioCsv;
window.abrirModalDoadorRelatorio = abrirModalDoadorRelatorio;
window.salvarDoadorRelatorio = salvarDoadorRelatorio;
window.excluirDoadorRelatorio = excluirDoadorRelatorio;
window.abrirModalInstituicaoRelatorio = abrirModalInstituicaoRelatorio;
window.salvarInstituicaoRelatorio = salvarInstituicaoRelatorio;
window.excluirInstituicaoRelatorio = excluirInstituicaoRelatorio;
window.abrirModalWhatsAppRelatorio = abrirModalWhatsAppRelatorio;
window.adicionarItemWhatsAppRelatorio = adicionarItemWhatsAppRelatorio;
window.removerItemWhatsAppRelatorio = removerItemWhatsAppRelatorio;
window.alternarCampanhaWhatsAppRel = alternarCampanhaWhatsAppRel;
window.selecionarContatoWhatsApp = selecionarContatoWhatsApp;
window.enviarMensagemWhatsAppRelatorio = enviarMensagemWhatsAppRelatorio;
