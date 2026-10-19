// src/styles/stock-details.styles.ts
import { StyleSheet } from 'react-native';

export const estilosStockDetails = StyleSheet.create({
  container: {
    flex: 1,
  },
  rolagem: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  cabecalho: {
    marginBottom: 16,
  },
  titulo: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitulo: {
    lineHeight: 20,
  },
  // Chaves de retrocompatibilidade
  cartaoPrincipal: {
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  textoInformativo: {
    lineHeight: 22,
    marginBottom: 14,
  },
  areaAcao: {
    marginTop: 8,
    width: '100%',
  },
  campoDigitacao: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    minHeight: 48,
    marginBottom: 12,
  },
  // Estilos específicos da Tela 3.4
  barraBusca: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 12,
    minHeight: 48, // Touch target >= 48px (WCAG AAA)
    marginBottom: 14,
  },
  inputBusca: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  seletorProdutos: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 18,
  },
  pilulaProduto: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1.5,
    minHeight: 48,
    justifyContent: 'center',
  },
  textoPilula: {
    fontWeight: '700',
    fontSize: 13,
  },
  painelConsolidado: {
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 16,
    marginBottom: 18,
  },
  tituloProdutoConsolidado: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtituloProdutoConsolidado: {
    marginBottom: 12,
  },
  gradeConsolidada: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  blocoMetrica: {
    flex: 1,
    minWidth: '45%',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  rotuloMetrica: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
  },
  valorMetrica: {
    fontWeight: 'bold',
    fontSize: 15,
  },
  secaoFiltros: {
    marginBottom: 16,
  },
  rotuloFiltro: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  linhaBotoesFiltro: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  botaoFiltro: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1.5,
    minHeight: 48,
    justifyContent: 'center',
  },
  cartaoLoteDetalhe: {
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  topoCartaoLote: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  codigoLoteTexto: {
    fontWeight: 'bold',
  },
  badgeStatusLote: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    gap: 4,
  },
  textoBadgeStatus: {
    fontWeight: 'bold',
    fontSize: 11,
  },
  linhaMetadadosLote: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
});