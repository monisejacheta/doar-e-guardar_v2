// src/styles/stock-move.styles.ts
import { StyleSheet, Platform } from 'react-native';

export const estilosStockMove = StyleSheet.create({
  container: {
    flex: 1,
  },
  rolagem: {
    paddingHorizontal: 16,
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
  botaoVoltar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  textoBotaoVoltar: {
    fontWeight: '700',
    marginLeft: 6,
  },
  
  // Busca
  searchBarRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 10, 
    marginBottom: 16 
  },
  inputSearchWrapper: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    borderRadius: 12, 
    borderWidth: 1, 
    paddingHorizontal: 12, 
    height: 48 
  },
  searchInput: { 
    flex: 1, 
    marginLeft: 8 
  },

  // Modo Lista
  listaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    width: '100%',
    elevation: 1,
    marginBottom: 8,
  },
  listaFoto: {
    width: 46,
    height: 46,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    marginRight: 10,
  },
  produtoNome: {
    fontWeight: '700',
  },
  produtoMeta: {
    marginTop: 1,
  },
  produtoSub: {
    fontWeight: '600',
    marginTop: 2,
  },
  badgeQtdConsolidada: {
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    alignItems: 'center',
    minWidth: 38,
  },
  badgeQtdNumero: {
    fontWeight: '800',
  },
  badgeQtdRotulo: {
    fontWeight: '600',
  },

  // Estilos de Card de Lote e Locais
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
    minHeight: 48,
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

  // Modal de Seleção de Lotes e Feedback
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    elevation: 6,
    overflow: 'hidden',
  },
  modalCapaContainer: {
    width: '100%',
    height: 140,
    position: 'relative',
    backgroundColor: '#F1F5F9',
  },
  modalProdutoFotoCapa: {
    width: '100%',
    height: '100%',
  },
  modalCloseBtnAbsolute: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    elevation: 4,
  },
  modalConteudoBox: {
    padding: 16,
    paddingTop: 12,
  },
  modalProdutoNomeCenter: {
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 2,
  },
  modalProdutoMetaCenter: {
    textAlign: 'center',
    marginBottom: 12,
  },
  modalLotesTitulo: {
    fontWeight: '700',
    marginBottom: 6,
  },
  loteCardItem: {
    borderWidth: 1.5,
    borderRadius: 8,
    padding: 8,
    marginBottom: 6,
  },
  loteLinhaTopo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  loteCodigo: {
    fontWeight: '700',
  },
  loteQtd: {
    fontWeight: '800',
  },
  loteLocal: {
    marginTop: 2,
  },
  loteValidade: {
    marginTop: 2,
  },
});