import { StyleSheet } from 'react-native';

export const estilosNotificationsConfig = StyleSheet.create({
  container: {
    flex: 1,
  },
  rolagem: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  cabecalho: {
    marginBottom: 20,
  },
  titulo: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitulo: {
    lineHeight: 20,
  },
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
});
