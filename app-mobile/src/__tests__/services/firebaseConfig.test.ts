import { auth, db, googleProvider } from '../../services/firebaseConfig';

describe('services/firebaseConfig.ts', () => {
  it('deve inicializar e exportar auth, db e googleProvider configurados', () => {
    expect(auth).toBeDefined();
    expect(db).toBeDefined();
    expect(googleProvider).toBeDefined();
    expect(typeof googleProvider.setCustomParameters).toBe('function');
  });
});
