// src/styles/stock-add.styles.ts
import { StyleSheet } from 'react-native';

export const estilosStockAdd = StyleSheet.create({
  container: {
    flex: 1,
  },
  rolagem: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  cabecalho: {
    marginBottom: 18,
  },
  titulo: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitulo: {
    lineHeight: 20,
  },
  secaoCard: {
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 16,
    marginBottom: 18,
  },
  tituloSecaoCard: {
    fontWeight: 'bold',
    marginBottom: 12,
  },
  divisorOu: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 14,
  },
  linhaDivisor: {
    flex: 1,
    height: 1,
  },
  textoDivisor: {
    marginHorizontal: 10,
    fontWeight: '600',
    fontSize: 12,
  },
  linhaDoisCampos: {
    flexDirection: 'row',
    gap: 12,
  },
  colunaCampo: {
    flex: 1,
  },
  rotuloSeletor: {
    fontWeight: '600',
    marginBottom: 6,
  },
  gradeSelecao: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  botaoOpcao: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1.5,
    borderRadius: 10,
    minHeight: 48, // WCAG AAA touch target
    justifyContent: 'center',
    alignItems: 'center',
  },
  textoOpcao: {
    fontWeight: '600',
    fontSize: 13,
  },
  bannerStatusApi: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 16,
  },
  textoStatusApi: {
    marginLeft: 8,
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
});