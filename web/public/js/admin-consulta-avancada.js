/**
 * Módulo de Estoque e Lotes (Consulta Avançada)
 * Modularizado no padrão do Painel Principal, 100% conectado à nuvem AWS.
 */

if (typeof window.escaparHtml !== 'function') {
  window.escaparHtml = function (texto) {
    const div = document.createElement('div');
    div.textContent = texto ?? '';
    return div.innerHTML;
  };
}

let lotesCacheAws = [];
let locaisCacheAws = [];
let categoriasCacheAws = [];
let motivosSaidaAws = [];
let paginaAtualLotes = 1;
let itensPorPaginaLotes = 50;
let totalPaginasLotes = 1;

const CATEGORIAS_BASE = [
  'Grãos e Cereais',
  'Laticínios',
  'Massas',
  'Óleos e Gorduras',
  'Enlatados',
  'Higiene e Limpeza'
];

function obterIdentificacaoUsuarioWeb() {
  try {
    const raw = localStorage.getItem(CHAVE_SESSAO_ADMIN);
    if (raw) {
      const sessao = JSON.parse(raw);
      const nome = sessao.nome || sessao.nome_usuario || 'Administrador';
      const email = sessao.email || sessao.email_usuario || 'casadacrianca@adm';
      return {
        nome,
        email,
        assinatura: `${nome} (${email}) • Módulo Web`
      };
    }
  } catch {
    // Fallback padrão
  }
  return {
    nome: 'Admin Casa da Criança',
    email: 'casadacrianca@adm',
    assinatura: 'Admin Casa da Criança (casadacrianca@adm) • Módulo Web'
  };
}

function exibirFeedbackEstoque(mensagem, sucesso = true) {
  const box = document.getElementById('feedback-operacao-estoque');
  if (!box) return;
  box.className = `p-3.5 rounded-2xl border font-semibold text-xs flex items-center justify-between gap-3 ${
    sucesso ? 'bg-pastelGreen/70 border-emerald-300 text-emerald-900' : 'bg-red-50 border-red-200 text-red-800'
  }`;
  box.innerHTML = `
    <span class="min-w-0 flex-1 break-words">${escaparHtml(mensagem)}</span>
    <button type="button" onclick="this.parentElement.classList.add('hidden')" class="font-bold underline text-xs shrink-0">Fechar</button>
  `;
  box.classList.remove('hidden');
}

async function carregarTabelaLotesAws() {
  const icone = document.getElementById('icone-refresh-lotes');
  if (icone) icone.classList.add('animate-spin');

  try {
    const [dados, respCats, respMotivos] = await Promise.all([
      carregarDadosEstoqueAws(),
      executarAcaoEstoqueAws({ acao: 'listar_categorias' }).catch(() => ({ categorias: [] })),
      executarAcaoEstoqueAws({ acao: 'motivos_saida', subacao: 'listar' }).catch(() => ({ motivos_saida: [] }))
    ]);

    lotesCacheAws = dados.lotes;
    locaisCacheAws = dados.locaisReconciliados;

    const catsAws = Array.isArray(respCats.categorias)
      ? respCats.categorias.filter((c) => !c.oculta).map((c) => c.nome_categoria).filter(Boolean)
      : [];
    const listaCats = catsAws.length > 0
      ? [...catsAws, ...lotesCacheAws.map((l) => l.categoria)]
      : [...CATEGORIAS_BASE, ...lotesCacheAws.map((l) => l.categoria)];
    categoriasCacheAws = Array.from(new Set(listaCats)).filter(Boolean);

    motivosSaidaAws = Array.isArray(respMotivos.motivos_saida) && respMotivos.motivos_saida.length > 0
      ? respMotivos.motivos_saida
      : [
          { id_motivo_saida: 'mot_saida_regular', nome_motivo_saida: 'Saida Regular', exige_confirmacao_perda: false },
          { id_motivo_saida: 'mot_perda_produtos', nome_motivo_saida: 'Perda de produtos', exige_confirmacao_perda: true }
        ];

    document.getElementById('resumo-lotes-ativos').textContent = dados.metricas.totalLotesAtivos;
    document.getElementById('resumo-unidades-totais').textContent = `${dados.metricas.totalUnidades} un.`;
    document.getElementById('resumo-fefo-30d').textContent = `${dados.metricas.qtdVencendo30d} lotes`;
    document.getElementById('resumo-vencidos').textContent = `${dados.metricas.qtdVencidos} lotes`;

    popularSelects();
    aplicarFiltrosLotes();
  } catch (erro) {
    console.error('Erro ao carregar lotes:', erro);
    exibirFeedbackEstoque(`Não foi possível carregar o estoque: ${erro.message}`, false);
  } finally {
    if (icone) icone.classList.remove('animate-spin');
  }
}

function popularSelects() {
  const selectFiltro = document.getElementById('filtro-prateleira');
  const valorAtual = selectFiltro.value || 'TODAS';
  selectFiltro.innerHTML = `<option value="TODAS">Todos os locais (${locaisCacheAws.length})</option>` +
    locaisCacheAws.map((l) => `<option value="${escaparHtml(l.nome)}">${escaparHtml(l.nome)} (${l.lotesAtivos})</option>`).join('');
  selectFiltro.value = valorAtual;

  const opcoesLocais = locaisCacheAws.length > 0
    ? locaisCacheAws.map((l) => `<option value="${escaparHtml(l.id_local_armazenamento)}" data-nome="${escaparHtml(l.nome)}">${escaparHtml(l.nome)}</option>`).join('')
    : `<option value="loc_armario_a_prateleira_1" data-nome="Armário A - Prateleira 1">Armário A - Prateleira 1</option>`;
  document.getElementById('entrada-prateleira').innerHTML = opcoesLocais;
  document.getElementById('transf-destino').innerHTML = opcoesLocais;

  const selectFiltroCat = document.getElementById('filtro-categoria');
  const catAtual = selectFiltroCat.value || 'TODAS';
  selectFiltroCat.innerHTML = `<option value="TODAS">Todas</option>` +
    categoriasCacheAws.map((c) => `<option value="${escaparHtml(c)}">${escaparHtml(c)}</option>`).join('');
  selectFiltroCat.value = catAtual;

  document.getElementById('entrada-categoria').innerHTML =
    categoriasCacheAws.map((c) => `<option value="${escaparHtml(c)}">${escaparHtml(c)}</option>`).join('');

  document.getElementById('baixa-motivo').innerHTML =
    motivosSaidaAws.map((m) => `<option value="${escaparHtml(m.nome_motivo_saida)}">${escaparHtml(m.nome_motivo_saida)}</option>`).join('');
}

function alterarItensPorPagina() {
  const select = document.getElementById('select-itens-por-pagina');
  itensPorPaginaLotes = Math.max(1, Number(select?.value || 50));
  paginaAtualLotes = 1;
  aplicarFiltrosLotes(true);
}

function mudarPaginaLotes(delta) {
  const nova = paginaAtualLotes + delta;
  if (nova < 1 || nova > totalPaginasLotes) return;
  paginaAtualLotes = nova;
  aplicarFiltrosLotes(false);
}

function aplicarFiltrosLotes(resetarPagina = false) {
  if (resetarPagina) paginaAtualLotes = 1;

  const termo = (document.getElementById('busca-termo').value || '').trim().toLowerCase();
  const prateleira = document.getElementById('filtro-prateleira').value;
  const categoria = document.getElementById('filtro-categoria').value;
  const statusFefo = document.getElementById('filtro-status-fefo').value;

  const filtrados = lotesCacheAws.filter((lote) => {
    const matchTermo = !termo ||
      lote.nomeProduto.toLowerCase().includes(termo) ||
      String(lote.codigoBarras).toLowerCase().includes(termo) ||
      String(lote.codigoLote).toLowerCase().includes(termo) ||
      String(lote.id).toLowerCase().includes(termo);
    const matchPrateleira = prateleira === 'TODAS' || lote.localArmazenamento === prateleira;
    const matchCategoria = categoria === 'TODAS' || lote.categoria === categoria;
    const matchStatus = statusFefo === 'TODOS' || lote.statusFefo.codigo === statusFefo;
    return matchTermo && matchPrateleira && matchCategoria && matchStatus;
  });

  const ordem = document.getElementById('select-ordem-lotes')?.value || 'alfabetica_az';
  const compararTexto = (a, b) => String(a || '').localeCompare(String(b || ''), 'pt-BR', { sensitivity: 'base' });
  filtrados.sort((a, b) => {
    switch (ordem) {
      case 'alfabetica_za':
        return compararTexto(b.nomeProduto, a.nomeProduto);
      case 'vencimento_asc':
        return (a.diasRestantes - b.diasRestantes) || compararTexto(a.nomeProduto, b.nomeProduto);
      case 'vencimento_desc':
        return (b.diasRestantes - a.diasRestantes) || compararTexto(a.nomeProduto, b.nomeProduto);
      case 'quantidade_desc':
        return (Number(b.quantidadeAtual) - Number(a.quantidadeAtual)) || compararTexto(a.nomeProduto, b.nomeProduto);
      case 'quantidade_asc':
        return (Number(a.quantidadeAtual) - Number(b.quantidadeAtual)) || compararTexto(a.nomeProduto, b.nomeProduto);
      case 'categoria_az':
        return compararTexto(a.categoria, b.categoria) || compararTexto(a.nomeProduto, b.nomeProduto);
      case 'local_az':
        return compararTexto(a.localArmazenamento, b.localArmazenamento) || compararTexto(a.nomeProduto, b.nomeProduto);
      case 'alfabetica_az':
      default:
        return compararTexto(a.nomeProduto, b.nomeProduto) || (a.diasRestantes - b.diasRestantes);
    }
  });

  totalPaginasLotes = Math.max(1, Math.ceil(filtrados.length / itensPorPaginaLotes));
  if (paginaAtualLotes > totalPaginasLotes) paginaAtualLotes = totalPaginasLotes;

  const inicio = (paginaAtualLotes - 1) * itensPorPaginaLotes;
  const fim = Math.min(inicio + itensPorPaginaLotes, filtrados.length);
  const paginados = filtrados.slice(inicio, fim);

  document.getElementById('contador-resultados-lotes').textContent =
    filtrados.length === 0
      ? 'Nenhum lote encontrado'
      : `Mostrando ${inicio + 1}–${fim} de ${filtrados.length} lotes`;

  const infoPag = document.getElementById('info-paginacao-lotes');
  const indPag = document.getElementById('indicador-pagina-atual');
  const btnAnt = document.getElementById('btn-pag-anterior');
  const btnProx = document.getElementById('btn-pag-proxima');
  if (infoPag) infoPag.textContent = `Página ${paginaAtualLotes} de ${totalPaginasLotes} (${filtrados.length} lotes)`;
  if (indPag) indPag.textContent = `${paginaAtualLotes} / ${totalPaginasLotes}`;
  if (btnAnt) btnAnt.disabled = paginaAtualLotes <= 1;
  if (btnProx) btnProx.disabled = paginaAtualLotes >= totalPaginasLotes;

  const tbody = document.getElementById('tbody-consulta-lotes');
  if (paginados.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="p-8 text-center text-slate-500 font-medium">Nenhum lote encontrado para os filtros escolhidos.</td></tr>`;
    return;
  }

  tbody.innerHTML = paginados.map((lote) => {
    const loteJson = encodeURIComponent(JSON.stringify(lote));
    return `
      <tr class="hover:bg-slate-50/80 transition">
        <td class="px-2.5 py-2 align-middle">
          <span class="font-bold text-brandBlue block truncate text-[11px]" title="${escaparHtml(lote.codigoLote)}">${escaparHtml(lote.codigoLote)}</span>
          <span class="text-[10px] text-slate-500 block truncate" title="${escaparHtml(lote.codigoBarras)}">Cód: ${escaparHtml(lote.codigoBarras)}</span>
        </td>
        <td class="px-2.5 py-2 align-middle">
          <span class="font-bold text-brandBlue block truncate text-xs" title="${escaparHtml(lote.nomeProduto)}">${escaparHtml(lote.nomeProduto)}</span>
          <span class="text-[10px] text-slate-500 block truncate">${escaparHtml(lote.marca)} • ${escaparHtml(lote.categoria)} (Mín: ${lote.estoqueMinimo})</span>
        </td>
        <td class="px-2.5 py-2 align-middle">
          <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-pastelBlue/70 text-brandBlue font-semibold text-[11px] max-w-full" title="${escaparHtml(lote.localArmazenamento)}">
            <i class="ph-fill ph-archive-box shrink-0"></i>
            <span class="truncate">${escaparHtml(lote.localArmazenamento)}</span>
          </span>
        </td>
        <td class="px-2 py-2 align-middle text-center">
          <span class="font-extrabold text-xs text-brandBlue block">${lote.quantidadeAtual}</span>
          <span class="text-[10px] font-normal text-slate-500 block truncate">${escaparHtml(lote.unidadeMedida)}</span>
        </td>
        <td class="px-2 py-2 align-middle text-center font-semibold text-[11px] text-slate-700">
          ${lote.dataValidadeFormatada}
        </td>
        <td class="px-2 py-2 align-middle text-center">
          <span class="w-full max-w-[132px] inline-flex items-center justify-center px-2 py-1 rounded-md text-[10px] font-bold border truncate ${lote.statusFefo.classeBadge}" title="${escaparHtml(lote.statusFefo.rotulo)}">
            <span class="truncate">${lote.statusFefo.rotulo}</span>
          </span>
        </td>
        <td class="px-2.5 py-2 align-middle text-right">
          <div class="grid grid-cols-2 gap-1 w-full max-w-[136px] ml-auto">
            <button type="button" onclick="abrirModalEdicaoLote('${loteJson}')" class="w-full inline-flex items-center justify-center gap-1 py-1 px-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] transition" title="Editar Lote">
              <i class="ph-bold ph-pencil-simple"></i> Editar
            </button>
            <button type="button" onclick="abrirModalTransferencia('${loteJson}')" class="w-full inline-flex items-center justify-center gap-1 py-1 px-1.5 rounded-md bg-pastelBlue hover:bg-blue-200 text-brandBlue font-bold text-[10px] transition" title="Mudar de local">
              <i class="ph-bold ph-arrows-left-right"></i> Mover
            </button>
            <button type="button" onclick="abrirModalAjuste('${loteJson}')" class="w-full inline-flex items-center justify-center gap-1 py-1 px-1.5 rounded-md bg-pastelYellow hover:bg-yellow-200 text-yellow-900 font-bold text-[10px] transition" title="Ajustar contagem">
              <i class="ph-bold ph-sliders-horizontal"></i> Ajustar
            </button>
            <button type="button" onclick="abrirModalBaixa('${loteJson}')" class="w-full inline-flex items-center justify-center gap-1 py-1 px-1.5 rounded-md bg-red-100 hover:bg-red-200 text-red-700 font-bold text-[10px] transition" title="Dar Baixa">
              <i class="ph-bold ph-minus-circle"></i> Baixa
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function limparFiltrosLotes() {
  document.getElementById('busca-termo').value = '';
  document.getElementById('filtro-prateleira').value = 'TODAS';
  document.getElementById('filtro-categoria').value = 'TODAS';
  document.getElementById('filtro-status-fefo').value = 'TODOS';
  const selectOrdem = document.getElementById('select-ordem-lotes');
  if (selectOrdem) selectOrdem.value = 'alfabetica_az';
  aplicarFiltrosLotes(true);
}

function atualizarPreviewFotoEntrada(urlFoto) {
  const inputHidden = document.getElementById('entrada-url-foto');
  const container = document.getElementById('container-preview-foto-entrada');
  const img = document.getElementById('preview-foto-entrada');
  const textoUrl = document.getElementById('preview-url-foto-texto');

  const urlLimpa = String(urlFoto || '').trim();
  if (inputHidden) inputHidden.value = urlLimpa;

  if (!container || !img) return;
  if (urlLimpa) {
    img.src = urlLimpa;
    img.onerror = () => {
      img.src = 'https://images.unsplash.com/photo-1584473457406-6240486418e9?auto=format&fit=crop&w=400&q=80';
    };
    if (textoUrl) textoUrl.textContent = urlLimpa;
    container.classList.remove('hidden');
  } else {
    img.src = '';
    if (textoUrl) textoUrl.textContent = '';
    container.classList.add('hidden');
  }
}

function abrirModalNovaEntrada() {
  document.getElementById('titulo-modal-lote').textContent = 'Registrar Entrada de Lote';
  document.getElementById('entrada-id-lote-edit').value = '';
  document.getElementById('entrada-id-produto-edit').value = '';
  document.getElementById('entrada-qtd-inicial-edit').value = '';
  document.getElementById('entrada-qtd-anterior-edit').value = '';
  atualizarPreviewFotoEntrada('');
  document.getElementById('entrada-ean').value = '';
  document.getElementById('entrada-nome').value = '';
  document.getElementById('entrada-marca').value = '';
  document.getElementById('entrada-quantidade').value = 10;
  document.getElementById('entrada-minimo').value = 10;
  const dtPadrao = new Date();
  dtPadrao.setDate(dtPadrao.getDate() + 90);
  document.getElementById('entrada-validade').value = dtPadrao.toISOString().split('T')[0];
  document.getElementById('entrada-codigo-lote').value = `LOTE-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 899)}`;
  document.getElementById('status-busca-ean').textContent = 'Digite o código de barras para buscar o produto automaticamente.';
  document.getElementById('status-busca-ean').className = 'text-[11px] font-medium text-slate-500 mt-1';
  document.getElementById('btn-salvar-entrada').textContent = 'Salvar Entrada';
  abrirModal('modal-entrada-lote');
}

function abrirModalEdicaoLote(loteEncoded) {
  const lote = JSON.parse(decodeURIComponent(loteEncoded));
  document.getElementById('titulo-modal-lote').textContent = `Editar Lote ${lote.codigoLote}`;
  document.getElementById('entrada-id-lote-edit').value = lote.id_lote_produto || lote.id;
  document.getElementById('entrada-id-produto-edit').value = lote.id_produto || `prod_${lote.codigoBarras}`;
  document.getElementById('entrada-qtd-inicial-edit').value = lote.quantidade_inicial_pacote || lote.quantidadeAtual;
  document.getElementById('entrada-qtd-anterior-edit').value = lote.quantidadeAtual;
  document.getElementById('entrada-ean').value = lote.codigoBarras;
  document.getElementById('entrada-nome').value = lote.nomeProduto;
  document.getElementById('entrada-marca').value = lote.marca;
  document.getElementById('entrada-codigo-lote').value = lote.codigoLote;
  document.getElementById('entrada-categoria').value = lote.categoria;
  document.getElementById('entrada-quantidade').value = lote.quantidadeAtual;
  document.getElementById('entrada-minimo').value = lote.estoqueMinimo || 10;
  document.getElementById('entrada-validade').value = String(lote.dataValidade || '').split('T')[0];
  atualizarPreviewFotoEntrada(lote.url_foto_produto || '');

  const selPrat = document.getElementById('entrada-prateleira');
  const optMatch = Array.from(selPrat.options).find((o) => o.dataset.nome === lote.localArmazenamento || o.value === lote.id_local_armazenamento);
  if (optMatch) selPrat.value = optMatch.value;

  document.getElementById('btn-salvar-entrada').textContent = 'Salvar Alterações';
  abrirModal('modal-entrada-lote');
}

async function consultarEanNaAws() {
  const ean = (document.getElementById('entrada-ean').value || '').trim();
  const statusEl = document.getElementById('status-busca-ean');
  if (!ean) {
    statusEl.textContent = 'Informe o código de barras antes de buscar.';
    statusEl.className = 'text-[11px] font-bold text-red-600 mt-1';
    return;
  }
  statusEl.textContent = 'Buscando produto pelo código de barras...';
  statusEl.className = 'text-[11px] font-bold text-brandBlue mt-1';

  try {
    const resp = await executarAcaoEstoqueAws({ acao: 'verificar_produto', codigo_barras: ean });
    const prod = resp.produto;
    if (prod && (prod.nome_produto || prod.nomeProduto)) {
      document.getElementById('entrada-nome').value = prod.nome_produto || prod.nomeProduto;
      document.getElementById('entrada-marca').value = prod.marca_produto || prod.marca || '';
      if (prod.categoria) {
        const selCat = document.getElementById('entrada-categoria');
        if (!Array.from(selCat.options).some((o) => o.value === prod.categoria)) {
          selCat.add(new Option(prod.categoria, prod.categoria));
        }
        selCat.value = prod.categoria;
      }
      atualizarPreviewFotoEntrada(prod.url_foto_produto || prod.foto || '');
      statusEl.textContent = `✓ Produto encontrado: ${prod.nome_produto || prod.nomeProduto}`;
      statusEl.className = 'text-[11px] font-bold text-emerald-700 mt-1';
    } else {
      statusEl.textContent = resp.mensagem || 'Código não encontrado. Preencha os campos manualmente.';
      statusEl.className = 'text-[11px] font-bold text-amber-700 mt-1';
    }
  } catch (e) {
    statusEl.textContent = `Não foi possível buscar automaticamente (${e.message}). Preencha manualmente.`;
    statusEl.className = 'text-[11px] font-bold text-amber-700 mt-1';
  }
}

async function submeterEntradaOuEdicaoLoteAws(event) {
  event.preventDefault();
  const btn = document.getElementById('btn-salvar-entrada');
  btn.disabled = true;

  const idLoteEdit = document.getElementById('entrada-id-lote-edit').value;
  const idProdEdit = document.getElementById('entrada-id-produto-edit').value;
  const qtdAnteriorEdit = Number(document.getElementById('entrada-qtd-anterior-edit')?.value || 0);
  const ehEdicao = Boolean(idLoteEdit);
  const usuarioWeb = obterIdentificacaoUsuarioWeb();

  const selPrat = document.getElementById('entrada-prateleira');
  const optPrat = selPrat.options[selPrat.selectedIndex];
  const idLocal = selPrat.value;
  const nomeLocal = optPrat ? (optPrat.dataset.nome || optPrat.textContent) : idLocal;
  const qtdInformada = Number(document.getElementById('entrada-quantidade').value);

  try {
    const lotePayload = {
      codigo_barra_produto: document.getElementById('entrada-ean').value.trim(),
      nome_produto: document.getElementById('entrada-nome').value.trim(),
      marca_produto: document.getElementById('entrada-marca').value.trim() || 'Institucional',
      numero_codigo_lote: document.getElementById('entrada-codigo-lote').value.trim(),
      categoria: document.getElementById('entrada-categoria').value,
      quantidade_inicial_pacote: ehEdicao ? Number(document.getElementById('entrada-qtd-inicial-edit').value || qtdInformada) : qtdInformada,
      quantidade_atual_pacote: qtdInformada,
      estoque_minimo_pacote: Number(document.getElementById('entrada-minimo').value || 10),
      unidade_medida_pacote: 'pacotes',
      data_validade_lote: document.getElementById('entrada-validade').value,
      local_descricao: nomeLocal,
      id_local_armazenamento: idLocal,
      url_foto_produto: document.getElementById('entrada-url-foto')?.value || ''
    };

    if (ehEdicao) {
      lotePayload.id_lote_produto = idLoteEdit;
      lotePayload.id_produto = idProdEdit;
      lotePayload.eh_transferencia_interna = true;

      // Garante registro no histórico (tb_movimentacoes) e no aviso do app via ajustar_estoque
      const qtdTemporaria = qtdInformada > 0 ? qtdInformada - 1 : 1;
      await executarAcaoEstoqueAws({
        acao: 'cadastrar_lote',
        id_usuario: usuarioWeb.assinatura,
        lote: {
          ...lotePayload,
          quantidade_atual_pacote: qtdInformada !== qtdAnteriorEdit ? qtdAnteriorEdit : qtdTemporaria
        }
      });

      await executarAcaoEstoqueAws({
        acao: 'ajustar_estoque',
        id_lote_produto: idLoteEdit,
        nova_quantidade: qtdInformada,
        justificativa: `Edição de produto (${lotePayload.nome_produto}) no Módulo Web por ${usuarioWeb.nome} (${usuarioWeb.email}).`,
        id_usuario: usuarioWeb.assinatura
      });
    } else {
      await executarAcaoEstoqueAws({
        acao: 'cadastrar_lote',
        id_usuario: usuarioWeb.assinatura,
        lote: lotePayload
      });
    }

    fecharModal('modal-entrada-lote');
    exibirFeedbackEstoque(
      ehEdicao
        ? `Lote "${lotePayload.numero_codigo_lote}" atualizado e registrado no histórico/avisos do app (${usuarioWeb.assinatura})!`
        : `Entrada do lote "${lotePayload.numero_codigo_lote}" registrada em ${nomeLocal}!`,
      true
    );
    await carregarTabelaLotesAws();
  } catch (erro) {
    exibirFeedbackEstoque(`Erro ao salvar lote: ${erro.message}`, false);
  } finally {
    btn.disabled = false;
  }
}

function abrirModalBaixa(loteEncoded) {
  const lote = JSON.parse(decodeURIComponent(loteEncoded));
  document.getElementById('baixa-id-lote').value = lote.id_lote_produto || lote.id;
  document.getElementById('baixa-max-qtd').value = lote.quantidadeAtual;
  document.getElementById('subtitulo-baixa-lote').textContent = `${lote.nomeProduto} (${lote.codigoLote}) • Disponível: ${lote.quantidadeAtual} ${lote.unidadeMedida}`;
  const inputQtd = document.getElementById('baixa-quantidade');
  inputQtd.max = lote.quantidadeAtual;
  inputQtd.value = 1;

  const selMotivo = document.getElementById('baixa-motivo');
  if (lote.diasRestantes < 0) {
    const optPerda = Array.from(selMotivo.options).find((o) => o.value.toLowerCase().includes('perda'));
    if (optPerda) selMotivo.value = optPerda.value;
    document.getElementById('baixa-justificativa').value = 'Descarte de lote vencido';
  } else {
    selMotivo.selectedIndex = 0;
    document.getElementById('baixa-justificativa').value = 'Uso na cozinha da instituição';
  }
  document.getElementById('baixa-confirmacao-perda').value = '';
  alternarTravaPerdaBaixa();
  abrirModal('modal-baixa-lote');
}

function alternarTravaPerdaBaixa() {
  const motivo = (document.getElementById('baixa-motivo').value || '').toLowerCase();
  const bloco = document.getElementById('bloco-trava-perda');
  if (motivo.includes('perda') || motivo.includes('descarte')) {
    bloco.classList.remove('hidden');
  } else {
    bloco.classList.add('hidden');
  }
}

async function submeterBaixaLoteAws(event) {
  event.preventDefault();
  const idLote = document.getElementById('baixa-id-lote').value;
  const motivoSaida = document.getElementById('baixa-motivo').value;
  const quantidade = Number(document.getElementById('baixa-quantidade').value);
  const justificativa = document.getElementById('baixa-justificativa').value.trim();
  const palavraConfirmacao = document.getElementById('baixa-confirmacao-perda').value.trim();

  const ehDescarte = motivoSaida.toLowerCase().includes('perda') || motivoSaida.toLowerCase().includes('descarte');
  if (ehDescarte && palavraConfirmacao !== 'PERDA') {
    alert('Para confirmar o descarte por perda, digite exatamente PERDA em letras maiúsculas.');
    return;
  }

  const btn = document.getElementById('btn-confirmar-baixa');
  btn.disabled = true;
  btn.textContent = 'Registrando...';

  try {
    const usuarioWeb = obterIdentificacaoUsuarioWeb();
    await executarAcaoEstoqueAws({
      acao: 'saida_produto',
      id_lote_produto: idLote,
      quantidade,
      motivo_saida: motivoSaida,
      justificativa: `${justificativa} (Módulo Web - ${usuarioWeb.nome})`,
      palavra_confirmacao: palavraConfirmacao,
      id_usuario: usuarioWeb.assinatura
    });
    fecharModal('modal-baixa-lote');
    exibirFeedbackEstoque(`Saída de ${quantidade} pacote(s) registrada com sucesso!`, true);
    await carregarTabelaLotesAws();
  } catch (erro) {
    exibirFeedbackEstoque(`Erro na baixa: ${erro.message}`, false);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Confirmar Baixa';
  }
}

function abrirModalTransferencia(loteEncoded) {
  const lote = JSON.parse(decodeURIComponent(loteEncoded));
  document.getElementById('transf-id-lote').value = lote.id_lote_produto || lote.id;
  document.getElementById('subtitulo-transf-lote').textContent = `${lote.nomeProduto} (${lote.codigoLote}) • Saldo: ${lote.quantidadeAtual}`;
  document.getElementById('transf-origem').value = lote.localArmazenamento;
  document.getElementById('transf-quantidade').max = lote.quantidadeAtual;
  document.getElementById('transf-quantidade').value = lote.quantidadeAtual;

  const selectDestino = document.getElementById('transf-destino');
  const outra = Array.from(selectDestino.options).find((o) => o.dataset.nome !== lote.localArmazenamento);
  if (outra) selectDestino.value = outra.value;

  abrirModal('modal-transferencia-lote');
}

async function submeterTransferenciaAws(event) {
  event.preventDefault();
  const idLote = document.getElementById('transf-id-lote').value;
  const origem = document.getElementById('transf-origem').value;
  const selectDestino = document.getElementById('transf-destino');
  const optDest = selectDestino.options[selectDestino.selectedIndex];
  const destinoId = selectDestino.value;
  const destinoNome = optDest ? (optDest.dataset.nome || optDest.textContent) : destinoId;
  const quantidade = Number(document.getElementById('transf-quantidade').value);

  if (origem === destinoNome) {
    alert('Escolha um local de destino diferente do atual.');
    return;
  }

  const lote = lotesCacheAws.find((l) => (l.id_lote_produto || l.id) === idLote);
  if (!lote) return;

  const btn = document.getElementById('btn-confirmar-transf');
  btn.disabled = true;
  btn.textContent = 'Movendo...';

  try {
    if (quantidade >= lote.quantidadeAtual) {
      await executarAcaoEstoqueAws({
        acao: 'cadastrar_lote',
        id_usuario: 'casadacrianca@adm',
        lote: {
          ...lote,
          id_lote_produto: lote.id_lote_produto,
          eh_transferencia_interna: true,
          quantidade_atual_pacote: lote.quantidadeAtual,
          quantidade_inicial_pacote: lote.quantidade_inicial_pacote || lote.quantidadeAtual,
          id_local_armazenamento: destinoId,
          local_descricao: destinoNome
        }
      });
    } else {
      await executarAcaoEstoqueAws({
        acao: 'saida_produto',
        id_lote_produto: lote.id_lote_produto,
        quantidade,
        motivo_saida: 'Saida Regular',
        justificativa: `Transferência parcial de ${origem} para ${destinoNome}`,
        id_usuario: 'casadacrianca@adm'
      });
      await executarAcaoEstoqueAws({
        acao: 'cadastrar_lote',
        id_usuario: 'casadacrianca@adm',
        lote: {
          ...lote,
          id_lote_produto: `lote_${Date.now()}`,
          eh_transferencia_interna: true,
          quantidade_inicial_pacote: quantidade,
          quantidade_atual_pacote: quantidade,
          id_local_armazenamento: destinoId,
          local_descricao: destinoNome
        }
      });
    }

    fecharModal('modal-transferencia-lote');
    exibirFeedbackEstoque(`${quantidade} pacote(s) movido(s) para "${destinoNome}" com sucesso!`, true);
    await carregarTabelaLotesAws();
  } catch (erro) {
    exibirFeedbackEstoque(`Erro ao mover lote: ${erro.message}`, false);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Confirmar Mudança';
  }
}

function abrirModalAjuste(loteEncoded) {
  const lote = JSON.parse(decodeURIComponent(loteEncoded));
  document.getElementById('ajuste-id-lote').value = lote.id_lote_produto || lote.id;
  document.getElementById('subtitulo-ajuste-lote').textContent = `${lote.nomeProduto} (${lote.codigoLote}) • Quantidade no sistema: ${lote.quantidadeAtual}`;
  document.getElementById('ajuste-nova-qtd').value = lote.quantidadeAtual;
  document.getElementById('ajuste-justificativa').value = '';
  abrirModal('modal-ajuste-lote');
}

async function submeterAjusteAws(event) {
  event.preventDefault();
  const idLote = document.getElementById('ajuste-id-lote').value;
  const novaQuantidade = Number(document.getElementById('ajuste-nova-qtd').value);
  const justificativa = document.getElementById('ajuste-justificativa').value.trim();

  const btn = document.getElementById('btn-confirmar-ajuste');
  btn.disabled = true;
  btn.textContent = 'Salvando...';

  try {
    const usuarioWeb = obterIdentificacaoUsuarioWeb();
    await executarAcaoEstoqueAws({
      acao: 'ajustar_estoque',
      id_lote_produto: idLote,
      nova_quantidade: novaQuantidade,
      justificativa: `${justificativa} (Módulo Web - ${usuarioWeb.nome})`,
      id_usuario: usuarioWeb.assinatura
    });
    fecharModal('modal-ajuste-lote');
    exibirFeedbackEstoque(`Contagem do lote ${idLote} ajustada para ${novaQuantidade} pacotes!`, true);
    await carregarTabelaLotesAws();
  } catch (erro) {
    exibirFeedbackEstoque(`Erro no ajuste: ${erro.message}`, false);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Salvar Ajuste';
  }
}

window.carregarTabelaLotesAws = carregarTabelaLotesAws;
window.aplicarFiltrosLotes = aplicarFiltrosLotes;
window.alterarItensPorPagina = alterarItensPorPagina;
window.mudarPaginaLotes = mudarPaginaLotes;
window.limparFiltrosLotes = limparFiltrosLotes;
window.abrirModalNovaEntrada = abrirModalNovaEntrada;
window.abrirModalEdicaoLote = abrirModalEdicaoLote;
window.consultarEanNaAws = consultarEanNaAws;
window.submeterEntradaOuEdicaoLoteAws = submeterEntradaOuEdicaoLoteAws;
window.abrirModalBaixa = abrirModalBaixa;
window.alternarTravaPerdaBaixa = alternarTravaPerdaBaixa;
window.submeterBaixaLoteAws = submeterBaixaLoteAws;
window.abrirModalTransferencia = abrirModalTransferencia;
window.submeterTransferenciaAws = submeterTransferenciaAws;
window.abrirModalAjuste = abrirModalAjuste;
window.submeterAjusteAws = submeterAjusteAws;
