/**
 * Módulo de Estoque Transparente (Perfil Doador)
 * Modularizado no padrão do Painel do Doador, conectado em tempo real à AWS.
 */

const URL_API_ESTOQUE_DOADOR = 'https://zqc7b27zwivnfyczo5kedb3vta0evazc.lambda-url.us-east-2.on.aws/api/estoque';

let todosProdutosDoador = [];
let paginaAtualDoador = 1;
let itensPorPaginaDoador = 50;
let totalPaginasDoador = 1;

function escaparHtmlEstoqueDoador(texto) {
  const div = document.createElement('div');
  div.textContent = texto ?? '';
  return div.innerHTML;
}

async function buscarEstoqueDoadorAws() {
  const icone = document.getElementById('icone-sync-estoque-doador');
  const loading = document.getElementById('loading');
  const tabelaContainer = document.getElementById('tabela-container');
  if (icone) icone.classList.add('animate-spin');

  try {
    const resposta = await fetch(URL_API_ESTOQUE_DOADOR, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ acao: 'consultar_estoque' })
    });
    const dados = await resposta.json();

    if (dados.sucesso && Array.isArray(dados.lotes)) {
      const agrupado = new Map();

      dados.lotes.forEach((lote) => {
        const qtd = parseInt(lote.quantidade_atual_pacote || 0, 10);
        if (qtd <= 0) return;

        const nome = String(lote.nome_produto || 'Alimento').trim();
        const chave = nome.toLowerCase();
        if (!agrupado.has(chave)) {
          agrupado.set(chave, {
            nome,
            marca: String(lote.marca_produto || 'Diversas'),
            categoria: String(lote.categoria || 'Alimentos'),
            unidade: String(lote.unidade_medida_pacote || 'pacotes'),
            qtd: 0,
            minimo: parseInt(lote.estoque_minimo_pacote || 10, 10)
          });
        }
        agrupado.get(chave).qtd += qtd;
      });

      todosProdutosDoador = Array.from(agrupado.values()).sort((a, b) => {
        const aCrit = a.qtd < a.minimo ? 0 : 1;
        const bCrit = b.qtd < b.minimo ? 0 : 1;
        if (aCrit !== bCrit) return aCrit - bCrit;
        return a.nome.localeCompare(b.nome);
      });

      const criticosCount = todosProdutosDoador.filter((p) => p.qtd < p.minimo).length;
      document.getElementById('resumo-doador-total').textContent = todosProdutosDoador.length;
      document.getElementById('resumo-doador-critico').textContent = criticosCount;
      document.getElementById('resumo-doador-ok').textContent = todosProdutosDoador.length - criticosCount;

      const selCat = document.getElementById('filtro-categoria-doador');
      const catAtual = selCat.value || 'TODAS';
      const cats = Array.from(new Set(todosProdutosDoador.map((p) => p.categoria))).sort();
      selCat.innerHTML = `<option value="TODAS">Todas</option>` +
        cats.map((c) => `<option value="${escaparHtmlEstoqueDoador(c)}">${escaparHtmlEstoqueDoador(c)}</option>`).join('');
      selCat.value = catAtual;

      aplicarFiltrosEstoqueDoador(true);
    }
  } catch (err) {
    document.getElementById('lista-estoque').innerHTML =
      `<tr><td colspan="5" class="p-8 text-center text-red-600 font-bold">Não foi possível carregar o estoque agora.</td></tr>`;
  } finally {
    if (icone) icone.classList.remove('animate-spin');
    if (loading) loading.classList.add('hidden');
    if (tabelaContainer) tabelaContainer.classList.remove('hidden');
  }
}

function alterarItensPorPaginaDoador() {
  itensPorPaginaDoador = Math.max(1, Number(document.getElementById('select-itens-doador')?.value || 50));
  aplicarFiltrosEstoqueDoador(true);
}

function mudarPaginaEstoqueDoador(delta) {
  const nova = paginaAtualDoador + delta;
  if (nova < 1 || nova > totalPaginasDoador) return;
  paginaAtualDoador = nova;
  aplicarFiltrosEstoqueDoador(false);
}

function limparFiltrosEstoqueDoador() {
  document.getElementById('busca-alimento').value = '';
  document.getElementById('filtro-categoria-doador').value = 'TODAS';
  document.getElementById('filtro-situacao').value = '';
  aplicarFiltrosEstoqueDoador(true);
}

function aplicarFiltrosEstoqueDoador(resetar = false) {
  if (resetar) paginaAtualDoador = 1;

  const termo = (document.getElementById('busca-alimento').value || '').trim().toLowerCase();
  const cat = document.getElementById('filtro-categoria-doador').value;
  const situacao = document.getElementById('filtro-situacao').value;

  const filtrados = todosProdutosDoador.filter((p) => {
    const matchNome = !termo || p.nome.toLowerCase().includes(termo) || p.marca.toLowerCase().includes(termo);
    const matchCat = cat === 'TODAS' || p.categoria === cat;
    const critico = p.qtd < p.minimo;
    const matchSit = situacao === '' || (situacao === 'critico' ? critico : !critico);
    return matchNome && matchCat && matchSit;
  });

  totalPaginasDoador = Math.max(1, Math.ceil(filtrados.length / itensPorPaginaDoador));
  if (paginaAtualDoador > totalPaginasDoador) paginaAtualDoador = totalPaginasDoador;

  const inicio = (paginaAtualDoador - 1) * itensPorPaginaDoador;
  const fim = Math.min(inicio + itensPorPaginaDoador, filtrados.length);
  const paginados = filtrados.slice(inicio, fim);

  document.getElementById('contador-doador-estoque').textContent =
    filtrados.length === 0 ? 'Nenhum item encontrado' : `Mostrando ${inicio + 1}–${fim} de ${filtrados.length} alimentos`;
  document.getElementById('info-pag-doador').textContent = `Página ${paginaAtualDoador} de ${totalPaginasDoador}`;
  document.getElementById('ind-pag-doador').textContent = `${paginaAtualDoador} / ${totalPaginasDoador}`;
  document.getElementById('btn-ant-doador').disabled = paginaAtualDoador <= 1;
  document.getElementById('btn-prox-doador').disabled = paginaAtualDoador >= totalPaginasDoador;

  const tbody = document.getElementById('lista-estoque');
  if (paginados.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="p-8 text-center text-slate-500 font-medium">Nenhum alimento encontrado para este filtro.</td></tr>`;
    return;
  }

  tbody.innerHTML = paginados.map((prod) => {
    const critico = prod.qtd < prod.minimo;
    const faltam = Math.max(1, prod.minimo - prod.qtd);
    const badge = critico
      ? `<span class="w-36 inline-flex items-center justify-center gap-1 bg-red-100 text-red-700 border border-red-200 font-bold text-[10px] px-2 py-1 rounded-md"><i class="ph-fill ph-warning-circle"></i> Faltam ${faltam} un.</span>`
      : `<span class="w-36 inline-flex items-center justify-center gap-1 bg-pastelGreen text-emerald-900 border border-emerald-200 font-bold text-[10px] px-2 py-1 rounded-md"><i class="ph-fill ph-check-circle"></i> Abastecido</span>`;

    return `
      <tr class="hover:bg-slate-50 transition cursor-pointer" onclick="window.location.href='./campanhas.html?item=' + encodeURIComponent('${escaparHtmlEstoqueDoador(prod.nome)}')">
        <td class="px-3 py-2.5 align-middle">
          <p class="font-bold text-brandBlue text-xs truncate" title="${escaparHtmlEstoqueDoador(prod.nome)}">${escaparHtmlEstoqueDoador(prod.nome)}</p>
          <p class="text-[10px] text-slate-500 truncate">Marca: ${escaparHtmlEstoqueDoador(prod.marca)}</p>
        </td>
        <td class="px-3 py-2.5 align-middle text-[11px] text-slate-600 truncate">${escaparHtmlEstoqueDoador(prod.categoria)}</td>
        <td class="px-3 py-2.5 align-middle text-[11px] text-center text-slate-500 truncate">${escaparHtmlEstoqueDoador(prod.unidade)}</td>
        <td class="px-3 py-2.5 align-middle text-center font-extrabold text-sm ${critico ? 'text-red-600' : 'text-brandBlue'}">${prod.qtd}</td>
        <td class="px-3 py-2.5 align-middle text-center">${badge}</td>
      </tr>
    `;
  }).join('');
}

window.buscarEstoqueDoadorAws = buscarEstoqueDoadorAws;
window.alterarItensPorPaginaDoador = alterarItensPorPaginaDoador;
window.mudarPaginaEstoqueDoador = mudarPaginaEstoqueDoador;
window.limparFiltrosEstoqueDoador = limparFiltrosEstoqueDoador;
window.aplicarFiltrosEstoqueDoador = aplicarFiltrosEstoqueDoador;
