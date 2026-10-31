// src/styles/home.styles.ts
import { StyleSheet, Platform } from 'react-native';

export const estilosHome = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 85,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  subSaudacao: {
    fontWeight: '600',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  saudacaoPrincipal: {
    fontWeight: '700',
    marginTop: 1,
  },
  avatarWrapper: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F1F5F9',
    borderWidth: 2,
    borderColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 42,
    height: 42,
  },
  
  // Card de Totais
  totalCard: {
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    elevation: 2,
  },
  totalTextoContainer: {
    flex: 1,
    paddingRight: 8,
  },
  totalCardLabel: {
    color: '#E0E7FF',
    fontWeight: '600',
  },
  totalCardValue: {
    color: '#FFFFFF',
    fontWeight: '800',
    marginTop: 2,
  },
  totalBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    flexShrink: 0,
    alignSelf: 'center',
  },
  totalBadgeText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // Alerta FEFO Compacto
  alertaAcolhedor: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 14,
    width: '100%',
  },
  alertaAcolhedorIcone: {
    marginRight: 6,
  },
  alertaAcolhedorTextoLinha: {
    flex: 1,
    fontWeight: '500',
  },

  // Buscas e Filtros
  searchSection: {
    marginBottom: 12,
    width: '100%',
  },
  searchHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  sectionTitle: {
    fontWeight: '700',
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
    paddingVertical: 4,
    borderRadius: 6,
  },
  toggleBtnActive: {
    backgroundColor: '#FFFFFF',
    elevation: 1,
  },
  searchBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inputSearchWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1.5,
    paddingHorizontal: 10,
    height: 42,
  },
  searchInput: {
    flex: 1,
  },
  btnBuscaAvancada: {
    width: 42,
    height: 42,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Gaveta de Filtros
  gavetaFiltros: {
    marginTop: 8,
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 12,
    gap: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  linhaFiltro: {
    gap: 4,
  },
  labelFiltro: {
    fontWeight: '600',
  },
  botoesWrapRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chipCategoria: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 9,
  },
  chipCategoriaAtivo: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  chipCategoriaTexto: {
    color: '#334155',
    fontWeight: '600',
  },
  chipCategoriaTextoAtivo: {
    color: '#FFFFFF',
  },
  chipOrdenacaoFixo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
    width: '48.5%', 
    height: 44,
  },
  chipOrdenacaoTexto: {
    fontWeight: '600',
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
  },
  listaFoto: {
    width: 46,
    height: 46,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  tituloComAlertaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
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
  },
  gridFoto: {
    width: '100%',
    height: 60,
    backgroundColor: '#F1F5F9',
  },
  gridConteudo: {
    padding: 5,
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
    paddingHorizontal: 3,
    paddingVertical: 1,
  },
  gridQtdText: {
    fontWeight: '800',
  },
  gridLotesText: {
    fontWeight: '500',
  },
  gridTitulo: {
    fontWeight: '700',
    lineHeight: 13,
  },

  // Estados Vazios
  emptyBox: {
    padding: 20,
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
    width: '100%',
  },
  emptyTitle: {
    fontWeight: '700',
    marginTop: 4,
  },
  emptySubtitle: {
    marginTop: 2,
  },
  loadingBox: {
    paddingVertical: 28,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 6,
    fontWeight: '600',
  },

  // Modal de Detalhes - REFATORAÇÃO CAPA GRANDE
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
    overflow: 'hidden', // Importante para as bordas da imagem no topo
  },
  // Capa Flutuante
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
    backgroundColor: 'rgba(255, 255, 255, 0.85)', // Fundo translúcido branco para contraste
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    elevation: 4,
  },
  // Conteúdo do Modal
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

  // Menu Hambúrguer
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  menuSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    maxHeight: '80%',
  },
  menuDragBar: {
    width: 36,
    height: 4,
    backgroundColor: '#CBD5E1',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 10,
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  menuTitulo: {
    fontWeight: '800',
  },
  menuItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 8,
  },
  menuItemIconBox: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  menuItemTexto: {
    flex: 1,
    fontWeight: '600',
  },

  // Barra Inferior Global
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 64,
    borderTopWidth: 1.5,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 6,
    elevation: 8,
  },
  bottomTabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  tabIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 1,
  },
  tabRotulo: {
    marginTop: 1,
  },
});