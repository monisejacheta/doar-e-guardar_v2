/**
 * Utilitários compartilhados de validação, formatação e conversão de datas (DD/MM/AAAA e ISO YYYY-MM-DD).
 * Inclui trava de segurança para detectar produtos com data de validade vencida.
 */

export function formatarInputDataDDMMAAAA(valor: string): string {
  const apenasDigitos = (valor || '').replace(/\D/g, '').slice(0, 8);
  if (apenasDigitos.length <= 2) return apenasDigitos;
  if (apenasDigitos.length <= 4) return `${apenasDigitos.slice(0, 2)}/${apenasDigitos.slice(2)}`;
  return `${apenasDigitos.slice(0, 2)}/${apenasDigitos.slice(2, 4)}/${apenasDigitos.slice(4, 8)}`;
}

export function obterHojeLocalZerado(): Date {
  const agora = new Date();
  return new Date(agora.getFullYear(), agora.getMonth(), agora.getDate(), 0, 0, 0, 0);
}

export function formatarDataDDMMAAAA(data: Date): string {
  const d = String(data.getDate()).padStart(2, '0');
  const m = String(data.getMonth() + 1).padStart(2, '0');
  const a = String(data.getFullYear());
  return `${d}/${m}/${a}`;
}

export function formatarDataIso(data: Date): string {
  const d = String(data.getDate()).padStart(2, '0');
  const m = String(data.getMonth() + 1).padStart(2, '0');
  const a = String(data.getFullYear());
  return `${a}-${m}-${d}`;
}

export function parseDataLocal(texto: string): Date | null {
  const limpo = (texto || '').trim();
  if (!limpo) return null;

  // Aceita DD/MM/AAAA
  const matchBr = limpo.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (matchBr) {
    const dia = Number(matchBr[1]);
    const mes = Number(matchBr[2]);
    const ano = Number(matchBr[3]);
    if (ano < 1900 || ano > 2100 || mes < 1 || mes > 12 || dia < 1 || dia > 31) return null;
    const data = new Date(ano, mes - 1, dia, 0, 0, 0, 0);
    if (data.getFullYear() !== ano || data.getMonth() !== mes - 1 || data.getDate() !== dia) {
      return null;
    }
    return data;
  }

  // Aceita YYYY-MM-DD (ou ISO completo com T)
  const apenasDataIso = limpo.includes('T') ? limpo.split('T')[0] : limpo;
  const matchIso = apenasDataIso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (matchIso) {
    const ano = Number(matchIso[1]);
    const mes = Number(matchIso[2]);
    const dia = Number(matchIso[3]);
    if (ano < 1900 || ano > 2100 || mes < 1 || mes > 12 || dia < 1 || dia > 31) return null;
    const data = new Date(ano, mes - 1, dia, 0, 0, 0, 0);
    if (data.getFullYear() !== ano || data.getMonth() !== mes - 1 || data.getDate() !== dia) {
      return null;
    }
    return data;
  }

  return null;
}

export function converterParaIso(texto: string): string | null {
  const data = parseDataLocal(texto);
  return data ? formatarDataIso(data) : null;
}

export function converterIsoParaBr(texto: string): string {
  const data = parseDataLocal(texto);
  return data ? formatarDataDDMMAAAA(data) : (texto || '');
}

export function diasAteVencimento(texto: string): number | null {
  const dataValidade = parseDataLocal(texto);
  if (!dataValidade) return null;
  const hoje = obterHojeLocalZerado();
  const diffMs = dataValidade.getTime() - hoje.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

export function estaVencido(texto: string): boolean {
  const dias = diasAteVencimento(texto);
  return dias !== null && dias < 0;
}
