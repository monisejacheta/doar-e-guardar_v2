// src/styles/stock-move.styles.ts
import { StyleSheet } from 'react-native';

export const estilosStockMove = StyleSheet.create({
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
  // Estilos específicos da Tela 3.3
  secaoCard: {
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  tituloSecaoCard: {
    fontWeight: 'bold',
    marginBottom: 12,
  },
  cartaoLoteOrigem: {
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 54,
  },
  infoLote: {
    flex: 1,
  },
  nomeProdutoLote: {
    fontWeight: 'bold',
  },
  detalheLocalAtual: {
    fontSize: 12,
    marginTop: 2,
  },
  badgeSaldo: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginLeft: 8,
  },
  gradeLocais: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
    marginBottom: 12,
  },
  botaoLocal: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1.5,
    borderRadius: 10,
    minHeight: 48, // Touch target >= 48px (WCAG AAA)
    justifyContent: 'center',
  },
  textoBotaoLocal: {
    fontWeight: '600',
    fontSize: 13,
  },
  avisoDivisaoLote: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    marginTop: 6,
    marginBottom: 12,
  },
  textoAvisoDivisao: {
    marginLeft: 8,
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
    lineHeight: 18,
  },
});