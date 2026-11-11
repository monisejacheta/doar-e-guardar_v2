import { StyleSheet } from 'react-native';

export const estilosRelatorios = StyleSheet.create({
  container: {
    flex: 1,
  },
  conteudoScroll: {
    padding: 20,
    paddingBottom: 110,
  },
  cabecalho: {
    marginBottom: 16,
  },
  tituloPagina: {
    fontWeight: '800',
  },
  subtituloPagina: {
    marginTop: 4,
    fontWeight: '500',
  },
  cartaoProporcao: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  donutContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
    position: 'relative',
  },
  donutCentroOverlay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutTotalValor: {
    fontWeight: '900',
  },
  donutTotalLabel: {
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  barraEmpilhada: {
    height: 18,
    borderRadius: 9,
    overflow: 'hidden',
    flexDirection: 'row',
    marginTop: 12,
    marginBottom: 18,
  },
  legendaLista: {
    gap: 10,
  },
  legendaLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
  },
  legendaEsquerda: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
    marginRight: 8,
  },
  pontoCor: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  nomeCategoria: {
    fontWeight: '700',
    flex: 1,
  },
  valoresDireita: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  percentualTexto: {
    fontWeight: '800',
  },
  quantidadeTexto: {
    fontWeight: '600',
  },
  estadoVazio: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
});
