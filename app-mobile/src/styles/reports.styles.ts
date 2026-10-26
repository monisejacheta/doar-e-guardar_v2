// src/styles/reports.styles.ts
import { StyleSheet } from 'react-native';

export const estilosReports = StyleSheet.create({
  container: { flex: 1 },
  rolagem: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },
  cabecalho: { marginBottom: 16 },
  titulo: { fontWeight: 'bold', marginBottom: 4 },
  subtitulo: { lineHeight: 20 },
  
  secaoCard: { borderWidth: 1.5, borderRadius: 14, padding: 16, marginBottom: 18 },
  tituloSecao: { fontWeight: 'bold', marginBottom: 12 },
  
  linhaGraficos: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  botaoTipoGrafico: {
    flex: 1,
    minWidth: '45%',
    minHeight: 48, // Touch target mínimo de 48px[cite: 7]
    borderWidth: 1,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  
  // Base segura para gráficos nativos
  areaGraficoSegura: { marginTop: 10, minHeight: 180, justifyContent: 'center' },
  
  // Grade de atalhos (2 por linha)
  gradeBotoes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 12,
  },
  miniCard: {
    width: '48%', // Garante 2 por linha
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    minHeight: 100, // Menor e mais compacto
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniCardIcone: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  miniCardTitulo: {
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 16,
  }
});