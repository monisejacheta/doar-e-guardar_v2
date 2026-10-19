// src/styles/stock-remove.styles.ts
import { StyleSheet } from 'react-native';

export const estilosStockRemove = StyleSheet.create({
  container: {
    flex: 1,
  },
  rolagem: {
    paddingHorizontal: 20,
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
  cartaoLote: {
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 52, // Touch target acessível
  },
  infoLote: {
    flex: 1,
  },
  nomeLote: {
    fontWeight: 'bold',
  },
  detalheLote: {
    fontSize: 12,
    marginTop: 2,
  },
  saldoLote: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  alertaFefo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginVertical: 10,
  },
  textoAlertaFefo: {
    marginLeft: 8,
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  gradeMotivos: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  botaoMotivo: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1.5,
    borderRadius: 10,
    minHeight: 48,
    justifyContent: 'center',
  },
  textoMotivo: {
    fontWeight: '600',
    fontSize: 13,
  },
  blocoTravaPerda: {
    borderWidth: 2,
    borderRadius: 12,
    padding: 14,
    marginTop: 10,
    marginBottom: 16,
  },
  textoAvisoPerda: {
    fontWeight: 'bold',
    marginBottom: 6,
  },
  instrucaoPerda: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 10,
  },
  campoDigitacao: {
    borderWidth: 1.5,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    minHeight: 48,
    marginBottom: 16,
  },
});