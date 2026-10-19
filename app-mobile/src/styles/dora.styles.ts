// src/styles/dora.styles.ts
import { StyleSheet } from 'react-native';

export const estilosDora = StyleSheet.create({
  container: {
    flex: 1,
  },
  rolagem: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 24,
  },
  cabecalho: {
    marginBottom: 12,
  },
  titulo: {
    fontWeight: 'bold',
    marginBottom: 2,
  },
  subtitulo: {
    lineHeight: 18,
  },
  // Chaves de retrocompatibilidade
  cartaoPrincipal: {
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  textoInformativo: {
    lineHeight: 20,
    marginBottom: 10,
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
  },
  // Estilos específicos da Tela 05 (Dora)
  faixaExemplos: {
    marginBottom: 14,
  },
  rotuloExemplos: {
    fontWeight: 'bold',
    marginBottom: 6,
  },
  gradePilulas: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pilulaSugestao: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    minHeight: 48, // Touch target >= 48px (WCAG AAA)
    justifyContent: 'center',
  },
  textoPilula: {
    fontWeight: '600',
    fontSize: 12,
  },
  balaoMensagem: {
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    maxWidth: '92%',
  },
  cabecalhoBalao: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 6,
  },
  autorBalao: {
    fontWeight: 'bold',
  },
  textoMensagem: {
    lineHeight: 21,
  },
  cartaoReceita: {
    marginTop: 10,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  tituloReceita: {
    fontWeight: 'bold',
    marginBottom: 6,
  },
  topicoReceita: {
    lineHeight: 19,
    marginBottom: 6,
  },
  linkFonte: {
    fontWeight: 'bold',
    textDecorationLine: 'underline',
    marginTop: 4,
  },
  barraInferiorChat: {
    padding: 12,
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  botaoVoz: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  botaoEnviar: {
    height: 48,
    paddingHorizontal: 16,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
});