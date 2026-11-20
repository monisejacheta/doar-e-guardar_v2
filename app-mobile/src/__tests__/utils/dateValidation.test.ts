import {
  converterIsoParaBr,
  converterParaIso,
  diasAteVencimento,
  estaVencido,
  formatarDataDDMMAAAA,
  formatarDataIso,
  formatarInputDataDDMMAAAA,
  parseDataLocal,
} from '../../utils/dateValidation';

describe('utils/dateValidation.ts', () => {
  it('deve aplicar máscara DD/MM/AAAA corretamente', () => {
    expect(formatarInputDataDDMMAAAA('20')).toBe('20');
    expect(formatarInputDataDDMMAAAA('2011')).toBe('20/11');
    expect(formatarInputDataDDMMAAAA('20112026')).toBe('20/11/2026');
  });

  it('deve converter e validar datas BR e ISO rejeitando datas inexistentes', () => {
    expect(converterParaIso('20/11/2026')).toBe('2026-11-20');
    expect(converterIsoParaBr('2026-11-20T10:00:00Z')).toBe('20/11/2026');
    expect(parseDataLocal('31/02/2026')).toBeNull();
    expect(parseDataLocal('')).toBeNull();

    const dt = new Date(2026, 10, 20);
    expect(formatarDataDDMMAAAA(dt)).toBe('20/11/2026');
    expect(formatarDataIso(dt)).toBe('2026-11-20');
  });

  it('deve identificar datas vencidas e dias até o vencimento', () => {
    expect(estaVencido('01/01/2020')).toBe(true);
    expect(estaVencido('31/12/2099')).toBe(false);
    expect(diasAteVencimento('31/12/2099')).toBeGreaterThan(100);
    expect(diasAteVencimento('invalido')).toBeNull();
  });
});
