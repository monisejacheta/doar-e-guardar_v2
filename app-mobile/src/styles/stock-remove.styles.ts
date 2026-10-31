// src/styles/stock-remove.styles.ts
import { StyleSheet } from 'react-native';

export const estilosStockRemove = StyleSheet.create({
  container: { flex: 1 },
  rolagem: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 100 },
  
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

  cabecalho: { marginBottom: 16, paddingHorizontal: 4 },
  titulo: { fontWeight: 'bold', marginBottom: 4 },
  subtitulo: { lineHeight: 20 },
  
  // Busca
  searchBarRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  inputSearchWrapper: { flex: 1, flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, height: 48 },
  searchInput: { flex: 1, marginLeft: 8 },

  // Estilos de Card (Modo Lista)
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
  produtoNome: { fontWeight: '700' },
  produtoMeta: { marginTop: 1 },
  produtoSub: { fontWeight: '600', marginTop: 2 },
  
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
  badgeQtdNumero: { fontWeight: '800' },
  badgeQtdRotulo: { fontWeight: '600' },

  // Modais de Seleção e Saída
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
  
  // Capa do Modal (Imagem)
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
  
  // Conteúdo Abaixo da Capa
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
  modalLotesTitulo: { fontWeight: '700', marginBottom: 6 },
  
  // Card do Lote (FEFO)
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
  loteCodigo: { fontWeight: '700' },
  loteQtd: { fontWeight: '800' },
  loteLocal: { marginTop: 2 },
  loteValidadeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    padding: 4,
    borderRadius: 6,
    marginTop: 6,
  },
  loteValidadeTexto: {
    fontWeight: '700',
    marginLeft: 6,
  },

  // Modal de Formulário de Saída
  labelForm: { fontWeight: 'bold', marginBottom: 6, marginTop: 12 },
  gradeMotivos: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  botaoMotivo: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1.5,
    borderRadius: 10,
    justifyContent: 'center',
  },
  textoMotivo: { fontWeight: '600', fontSize: 12 },

  blocoTravaPerda: {
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 14,
    marginTop: 10,
    marginBottom: 16,
  },
  textoAvisoPerda: { fontWeight: 'bold', marginBottom: 6 },
  instrucaoPerda: { fontSize: 12, lineHeight: 18, marginBottom: 10 },
});