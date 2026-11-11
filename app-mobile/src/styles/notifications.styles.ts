import { StyleSheet } from 'react-native';

export const estilosNotificacoes = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerEsquerda: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  botaoIcone: {
    minWidth: 48,
    minHeight: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tituloWrapper: {
    flex: 1,
  },
  titulo: {
    fontWeight: '800',
  },
  subtitulo: {
    fontWeight: '500',
    marginTop: 2,
  },
  scrollConteudo: {
    padding: 16,
    paddingBottom: 110,
    gap: 12,
  },
  cardNotificacao: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 14,
    borderWidth: 1,
    borderLeftWidth: 4,
    paddingVertical: 12,
    paddingLeft: 12,
    paddingRight: 4,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  iconeTipoBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  conteudoCard: {
    flex: 1,
  },
  topoCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 4,
  },
  badgeTipo: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeTipoTexto: {
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  dataTexto: {
    fontWeight: '600',
  },
  tituloCard: {
    fontWeight: '800',
    marginBottom: 3,
  },
  mensagemCard: {
    lineHeight: 19,
  },
  botaoDismiss: {
    minWidth: 48,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  estadoVazio: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 28,
    alignItems: 'center',
    marginTop: 18,
  },
  botaoRestaurar: {
    minHeight: 48,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
});
