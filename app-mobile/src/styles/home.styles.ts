// src/styles/home.styles.ts
import { StyleSheet } from 'react-native';

export const estilosHome = StyleSheet.create({
  container: {
    flex: 1,
  },
  barraSuperior: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  perfilResumo: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48, // Touch target acessível
  },
  avatarPequeno: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  saudacaoNome: {
    fontWeight: 'bold',
  },
  rotuloFuncao: {
    fontWeight: '500',
  },
  acoesTopo: {
    flexDirection: 'row',
    gap: 8,
  },
  botaoIconeTopo: {
    width: 48,
    height: 48,
    borderWidth: 1.5,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  badgeNotificacao: {
    position: 'absolute',
    top: 6,
    right: 6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  textoBadge: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 10,
  },
  rolagem: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  secaoResumo: {
    marginBottom: 20,
  },
  secaoTitulo: {
    fontWeight: 'bold',
    marginBottom: 12,
  },
  linhaResumos: {
    flexDirection: 'row',
    gap: 12,
  },
  cartaoResumoPequeno: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 12,
    minHeight: 88,
    justifyContent: 'space-between',
  },
  cabecalhoResumo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  valorResumo: {
    fontWeight: 'bold',
    marginTop: 6,
  },
  legendaResumo: {
    fontWeight: '600',
    marginTop: 2,
  },
  blocoDestaqueDora: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    minHeight: 80,
  },
  iconeDora: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  conteudoDora: {
    flex: 1,
  },
  tituloDora: {
    fontWeight: 'bold',
    marginBottom: 2,
  },
  descricaoDora: {
    lineHeight: 18,
  },
});