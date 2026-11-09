// src/utils/imageUtils.ts
import { ImageSourcePropType } from 'react-native';

declare const require: any;

const PLACEHOLDERS = {
  laticinios: require('../../assets/images/placeholder_laticinios.png'),
  graos: require('../../assets/images/placeholder_graos.png'),
  massas: require('../../assets/images/placeholder_massas.png'),
  oleos: require('../../assets/images/placeholder_oleos.png'),
  geral: require('../../assets/images/placeholder_geral.png'),
};

/**
 * Retorna exclusivamente os assets locais de placeholder contidos em app-mobile/assets/images,
 * mapeados pela categoria do alimento.
 */
export function obterPlaceholderLocalPorCategoria(categoria?: string): ImageSourcePropType {
  const cat = (categoria || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  if (cat.includes('lati') || cat.includes('leite') || cat.includes('queijo') || cat.includes('iogurte') || cat.includes('manteiga')) {
    return PLACEHOLDERS.laticinios;
  }
  if (
    cat.includes('grao') ||
    cat.includes('arroz') ||
    cat.includes('feij') ||
    cat.includes('cereal') ||
    cat.includes('lentilha') ||
    cat.includes('milho') ||
    cat.includes('farinha')
  ) {
    return PLACEHOLDERS.graos;
  }
  if (
    cat.includes('massa') ||
    cat.includes('macarr') ||
    cat.includes('padaria') ||
    cat.includes('trigo') ||
    cat.includes('biscoito') ||
    cat.includes('pao') ||
    cat.includes('bolo')
  ) {
    return PLACEHOLDERS.massas;
  }
  if (
    cat.includes('oleo') ||
    cat.includes('azeite') ||
    cat.includes('gordura') ||
    cat.includes('tempero') ||
    cat.includes('condimento') ||
    cat.includes('sal') ||
    cat.includes('molho')
  ) {
    return PLACEHOLDERS.oleos;
  }

  return PLACEHOLDERS.geral;
}

/**
 * Resolve a imagem de exibição do produto:
 * - Filtra e remove qualquer placeholder remoto da AWS / S3 ou gerado externamente.
 * - Utiliza estritamente os placeholders locais oficiais do aplicativo (app-mobile/assets/images).
 * - Aceita fotos reais externas customizadas (quando não forem placeholders da AWS).
 */
export function resolverFotoProduto(fotoUrl?: string | null, categoria?: string): ImageSourcePropType {
  const local = obterPlaceholderLocalPorCategoria(categoria);
  if (!fotoUrl || typeof fotoUrl !== 'string') {
    return local;
  }

  const urlLimpa = fotoUrl.trim().toLowerCase();

  // Detecta URLs de placeholder da AWS / S3 ou genéricas externas
  const ehPlaceholderRemoto =
    urlLimpa.includes('placeholder') ||
    urlLimpa.includes('via.placeholder') ||
    urlLimpa.includes('dummyimage') ||
    urlLimpa.includes('s3.amazonaws.com') ||
    urlLimpa.includes('.s3.') ||
    urlLimpa.includes('default-image') ||
    urlLimpa.includes('sem-foto') ||
    urlLimpa.includes('no-image') ||
    !urlLimpa.startsWith('http');

  if (ehPlaceholderRemoto) {
    return local;
  }

  return { uri: fotoUrl.trim() };
}
