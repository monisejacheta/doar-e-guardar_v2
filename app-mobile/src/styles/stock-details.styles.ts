import { StyleSheet } from 'react-native';

export const estilosStockDetails = StyleSheet.create({
  container: { flex: 1 },
  rolagem: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
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
  cabecalho: {
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  titulo: {
    fontWeight: '900',
    marginBottom: 4,
  },
  subtitulo: {
    lineHeight: 20,
    fontWeight: '500',
  },
  
  // Busca e Toggles
  searchBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  inputSearchWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontWeight: '500',
  },
  toggleGroup: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    padding: 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  toggleBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
  },
  toggleBtnActive: {
    backgroundColor: '#FFFFFF',
    elevation: 1,
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

  // Modo Grid
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    width: '100%',
  },
  gridCard: {
    borderRadius: 10,
    borderWidth: 1.5,
    overflow: 'hidden',
    elevation: 1,
    marginBottom: 8,
  },
  gridFoto: {
    width: '100%',
    height: 70,
    backgroundColor: '#F1F5F9',
  },
  gridConteudo: {
    padding: 6,
  },
  gridBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  gridQtdBadge: {
    backgroundColor: '#EFF6FF',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  gridQtdText: {
    fontWeight: '800',
  },
  gridLotesText: {
    fontWeight: '500',
  },
  gridTitulo: {
    fontWeight: '700',
    lineHeight: 14,
  },

  // Modal de Detalhes com Foto em Capa
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
    height: 160,
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
  modalResumoBox: {
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    alignItems: 'center',
  },
  modalResumoTexto: {
    fontWeight: '600',
    textAlign: 'center',
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
  modalBtnPrimario: {
    minHeight: 42,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  modalBtnTexto: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});