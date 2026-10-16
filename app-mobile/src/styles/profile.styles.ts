// src/app/profile.styles.ts
import { StyleSheet } from 'react-native';

export const estilosPerfil = StyleSheet.create({
  container: {
    flex: 1,
  },
  rolagem: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  cartaoResumo: {
    alignItems: 'center',
    padding: 20,
    borderWidth: 1.5,
    borderRadius: 16,
    marginBottom: 24,
  },
  fotoArea: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  fotoIcone: {
    fontSize: 40,
  },
  nomeUsuario: {
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  emailUsuario: {
    marginBottom: 8,
    textAlign: 'center',
  },
  etiquetaFuncao: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  textoFuncao: {
    fontWeight: '700',
  },
  tituloSecao: {
    fontWeight: 'bold',
    marginBottom: 12,
  },
  listaOpcoes: {
    width: '100%',
    marginBottom: 24,
  },
  areaLogout: {
    width: '100%',
    marginTop: 10,
  },
});