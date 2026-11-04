import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDDmJWmKMOgSQg0XxfpAVtrNy8XY79G7VM",
  authDomain: "doar-e-guardar-v2.firebaseapp.com",
  projectId: "doar-e-guardar-v2",
  storageBucket: "doar-e-guardar-v2.firebasestorage.app",
  messagingSenderId: "206062751062",
  appId: "1:206062751062:web:38cda34f65ca612043daf7",
  measurementId: "G-87KFR89NX0"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: 'select_account' });

window.realizarLoginGoogle = async () => {
    try {
        const resultado = await signInWithPopup(auth, provider);
        const user = resultado.user;

        await setDoc(doc(db, 'tb_sessoesUsuarios', user.uid), {
            id_usuario: user.uid,
            email_usuario: user.email,
            nome_usuario: user.displayName || user.email.split('@')[0],
            url_foto_perfil: user.photoURL || '',
            nivel_acesso_permissao: 'doador',
            plataforma_acesso: 'portal_web',
            status_sessao_ativa: true,
            data_hora_inicio_sessao: serverTimestamp(),
        }, { merge: true });

        if(window.fecharModal) window.fecharModal('modal-login');
        
        // Agora permanece na index, o listener cuidará de mostrar a nav de Doador
        // window.location.href = './views/donor/campanhas.html';
        
    } catch (erro) {
        if (erro.code !== 'auth/popup-closed-by-user') {
            alert('Falha ao conectar com o Google: ' + erro.message);
        }
    }
};

window.realizarLogout = async () => {
    await signOut(auth);
    window.location.reload();
};

onAuthStateChanged(auth, (user) => {
    const infoNome = document.getElementById('nome-usuario');
    const infoAcesso = document.getElementById('nivel-acesso');
    const avatarImg = document.getElementById('avatar-visitante');
    const btnLogoutCorner = document.getElementById('btn-logout-corner');
    
    if (user) {
        if(infoNome) infoNome.textContent = user.displayName || user.email.split('@')[0];
        if(infoAcesso) {
            infoAcesso.innerHTML = '<i class="ph-fill ph-heart"></i><span>Doador</span>';
            infoAcesso.className = "inline-flex items-center gap-1 mt-1 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-semibold";
        }
        if (user.photoURL && avatarImg) avatarImg.src = user.photoURL;

        document.getElementById('menu-publico')?.classList.add('hidden');
        document.getElementById('menu-doador')?.classList.remove('hidden');
        document.getElementById('container-botoes-login')?.classList.add('hidden');
        
        // Mostra o botao de logout e amarra a ação
        if (btnLogoutCorner) {
            btnLogoutCorner.classList.remove('hidden');
            btnLogoutCorner.onclick = window.realizarLogout;
        }
    } else {
        if (btnLogoutCorner) {
             btnLogoutCorner.classList.add('hidden');
        }
    }
});