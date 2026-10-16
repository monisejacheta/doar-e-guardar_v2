// src/app/home.styles.ts
import { StyleSheet } from 'react-native';

export const estilosHome = StyleSheet.create({
  container: {
    flex: 1,
  },
  barraSuperior: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  perfilResumo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarPequeno: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarTexto: {
    fontSize: 20,
  },
  saudacaoNome: {
    fontWeight: 'bold',
  },
  rotuloFuncao: {
    fontWeight: '500',
  },
  acoesTopo: {
    flexDirection: 'row',
    gap: 8,
  },
  botaoIconeTopo: {
    width: 44,
    height: 44,
    borderWidth: 1.5,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconeTextoTopo: {
    fontSize: 18,
  },
  rolagem: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  blocoDestaqueDora: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconeDora: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  textoIconeDora: {
    fontSize: 26,
  },
  conteudoDora: {
    flex: 1,
  },
  tituloDora: {
    fontWeight: 'bold',
    marginBottom: 2,
  },
  descricaoDora: {
    lineHeight: 18,
  },
  secaoTitulo: {
    fontWeight: 'bold',
    marginBottom: 12,
    marginTop: 4,
  },
});