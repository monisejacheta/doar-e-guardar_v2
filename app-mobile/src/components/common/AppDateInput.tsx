import React, { useMemo, useState } from 'react';
import {
  Modal,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAppTheme } from '../../context/ThemeContext';
import {
  formatarDataDDMMAAAA,
  formatarInputDataDDMMAAAA,
  obterHojeLocalZerado,
  parseDataLocal,
} from '../../utils/dateValidation';

const NOMES_MESES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export interface AppDateInputProps {
  rotulo: string;
  value: string;
  onChangeText: (dataBr: string) => void;
  placeholder?: string;
  mensagemAviso?: string;
  dicaAcessibilidade?: string;
  bloquearDatasPassadas?: boolean;
  editable?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
}

/**
 * Campo de data (DD/MM/AAAA) com ícone de calendário acessível (>= 48px)
 * que abre um calendário interativo modal para seleção direta da data.
 */
export function AppDateInput({
  rotulo,
  value,
  onChangeText,
  placeholder = 'DD/MM/AAAA',
  mensagemAviso,
  dicaAcessibilidade,
  bloquearDatasPassadas = false,
  editable = true,
  containerStyle,
}: AppDateInputProps) {
  const { theme, tokens, fontScale } = useAppTheme();

  const [calendarioVisivel, setCalendarioVisivel] = useState(false);
  const [avisoCalendario, setAvisoCalendario] = useState<string | null>(null);

  const hoje = useMemo(() => obterHojeLocalZerado(), []);
  const dataSelecionada = useMemo(() => parseDataLocal(value), [value]);

  const [mesExibido, setMesExibido] = useState<number>(() =>
    dataSelecionada ? dataSelecionada.getMonth() : hoje.getMonth(),
  );
  const [anoExibido, setAnoExibido] = useState<number>(() =>
    dataSelecionada ? dataSelecionada.getFullYear() : hoje.getFullYear(),
  );

  const abrirCalendario = () => {
    if (!editable) return;
    const base = parseDataLocal(value) || hoje;
    setMesExibido(base.getMonth());
    setAnoExibido(base.getFullYear());
    setAvisoCalendario(null);
    setCalendarioVisivel(true);
  };

  const navegarMes = (delta: number) => {
    let novoMes = mesExibido + delta;
    let novoAno = anoExibido;
    if (novoMes < 0) {
      novoMes = 11;
      novoAno -= 1;
    } else if (novoMes > 11) {
      novoMes = 0;
      novoAno += 1;
    }
    setMesExibido(novoMes);
    setAnoExibido(novoAno);
  };

  const celulasMes = useMemo(() => {
    const primeiroDiaSemana = new Date(anoExibido, mesExibido, 1).getDay();
    const totalDiasMes = new Date(anoExibido, mesExibido + 1, 0).getDate();
    const celulas: (Date | null)[] = [];
    for (let i = 0; i < primeiroDiaSemana; i++) {
      celulas.push(null);
    }
    for (let dia = 1; dia <= totalDiasMes; dia++) {
      celulas.push(new Date(anoExibido, mesExibido, dia, 0, 0, 0, 0));
    }
    while (celulas.length % 7 !== 0) {
      celulas.push(null);
    }
    return celulas;
  }, [anoExibido, mesExibido]);

  const selecionarData = (data: Date) => {
    const ehPassado = data.getTime() < hoje.getTime();
    if (bloquearDatasPassadas && ehPassado) {
      setAvisoCalendario(
        'Bloqueio de segurança: não é permitido selecionar produtos com data de validade vencida.',
      );
      return;
    }
    setAvisoCalendario(null);
    onChangeText(formatarDataDDMMAAAA(data));
    setCalendarioVisivel(false);
  };

  const mesmaData = (a: Date | null, b: Date | null) => {
    if (!a || !b) return false;
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  };

  return (
    <View style={[styles.container, containerStyle]}>
      <Text
        style={[
          styles.label,
          { color: theme.text, fontSize: tokens.typography.fontSize.sm * fontScale },
        ]}
      >
        {rotulo}
      </Text>

      <View
        style={[
          styles.inputRow,
          {
            backgroundColor: theme.surface,
            borderColor: mensagemAviso ? theme.danger : theme.border,
          },
        ]}
      >
        <TextInput
          style={[
            styles.input,
            {
              color: theme.text,
              fontSize: tokens.typography.fontSize.md * fontScale,
            },
          ]}
          value={value}
          onChangeText={(txt) => onChangeText(formatarInputDataDDMMAAAA(txt))}
          placeholder={placeholder}
          placeholderTextColor={theme.subtext}
          keyboardType="numeric"
          maxLength={10}
          editable={editable}
          accessibilityLabel={rotulo}
          accessibilityHint={
            dicaAcessibilidade ||
            'Digite a data no formato DD/MM/AAAA ou toque no ícone de calendário ao lado'
          }
        />

        <TouchableOpacity
          style={[
            styles.calendarButton,
            {
              backgroundColor: `${theme.primary}12`,
              borderLeftColor: theme.border,
            },
          ]}
          onPress={abrirCalendario}
          disabled={!editable}
          activeOpacity={0.75}
          accessibilityRole="button"
          accessibilityLabel={`Abrir calendário para ${rotulo}`}
        >
          <Feather name="calendar" size={20} color={theme.primary} />
        </TouchableOpacity>
      </View>

      {mensagemAviso ? (
        <Text
          style={[
            styles.aviso,
            { color: theme.danger, fontSize: tokens.typography.fontSize.xs * fontScale },
          ]}
        >
          {mensagemAviso}
        </Text>
      ) : null}

      <Modal
        visible={calendarioVisivel}
        transparent
        animationType="fade"
        onRequestClose={() => setCalendarioVisivel(false)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.modalCard,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}
          >
            <View style={styles.modalTopRow}>
              <View style={styles.modalTitleGroup}>
                <Feather name="calendar" size={18} color={theme.primary} />
                <Text
                  style={[
                    styles.modalTitle,
                    { color: theme.text, fontSize: 15 * fontScale },
                  ]}
                >
                  Selecionar Data
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setCalendarioVisivel(false)}
                style={styles.closeIconButton}
                accessibilityRole="button"
                accessibilityLabel="Fechar calendário"
              >
                <Feather name="x" size={20} color={theme.subtext} />
              </TouchableOpacity>
            </View>

            <View style={[styles.navRow, { borderColor: theme.border }]}>
              <TouchableOpacity
                onPress={() => setAnoExibido((a) => a - 1)}
                style={styles.navIconBtn}
                accessibilityRole="button"
                accessibilityLabel="Ano anterior"
              >
                <Feather name="chevrons-left" size={18} color={theme.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => navegarMes(-1)}
                style={styles.navIconBtn}
                accessibilityRole="button"
                accessibilityLabel="Mês anterior"
              >
                <Feather name="chevron-left" size={20} color={theme.primary} />
              </TouchableOpacity>

              <Text
                style={[
                  styles.monthYearText,
                  { color: theme.text, fontSize: 14 * fontScale },
                ]}
              >
                {NOMES_MESES[mesExibido]} {anoExibido}
              </Text>

              <TouchableOpacity
                onPress={() => navegarMes(1)}
                style={styles.navIconBtn}
                accessibilityRole="button"
                accessibilityLabel="Próximo mês"
              >
                <Feather name="chevron-right" size={20} color={theme.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setAnoExibido((a) => a + 1)}
                style={styles.navIconBtn}
                accessibilityRole="button"
                accessibilityLabel="Próximo ano"
              >
                <Feather name="chevrons-right" size={18} color={theme.primary} />
              </TouchableOpacity>
            </View>

            <View style={styles.weekRow}>
              {DIAS_SEMANA.map((sigla) => (
                <View key={sigla} style={styles.weekCell}>
                  <Text
                    style={[
                      styles.weekText,
                      { color: theme.subtext, fontSize: 11 * fontScale },
                    ]}
                  >
                    {sigla}
                  </Text>
                </View>
              ))}
            </View>

            <View style={styles.daysGrid}>
              {celulasMes.map((dataCell, idx) => {
                if (!dataCell) {
                  return <View key={`empty-${idx}`} style={styles.daySlot} />;
                }
                const selecionada = mesmaData(dataCell, dataSelecionada);
                const ehHoje = mesmaData(dataCell, hoje);
                const ehPassado = dataCell.getTime() < hoje.getTime();
                const bloqueadaVisualmente = bloquearDatasPassadas && ehPassado;

                return (
                  <TouchableOpacity
                    key={dataCell.toISOString()}
                    style={[
                      styles.daySlot,
                      styles.dayButton,
                      selecionada && {
                        backgroundColor: theme.primary,
                      },
                      !selecionada &&
                        ehHoje && {
                          borderColor: theme.secondary,
                          borderWidth: 1.5,
                          backgroundColor: `${theme.secondary}15`,
                        },
                      !selecionada &&
                        bloqueadaVisualmente && {
                          backgroundColor: `${theme.danger}0D`,
                        },
                    ]}
                    onPress={() => selecionarData(dataCell)}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel={`Dia ${formatarDataDDMMAAAA(dataCell)}${
                      bloqueadaVisualmente ? ' (vencido)' : ''
                    }`}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        {
                          color: selecionada
                            ? '#FFFFFF'
                            : bloqueadaVisualmente
                              ? theme.danger
                              : theme.text,
                          fontSize: 13 * fontScale,
                          textDecorationLine: bloqueadaVisualmente ? 'line-through' : 'none',
                          opacity: bloqueadaVisualmente ? 0.65 : 1,
                        },
                      ]}
                    >
                      {dataCell.getDate()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {avisoCalendario ? (
              <View
                style={[
                  styles.warningBox,
                  {
                    backgroundColor: `${theme.danger}12`,
                    borderColor: `${theme.danger}55`,
                  },
                ]}
              >
                <Feather name="alert-triangle" size={16} color={theme.danger} />
                <Text
                  style={[
                    styles.warningText,
                    { color: theme.danger, fontSize: 12 * fontScale },
                  ]}
                >
                  {avisoCalendario}
                </Text>
              </View>
            ) : null}

            <View style={styles.footerRow}>
              <TouchableOpacity
                onPress={() => {
                  setMesExibido(hoje.getMonth());
                  setAnoExibido(hoje.getFullYear());
                  selecionarData(hoje);
                }}
                style={[
                  styles.footerAction,
                  {
                    backgroundColor: `${theme.secondary}18`,
                    borderColor: theme.secondary,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Selecionar data de hoje"
              >
                <Feather name="check-circle" size={16} color={theme.secondary} />
                <Text
                  style={[
                    styles.footerActionText,
                    { color: theme.secondary, fontSize: 13 * fontScale },
                  ]}
                >
                  Hoje ({formatarDataDDMMAAAA(hoje)})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setCalendarioVisivel(false)}
                style={[
                  styles.footerClose,
                  { borderColor: theme.border, backgroundColor: theme.background },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Fechar calendário"
              >
                <Text style={[styles.footerCloseText, { color: theme.text, fontSize: 13 * fontScale }]}>
                  Fechar
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: '100%',
  },
  label: {
    fontWeight: '600',
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    minHeight: 48,
    borderWidth: 1.5,
    borderRadius: 12,
    overflow: 'hidden',
  },
  input: {
    flex: 1,
    minHeight: 48,
    paddingHorizontal: 14,
  },
  calendarButton: {
    minWidth: 48,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftWidth: 1,
  },
  aviso: {
    marginTop: 6,
    fontWeight: '600',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  modalTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  modalTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontWeight: '800',
  },
  closeIconButton: {
    minWidth: 48,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    paddingVertical: 4,
    marginBottom: 10,
  },
  navIconBtn: {
    minWidth: 48,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthYearText: {
    flex: 1,
    textAlign: 'center',
    fontWeight: '800',
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  weekCell: {
    flexBasis: '14.2857%',
    alignItems: 'center',
    paddingVertical: 4,
  },
  weekText: {
    fontWeight: '700',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  daySlot: {
    flexBasis: '14.2857%',
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  dayButton: {
    borderRadius: 10,
  },
  dayText: {
    fontWeight: '700',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 10,
  },
  warningText: {
    flex: 1,
    fontWeight: '700',
  },
  footerRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  footerAction: {
    flex: 1,
    minHeight: 48,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 10,
  },
  footerActionText: {
    fontWeight: '700',
  },
  footerClose: {
    minWidth: 88,
    minHeight: 48,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  footerCloseText: {
    fontWeight: '700',
  },
});
