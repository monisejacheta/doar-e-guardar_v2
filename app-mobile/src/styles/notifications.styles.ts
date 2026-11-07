// src/app/notifications.styles.ts
import { StyleSheet } from 'react-native';

export const estilosNotificacoes = StyleSheet.create({
  container: {
    flex: 1,
  },
  barraAcoesTopo: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  textoContador: {
    fontWeight: 'bold',
  },
  botaoConfigurar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1.5,
    borderRadius: 8,
    minHeight: 48, // Touch target acessível
  },
  textoBotaoConfig: {
    fontWeight: '700',
    marginLeft: 6,
  },
  rolagem: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  cartaoAviso: {
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  cabecalhoAviso: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  areaIcone: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  iconeTexto: {
    fontSize: 18,
  },
  tituloAviso: {
    fontWeight: 'bold',
    flex: 1,
  },
  pontoNaoLido: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginLeft: 6,
  },
  mensagemAviso: {
    lineHeight: 20,
    marginBottom: 8,
  },
  rodapeAviso: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: 8,
    marginTop: 4,
  },
  dataHora: {
    fontWeight: '500',
  },
  textoLink: {
    fontWeight: '700',
  },
  areaVazia: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  textoVazio: {
    textAlign: 'center',
    marginTop: 8,
  },
});