// src/styles/audit.styles.ts
import { StyleSheet } from 'react-native';

export const estilosAudit = StyleSheet.create({
  container: { flex: 1 },
  rolagem: {
    paddingHorizontal: 16,
    paddingTop: 14,
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
    fontWeight: '800',
    marginBottom: 2,
    letterSpacing: -0.3,
  },
  subtitulo: {
    lineHeight: 18,
    fontWeight: '500',
  },

  // Card Termômetro de Saúde
  cardSaude: {
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
  },
  indicadorBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    marginRight: 14,
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
    marginBottom: 2,
  },
  subtituloSaude: {
    lineHeight: 16,
    fontWeight: '500',
  },

  // Ações Principais
  botaoAuditoria: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 20,
    elevation: 2,
  },
  botaoAuditoriaTexto: {
    fontWeight: '800',
    marginLeft: 8,
  },

  // Lista de Logs de Ajuste
  tituloSecaoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  tituloSecao: {
    fontWeight: '800',
    marginLeft: 6,
  },
  cardLog: {
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    elevation: 1,
  },
  linhaTopoLog: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  badgeAjuste: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeAjusteTexto: {
    fontWeight: '800',
    marginLeft: 4,
  },
  textoDataLog: {
    fontWeight: '600',
  },
  textoProdutoLog: {
    fontWeight: '800',
    marginBottom: 2,
  },
  textoMetadadosLog: {
    fontWeight: '600',
    marginBottom: 8,
  },
  caixaComparacao: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  textoComparacao: {
    fontWeight: '700',
  },
  rodapeLog: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textoResponsavelLog: {
    fontWeight: '600',
    marginLeft: 4,
  },

  // Modais de Busca e Ajuste
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
    padding: 20,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitulo: {
    fontWeight: '900',
  },
  inputBuscaModal: {
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemListaLote: {
    borderWidth: 1.5,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  linhaLoteModal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  textoLoteModal: {
    fontWeight: '700',
  },
  textoQtdModal: {
    fontWeight: '800',
  },
  boxInfoAtual: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    marginBottom: 16,
    alignItems: 'center',
  },
  emptyBox: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 12,
    borderWidth: 1.5,
  },
});