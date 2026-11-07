/**
 * Módulo Unificado de Administração e Padronização Visual (Portal Web - Doar & Guardar)
 * Segue estritamente o padrão visual do index.html e conecta todas as telas às 13 tabelas
 * reais do AWS DynamoDB via AWS Lambda.
 */

const URL_API_ESTOQUE_AWS = 'https://zqc7b27zwivnfyczo5kedb3vta0evazc.lambda-url.us-east-2.on.aws/api/estoque';
const CHAVE_SESSAO_ADMIN = 'dg_sessao_admin';
const CHAVE_LOCAIS_ADMIN = 'dg_locais_admin';
const CHAVE_CAMPANHAS_ADMIN = 'dg_campanhas_admin';
const CHAVE_HISTORICO_MENSAGERIA = 'dg_historico_mensageria_admin';

const MAPA_SINONIMOS_PRATELEIRAS = {
  'armário a - prat. 1': 'Armário A - Prateleira 1',
  'armario a - prat. 1': 'Armário A - Prateleira 1',
  'armario a - prateleira 1': 'Armário A - Prateleira 1',
  'armário a - prat. 2': 'Armário A - Prateleira 2',
  'armario a - prat. 2': 'Armário A - Prateleira 2',
  'armario a - prateleira 2': 'Armário A - Prateleira 2',
  'armário b - prat. 1': 'Armário B - Prateleira 1',
  'armario b - prat. 1': 'Armário B - Prateleira 1',
  'armario b - prateleira 1': 'Armário B - Prateleira 1',
  'armário b - prat. 2': 'Armário B - Prateleira 2',
  'armario b - prat. 2': 'Armário B - Prateleira 2',
  'armario b - prateleira 2': 'Armário B - Prateleira 2',
  'armário b - prat. 3': 'Armário B - Prateleira 3',
  'armario b - prat. 3': 'Armário B - Prateleira 3',
  'armario b - prateleira 3': 'Armário B - Prateleira 3',
  'geladeira 1 - prat. central': 'Geladeira 1 - Prateleira Central',
  'geladeira 1 - prateleira central': 'Geladeira 1 - Prateleira Central',
  'geladeira 1 - prat. superior': 'Geladeira 1 - Prateleira Superior',
  'geladeira 1 - prateleira superior': 'Geladeira 1 - Prateleira Superior',
  'despensa central - prat. 3': 'Armário Despensa - Prateleira 3',
  'despensa prateleira 1': 'Armário Despensa - Prateleira 1'
};

const LOCAIS_PADRAO_INSTITUICAO = [
  {
    id_local_armazenamento: 'loc_armario_a_prateleira_1',
    nome_local: 'Armário A',
    sublocal_compartimento: 'Prateleira 1',
    local_descricao: 'Armário A - Prateleira 1',
    tipo_local: 'armário',
    localizacao_ambiente: 'Despensa Principal'
  },
  {
    id_local_armazenamento: 'loc_armario_a_prateleira_2',
    nome_local: 'Armário A',
    sublocal_compartimento: 'Prateleira 2',
    local_descricao: 'Armário A - Prateleira 2',
    tipo_local: 'armário',
    localizacao_ambiente: 'Despensa Principal'
  },
  {
    id_local_armazenamento: 'loc_armario_b_prateleira_1',
    nome_local: 'Armário B',
    sublocal_compartimento: 'Prateleira 1',
    local_descricao: 'Armário B - Prateleira 1',
    tipo_local: 'armário',
    localizacao_ambiente: 'Despensa Seca'
  },
  {
    id_local_armazenamento: 'loc_armario_b_prateleira_3',
    nome_local: 'Armário B',
    sublocal_compartimento: 'Prateleira 3',
    local_descricao: 'Armário B - Prateleira 3',
    tipo_local: 'armário',
    localizacao_ambiente: 'Despensa Seca'
  },
  {
    id_local_armazenamento: 'loc_geladeira_1_prateleira_central',
    nome_local: 'Geladeira 1',
    sublocal_compartimento: 'Prateleira Central',
    local_descricao: 'Geladeira 1 - Prateleira Central',
    tipo_local: 'geladeira',
    localizacao_ambiente: 'Cozinha Institucional'
  },
  {
    id_local_armazenamento: 'loc_geladeira_1_gaveta_superior',
    nome_local: 'Geladeira 1',
    sublocal_compartimento: 'Gaveta Superior',
    local_descricao: 'Geladeira 1 - Gaveta Superior',
    tipo_local: 'geladeira',
    localizacao_ambiente: 'Cozinha Institucional'
  }
];

function normalizarNomePrateleira(nomeBruto) {
  if (!nomeBruto || typeof nomeBruto !== 'string') {
    return 'Armário A - Prateleira 1';
  }
  let limpo = nomeBruto.trim().replace(/\bPrat(?:\.|\b)\s*/gi, 'Prateleira ').replace(/\s+/g, ' ');
  const chave = limpo.toLowerCase();
  if (MAPA_SINONIMOS_PRATELEIRAS[chave]) {
    return MAPA_SINONIMOS_PRATELEIRAS[chave];
  }
  if (limpo.toLowerCase().startsWith('despensa') && !limpo.toLowerCase().startsWith('armário')) {
    limpo = `Armário ${limpo}`;
  }
  return limpo;
}

/**
 * Valida a sessão ativa do Administrador (casadacrianca@adm / casadacriancaadm)
 */
function verificarAutenticacaoAdmin() {
  try {
    const raw = localStorage.getItem(CHAVE_SESSAO_ADMIN);
    if (!raw) {
      window.location.replace('../../index.html#modal-login');
      return null;
    }
    const sessao = JSON.parse(raw);
    const roleSessao = String(sessao?.role || sessao?.nivel_acesso_permissao || '').toLowerCase();
    const emailSessao = String(sessao?.email || sessao?.email_usuario || '').toLowerCase();
    if (!sessao || roleSessao !== 'administrador' || emailSessao !== 'casadacrianca@adm') {
      localStorage.removeItem(CHAVE_SESSAO_ADMIN);
      window.location.replace('../../index.html#modal-login');
      return null;
    }
    return sessao;
  } catch (erro) {
    console.error('Erro ao validar sessão administrativa:', erro);
    window.location.replace('../../index.html#modal-login');
    return null;
  }
}

function realizarLogoutAdmin() {
  localStorage.removeItem(CHAVE_SESSAO_ADMIN);
  window.location.href = '../../index.html';
}

/**
 * Garante que os modais globais (como Acessibilidade igual ao index.html) existam na página
 */
function garantirModalAcessibilidadePadraoIndex() {
  if (!window.abrirModal) {
    window.abrirModal = function (id) {
      const modal = document.getElementById(id);
      if (!modal) return;
      const modalBox = modal.querySelector('div');
      modal.classList.remove('hidden');
      setTimeout(() => {
        modal.classList.remove('opacity-0');
        if (modalBox) modalBox.classList.remove('scale-95');
      }, 10);
    };
  }

  if (!window.fecharModal) {
    window.fecharModal = function (id) {
      const modal = document.getElementById(id);
      if (!modal) return;
      const modalBox = modal.querySelector('div');
      modal.classList.add('opacity-0');
      if (modalBox) modalBox.classList.add('scale-95');
      setTimeout(() => {
        modal.classList.add('hidden');
      }, 300);
    };
  }

  if (!document.getElementById('modal-configuracoes')) {
    const divModal = document.createElement('div');
    divModal.id = 'modal-configuracoes';
    divModal.className = 'hidden fixed inset-0 bg-brandBlue/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 opacity-0 transition-opacity duration-300';
    divModal.innerHTML = `
      <div class="bg-white rounded-3xl shadow-xl max-w-sm w-full p-8 relative transform scale-95 transition-transform duration-300">
        <button type="button" onclick="fecharModal('modal-configuracoes')" class="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition">
          <i class="ph ph-x text-xl"></i>
        </button>
        <div class="text-center mb-6">
          <i class="ph ph-sliders text-4xl text-brandBlue mb-2"></i>
          <h3 class="text-2xl font-bold text-brandBlue">Acessibilidade</h3>
          <p class="text-slate-500 text-sm mt-1">Ajuste a visualização do portal para a sua necessidade.</p>
        </div>
        <div class="space-y-4">
          <div class="p-4 bg-pastelBlue/30 rounded-2xl border border-pastelBlue">
            <p class="text-sm font-bold text-brandBlue mb-3">Recursos Visuais</p>
            <button type="button" onclick="alternarAltoContraste()" class="w-full flex items-center gap-3 px-4 py-3 bg-white rounded-xl text-blue-900 hover:bg-blue-50 transition mb-2 shadow-sm border border-slate-100 font-semibold text-sm">
              <i class="ph ph-moon text-xl"></i> Alternar Alto Contraste
            </button>
            <button type="button" onclick="alternarTamanhoFonte()" class="w-full flex items-center gap-3 px-4 py-3 bg-white rounded-xl text-blue-900 hover:bg-blue-50 transition shadow-sm border border-slate-100 font-semibold text-sm">
              <i class="ph ph-text-aa text-xl"></i> Aumentar / Ajustar Fonte
            </button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(divModal);
  }
}

/**
 * Renderiza a Navbar Lateral Fixa idêntica ao padrão visual do index.html para o Administrador
 */
function renderizarSidebarAdmin(paginaAtiva) {
  const containerSidebar = document.getElementById('sidebar-admin-container');
  if (!containerSidebar) return;

  const sessao = verificarAutenticacaoAdmin();
  if (!sessao) return;

  garantirModalAcessibilidadePadraoIndex();

  const nomeExibicao = sessao.nome || sessao.nome_usuario || 'Admin Casa da Criança';
  const emailExibicao = sessao.email || sessao.email_usuario || 'casadacrianca@adm';

  const itensMenuAdmin = [
    { id: 'dashboard', href: './dashboard.html', icone: 'ph-chart-pie-slice', rotulo: 'Dashboard Admin' },
    { id: 'consulta-avancada', href: './consulta-avancada.html', icone: 'ph-barcode', rotulo: 'Estoque e Lotes' },
    { id: 'moderacao-campanhas', href: './moderacao-campanhas.html', icone: 'ph-seal-check', rotulo: 'Moderar Campanhas' },
    { id: 'locais-armazenamento', href: './locais-armazenamento.html', icone: 'ph-archive-box', rotulo: 'Armários e Geladeiras' },
    { id: 'relatorios', href: './relatorios.html', icone: 'ph-file-pdf', rotulo: 'Central de Relatórios' },
    { id: 'mensageria', href: './mensageria.html', icone: 'ph-paper-plane-tilt', rotulo: 'Mensageria & LGPD' }
  ];

  const linksAdminHtml = itensMenuAdmin.map((item) => {
    const ativo = item.id === paginaAtiva;
    const classesLink = ativo
      ? 'flex items-center gap-3 px-4 py-2.5 bg-white rounded-xl text-brandBlue shadow-sm font-bold transition hover:bg-blue-50 text-sm'
      : 'flex items-center gap-3 px-4 py-2.5 rounded-xl text-blue-900 hover:bg-white/60 transition font-medium text-sm';
    return `
      <a href="${item.href}" class="${classesLink}">
        <i class="ph ${item.icone} text-lg"></i> ${item.rotulo}
      </a>
    `;
  }).join('');

  containerSidebar.outerHTML = `
    <aside id="sidebar-admin-container" class="w-64 lg:w-72 bg-pastelBlue flex flex-col shadow-lg h-full flex-shrink-0 relative z-20">
      <div class="p-6 text-center border-b border-white/60 bg-white/30 relative">
        <button type="button" onclick="realizarLogoutAdmin()" class="absolute top-4 right-4 text-slate-500 hover:text-red-500 transition" aria-label="Sair da conta" title="Sair da conta">
          <i class="ph ph-sign-out text-2xl"></i>
        </button>

        <div class="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm overflow-hidden border-2 border-white">
          <img src="../../public/assets/avatarPublico01.png" alt="Avatar do Administrador" class="w-full h-full object-cover">
        </div>
        <h2 class="text-lg font-bold text-brandBlue leading-tight">${nomeExibicao}</h2>
        <div class="inline-flex items-center gap-1 mt-1 px-3 py-1 bg-indigo-100 text-indigo-900 rounded-full text-xs font-bold border border-indigo-200">
          <i class="ph-fill ph-shield-star"></i>
          <span>Administrador</span>
        </div>
        <p class="text-[11px] font-medium text-blue-900/75 mt-1 truncate" title="${emailExibicao}">${emailExibicao}</p>
      </div>

      <nav class="flex-1 px-4 py-5 space-y-2 overflow-y-auto" aria-label="Navegação Administrativa">
        <p class="px-3 text-[11px] font-bold uppercase tracking-wider text-blue-800/70">Páginas Públicas</p>
        <a href="../../index.html#inicio" class="flex items-center gap-3 px-4 py-2 rounded-xl text-blue-900 hover:bg-white/60 transition font-medium text-sm">
          <i class="ph ph-house text-lg"></i> Início
        </a>
        <a href="../../index.html#nossa-historia" class="flex items-center gap-3 px-4 py-2 rounded-xl text-blue-900 hover:bg-white/60 transition font-medium text-sm">
          <i class="ph ph-book-open text-lg"></i> Nossa História
        </a>
        <a href="../../index.html#como-doar" class="flex items-center gap-3 px-4 py-2 rounded-xl text-blue-900 hover:bg-white/60 transition font-medium text-sm">
          <i class="ph ph-map-pin text-lg"></i> Como e Onde Doar
        </a>

        <p class="px-3 pt-3 text-[11px] font-bold uppercase tracking-wider text-indigo-900/80">Painel Administrativo</p>
        ${linksAdminHtml}
      </nav>

      <div class="p-4 border-t border-white/60 space-y-3 bg-white/30">
        <button type="button" onclick="abrirModal('modal-configuracoes')" class="flex items-center justify-center gap-2 w-full py-3 bg-white rounded-xl text-blue-900 font-medium hover:bg-blue-50 transition shadow-sm text-sm">
          <i class="ph ph-gear text-xl"></i> Acessibilidade
        </button>

        <button type="button" onclick="realizarLogoutAdmin()" class="flex items-center justify-center gap-2 w-full py-3 bg-red-100 rounded-xl text-red-700 font-semibold hover:bg-red-200 transition shadow-sm text-sm">
          <i class="ph ph-sign-out text-xl"></i> Sair da Conta
        </button>
      </div>
    </aside>
  `;
}

/**
 * Calcula quantos dias restam para o vencimento do lote (FEFO)
 */
function calcularDiasRestantesValidade(dataValidadeStr) {
  if (!dataValidadeStr) return 999;
  const limpo = String(dataValidadeStr).trim().split('T')[0];
  let dataAlvo;
  if (limpo.includes('/')) {
    const p = limpo.split('/');
    dataAlvo = new Date(Number(p[2]), Number(p[1]) - 1, Number(p[0]), 23, 59, 59);
  } else {
    const p = limpo.split('-');
    if (p.length === 3) {
      dataAlvo = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]), 23, 59, 59);
    } else {
      dataAlvo = new Date(dataValidadeStr);
    }
  }
  if (isNaN(dataAlvo.getTime())) return 999;
  const hoje = new Date();
  return Math.ceil((dataAlvo.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
}

function classificarStatusFefo(diasRestantes) {
  if (diasRestantes < 0) {
    return { codigo: 'vencido', rotulo: 'Vencido (Bloqueado)', classeBadge: 'bg-red-100 text-red-800 border-red-200', prioridade: 0 };
  }
  if (diasRestantes <= 15) {
    return { codigo: 'critico', rotulo: `Vence em ${diasRestantes}d (Urgente)`, classeBadge: 'bg-red-50 text-red-700 border-red-200', prioridade: 1 };
  }
  if (diasRestantes <= 30) {
    return { codigo: 'atencao', rotulo: `Vence em ${diasRestantes}d (Atenção)`, classeBadge: 'bg-amber-100 text-amber-800 border-amber-200', prioridade: 2 };
  }
  return { codigo: 'seguro', rotulo: `${diasRestantes} dias (Regular)`, classeBadge: 'bg-emerald-100 text-emerald-800 border-emerald-200', prioridade: 3 };
}

function formatarDataBr(dataStr) {
  if (!dataStr) return '--/--/----';
  const limpo = String(dataStr).trim().split('T')[0];
  if (limpo.includes('/')) return limpo;
  const partes = limpo.split('-');
  if (partes.length === 3) {
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }
  const dt = new Date(dataStr);
  return !isNaN(dt.getTime()) ? dt.toLocaleDateString('pt-BR') : dataStr;
}

/**
 * Executa requisição POST para o backend serverless na AWS Lambda
 */
async function executarAcaoEstoqueAws(payload) {
  const resposta = await fetch(URL_API_ESTOQUE_AWS, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const dados = await resposta.json().catch(() => ({}));
  if (!resposta.ok || dados.sucesso === false) {
    throw new Error(dados.mensagem || dados.erro || `Erro HTTP ${resposta.status} na AWS Lambda.`);
  }
  return dados;
}

/**
 * Reconcilia os locais de armazenamento (tb_locaisArmazenamento) com os lotes reais da AWS (tb_lotesProdutos)
 */
function obterLocaisArmazenamentoReconciliados(lotesNormalizados = [], locaisAwsBrutos = []) {
  let locaisSalvos = [];
  try {
    const raw = localStorage.getItem(CHAVE_LOCAIS_ADMIN);
    if (raw) locaisSalvos = JSON.parse(raw);
  } catch {
    locaisSalvos = [];
  }

  const mapaPorNome = new Map();

  const registrarNoMapa = (loc, idx) => {
    const descBruta = loc.local_descricao || loc.nome || `${loc.nome_local || 'Armário A'} - ${loc.sublocal_compartimento || 'Prateleira 1'}`;
    const nomeCanonico = normalizarNomePrateleira(descBruta);
    const chave = nomeCanonico.toLowerCase();
    const partes = nomeCanonico.split(' - ');
    const nomeLocal = loc.nome_local || partes[0] || 'Armário A';
    const sublocal = loc.sublocal_compartimento || partes[1] || 'Prateleira 1';
    const tipoRaw = String(loc.tipo_local || loc.tipo || (chave.includes('geladeira') ? 'geladeira' : 'armário')).toLowerCase();
    const tipoCanon = tipoRaw.includes('geladeira') ? 'geladeira' : 'armário';

    if (!mapaPorNome.has(chave)) {
      mapaPorNome.set(chave, {
        id: loc.id_local_armazenamento || loc.id || `loc_${idx + 1}`,
        id_local_armazenamento: loc.id_local_armazenamento || loc.id || `loc_${idx + 1}`,
        nome: nomeCanonico,
        local_descricao: nomeCanonico,
        nome_local: nomeLocal,
        sublocal_compartimento: sublocal,
        tipo: tipoCanon === 'geladeira' ? 'geladeira' : 'armario',
        tipo_local: tipoCanon,
        ambiente: loc.localizacao_ambiente || (tipoCanon === 'geladeira' ? 'Cozinha Institucional' : 'Despensa Principal'),
        capacidade: loc.capacidade || (tipoCanon === 'geladeira' ? '120 L' : '150 pacotes'),
        descricao: loc.descricao || `${loc.localizacao_ambiente || 'Despensa Institucional'} • Compartimento ${sublocal}`,
        lotesAtivos: 0,
        unidadesTotais: 0,
        itensCriticosFefo: 0
      });
    }
  };

  LOCAIS_PADRAO_INSTITUICAO.forEach(registrarNoMapa);
  if (Array.isArray(locaisAwsBrutos)) locaisAwsBrutos.forEach(registrarNoMapa);
  if (Array.isArray(locaisSalvos)) locaisSalvos.forEach(registrarNoMapa);

  lotesNormalizados.forEach((lote) => {
    if (lote.quantidadeAtual <= 0) return;
    const nomePrateleira = normalizarNomePrateleira(lote.localArmazenamento);
    const chave = nomePrateleira.toLowerCase();
    if (!mapaPorNome.has(chave)) {
      registrarNoMapa({ local_descricao: nomePrateleira }, mapaPorNome.size);
    }
    const reg = mapaPorNome.get(chave);
    reg.lotesAtivos += 1;
    reg.unidadesTotais += Number(lote.quantidadeAtual || 0);
    if (lote.diasRestantes <= 30) {
      reg.itensCriticosFefo += 1;
    }
  });

  const listaFinal = Array.from(mapaPorNome.values()).sort((a, b) => a.nome.localeCompare(b.nome));
  try {
    localStorage.setItem(CHAVE_LOCAIS_ADMIN, JSON.stringify(listaFinal));
  } catch {
    // Ignora erro de quota
  }
  return listaFinal;
}

/**
 * Consulta todos os lotes (tb_lotesProdutos), locais (tb_locaisArmazenamento) e movimentações (tb_movimentacoes) na AWS
 */
async function carregarDadosEstoqueAws() {
  const dadosEstoque = await executarAcaoEstoqueAws({ acao: 'consultar_estoque' });
  const lotesBrutos = Array.isArray(dadosEstoque.lotes) ? dadosEstoque.lotes : [];
  const locaisAwsBrutos = Array.isArray(dadosEstoque.locais) ? dadosEstoque.locais : [];

  let movsBrutas = Array.isArray(dadosEstoque.movimentacoes) ? dadosEstoque.movimentacoes : [];
  if (movsBrutas.length === 0) {
    try {
      const respMov = await executarAcaoEstoqueAws({ acao: 'consultar_movimentacoes' });
      if (Array.isArray(respMov.movimentacoes)) {
        movsBrutas = respMov.movimentacoes;
      }
    } catch (e) {
      console.warn('Aviso ao consultar movimentações complementares na AWS:', e);
    }
  }

  // Mapeia os campos reais snake_case do DynamoDB tb_lotesProdutos + aliases camelCase
  const lotes = lotesBrutos
    .map((item) => {
      const idLote = String(item.id_lote_produto || item.id || item.idLote || '');
      const codigoLote = String(item.numero_codigo_lote || item.numeroLote || idLote || 'S/L');
      const ean = String(item.codigo_barra_produto || item.codigoBarras || 'SEM-EAN');
      const nomeProd = String(item.nome_produto || item.nomeProduto || item.nome || 'Alimento Cadastrado').trim();
      const marcaProd = String(item.marca_produto || item.marca || 'Institucional').trim();
      const categoriaProd = String(item.categoria || 'Grãos e Cereais').trim();
      const qtdAtual = Number(item.quantidade_atual_pacote ?? item.quantidadeAtual ?? item.quantidade ?? 0);
      const qtdInicial = Number(item.quantidade_inicial_pacote ?? item.quantidadeInicial ?? qtdAtual);
      const estoqueMin = Number(item.estoque_minimo_pacote ?? item.estoqueMinimo ?? 10);
      const unidade = String(item.unidade_medida_pacote || item.unidadeMedida || item.unidade || 'pacotes').trim();
      const dataValidade = String(item.data_validade_lote || item.dataValidade || '');
      const diasRestantes = calcularDiasRestantesValidade(dataValidade);
      const statusFefo = classificarStatusFefo(diasRestantes);
      const localCanonico = normalizarNomePrateleira(
        item.local_descricao || item.localArmazenamento || item.id_local_armazenamento || 'Armário A - Prateleira 1'
      );

      return {
        // Chaves originais DynamoDB (snake_case)
        ...item,
        id_lote_produto: idLote,
        numero_codigo_lote: codigoLote,
        codigo_barra_produto: ean,
        nome_produto: nomeProd,
        marca_produto: marcaProd,
        quantidade_atual_pacote: qtdAtual,
        quantidade_inicial_pacote: qtdInicial,
        estoque_minimo_pacote: estoqueMin,
        unidade_medida_pacote: unidade,
        data_validade_lote: dataValidade,
        local_descricao: localCanonico,
        // Chaves normalizadas para as telas Web (camelCase)
        id: idLote,
        codigoLote,
        codigoBarras: ean,
        nomeProduto: nomeProd,
        marca: marcaProd,
        categoria: categoriaProd,
        quantidadeAtual: qtdAtual,
        unidadeMedida: unidade,
        dataValidade,
        dataValidadeFormatada: formatarDataBr(dataValidade),
        diasRestantes,
        statusFefo,
        localArmazenamento: localCanonico,
        estoqueMinimo: estoqueMin
      };
    })
    .filter((lote) => lote.quantidadeAtual > 0)
    .sort((a, b) => a.diasRestantes - b.diasRestantes);

  // Agrupamento por produto para apurar saldo total vs. estoque mínimo
  const mapaProdutos = new Map();
  lotes.forEach((lote) => {
    const chave = lote.nomeProduto.toLowerCase();
    if (!mapaProdutos.has(chave)) {
      mapaProdutos.set(chave, {
        nomeProduto: lote.nomeProduto,
        marca: lote.marca,
        codigoBarras: lote.codigoBarras,
        categoria: lote.categoria,
        unidadeMedida: lote.unidadeMedida,
        quantidadeTotal: 0,
        estoqueMinimo: lote.estoqueMinimo,
        lotesCount: 0,
        menorValidadeDias: lote.diasRestantes
      });
    }
    const prod = mapaProdutos.get(chave);
    prod.quantidadeTotal += lote.quantidadeAtual;
    prod.lotesCount += 1;
    if (lote.diasRestantes < prod.menorValidadeDias) {
      prod.menorValidadeDias = lote.diasRestantes;
    }
  });

  const produtosAgrupados = Array.from(mapaProdutos.values());
  const produtosAbaixoMinimo = produtosAgrupados.filter((p) => p.quantidadeTotal < p.estoqueMinimo);
  const lotesVencendo30d = lotes.filter((l) => l.diasRestantes >= 0 && l.diasRestantes <= 30);
  const lotesVencidos = lotes.filter((l) => l.diasRestantes < 0);
  const totalUnidades = lotes.reduce((acc, l) => acc + l.quantidadeAtual, 0);

  const locaisReconciliados = obterLocaisArmazenamentoReconciliados(lotes, locaisAwsBrutos);

  // Normaliza movimentações vindas de tb_movimentacoes e tb_movimentacoesEstoques
  const movimentacoes = movsBrutas.map((m) => {
    const idMov = String(m.id_movimentacao_estoque || m.id_movimentacao || m.id || `mov_${Math.random().toString(36).substring(2, 7)}`);
    const operacaoRaw = String(m.operacao || m.tipo_operacao || m.tipo || 'ENTRADA').toUpperCase();
    const qtdMov = Number(m.quantidade_movimentada_pacote ?? m.qtd ?? m.quantidade ?? 0);
    const localMov = normalizarNomePrateleira(m.local_descricao || m.local || m.localArmazenamento || 'Armário A - Prateleira 1');
    const motivoMov = String(m.justificativa_detalhe || m.motivo_saida || m.justificativa || m.motivo || 'Operação auditada na AWS');
    const respMov = String(m.id_usuario_responsavel || m.responsavel || 'casadacrianca@adm');
    const dataMov = String(m.data_hora_movimentacao || m.data || m.dataHora || '');

    return {
      ...m,
      id: idMov,
      tipo: operacaoRaw,
      nomeProduto: String(m.nome_produto || m.nome || m.nomeProduto || 'Alimento'),
      codigoLote: String(m.numero_codigo_lote || m.lote || 'S/L'),
      quantidade: qtdMov,
      unidadeMedida: String(m.unidade_medida_pacote || m.unidadeMedida || 'pacotes'),
      localArmazenamento: localMov,
      motivo: motivoMov,
      responsavel: respMov,
      dataHora: dataMov,
      dataHoraFormatada: dataMov ? new Date(dataMov).toLocaleString('pt-BR') : '--'
    };
  });

  return {
    lotes,
    movimentacoes,
    locaisReconciliados,
    produtosAgrupados,
    produtosAbaixoMinimo,
    metricas: {
      totalLotesAtivos: lotes.length,
      totalUnidades: Math.round(totalUnidades * 100) / 100,
      totalProdutosDistintos: produtosAgrupados.length,
      qtdAbaixoMinimo: produtosAbaixoMinimo.length,
      qtdVencendo30d: lotesVencendo30d.length,
      qtdVencidos: lotesVencidos.length,
      totalLocaisAtivos: locaisReconciliados.length
    }
  };
}

/**
 * Normaliza o status de uma campanha entre o padrão DynamoDB ('Pendente de Análise', 'Aprovada', 'Reprovada', 'Encerrada')
 * e o código interno ('pendente', 'aprovada', 'reprovada', 'encerrada')
 */
function normalizarObjetoCampanha(c) {
  const id = String(c.id_campanha_doacao || c.idCampanha || c.id || `camp_${Math.random().toString(36).substring(2, 7)}`);
  const statusBruto = String(c.status_campanha || c.status || 'Pendente de Análise').toLowerCase();
  let statusCodigo = 'pendente';
  let statusRotuloDb = 'Pendente de Análise';

  if (statusBruto.includes('aprov') || statusBruto.includes('ativ')) {
    statusCodigo = 'aprovada';
    statusRotuloDb = 'Aprovada';
  } else if (statusBruto.includes('reprov') || statusBruto.includes('recus')) {
    statusCodigo = 'reprovada';
    statusRotuloDb = 'Reprovada';
  } else if (statusBruto.includes('encerr') || statusBruto.includes('finaliz') || statusBruto.includes('conclu')) {
    statusCodigo = 'encerrada';
    statusRotuloDb = 'Encerrada';
  }

  const metas = Array.isArray(c.itens_metas) ? c.itens_metas : [];
  const primeiroItem = metas[0] || {};
  const itemFoco = c.itemFoco || primeiroItem.nome || primeiroItem.nome_item_solicitado || 'Alimentos Não Perecíveis';
  const metaUnidades = Number(
    c.metaUnidades ||
    metas.reduce((acc, m) => acc + Number(m.qtd || m.quantidade_meta_pretendida || 0), 0) ||
    50
  );
  const arrecadadoUnidades = Number(c.arrecadadoUnidades || c.quantidade_arrecadada || 0);
  const titulo = c.nome_campanha || c.titulo || 'Campanha Solidária';
  const descricao = c.objetivo_descricao_campanha || c.descricao || '';
  const dataInicio = c.data_inicio_campanha || c.criadoEm || new Date().toISOString().split('T')[0];
  const dataLimite = c.data_termino_campanha || c.dataLimite || '2026-12-31';
  const criadorNome = c.nome_proponente || c.criadorNome || 'Doador Comunitário';
  const criadorEmail = c.id_doador_responsavel || c.criadorEmail || 'doador@comunidade.org';
  const parecer = c.justificativa_parecer_tecnico || c.parecerTecnico || '';

  return {
    ...c,
    // Chaves DynamoDB tb_campanhasDoacoes
    id_campanha_doacao: id,
    nome_campanha: titulo,
    objetivo_descricao_campanha: descricao,
    data_inicio_campanha: dataInicio,
    data_termino_campanha: dataLimite,
    status_campanha: statusRotuloDb,
    justificativa_parecer_tecnico: parecer,
    nome_proponente: criadorNome,
    id_doador_responsavel: criadorEmail,
    // Chaves normalizadas Web
    idCampanha: id,
    titulo,
    descricao,
    itemFoco,
    metaUnidades,
    arrecadadoUnidades,
    dataInicio,
    dataLimite,
    criadorNome,
    criadorEmail,
    status: statusCodigo,
    parecerTecnico: parecer,
    criadoEm: c.criada_em || c.criadoEm || dataInicio
  };
}

/**
 * Carrega todas as campanhas reais de tb_campanhasDoacoes na AWS + reconcilia com o cache local
 */
async function carregarCampanhasReconciliadas() {
  let campanhasAws = [];
  let itensAws = [];
  try {
    const [respCamp, respItens] = await Promise.all([
      executarAcaoEstoqueAws({ acao: 'consultar_campanhas' }),
      executarAcaoEstoqueAws({ acao: 'consultar_itens_campanha' }).catch(() => ({ itens: [] }))
    ]);
    if (Array.isArray(respCamp.campanhas)) campanhasAws = respCamp.campanhas;
    if (Array.isArray(respItens.itens)) itensAws = respItens.itens;
  } catch (e) {
    console.warn('Aviso ao consultar tb_campanhasDoacoes na AWS:', e);
  }

  let campanhasLocais = [];
  try {
    const raw = localStorage.getItem(CHAVE_CAMPANHAS_ADMIN);
    if (raw) campanhasLocais = JSON.parse(raw);
  } catch {
    campanhasLocais = [];
  }

  const mapa = new Map();

  // Associa os itens de tb_itensCampanhas às campanhas da AWS
  campanhasAws.forEach((c) => {
    const idCamp = String(c.id_campanha_doacao || c.idCampanha || '');
    if (!idCamp) return;
    const metasRelacionadas = itensAws.filter((it) => String(it.id_campanha_doacao) === idCamp);
    const campEnriquecida = {
      ...c,
      itens_metas: Array.isArray(c.itens_metas) && c.itens_metas.length > 0 ? c.itens_metas : metasRelacionadas
    };
    mapa.set(idCamp, normalizarObjetoCampanha(campEnriquecida));
  });

  campanhasLocais.forEach((c) => {
    const idCamp = String(c.id_campanha_doacao || c.idCampanha || '');
    if (!idCamp) return;
    const existente = mapa.get(idCamp) || {};
    mapa.set(idCamp, normalizarObjetoCampanha({ ...existente, ...c }));
  });

  const lista = Array.from(mapa.values()).sort((a, b) => String(b.criadoEm).localeCompare(String(a.criadoEm)));
  try {
    localStorage.setItem(CHAVE_CAMPANHAS_ADMIN, JSON.stringify(lista));
  } catch {
    // Ignora erro de quota
  }
  return lista;
}

/**
 * Cria ou modera uma campanha persistindo no AWS DynamoDB (tb_campanhasDoacoes e tb_itensCampanhas)
 */
async function salvarOuModerarCampanhaAdmin(campanha, ehNova = false) {
  const normalizada = normalizarObjetoCampanha(campanha);
  const lista = await carregarCampanhasReconciliadas();
  const idx = lista.findIndex((c) => c.idCampanha === normalizada.idCampanha);
  if (idx >= 0) {
    lista[idx] = normalizada;
  } else {
    lista.unshift(normalizada);
  }
  localStorage.setItem(CHAVE_CAMPANHAS_ADMIN, JSON.stringify(lista));

  try {
    if (ehNova) {
      await executarAcaoEstoqueAws({
        acao: 'criar_campanha',
        dados: {
          id_campanha_doacao: normalizada.id_campanha_doacao,
          id_doador_responsavel: normalizada.id_doador_responsavel,
          nome_proponente: normalizada.nome_proponente,
          nome_campanha: normalizada.nome_campanha,
          objetivo_descricao_campanha: normalizada.objetivo_descricao_campanha,
          data_inicio_campanha: normalizada.data_inicio_campanha,
          data_termino_campanha: normalizada.data_termino_campanha,
          status_campanha: normalizada.status_campanha,
          justificativa_parecer_tecnico: normalizada.justificativa_parecer_tecnico,
          itens_metas: [
            {
              nome: normalizada.itemFoco,
              qtd: normalizada.metaUnidades,
              unidade_medida_item: 'pacotes/unidades'
            }
          ]
        }
      });
    } else {
      await executarAcaoEstoqueAws({
        acao: 'moderar_campanha',
        id_campanha_doacao: normalizada.id_campanha_doacao,
        status_campanha: normalizada.status_campanha,
        justificativa_parecer_tecnico: normalizada.justificativa_parecer_tecnico,
        responsavel: 'casadacrianca@adm'
      });
    }
  } catch (e) {
    console.warn('Sincronização com AWS tb_campanhasDoacoes:', e);
  }

  return lista;
}

// Exporta funções globalmente
window.URL_API_ESTOQUE_AWS = URL_API_ESTOQUE_AWS;
window.CHAVE_SESSAO_ADMIN = CHAVE_SESSAO_ADMIN;
window.CHAVE_LOCAIS_ADMIN = CHAVE_LOCAIS_ADMIN;
window.CHAVE_CAMPANHAS_ADMIN = CHAVE_CAMPANHAS_ADMIN;
window.CHAVE_HISTORICO_MENSAGERIA = CHAVE_HISTORICO_MENSAGERIA;
window.normalizarNomePrateleira = normalizarNomePrateleira;
window.verificarAutenticacaoAdmin = verificarAutenticacaoAdmin;
window.realizarLogoutAdmin = realizarLogoutAdmin;
window.renderizarSidebarAdmin = renderizarSidebarAdmin;
window.calcularDiasRestantesValidade = calcularDiasRestantesValidade;
window.classificarStatusFefo = classificarStatusFefo;
window.formatarDataBr = formatarDataBr;
window.executarAcaoEstoqueAws = executarAcaoEstoqueAws;
window.obterLocaisArmazenamentoReconciliados = obterLocaisArmazenamentoReconciliados;
window.carregarDadosEstoqueAws = carregarDadosEstoqueAws;
window.carregarCampanhasReconciliadas = carregarCampanhasReconciliadas;
window.salvarOuModerarCampanhaAdmin = salvarOuModerarCampanhaAdmin;
