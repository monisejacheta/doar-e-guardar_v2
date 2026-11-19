/**
 * Módulo de Armários e Geladeiras (Locais de Armazenamento)
 * Modularizado no padrão do Painel Principal, 100% conectado à nuvem AWS.
 */

if (typeof window.escaparHtml !== 'function') {
  window.escaparHtml = function (texto) {
    const div = document.createElement('div');
    div.textContent = texto ?? '';
    return div.innerHTML;
  };
}

let lotesAtuaisAws = [];
let locaisAtuais = [];

function obterUsuarioWebLocais() {
  try {
    const raw = localStorage.getItem(CHAVE_SESSAO_ADMIN);
    if (raw) {
      const sessao = JSON.parse(raw);
      const nome = sessao.nome || sessao.nome_usuario || 'Administrador';
      const email = sessao.email || sessao.email_usuario || 'casadacrianca@adm';
      return `${nome} (${email}) • Módulo Web`;
    }
  } catch {
    // Fallback padrão
  }
  return 'Admin Casa da Criança (casadacrianca@adm) • Módulo Web';
}

function exibirAlertaLocais(msg, sucesso = true) {
  const box = document.getElementById('alerta-locais');
  if (!box) return;
  box.className = `p-3 rounded-xl border font-semibold text-xs flex items-center justify-between gap-3 ${
    sucesso ? 'bg-pastelGreen/70 border-emerald-300 text-emerald-900' : 'bg-red-50 border-red-200 text-red-800'
  }`;
  box.innerHTML = `
    <span class="min-w-0 flex-1 break-words">${escaparHtml(msg)}</span>
    <button type="button" onclick="this.parentElement.classList.add('hidden')" class="font-bold underline text-xs shrink-0">Fechar</button>
  `;
  box.classList.remove('hidden');
}

async function sincronizarLocaisComAws() {
  const icone = document.getElementById('icone-sync-locais');
  if (icone) icone.classList.add('animate-spin');

  try {
    const dados = await carregarDadosEstoqueAws();
    lotesAtuaisAws = dados.lotes;
    locaisAtuais = dados.locaisReconciliados;
    renderizarGridLocais();
  } catch (erro) {
    exibirAlertaLocais(`Não foi possível carregar os locais: ${erro.message}`, false);
  } finally {
    if (icone) icone.classList.remove('animate-spin');
  }
}

function limparFiltrosLocais() {
  document.getElementById('busca-local').value = '';
  document.getElementById('filtro-tipo-local').value = 'TODOS';
  renderizarGridLocais();
}

function renderizarGridLocais() {
  const termo = (document.getElementById('busca-local').value || '').trim().toLowerCase();
  const tipoFiltro = document.getElementById('filtro-tipo-local').value;

  const emUso = locaisAtuais.filter((l) => l.lotesAtivos > 0).length;
  const livres = locaisAtuais.length - emUso;

  document.getElementById('stat-total-locais').textContent = locaisAtuais.length;
  document.getElementById('stat-em-uso').textContent = emUso;
  document.getElementById('stat-livres').textContent = livres;

  const filtrados = locaisAtuais.filter((loc) => {
    const matchTermo = !termo ||
      loc.nome.toLowerCase().includes(termo) ||
      loc.ambiente.toLowerCase().includes(termo);
    const matchTipo = tipoFiltro === 'TODOS' || loc.tipo_local === tipoFiltro;
    return matchTermo && matchTipo;
  });

  const grid = document.getElementById('grid-locais-armazenamento');
  if (filtrados.length === 0) {
    grid.innerHTML = `
      <div class="md:col-span-2 xl:col-span-3 bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-500 text-xs font-medium">
        Nenhum local encontrado. Clique em <strong>Novo Local</strong> para cadastrar um armário ou geladeira.
      </div>
    `;
    return;
  }

  grid.innerHTML = filtrados.map((loc) => {
    const lotesNaPrateleira = lotesAtuaisAws.filter((l) => l.localArmazenamento === loc.nome);
    const temLotes = loc.lotesAtivos > 0;
    const ehGeladeira = loc.tipo === 'geladeira';

    const listaItensHtml = lotesNaPrateleira.length > 0
      ? lotesNaPrateleira.map((l) => `
          <div class="flex items-center justify-between gap-2 py-1 px-2 rounded-lg bg-white border border-slate-200/80 text-[11px]">
            <span class="font-semibold text-brandBlue truncate min-w-0 flex-1" title="${escaparHtml(l.nomeProduto)}">${escaparHtml(l.nomeProduto)}</span>
            <span class="text-slate-600 font-bold shrink-0">${l.quantidadeAtual} un.</span>
          </div>
        `).join('')
      : `<p class="text-[11px] text-slate-500 py-1">Espaço vazio no momento.</p>`;

    const locJson = encodeURIComponent(JSON.stringify(loc));

    const botaoExclusao = temLotes
      ? `<button type="button" onclick="tentarExcluirLocalComLotes('${escaparHtml(loc.nome)}', ${loc.lotesAtivos})" class="w-24 inline-flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-slate-100 text-slate-400 border border-slate-200 font-semibold text-[11px] cursor-not-allowed" title="Não pode excluir enquanto houver lotes guardados">
          <i class="ph-bold ph-lock-key"></i> Em uso
         </button>`
      : `<button type="button" onclick="excluirLocalVazioAws('${escaparHtml(loc.id_local_armazenamento)}', '${escaparHtml(loc.nome)}')" class="w-24 inline-flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold text-[11px] transition">
          <i class="ph-bold ph-trash"></i> Excluir
         </button>`;

    return `
      <article class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-3">
        <div class="space-y-2.5">
          <div class="flex items-start justify-between gap-2">
            <div class="flex items-center gap-2.5 min-w-0 flex-1">
              <div class="w-9 h-9 rounded-xl ${ehGeladeira ? 'bg-pastelBlue text-brandBlue' : 'bg-pastelYellow text-yellow-800'} flex items-center justify-center shrink-0">
                <i class="ph-fill ${ehGeladeira ? 'ph-thermometer-cold' : 'ph-archive-box'} text-lg"></i>
              </div>
              <div class="min-w-0 flex-1">
                <span class="text-[10px] font-bold uppercase text-slate-400 block truncate">${escaparHtml(loc.ambiente)}</span>
                <h3 class="text-sm font-bold text-brandBlue truncate" title="${escaparHtml(loc.nome)}">${escaparHtml(loc.nome)}</h3>
              </div>
            </div>
            <span class="px-2 py-0.5 rounded-lg text-[10px] font-bold shrink-0 ${temLotes ? 'bg-pastelGreen text-emerald-900' : 'bg-slate-100 text-slate-600'}">
              ${loc.lotesAtivos} lotes • ${loc.unidadesTotais} un.
            </span>
          </div>

          <details class="group rounded-xl bg-slate-50 border border-slate-200/80 overflow-hidden">
            <summary class="flex items-center justify-between gap-2 px-3 py-2 cursor-pointer list-none text-[11px] font-bold text-brandBlue hover:bg-slate-100/70 transition">
              <span>${temLotes ? (lotesNaPrateleira.length === 1 ? 'Ver 1 item guardado' : `Ver ${lotesNaPrateleira.length} itens guardados`) : 'Espaço livre (0 itens)'}</span>
              <i class="ph-bold ph-caret-down text-slate-400 transition-transform group-open:rotate-180"></i>
            </summary>
            <div class="px-2.5 pb-2.5 pt-1 border-t border-slate-200/70 space-y-1 max-h-36 overflow-y-auto">
              ${listaItensHtml}
            </div>
          </details>
        </div>

        <div class="flex items-center justify-between pt-2.5 border-t border-slate-100 gap-2">
          <button type="button" onclick="abrirModalEditarLocal('${locJson}')" class="w-24 inline-flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-pastelBlue/70 hover:bg-pastelBlue text-brandBlue font-bold text-[11px] transition">
            <i class="ph-bold ph-pencil-simple"></i> Editar
          </button>
          ${botaoExclusao}
        </div>
      </article>
    `;
  }).join('');
}

function abrirModalNovoLocal() {
  document.getElementById('titulo-modal-local').textContent = 'Novo Local';
  document.getElementById('local-id-edit').value = '';
  document.getElementById('local-nome-movel').value = '';
  document.getElementById('local-sublocal').value = '';
  document.getElementById('local-tipo').value = 'armário';
  document.getElementById('local-ambiente').value = 'Despensa Principal';
  document.getElementById('btn-salvar-local').textContent = 'Salvar Local';
  abrirModal('modal-local-armazenamento');
}

function abrirModalEditarLocal(locEncoded) {
  const loc = JSON.parse(decodeURIComponent(locEncoded));
  document.getElementById('titulo-modal-local').textContent = `Editar ${loc.nome}`;
  document.getElementById('local-id-edit').value = loc.id_local_armazenamento;
  document.getElementById('local-nome-movel').value = loc.nome_local;
  document.getElementById('local-sublocal').value = loc.sublocal_compartimento;
  document.getElementById('local-tipo').value = loc.tipo_local === 'geladeira' ? 'geladeira' : 'armário';
  document.getElementById('local-ambiente').value = loc.ambiente;
  document.getElementById('btn-salvar-local').textContent = 'Salvar Alterações';
  abrirModal('modal-local-armazenamento');
}

async function salvarLocalAws(event) {
  event.preventDefault();
  const idEdit = document.getElementById('local-id-edit').value;
  const nomeLocal = document.getElementById('local-nome-movel').value.trim();
  const sublocal = document.getElementById('local-sublocal').value.trim();
  const tipoLocal = document.getElementById('local-tipo').value;
  const ambiente = document.getElementById('local-ambiente').value.trim();

  const btn = document.getElementById('btn-salvar-local');
  btn.disabled = true;

  try {
    const payload = {
      acao: 'cadastrar_local',
      nome_local: nomeLocal,
      sublocal_compartimento: sublocal,
      tipo_local: tipoLocal,
      localizacao_ambiente: ambiente,
      id_usuario: obterUsuarioWebLocais()
    };
    if (idEdit) payload.id_local_armazenamento = idEdit;

    const resp = await executarAcaoEstoqueAws(payload);
    fecharModal('modal-local-armazenamento');
    exibirAlertaLocais(
      idEdit
        ? `Local "${resp.local?.local_descricao || nomeLocal}" atualizado com sucesso!`
        : `Local "${resp.local?.local_descricao || nomeLocal}" cadastrado com sucesso!`,
      true
    );
    await sincronizarLocaisComAws();
  } catch (erro) {
    exibirAlertaLocais(`Não foi possível salvar o local: ${erro.message}`, false);
  } finally {
    btn.disabled = false;
  }
}

function tentarExcluirLocalComLotes(nomeLocal, qtdLotes) {
  exibirAlertaLocais(
    `Não é possível excluir "${nomeLocal}" porque ainda existem ${qtdLotes} lote(s) guardado(s) nele. Mova os produtos antes de excluir.`,
    false
  );
}

async function excluirLocalVazioAws(idLocal, nomeLocal) {
  if (!confirm(`Deseja excluir o local vazio "${nomeLocal}"?`)) return;
  try {
    await executarAcaoEstoqueAws({
      acao: 'excluir_local',
      id_local_armazenamento: idLocal,
      local_descricao: nomeLocal,
      id_usuario: obterUsuarioWebLocais()
    });
    exibirAlertaLocais(`Local "${nomeLocal}" removido com sucesso.`, true);
    await sincronizarLocaisComAws();
  } catch (erro) {
    exibirAlertaLocais(`Não foi possível excluir: ${erro.message}`, false);
  }
}

window.sincronizarLocaisComAws = sincronizarLocaisComAws;
window.limparFiltrosLocais = limparFiltrosLocais;
window.renderizarGridLocais = renderizarGridLocais;
window.abrirModalNovoLocal = abrirModalNovoLocal;
window.abrirModalEditarLocal = abrirModalEditarLocal;
window.salvarLocalAws = salvarLocalAws;
window.tentarExcluirLocalComLotes = tentarExcluirLocalComLotes;
window.excluirLocalVazioAws = excluirLocalVazioAws;
