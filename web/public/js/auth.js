// web/public/js/auth.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
  getAuth,
  signInWithPopup,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDDmJWmKMOgSQg0XxfpAVtrNy8XY79G7VM",
  authDomain: "doar-e-guardar-v2.firebaseapp.com",
  projectId: "doar-e-guardar-v2",
  storageBucket: "doar-e-guardar-v2.firebasestorage.app",
  messagingSenderId: "206062751062",
  appId: "1:206062751062:web:38cda34f65ca612043daf7",
  measurementId: "G-87KFR89NX0",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: "select_account" });

const CHAVE_SESSAO_ADMIN = "dg_sessao_admin";
const EMAIL_ADMIN_OFICIAL = "casadacrianca@adm";
const SENHA_ADMIN_OFICIAL = "casadacriancaadm";

function obterSessaoAdminAtiva() {
  try {
    const bruto = localStorage.getItem(CHAVE_SESSAO_ADMIN);
    if (!bruto) return null;
    const sessao = JSON.parse(bruto);
    const emailSessao = String(sessao?.email || sessao?.email_usuario || "").toLowerCase();
    const roleSessao = String(sessao?.role || sessao?.nivel_acesso_permissao || "").toLowerCase();
    if (sessao && emailSessao === EMAIL_ADMIN_OFICIAL && roleSessao === "administrador") {
      return sessao;
    }
    return null;
  } catch {
    return null;
  }
}

async function registrarSessaoFirestore(dadosUsuario, nivelAcesso = "doador") {
  try {
    await setDoc(
      doc(db, "tb_sessoesUsuarios", dadosUsuario.uid),
      {
        id_usuario: dadosUsuario.uid,
        email_usuario: dadosUsuario.email,
        nome_usuario: dadosUsuario.displayName || dadosUsuario.email.split("@")[0],
        url_foto_perfil: dadosUsuario.photoURL || "",
        nivel_acesso_permissao: nivelAcesso,
        plataforma_acesso: "portal_web",
        status_sessao_ativa: true,
        data_hora_inicio_sessao: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (e) {
    console.warn("Aviso ao registrar sessão no Firestore:", e);
  }
}

function aplicarEstadoAdminNaInterface(sessaoAdmin) {
  const infoNome = document.getElementById("nome-usuario");
  const infoAcesso = document.getElementById("nivel-acesso");
  const btnLogoutCorner = document.getElementById("btn-logout-corner");

  if (infoNome) infoNome.textContent = sessaoAdmin.nome_usuario || "Administrador";
  if (infoAcesso) {
    infoAcesso.innerHTML = '<i class="ph-fill ph-shield-star"></i><span>Administrador</span>';
    infoAcesso.className =
      "inline-flex items-center gap-1 mt-1 px-3 py-1 bg-indigo-100 text-indigo-900 rounded-full text-xs font-bold border border-indigo-200";
  }

  document.getElementById("menu-publico")?.classList.add("hidden");
  document.getElementById("menu-doador")?.classList.add("hidden");
  document.getElementById("menu-admin")?.classList.remove("hidden");
  document.getElementById("container-botoes-login")?.classList.add("hidden");

  if (btnLogoutCorner) {
    btnLogoutCorner.classList.remove("hidden");
    btnLogoutCorner.onclick = window.realizarLogout;
  }
}

window.realizarLoginGoogle = async () => {
  try {
    localStorage.removeItem(CHAVE_SESSAO_ADMIN);
    const resultado = await signInWithPopup(auth, provider);
    await registrarSessaoFirestore(resultado.user, "doador");

    if (window.fecharModal) window.fecharModal("modal-login");
  } catch (erro) {
    if (
      erro.code !== "auth/popup-closed-by-user" &&
      erro.code !== "auth/cancelled-popup-request"
    ) {
      alert("Falha ao conectar com o Google: " + erro.message);
    }
  }
};

window.realizarLoginCredenciais = async (event) => {
  if (event) event.preventDefault();
  const inputEmail = document.getElementById("login-email");
  const inputSenha = document.getElementById("login-senha");
  const erroBox = document.getElementById("login-erro-msg");
  const email = inputEmail ? inputEmail.value.trim().toLowerCase() : "";
  const senha = inputSenha ? inputSenha.value.trim() : "";

  if (erroBox) erroBox.classList.add("hidden");

  if (!email || !senha) {
    if (erroBox) {
      erroBox.textContent = "Por favor, preencha seu e-mail e senha.";
      erroBox.classList.remove("hidden");
    } else {
      alert("Por favor, preencha seu e-mail e senha.");
    }
    return;
  }

  // 1. Verifica credencial homologada do Administrador (casadacrianca@adm / casadacriancaadm)
  if (email === EMAIL_ADMIN_OFICIAL && senha === SENHA_ADMIN_OFICIAL) {
    const sessaoAdmin = {
      uid: "adm_casadacrianca_oficial",
      id_usuario: "adm_casadacrianca_oficial",
      email: EMAIL_ADMIN_OFICIAL,
      email_usuario: EMAIL_ADMIN_OFICIAL,
      nome: "Admin Casa da Criança",
      nome_usuario: "Admin Casa da Criança",
      role: "administrador",
      nivel_acesso_permissao: "administrador",
      autenticado_em: new Date().toISOString(),
    };
    localStorage.setItem(CHAVE_SESSAO_ADMIN, JSON.stringify(sessaoAdmin));

    registrarSessaoFirestore(
      {
        uid: sessaoAdmin.id_usuario,
        email: sessaoAdmin.email_usuario,
        displayName: sessaoAdmin.nome_usuario,
        photoURL: "",
      },
      "administrador"
    );

    if (inputSenha) inputSenha.value = "";
    if (window.fecharModal) window.fecharModal("modal-login");
    aplicarEstadoAdminNaInterface(sessaoAdmin);
    window.location.href = "./views/admin/dashboard.html";
    return;
  }

  // 2. Autenticação de doadores/usuários via Firebase Auth
  try {
    localStorage.removeItem(CHAVE_SESSAO_ADMIN);
    const resultado = await signInWithEmailAndPassword(auth, email, senha);
    await registrarSessaoFirestore(resultado.user, "doador");

    if (inputSenha) inputSenha.value = "";
    if (window.fecharModal) window.fecharModal("modal-login");
  } catch {
    if (erroBox) {
      erroBox.textContent = "Acesso negado: E-mail ou senha inválidos.";
      erroBox.classList.remove("hidden");
    } else {
      alert("Acesso negado: E-mail ou senha inválidos.");
    }
  }
};

window.realizarLogout = async () => {
  localStorage.removeItem(CHAVE_SESSAO_ADMIN);
  try {
    await signOut(auth);
  } catch {
    // Ignora erro local caso não houvesse sessão Firebase
  }
  window.location.href = "./index.html";
};

const sessaoInicialAdmin = obterSessaoAdminAtiva();
if (sessaoInicialAdmin) {
  aplicarEstadoAdminNaInterface(sessaoInicialAdmin);
}

onAuthStateChanged(auth, (user) => {
  const sessaoAdmin = obterSessaoAdminAtiva();
  if (sessaoAdmin) {
    aplicarEstadoAdminNaInterface(sessaoAdmin);
    return;
  }

  const infoNome = document.getElementById("nome-usuario");
  const infoAcesso = document.getElementById("nivel-acesso");
  const avatarImg = document.getElementById("avatar-visitante");
  const btnLogoutCorner = document.getElementById("btn-logout-corner");

  if (user) {
    if (infoNome) infoNome.textContent = user.displayName || user.email.split("@")[0];
    if (infoAcesso) {
      infoAcesso.innerHTML = '<i class="ph-fill ph-heart"></i><span>Doador</span>';
      infoAcesso.className =
        "inline-flex items-center gap-1 mt-1 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-semibold";
    }
    if (user.photoURL && avatarImg) avatarImg.src = user.photoURL;

    document.getElementById("menu-publico")?.classList.add("hidden");
    document.getElementById("menu-admin")?.classList.add("hidden");
    document.getElementById("menu-doador")?.classList.remove("hidden");
    document.getElementById("container-botoes-login")?.classList.add("hidden");

    if (btnLogoutCorner) {
      btnLogoutCorner.classList.remove("hidden");
      btnLogoutCorner.onclick = window.realizarLogout;
    }
  } else {
    document.getElementById("menu-publico")?.classList.remove("hidden");
    document.getElementById("menu-doador")?.classList.add("hidden");
    document.getElementById("menu-admin")?.classList.add("hidden");
    document.getElementById("container-botoes-login")?.classList.remove("hidden");
    if (btnLogoutCorner) {
      btnLogoutCorner.classList.add("hidden");
    }
  }
});
