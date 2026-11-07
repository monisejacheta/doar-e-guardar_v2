// src/styles/diagnostic.styles.ts
import { StyleSheet } from 'react-native';

export const estilosDiagnostic = StyleSheet.create({
  container: { flex: 1 },
  rolagem: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },
  cabecalho: { marginBottom: 16 },
  titulo: { fontWeight: 'bold', marginBottom: 4 },
  subtitulo: { lineHeight: 20 },
  // Chaves de retrocompatibilidade
  cartaoPrincipal: { borderWidth: 1.5, borderRadius: 14, padding: 16, marginBottom: 16 },
  textoInformativo: { lineHeight: 22, marginBottom: 14 },
  areaAcao: { marginTop: 8, width: '100%' },
  campoDigitacao: { borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14, minHeight: 48, marginBottom: 12 },
  // Estilos específicos da Tela 09
  cartaoStatus: {
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 68,
  },
  infoComponente: { flex: 1, paddingRight: 10 },
  nomeComponente: { fontWeight: 'bold', marginBottom: 2 },
  detalheComponente: { fontSize: 12 },
  badgeSaude: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    minWidth: 95,
    alignItems: 'center',
  },
  textoBadgeSaude: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 11 },
});