// src/styles/reports-stock.styles.ts
import { StyleSheet } from 'react-native';

export const estilosReportsStock = StyleSheet.create({
  container: { flex: 1 },
  rolagem: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 },
  
  // Novo Botão de Voltar
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
  
  secaoCard: { borderWidth: 1, borderRadius: 14, padding: 16, marginBottom: 16 },
  tituloSecaoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  tituloSecao: { fontWeight: 'bold' },
  
  btnToggleMetrica: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  btnToggleTexto: { fontSize: 11, fontWeight: '700', marginLeft: 6 },
  
  // Gráfico de Barras
  barraContainer: { gap: 10 },
  linhaBarra: { gap: 4 },
  rotuloBarraRow: { flexDirection: 'row', justifyContent: 'space-between' },
  rotuloBarraTexto: { fontWeight: '600' },
  rotuloBarraValor: { fontWeight: 'bold' },
  trilhoBarra: { height: 10, borderRadius: 5, overflow: 'hidden', width: '100%' },
  preenchimentoBarra: { height: '100%', borderRadius: 5 },
  
  // Filtros Avançados
  searchBarRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  inputSearchWrapper: { flex: 1, flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, height: 48 },
  searchInput: { flex: 1, marginLeft: 8 },
  btnBuscaAvancada: { width: 48, height: 48, borderRadius: 12, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  
  gavetaFiltros: { borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 16 },
  labelSecaoFiltro: { fontWeight: 'bold', marginBottom: 8 },
  scrollCategoriasContainer: { gap: 8, paddingBottom: 4 },
  chipCategoria: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, flexDirection: 'row', alignItems: 'center' },
  
  botoesWrapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chipOrdenacaoFixo: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1 },
  
  btnFiltroMinimo: { flexDirection: 'row', alignItems: 'center', marginTop: 12, paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1, borderRadius: 10 },
  textoFiltroMinimo: { marginLeft: 8, fontWeight: '700', fontSize: 12 },

  // Lista Contínua Minimalista
  tabelaContainer: { 
    borderWidth: 1, 
    borderRadius: 12, 
    overflow: 'hidden', 
    marginBottom: 12 
  },
  
  produtoHeaderMinimalista: { 
    paddingHorizontal: 12, 
    paddingTop: 14, 
    paddingBottom: 8,
  },
  produtoNomeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  produtoNome: { fontWeight: 'bold', flex: 1 },
  iconeAvisoEstoque: { marginLeft: 6 },
  produtoSub: { fontSize: 11, fontWeight: '500' },
  
  // Estilos da linha do lote
  loteContainer: {
    paddingVertical: 10, 
    paddingHorizontal: 12, 
    borderBottomWidth: 1,
  },
  linhaLocal: {
    marginBottom: 6,
  },
  textoLocal: {
    fontSize: 12,
    fontWeight: '700'
  },
  linhaLoteValidade: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  textoLoteValidade: {
    fontSize: 11,
    fontWeight: '500'
  }
});