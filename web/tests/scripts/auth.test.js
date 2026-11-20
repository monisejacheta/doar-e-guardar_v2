const fs = require('fs');
const path = require('path');
const { setupWebDom } = require('../helpers/domMock');

describe('Módulo de Autenticação Web (web/public/js/auth.js)', () => {
  function carregarAuthComMocks({ userCredential = null } = {}) {
    const ctx = setupWebDom();
    ctx.registerIds([
      'btn-login-google',
      'login-email',
      'login-senha',
      'login-erro-msg',
      'nome-usuario',
      'nivel-acesso',
      'avatar-visitante',
      'btn-logout-corner',
      'menu-publico',
      'menu-doador',
      'menu-admin',
      'container-botoes-login',
    ]);
    global.window.fecharModal = jest.fn();

    const userObj = userCredential || {
      uid: 'uid_google_1',
      displayName: 'Doadora Laura',
      email: 'laura@gmail.com',
      photoURL: 'https://img.example/laura.jpg',
    };
    const signInWithPopup = jest.fn(async () => ({ user: userObj }));
    const signInWithEmailAndPassword = jest.fn(async () => {
      throw new Error('auth/invalid-credential');
    });
    const setDoc = jest.fn(async () => {});
    const signOut = jest.fn(async () => {});
    let authCallback = null;
    const onAuthStateChanged = jest.fn((_auth, cb) => {
      authCallback = cb;
    });

    const src = fs.readFileSync(
      path.resolve(__dirname, '../../public/js/auth.js'),
      'utf8'
    );

    const instrumented = src
      .replace(/import\s*\{[^}]+\}\s*from\s*["'][^"']+firebase-app\.js["'];?/g, '')
      .replace(/import\s*\{[\s\S]*?\}\s*from\s*["'][^"']+firebase-auth\.js["'];?/g, '')
      .replace(/import\s*\{[\s\S]*?\}\s*from\s*["'][^"']+firebase-firestore\.js["'];?/g, '');

    const deps = {
      initializeApp: jest.fn(() => ({})),
      getAuth: jest.fn(() => ({ currentUser: null })),
      GoogleAuthProvider: function GoogleAuthProvider() {
        this.setCustomParameters = jest.fn();
      },
      signInWithPopup,
      signInWithEmailAndPassword,
      onAuthStateChanged,
      signOut,
      getFirestore: jest.fn(() => ({})),
      doc: jest.fn(() => ({})),
      setDoc,
      serverTimestamp: jest.fn(() => 'SERVER_TS'),
    };

    const fnBody = `
      const { initializeApp, getAuth, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, onAuthStateChanged, signOut, getFirestore, doc, setDoc, serverTimestamp } = deps;
      ${instrumented}
    `;
    new Function('deps', fnBody)(deps);
    return { ctx, signInWithPopup, setDoc, signOut, triggerAuthState: (u) => authCallback?.(u), userObj };
  }

  test('realizarLoginCredenciais deve validar campos vazios, rejeitar credenciais inválidas e autenticar admin oficial', async () => {
    const { ctx } = carregarAuthComMocks();

    await global.window.realizarLoginCredenciais({ preventDefault: jest.fn() });
    expect(ctx.document.getElementById('login-erro-msg').textContent).toMatch(/preencha/i);

    ctx.document.getElementById('login-email').value = 'intruso@teste.com';
    ctx.document.getElementById('login-senha').value = 'errada';
    await global.window.realizarLoginCredenciais({ preventDefault: jest.fn() });
    expect(ctx.localStorage.getItem('dg_sessao_admin')).toBeNull();
    expect(ctx.document.getElementById('login-erro-msg').textContent).toMatch(/inválidos/i);

    ctx.document.getElementById('login-email').value = 'casadacrianca@adm';
    ctx.document.getElementById('login-senha').value = 'casadacriancaadm';
    await global.window.realizarLoginCredenciais({ preventDefault: jest.fn() });

    const sessao = JSON.parse(ctx.localStorage.getItem('dg_sessao_admin'));
    expect(sessao.email).toBe('casadacrianca@adm');
    expect(sessao.role).toBe('administrador');
    expect(ctx.location.href).toContain('dashboard.html');
  });

  test('realizarLoginGoogle deve persistir sessão no Firestore e atualizar UI para doador autenticado', async () => {
    const { ctx, signInWithPopup, setDoc, triggerAuthState, userObj } = carregarAuthComMocks();

    await global.window.realizarLoginGoogle();
    expect(signInWithPopup).toHaveBeenCalled();
    expect(setDoc).toHaveBeenCalled();
    expect(global.window.fecharModal).toHaveBeenCalledWith('modal-login');

    triggerAuthState(userObj);
    expect(ctx.document.getElementById('nome-usuario').textContent).toBe('Doadora Laura');
    expect(ctx.document.getElementById('menu-doador').classList.contains('hidden')).toBe(false);
  });

  test('realizarLogout deve limpar dg_sessao_admin e encerrar Firebase', async () => {
    const { ctx, signOut } = carregarAuthComMocks();
    ctx.localStorage.setItem('dg_sessao_admin', JSON.stringify({ role: 'administrador' }));

    await global.window.realizarLogout();
    expect(ctx.localStorage.getItem('dg_sessao_admin')).toBeNull();
    expect(signOut).toHaveBeenCalled();
  });
});
