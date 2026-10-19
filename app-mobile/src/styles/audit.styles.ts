// src/styles/audit.styles.ts
import { StyleSheet } from 'react-native';

export const estilosAudit = StyleSheet.create({
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
  // Estilos específicos da Tela 07
  gradeAtalhos: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 },
  botaoAtalho: {
    flex: 1,
    minWidth: '46%',
    minHeight: 48, // Touch target WCAG AAA
    borderWidth: 1.5,
    borderRadius: 10,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartaoLog: {
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  topoLog: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
});