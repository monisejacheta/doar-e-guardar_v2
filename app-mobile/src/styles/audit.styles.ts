import { StyleSheet } from 'react-native';

export const estilosAudit = StyleSheet.create({
  container: {
    flex: 1,
  },
  rolagem: {
    padding: 20,
    paddingBottom: 110,
  },
  botaoVoltar: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    minHeight: 48,
    minWidth: 48,
    marginBottom: 8,
  },
  textoBotaoVoltar: {
    fontWeight: '700',
    marginLeft: 8,
  },
  cabecalho: {
    marginBottom: 16,
  },
  titulo: {
    fontWeight: '800',
  },
  subtitulo: {
    marginTop: 4,
    lineHeight: 19,
  },
  cardSaude: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 14,
    marginBottom: 16,
    gap: 14,
  },
  indicadorBox: {
    width: 66,
    height: 66,
    borderRadius: 33,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  indicadorTexto: {
    fontWeight: '900',
    fontSize: 16,
  },
  textoSaudeContainer: {
    flex: 1,
  },
  tituloSaude: {
    fontWeight: '800',
  },
  subtituloSaude: {
    marginTop: 3,
    lineHeight: 16,
  },
  botaoAuditoria: {
    minHeight: 48,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 14,
  },
  botaoAuditoriaTexto: {
    fontWeight: '800',
  },
  gradeAtalhos: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 20,
  },
  cardAtalho: {
    width: '48%',
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  tituloSecaoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  tituloSecao: {
    fontWeight: '800',
  },
  emptyBox: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 26,
    alignItems: 'center',
  },
  emptyTitle: {
    fontWeight: '800',
    marginTop: 10,
  },
  emptySubtitle: {
    marginTop: 4,
    textAlign: 'center',
  },
  // Linha do Tempo Cronológica
  timelineItemRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  timelineRailCol: {
    width: 42,
    alignItems: 'center',
  },
  timelineNodeCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  timelineLine: {
    flex: 1,
    width: 2,
    marginTop: 2,
    marginBottom: 2,
  },
  timelineCardCol: {
    flex: 1,
    paddingBottom: 14,
    paddingLeft: 8,
  },
  cardTimeline: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 13,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
  },
  linhaTopoLog: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 6,
  },
  badgeTipoAcao: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeTipoTexto: {
    fontWeight: '800',
  },
  textoDataLog: {
    fontWeight: '600',
  },
  textoTituloEvento: {
    fontWeight: '800',
    marginBottom: 3,
  },
  textoMetadadosLog: {
    lineHeight: 17,
  },
  rodapeLog: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  textoResponsavelLog: {
    fontWeight: '600',
    flex: 1,
  },
  // Modais
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    padding: 18,
  },
  modalCard: {
    borderRadius: 18,
    padding: 18,
    maxHeight: '88%',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  modalTitulo: {
    fontWeight: '800',
  },
  botaoFecharModal: {
    minWidth: 48,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputBuscaModal: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    marginVertical: 10,
  },
  itemListaLote: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 8,
  },
  linhaLoteModal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 3,
  },
  textoLoteModal: {
    fontWeight: '800',
  },
  textoQtdModal: {
    fontWeight: '800',
  },
  boxInfoAtual: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    alignItems: 'center',
    marginBottom: 14,
  },
});
