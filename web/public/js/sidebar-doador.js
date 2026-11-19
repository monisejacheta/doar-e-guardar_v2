/**
 * Sidebar Padronizada do Perfil Doador
 * Mesmo padrão visual da barra lateral Pública e Administrativa.
 */

function renderizarSidebarDoador(paginaAtiva, user = null) {
  const container = document.getElementById('sidebar-doador-container');
  if (!container) return;

  const nome = user?.displayName || (user?.email ? user.email.split('@')[0] : 'Doador');
  const foto = user?.photoURL || '../../public/assets/avatarPublico02.png';

  const itensDoador = [
    { id: 'dashboard', href: './dashboardDoador.html', icone: 'ph-squares-four', rotulo: 'Painel do Doador' },
    { id: 'estoque', href: './estoque.html', icone: 'ph-package', rotulo: 'Estoque Transparente' },
    { id: 'campanhas', href: './campanhas.html', icone: 'ph-megaphone', rotulo: 'Propor Campanha' },
    { id: 'minhas-campanhas', href: './minhas-campanhas.html', icone: 'ph-folder-star', rotulo: 'Minhas Campanhas' },
    { id: 'configuracoes', href: './configuracoes.html', icone: 'ph-user-gear', rotulo: 'Meu Perfil & Preferências' }
  ];

  const linksHtml = itensDoador.map((item) => {
    const ativo = item.id === paginaAtiva;
    const classes = ativo
      ? 'flex items-center gap-3 px-4 py-2.5 bg-white rounded-xl text-brandBlue shadow-sm font-bold transition hover:bg-blue-50 text-sm'
      : 'flex items-center gap-3 px-4 py-2.5 rounded-xl text-blue-900 hover:bg-white/60 transition font-medium text-sm';
    return `
      <a href="${item.href}" class="${classes}">
        <i class="ph ${item.icone} text-lg"></i> ${item.rotulo}
      </a>
    `;
  }).join('');

  container.outerHTML = `
    <aside id="sidebar-doador-container" class="w-64 lg:w-72 bg-pastelBlue flex flex-col shadow-lg h-full flex-shrink-0 relative z-20">
      <div class="p-5 text-center border-b border-white/60 bg-white/30 relative">
        <button type="button" onclick="realizarLogout()" class="absolute top-3.5 right-3.5 text-slate-500 hover:text-red-500 transition" aria-label="Sair da conta" title="Sair da conta">
          <i class="ph ph-sign-out text-xl"></i>
        </button>

        <div class="w-14 h-14 bg-white rounded-full flex items-center justify-center mx-auto mb-2.5 shadow-sm overflow-hidden border-2 border-white">
          <img id="avatar-doador" src="${foto}" alt="Avatar do Doador" class="w-full h-full object-cover">
        </div>
        <h2 id="sidebar-nome-doador" class="text-base font-bold text-brandBlue leading-tight truncate">${nome}</h2>
        <div class="inline-flex items-center gap-1 mt-1 px-2.5 py-0.5 bg-emerald-100 text-emerald-900 rounded-full text-[11px] font-bold border border-emerald-200">
          <i class="ph-fill ph-heart"></i>
          <span>Doador Parceiro</span>
        </div>
      </div>

      <nav class="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto" aria-label="Navegação do Doador">
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

        <p class="px-3 pt-2.5 text-[11px] font-bold uppercase tracking-wider text-emerald-900/80">Área do Doador</p>
        ${linksHtml}
      </nav>

      <div class="p-3.5 border-t border-white/60 space-y-2 bg-white/30">
        <button type="button" onclick="alternarAltoContraste()" class="flex items-center justify-center gap-2 w-full py-2.5 bg-white rounded-xl text-blue-900 font-medium hover:bg-blue-50 transition shadow-sm text-sm">
          <i class="ph ph-moon text-lg"></i> Modo Noturno
        </button>

        <button type="button" onclick="realizarLogout()" class="flex items-center justify-center gap-2 w-full py-2.5 bg-red-100 rounded-xl text-red-700 font-semibold hover:bg-red-200 transition shadow-sm text-sm">
          <i class="ph ph-sign-out text-lg"></i> Sair da Conta
        </button>
      </div>
    </aside>
  `;
}

function atualizarUsuarioSidebarDoador(user) {
  if (!user) return;
  const nome = user.displayName || (user.email ? user.email.split('@')[0] : 'Doador');
  const elNome = document.getElementById('sidebar-nome-doador');
  const elAvatar = document.getElementById('avatar-doador');
  if (elNome) elNome.textContent = nome;
  if (elAvatar && user.photoURL) elAvatar.src = user.photoURL;
}

window.renderizarSidebarDoador = renderizarSidebarDoador;
window.atualizarUsuarioSidebarDoador = atualizarUsuarioSidebarDoador;
