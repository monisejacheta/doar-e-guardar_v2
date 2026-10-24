// app-mobile/src/services/firebaseConfig.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDDmJWmKMOgSQg0XxfpAVtrNy8XY79G7VM",
  authDomain: "doar-e-guardar-v2.firebaseapp.com",
  projectId: "doar-e-guardar-v2",
  storageBucket: "doar-e-guardar-v2.firebasestorage.app",
  messagingSenderId: "206062751062",
  appId: "1:206062751062:web:38cda34f65ca612043daf7",
  measurementId: "G-87KFR89NX0"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);

// Instancia o provedor do Google
export const googleProvider = new GoogleAuthProvider();

// Força o Google a sempre exibir a tela de seleção de contas:
googleProvider.setCustomParameters({
  prompt: 'select_account',
});