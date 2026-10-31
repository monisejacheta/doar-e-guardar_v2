// src/styles/reports-movements.styles.ts
import { StyleSheet } from 'react-native';

export const estilosReportsMove = StyleSheet.create({
  container: {
    flex: 1,
  },
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

  // Busca e Filtros
  searchBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
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
    fontWeight: '600',
  },
  gavetaFiltros: {
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  labelFiltro: {
    fontWeight: '700',
    marginBottom: 8,
  },
  botoesWrapRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chipFiltro: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1.5,
    minHeight: 38,
  },
  chipFiltroTexto: {
    fontWeight: '700',
    marginLeft: 6,
  },

  // Cards da Linha do Tempo (Timeline Padrão Doar&Guardar)
  cardMovimentacao: {
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
  },
  linhaTopoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
  },
  identificadorOperacao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconeOperacaoBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  textoOperacao: {
    fontWeight: '800',
  },
  textoDataHora: {
    fontWeight: '700',
  },

  // Detalhes do Produto no Card
  linhaProdutoCard: {
    marginBottom: 10,
  },
  textoNomeProduto: {
    fontWeight: '800',
    marginBottom: 2,
    lineHeight: 18,
  },
  textoLoteLocal: {
    fontWeight: '600',
  },

  // Resumo Quantidade (Rodapé)
  linhaRodapeCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  caixaResponsavel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  textoResponsavel: {
    fontWeight: '600',
  },
  caixaQuantidade: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  textoQuantidade: {
    fontWeight: '800',
  },

  // Estados Vazios (Loading e Sem Registro)
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    marginTop: 10,
  },
  emptyTitle: {
    fontWeight: '800',
    marginTop: 12,
    marginBottom: 4,
  },
  emptySubtitle: {
    textAlign: 'center',
    lineHeight: 18,
    fontWeight: '600',
  },
});