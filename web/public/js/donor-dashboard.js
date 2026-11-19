/**
 * Módulo do Painel do Doador
 * Conectado em tempo real à AWS (campanhas e necessidades do estoque).
 */

const URL_API_DOADOR_AWS = 'https://zqc7b27zwivnfyczo5kedb3vta0evazc.lambda-url.us-east-2.on.aws/api/estoque';

function escaparHtmlDoador(texto) {
  const div = document.createElement('div');
  div.textContent = texto ?? '';
  return div.innerHTML;
}

function extrairMetaCampanhaDoador(textoBruto) {
  const texto = String(textoBruto || '');
  const matchRecebido = texto.match(/\[RECEBIDO:(\d+)\]/);
  const textoLimpo = texto
    .replace(/\[RECEBIDO:\d+\]/g, '')
    .replace(/\[PARECER:.*?\]/g, '')
    .replace(/\[INICIO:.*?\]/g, '')
    .trim();
  return {
    itemFoco: textoLimpo || 'Alimentos Não Perecíveis',
    recebido: matchRecebido ? Number(matchRecebido[1]) : 0
  };
}

function normalizarCampanhaDoador(c) {
  const statusRaw = String(c.status_aprovacao || c.status_campanha || 'Pendente de Análise').toLowerCase();
  let status = 'pendente';
  if (statusRaw.includes('aprov') || statusRaw.includes('ativ')) status = 'aprovada';
  else if (statusRaw.includes('encerr') || statusRaw.includes('finaliz') || statusRaw.includes('conclu')) status = 'encerrada';
  else if (statusRaw.includes('reprov') || statusRaw.includes('recus')) status = 'reprovada';

  const parsed = extrairMetaCampanhaDoador(c.itens_necessarios || c.itemFoco || '');
  const meta = parseInt(String(c.meta ?? c.metaUnidades ?? 50).replace(/[^\d]/g, ''), 10) || 50;
  const arrecadado = parsed.recebido || Number(c.arrecadadoUnidades ?? 0);
  const pct = meta > 0 ? Math.min(100, Math.round((arrecadado / meta) * 100)) : 0;

  return {
    id: String(c.id_campanha || c.id_campanha_doacao || ''),
    titulo: c.titulo || c.nome_campanha || 'Campanha Solidária',
    descricao: c.descricao || c.objetivo_descricao_campanha || '',
    responsavel: c.responsavel || c.nome_proponente || 'Comunidade',
    dataFim: c.data_fim || c.data_termino_campanha || '',
    itemFoco: parsed.itemFoco,
    meta,
    arrecadado,
    pct,
    status
  };
}

function formatarDataSimplesBr(dataStr) {
  if (!dataStr) return '--/--/----';
  const partes = String(dataStr).trim().split('T')[0].split('-');
  return partes.length === 3 ? `${partes[2]}/${partes[1]}/${partes[0]}` : dataStr;
}

function alternarListaDoador(idContainer, botao) {
  const el = document.getElementById(idContainer);
  if (!el) return;
  const oculta = el.classList.toggle('hidden');
  if (botao) {
    const icone = botao.querySelector('i');
    const texto = botao.querySelector('span');
    if (icone) icone.className = oculta ? 'ph-bold ph-eye text-xs' : 'ph-bold ph-eye-slash text-xs';
    if (texto) texto.textContent = oculta ? 'Mostrar itens' : 'Ocultar itens';
  }
}

async function carregarPainelDoadorAws(nomeUsuario = '', emailUsuario = '') {
  const icone = document.getElementById('icone-sync-doador');
  const alerta = document.getElementById('alerta-erro-doador');
  if (icone) icone.classList.add('animate-spin');
  if (alerta) alerta.classList.add('hidden');

  try {
    const [respCamp, respEst] = await Promise.all([
      fetch(URL_API_DOADOR_AWS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acao: 'listar_campanhas' })
      }).then((r) => r.json()),
      fetch(URL_API_DOADOR_AWS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acao: 'consultar_estoque' })
      }).then((r) => r.json())
    ]);

    const campanhas = (Array.isArray(respCamp.campanhas) ? respCamp.campanhas : []).map(normalizarCampanhaDoador);

    const nomeLower = String(nomeUsuario || '').toLowerCase();
    const emailLower = String(emailUsuario || '').toLowerCase();
    const minhas = campanhas.filter((c) => {
      const resp = c.responsavel.toLowerCase();
      return (nomeLower && resp.includes(nomeLower)) || (emailLower && resp.includes(emailLower));
    });
    const baseResumo = minhas.length > 0 ? minhas : campanhas;

    document.getElementById('doador-camp-ativas').textContent = baseResumo.filter((c) => c.status === 'aprovada').length;
    document.getElementById('doador-camp-pendentes').textContent = baseResumo.filter((c) => c.status === 'pendente').length;
    document.getElementById('doador-camp-concluidas').textContent = baseResumo.filter((c) => c.status === 'encerrada').length;

    // Itens com estoque baixo na instituição
    const lotes = Array.isArray(respEst.lotes) ? respEst.lotes : [];
    const mapaProds = new Map();
    lotes.forEach((l) => {
      const qtd = Number(l.quantidade_atual_pacote || 0);
      if (qtd <= 0) return;
      const nome = String(l.nome_produto || 'Alimento').trim();
      const key = nome.toLowerCase();
      if (!mapaProds.has(key)) {
        mapaProds.set(key, {
          nome,
          categoria: l.categoria || 'Alimentos',
          qtdTotal: 0,
          minimo: Number(l.estoque_minimo_pacote || 10)
        });
      }
      mapaProds.get(key).qtdTotal += qtd;
    });

    const itensUrgentes = Array.from(mapaProds.values())
      .filter((p) => p.qtdTotal < p.minimo)
      .sort((a, b) => (a.qtdTotal - a.minimo) - (b.qtdTotal - b.minimo));

    const containerUrgentes = document.getElementById('doador-lista-urgentes');
    if (itensUrgentes.length === 0) {
      containerUrgentes.innerHTML = `
        <div class="p-3.5 rounded-xl bg-pastelGreen/60 border border-pastelGreen text-emerald-900 text-xs font-semibold flex items-center gap-2">
          <i class="ph-fill ph-check-circle text-lg text-emerald-700 shrink-0"></i>
          <span>Todos os alimentos estão em níveis regulares no momento!</span>
        </div>
      `;
    } else {
      containerUrgentes.innerHTML = itensUrgentes.map((p) => {
        const faltam = Math.max(1, p.minimo - p.qtdTotal);
        return `
          <div class="p-3 rounded-xl bg-red-50/70 border border-red-200 flex items-center justify-between gap-2">
            <div class="min-w-0 flex-1">
              <p class="text-xs font-bold text-brandBlue truncate">${escaparHtmlDoador(p.nome)}</p>
              <p class="text-[11px] text-slate-600 truncate">${escaparHtmlDoador(p.categoria)} • Atual: ${p.qtdTotal} / Ideal: ${p.minimo}</p>
            </div>
            <span class="px-2.5 py-0.5 rounded-lg bg-red-600 text-white font-bold text-[11px] shrink-0">Faltam ${faltam}</span>
          </div>
        `;
      }).join('');
    }

    // Campanhas ativas da instituição/comunidade
    const ativasLista = campanhas.filter((c) => c.status === 'aprovada');
    const containerCamps = document.getElementById('doador-lista-campanhas-ativas');
    if (ativasLista.length === 0) {
      containerCamps.innerHTML = `<p class="text-xs text-slate-500 py-3">Nenhuma campanha ativa no momento. Que tal propor uma?</p>`;
    } else {
      containerCamps.innerHTML = ativasLista.map((c) => `
        <div class="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
          <div class="flex items-center justify-between gap-2">
            <span class="text-xs font-bold text-brandBlue truncate min-w-0 flex-1">${escaparHtmlDoador(c.titulo)}</span>
            <span class="text-[11px] font-bold text-emerald-800 bg-pastelGreen px-2 py-0.5 rounded shrink-0">${c.arrecadado}/${c.meta} un.</span>
          </div>
          <div class="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div class="h-full bg-brandBlue rounded-full" style="width: ${c.pct}%"></div>
          </div>
          <p class="text-[11px] text-slate-500 truncate">Item: <strong>${escaparHtmlDoador(c.itemFoco)}</strong> • Até ${formatarDataSimplesBr(c.dataFim)}</p>
        </div>
      `).join('');
    }
  } catch (erro) {
    console.warn('Erro ao carregar painel do doador:', erro);
    if (alerta) {
      alerta.textContent = 'Não foi possível atualizar os dados agora. Tente novamente em instantes.';
      alerta.classList.remove('hidden');
    }
  } finally {
    if (icone) icone.classList.remove('animate-spin');
  }
}

window.carregarPainelDoadorAws = carregarPainelDoadorAws;
window.alternarListaDoador = alternarListaDoador;
