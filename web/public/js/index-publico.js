/**
 * Módulo Público da Landing Page (index.html)
 * Carrega campanhas ativas reais da AWS (nome, data e locais de arrecadação) e gerencia o modal de boas-vindas.
 */

const URL_API_INDEX_PUBLICO = 'https://zqc7b27zwivnfyczo5kedb3vta0evazc.lambda-url.us-east-2.on.aws/api/estoque';
let campanhasAtivasLandingCache = [];

function escaparHtmlPublico(texto) {
  const div = document.createElement('div');
  div.textContent = texto ?? '';
  return div.innerHTML;
}

function extrairLocaisColetaCampanha(c) {
  const itensTexto = String(c.itens_necessarios || '');
  const matchColetas = itensTexto.match(/\[COLETAS:(.*?)\]/);
  if (matchColetas && matchColetas[1].trim()) {
    return matchColetas[1].split('|').map((s) => s.trim()).filter(Boolean);
  }
  const desc = String(c.descricao || c.objetivo_descricao_campanha || '').trim();
  const matchDesc = desc.match(/Pontos de Coleta:\s*(.+)$/im);
  if (matchDesc && matchDesc[1].trim()) {
    return matchDesc[1].split(';').map((s) => s.trim()).filter(Boolean);
  }
  return ['Casa da Criança — R. Silvio Galizoni, 238 - Cubatão, Itapira - SP, 13972-340'];
}

function extrairItensNecessariosCampanha(c) {
  const texto = String(c.itens_necessarios || '');
  const matchItens = texto.match(/\[ITENS:([^\]]*)\]/i);
  if (matchItens && matchItens[1]) {
    try {
      const parsed = JSON.parse(decodeURIComponent(matchItens[1]));
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((it) => String(it?.nome || '').trim()).filter(Boolean);
      }
    } catch (_) {
      // fallback para parsing textual
    }
  }

  const bruto = texto
    .replace(/\[RECEBIDO:[^\]]*\]/gi, '')
    .replace(/\[INICIO:[^\]]*\]/gi, '')
    .replace(/\[COLETAS:[^\]]*\]/gi, '')
    .replace(/\[PARECER:[^\]]*\]/gi, '')
    .replace(/\[ITENS:[^\]]*\]/gi, '')
    .trim();

  if (!bruto) return [];
  return bruto
    .split(',')
    .map((item) => item.replace(/\(\s*\d+\s*un\.?\s*\)/gi, '').trim())
    .filter(Boolean);
}

function limparDescricaoCampanha(c) {
  return String(c.descricao || c.objetivo_descricao_campanha || '')
    .replace(/\n?Pontos de Coleta:\s*.+$/im, '')
    .trim();
}

function formatarDataBrPublica(dataStr) {
  if (!dataStr) return '--/--/----';
  const partes = String(dataStr).trim().split('T')[0].split('-');
  return partes.length === 3 ? `${partes[2]}/${partes[1]}/${partes[0]}` : dataStr;
}

async function carregarCampanhasAtivasLanding() {
  const container = document.getElementById('landing-campanhas-ativas');
  if (!container) return;

  try {
    const resp = await fetch(URL_API_INDEX_PUBLICO, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ acao: 'listar_campanhas' })
    });
    const dados = await resp.json();
    const brutas = Array.isArray(dados.campanhas) ? dados.campanhas : [];

    const ativas = brutas
      .filter((c) => {
        const st = String(c.status_aprovacao || c.status_campanha || '').toLowerCase();
        return st.includes('aprov') || st.includes('ativ');
      })
      .map((c) => ({
        titulo: c.titulo || c.nome_campanha || 'Campanha Solidária',
        dataFim: c.data_fim || c.data_termino_campanha || '',
        responsavel: c.responsavel || '',
        descricao: limparDescricaoCampanha(c),
        locais: extrairLocaisColetaCampanha(c),
        itens: extrairItensNecessariosCampanha(c)
      }));

    campanhasAtivasLandingCache = ativas;

    if (ativas.length === 0) {
      container.innerHTML = `
        <div class="col-span-full p-4 rounded-2xl bg-white/80 border border-slate-200 text-xs font-medium text-slate-600 text-center">
          Nenhuma campanha ativa no momento. Você pode doar alimentos diretamente ou propor uma campanha!
        </div>
      `;
      return;
    }

    container.innerHTML = ativas.slice(0, 3).map((camp, idx) => {
      const locaisHtml = camp.locais.map((loc) => `
        <li class="flex items-start gap-1.5 text-[11px] text-slate-600">
          <i class="ph-fill ph-map-pin text-emerald-600 text-xs mt-0.5 shrink-0"></i>
          <span class="break-words">${escaparHtmlPublico(loc)}</span>
        </li>
      `).join('');

      return `
        <div role="button" tabindex="0" onclick="abrirDetalhesCampanhaPublico(${idx})" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();abrirDetalhesCampanhaPublico(${idx});}" class="bg-white/95 border border-slate-200/90 hover:border-brandBlue/50 hover:shadow-md p-3.5 rounded-2xl shadow-sm text-left space-y-2 cursor-pointer transition-all group">
          <div class="flex items-start justify-between gap-2">
            <h3 class="text-xs font-extrabold text-brandBlue leading-snug break-words group-hover:underline">${escaparHtmlPublico(camp.titulo)}</h3>
            <span class="px-2 py-0.5 rounded-md bg-pastelGreen text-emerald-900 font-bold text-[10px] shrink-0">Ativa</span>
          </div>
          <p class="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
            <i class="ph ph-calendar-blank text-brandBlue"></i>
            <span>Até ${formatarDataBrPublica(camp.dataFim)}</span>
          </p>
          <div class="pt-1 border-t border-slate-100 space-y-1">
            <p class="text-[10px] font-bold uppercase tracking-wide text-slate-400">Locais de arrecadação</p>
            <ul class="space-y-1">${locaisHtml}</ul>
          </div>
          <p class="text-[10px] font-bold text-brandBlue/80 flex items-center gap-1 pt-0.5">
            <span>Clique para ver detalhes e itens</span>
            <i class="ph-bold ph-arrow-right"></i>
          </p>
        </div>
      `;
    }).join('');
  } catch {
    container.innerHTML = `
      <div class="col-span-full p-3 rounded-2xl bg-white/80 border border-slate-200 text-xs text-slate-500 text-center">
        Consulte nossas campanhas ativas após entrar na plataforma.
      </div>
    `;
  }
}

function abrirModalBoasVindasPublico() {
  const avatarSidebar = document.getElementById('avatar-visitante');
  const avatarModal = document.getElementById('avatar-modal-boas-vindas');
  if (avatarSidebar && avatarModal && avatarSidebar.src) {
    avatarModal.src = avatarSidebar.src;
  }
  if (typeof window.abrirModal === 'function') {
    window.abrirModal('modal-boas-vindas-publico');
  }
}

function abrirDetalhesCampanhaPublico(indice) {
  const camp = campanhasAtivasLandingCache[indice];
  if (!camp) return;

  const tituloEl = document.getElementById('detalhe-camp-titulo');
  const dataEl = document.getElementById('detalhe-camp-data');
  const respEl = document.getElementById('detalhe-camp-responsavel');
  const descEl = document.getElementById('detalhe-camp-descricao');
  const locaisEl = document.getElementById('detalhe-camp-locais');
  const itensEl = document.getElementById('detalhe-camp-itens');

  if (tituloEl) tituloEl.textContent = camp.titulo;
  if (dataEl) dataEl.textContent = `Até ${formatarDataBrPublica(camp.dataFim)}`;

  if (respEl) {
    if (camp.responsavel) {
      respEl.textContent = `Organização: ${camp.responsavel}`;
      respEl.classList.remove('hidden');
    } else {
      respEl.classList.add('hidden');
    }
  }

  if (descEl) {
    if (camp.descricao) {
      descEl.textContent = camp.descricao;
      descEl.classList.remove('hidden');
    } else {
      descEl.classList.add('hidden');
    }
  }

  if (locaisEl) {
    locaisEl.innerHTML = camp.locais.map((loc) => `
      <li class="flex items-start gap-2 text-xs font-semibold text-emerald-950 bg-white/90 border border-emerald-200 rounded-xl px-3 py-2">
        <i class="ph-fill ph-map-pin text-emerald-600 text-sm mt-0.5 shrink-0"></i>
        <span class="break-words">${escaparHtmlPublico(loc)}</span>
      </li>
    `).join('');
  }

  if (itensEl) {
    if (camp.itens.length > 0) {
      itensEl.innerHTML = camp.itens.map((item) => `
        <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-blue-200 text-brandBlue text-xs font-bold shadow-sm">
          <i class="ph-fill ph-check-circle text-blue-600 text-sm"></i>
          <span>${escaparHtmlPublico(item)}</span>
        </span>
      `).join('');
    } else {
      itensEl.innerHTML = `
        <span class="text-xs text-slate-600">Alimentos não perecíveis e mantimentos em geral.</span>
      `;
    }
  }

  if (typeof window.abrirModal === 'function') {
    window.abrirModal('modal-detalhes-campanha-publico');
  }
}

window.carregarCampanhasAtivasLanding = carregarCampanhasAtivasLanding;
window.abrirModalBoasVindasPublico = abrirModalBoasVindasPublico;
window.abrirDetalhesCampanhaPublico = abrirDetalhesCampanhaPublico;
