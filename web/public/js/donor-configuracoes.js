/**
 * Módulo de Conta, Preferências de WhatsApp e Acessibilidade (Perfil Doador)
 * Conectado à AWS (tb_doadores) e sincronizado com accessibility.js.
 */

const URL_API_CONFIG_DOADOR = 'https://zqc7b27zwivnfyczo5kedb3vta0evazc.lambda-url.us-east-2.on.aws/api/estoque';

let doadorAwsRegistro = null;
let usuarioFirebaseAtual = null;

function mostrarFeedbackConfigDoador(msg, sucesso = true) {
  const box = document.getElementById('feedback-config-doador');
  if (!box) return;
  box.className = `p-3 rounded-xl border font-semibold text-xs flex items-center justify-between gap-3 ${
    sucesso ? 'bg-pastelGreen/70 border-emerald-300 text-emerald-900' : 'bg-red-50 border-red-200 text-red-800'
  }`;
  box.innerHTML = `
    <span class="min-w-0 flex-1 break-words">${msg}</span>
    <button type="button" onclick="this.parentElement.classList.add('hidden')" class="font-bold underline text-xs shrink-0">Fechar</button>
  `;
  box.classList.remove('hidden');
}

async function carregarDadosPerfilDoador(user) {
  usuarioFirebaseAtual = user;
  const nome = user.displayName || (user.email ? user.email.split('@')[0] : 'Doador');
  const email = user.email || '';

  document.getElementById('perfil-nome').value = nome;
  document.getElementById('perfil-email').value = email;
  document.getElementById('timestamp-consentimento').textContent = new Date().toLocaleString('pt-BR');

  try {
    const resp = await fetch(URL_API_CONFIG_DOADOR, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ acao: 'consultar_doadores' })
    });
    const dados = await resp.json();
    const lista = Array.isArray(dados.doadores) ? dados.doadores : [];

    doadorAwsRegistro = lista.find((d) =>
      (email && String(d.email || d.email_doador || '').toLowerCase() === email.toLowerCase()) ||
      String(d.id_doador || '') === `doador_${user.uid}`
    ) || null;

    if (doadorAwsRegistro) {
      document.getElementById('perfil-whatsapp').value = doadorAwsRegistro.telefone || doadorAwsRegistro.telefone_doador || '';
      document.getElementById('optin-whatsapp').checked = doadorAwsRegistro.status_ativo !== false && doadorAwsRegistro.opt_in_whatsapp !== false;
      if (doadorAwsRegistro.atualizado_em) {
        document.getElementById('timestamp-consentimento').textContent = new Date(doadorAwsRegistro.atualizado_em).toLocaleString('pt-BR');
      }
    }
  } catch (erro) {
    console.warn('Aviso ao buscar preferências do doador na AWS:', erro);
  }

  atualizarStatusVisualAcessibilidade();
}

async function salvarConfiguracoesDoador(event) {
  if (event) event.preventDefault();
  const btn = document.getElementById('btn-salvar-config-doador');
  if (btn) btn.disabled = true;

  const nome = document.getElementById('perfil-nome').value.trim();
  const email = document.getElementById('perfil-email').value.trim();
  const telefone = document.getElementById('perfil-whatsapp').value.replace(/\D/g, '');
  const optInWhatsapp = document.getElementById('optin-whatsapp').checked;

  try {
    const idDoador = doadorAwsRegistro?.id_doador || `doador_${usuarioFirebaseAtual?.uid || Date.now()}`;
    const acao = doadorAwsRegistro ? 'atualizar_doador' : 'cadastrar_doador';

    const resp = await fetch(URL_API_CONFIG_DOADOR, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        acao,
        id_doador: idDoador,
        nome,
        nome_completo: nome,
        email,
        telefone,
        telefone_doador: telefone,
        tipo: 'PF',
        status_ativo: optInWhatsapp,
        opt_in_whatsapp: optInWhatsapp
      })
    });
    const dados = await resp.json();
    if (!resp.ok || dados.sucesso === false) {
      throw new Error(dados.mensagem || 'Não foi possível salvar suas preferências.');
    }

    if (dados.doador) doadorAwsRegistro = dados.doador;
    document.getElementById('timestamp-consentimento').textContent = new Date().toLocaleString('pt-BR');
    mostrarFeedbackConfigDoador(
      `Preferências salvas! Avisos por WhatsApp: ${optInWhatsapp ? 'Ativos' : 'Desativados'}.`,
      true
    );
  } catch (erro) {
    mostrarFeedbackConfigDoador(`Erro ao salvar preferências: ${erro.message}`, false);
  } finally {
    if (btn) btn.disabled = false;
  }
}

// ==========================================
// CONFIGURAÇÕES DE ACESSIBILIDADE NA PÁGINA
// ==========================================
function atualizarStatusVisualAcessibilidade() {
  const contrasteAtivo = document.documentElement.classList.contains('high-contrast') || localStorage.getItem('dg_alto_contraste') === 'true';
  const fonteSalva = localStorage.getItem('dg_fonte') || 'normal';

  const badgeContraste = document.getElementById('status-alto-contraste');
  if (badgeContraste) {
    badgeContraste.textContent = contrasteAtivo ? 'Ativado' : 'Desativado';
    badgeContraste.className = `px-2.5 py-0.5 rounded-lg text-[11px] font-bold ${
      contrasteAtivo ? 'bg-brandBlue text-white' : 'bg-slate-200 text-slate-700'
    }`;
  }

  const mapaFontes = { normal: '100%', large: '115%', extra: '130%' };
  document.documentElement.style.fontSize = mapaFontes[fonteSalva] || '100%';

  ['normal', 'large', 'extra'].forEach((tam) => {
    const btn = document.getElementById(`btn-fonte-${tam}`);
    if (!btn) return;
    const ativo = tam === fonteSalva;
    btn.className = `flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition ${
      ativo
        ? 'bg-brandBlue text-white border-brandBlue shadow-sm'
        : 'bg-white text-brandBlue border-slate-200 hover:bg-pastelBlue/40'
    }`;
  });
}

function alternarAltoContrastePagina() {
  if (typeof window.alternarAltoContraste === 'function') {
    window.alternarAltoContraste();
  } else {
    document.documentElement.classList.toggle('high-contrast');
    const ativo = document.documentElement.classList.contains('high-contrast');
    localStorage.setItem('dg_alto_contraste', ativo ? 'true' : 'false');
  }
  atualizarStatusVisualAcessibilidade();
}

function definirTamanhoFontePagina(nivel) {
  const mapa = { normal: '100%', large: '115%', extra: '130%' };
  document.documentElement.style.fontSize = mapa[nivel] || '100%';
  localStorage.setItem('dg_fonte', nivel);
  atualizarStatusVisualAcessibilidade();
}

function restaurarAcessibilidadePadrao() {
  document.documentElement.classList.remove('high-contrast');
  localStorage.setItem('dg_alto_contraste', 'false');
  definirTamanhoFontePagina('normal');
  mostrarFeedbackConfigDoador('Configurações de acessibilidade restauradas para o padrão.', true);
}

window.carregarDadosPerfilDoador = carregarDadosPerfilDoador;
window.salvarConfiguracoesDoador = salvarConfiguracoesDoador;
window.alternarAltoContrastePagina = alternarAltoContrastePagina;
window.definirTamanhoFontePagina = definirTamanhoFontePagina;
window.restaurarAcessibilidadePadrao = restaurarAcessibilidadePadrao;
window.atualizarStatusVisualAcessibilidade = atualizarStatusVisualAcessibilidade;
