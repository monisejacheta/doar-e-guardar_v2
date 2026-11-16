// app-mobile/src/services/firebaseConfig.ts
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp, getApps, getApp } from 'firebase/app';
import * as FirebaseAuth from 'firebase/auth';
import { getAuth, initializeAuth, GoogleAuthProvider } from 'firebase/auth';
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

function inicializarFirebaseAuth() {
  if (Platform.OS !== 'web') {
    try {
      const getRnPersistence = (FirebaseAuth as any).getReactNativePersistence;
      if (typeof getRnPersistence === 'function') {
        return initializeAuth(app, {
          persistence: getRnPersistence(AsyncStorage),
        });
      }
    } catch {
      // Se já foi inicializado (ex.: Hot Reload), retorna a instância existente
    }
  }
  return getAuth(app);
}

export const auth = inicializarFirebaseAuth();
export const db = getFirestore(app);

// Instancia o provedor do Google
export const googleProvider = new GoogleAuthProvider();

// Força o Google a sempre exibir a tela de seleção de contas:
googleProvider.setCustomParameters({
  prompt: 'select_account',
});
