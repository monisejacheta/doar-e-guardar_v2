// src/app/index.styles.ts
import { StyleSheet } from 'react-native';

export const estilosLogin = StyleSheet.create({
  container: {
    flex: 1,
  },
  barraSuperior: {
    paddingHorizontal: 20,
    paddingTop: 8,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  botaoContraste: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1.5,
    borderRadius: 8,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textoContraste: {
    fontWeight: '600',
  },
  rolagem: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  cabecalho: {
    alignItems: 'center',
    marginBottom: 20,
  },
  titulo: {
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitulo: {
    textAlign: 'center',
  },
  formulario: {
    width: '100%',
  },
  linkEsqueciSenha: {
    alignSelf: 'flex-end',
    marginBottom: 18,
    paddingVertical: 6,
  },
  textoEsqueciSenha: {
    fontWeight: '600',
  },
  divisorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
  },
  linhaDivisoria: {
    flex: 1,
    height: 1,
  },
  textoDivisor: {
    marginHorizontal: 12,
    fontWeight: '600',
  },
  areaGoogle: {
    width: '100%',
    marginBottom: 16,
  },
  botaoGoogle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    paddingHorizontal: 16,
    width: '100%',
  },
  iconeGoogle: {
    fontWeight: 'bold',
    marginRight: 10,
    fontSize: 18,
  },
  textoGoogle: {
    fontWeight: '700',
  },
  areaSimulacao: {
    width: '100%',
    marginTop: 4,
  },
  botaoSimulacao: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    width: '100%',
  },
  textoSimulacao: {
    fontWeight: 'bold',
  },
  rodapeAjuda: {
    marginTop: 20,
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  textoRodape: {
    textAlign: 'center',
    lineHeight: 18,
  },
});