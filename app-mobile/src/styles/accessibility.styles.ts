// src/styles/accessibility.styles.ts
import { StyleSheet } from 'react-native';

export const estilosAccessibility = StyleSheet.create({
  container: {
    flex: 1,
  },
  rolagem: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  cabecalho: {
    marginBottom: 18,
  },
  titulo: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitulo: {
    lineHeight: 20,
  },
  // Chaves de retrocompatibilidade
  cartaoPrincipal: {
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  textoInformativo: {
    lineHeight: 22,
    marginBottom: 14,
  },
  areaAcao: {
    marginTop: 8,
    width: '100%',
  },
  campoDigitacao: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    minHeight: 48,
    marginBottom: 12,
  },
  // Estilos específicos da Tela 02.3
  secaoCard: {
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  tituloSecao: {
    fontWeight: 'bold',
    marginBottom: 6,
  },
  descricaoSecao: {
    marginBottom: 14,
    lineHeight: 18,
  },
  linhaBotoesEscala: {
    flexDirection: 'row',
    gap: 10,
  },
  botaoEscala: {
    flex: 1,
    minHeight: 52, // Touch target >= 48px (WCAG AAA)
    borderWidth: 1.5,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
  },
  textoBotaoEscala: {
    fontWeight: 'bold',
  },
  gradeModosVisuais: {
    gap: 10,
  },
  botaoModoVisual: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 54,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  textoModoVisual: {
    fontWeight: '700',
  },
  linhaSwitch: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 54,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  infoSwitch: {
    flex: 1,
    paddingRight: 12,
  },
  tituloSwitch: {
    fontWeight: 'bold',
    marginBottom: 2,
  },
});