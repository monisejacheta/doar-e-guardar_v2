// src/styles/stock.styles.ts
import { StyleSheet } from 'react-native';

export const estilosEstoque = StyleSheet.create({
  container: {
    flex: 1,
  },
  cabecalhoFixo: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
  },
  areaBusca: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 12,
    minHeight: 48, // Regra WCAG: touch target
    marginBottom: 10,
  },
  campoBusca: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  gradeBotoesAcao: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  botaoAcaoEstoque: {
    flex: 1,
    minWidth: '47%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderWidth: 1.5,
    borderRadius: 10,
    minHeight: 48,
  },
  iconeAcao: {
    fontSize: 18,
    marginRight: 8,
  },
  textoAcao: {
    fontWeight: '700',
  },
  rolagemLista: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
  },
  tituloSecao: {
    fontWeight: 'bold',
    marginBottom: 10,
  },
  cartaoProduto: {
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 76,
  },
  areaIconeProduto: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconeProduto: {
    fontSize: 22,
  },
  infoProduto: {
    flex: 1,
  },
  nomeProduto: {
    fontWeight: '700',
    marginBottom: 2,
  },
  detalhesProduto: {
    lineHeight: 16,
  },
  resumoQuantidade: {
    alignItems: 'flex-end',
    marginLeft: 10,
  },
  valorQuantidade: {
    fontWeight: 'bold',
  },
  alertaVencimento: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  textoAlerta: {
    fontWeight: '600',
    fontSize: 11,
  },
  listaVazia: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
});