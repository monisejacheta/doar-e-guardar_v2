// src/styles/dora.styles.ts
import { StyleSheet } from 'react-native';

export const estilosDora = StyleSheet.create({
  container: {
    flex: 1,
  },
  rolagem: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 28,
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
    borderRadius: 20,
    paddingHorizontal: 16,
    minHeight: 46,
  },
  // Faixa de sugestões rápidas
  faixaExemplos: {
    marginBottom: 14,
  },
  rotuloExemplos: {
    fontWeight: '700',
    marginBottom: 8,
  },
  gradePilulas: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pilulaSugestao: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 18,
    borderWidth: 1.5,
    minHeight: 40,
    justifyContent: 'center',
  },
  textoPilula: {
    fontWeight: '600',
    fontSize: 12,
  },
  // Linha de conversa com Avatar + Balão
  linhaMensagem: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 14,
    gap: 8,
    width: '100%',
  },
  linhaMensagemDora: {
    justifyContent: 'flex-start',
  },
  linhaMensagemUsuario: {
    justifyContent: 'flex-end',
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    flexShrink: 0,
  },
  avatarImagem: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  indicadorOnline: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: '#16A34A',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  balaoMensagem: {
    borderWidth: 1.5,
    borderRadius: 18,
    padding: 13,
    maxWidth: '81%',
    flexShrink: 1,
  },
  cabecalhoBalao: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 5,
    gap: 8,
  },
  autorBalao: {
    fontWeight: '800',
  },
  horarioBalao: {
    fontSize: 10,
    opacity: 0.7,
  },
  textoMensagem: {
    lineHeight: 21,
  },
  // Card de Receita Culinária Verdadeira
  cartaoReceita: {
    marginTop: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  tituloReceita: {
    fontWeight: '800',
    marginBottom: 4,
  },
  topicoReceita: {
    lineHeight: 19,
    marginBottom: 8,
  },
  linkFonte: {
    fontWeight: '700',
    textDecorationLine: 'underline',
    marginTop: 4,
  },
  // Card de Predição de Consumo (Machine Learning)
  cartaoPredicoes: {
    marginTop: 10,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  itemPredicao: {
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  // Barra inferior de chat
  barraInferiorChat: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  botaoVoz: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  botaoEnviar: {
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
});
