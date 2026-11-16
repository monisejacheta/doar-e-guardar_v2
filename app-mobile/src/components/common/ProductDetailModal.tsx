// src/components/common/ProductDetailModal.tsx
import React from 'react';
import {
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useAppTheme } from '../../context/ThemeContext';
import { resolverFotoProduto } from '../../utils/imageUtils';

export interface ProductDetailLot {
  id_lote_produto: string;
  numero_codigo_lote: string;
  quantidade_atual_pacote: number;
  data_validade_lote: string;
  local_descricao: string;
}

export interface ProductDetailItem<T extends ProductDetailLot = ProductDetailLot> {
  codigo_barra_produto: string;
  nome_produto: string;
  categoria: string;
  quantidade_total: number;
  estoque_minimo?: number;
  foto_url?: string;
  lotes: T[];
}

interface ProductDetailModalProps<T extends ProductDetailLot> {
  visible: boolean;
  produto: ProductDetailItem<T> | null;
  onClose: () => void;
  headerTitle?: string;
  accentColor?: string;
  instructionText?: string;
  lotesTitle?: string;
  highlightFefoFirst?: boolean;
  onSelectLote?: (lote: T) => void;
  closeButtonLabel?: string;
}

function avaliarValidade(dataValidade: string): 'vencido' | 'proximo_vencimento' | 'ok' {
  if (!dataValidade) return 'ok';
  let dataVal: Date;
  if (dataValidade.includes('/')) {
    const [d, m, y] = dataValidade.split('/');
    dataVal = new Date(Number(y), Number(m) - 1, Number(d));
  } else {
    const partes = dataValidade.split('-');
    if (partes.length !== 3) return 'ok';
    dataVal = new Date(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2]));
  }
  if (isNaN(dataVal.getTime())) return 'ok';
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const diffDias = Math.ceil((dataVal.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDias < 0) return 'vencido';
  if (diffDias <= 7) return 'proximo_vencimento';
  return 'ok';
}

export function ProductDetailModal<T extends ProductDetailLot>({
  visible,
  produto,
  onClose,
  headerTitle = 'Detalhes do Produto',
  accentColor,
  instructionText,
  lotesTitle = 'Lotes e Prateleiras',
  highlightFefoFirst = false,
  onSelectLote,
  closeButtonLabel = 'Fechar',
}: ProductDetailModalProps<T>) {
  const { theme, mode, fontScale } = useAppTheme();
  const corDestaque = accentColor || theme.primary;
  const isDarkOrHC = mode === 'dark' || mode === 'high-contrast';
  const abaixoMinimo =
    produto !== null &&
    typeof produto.estoque_minimo === 'number' &&
    produto.quantidade_total < produto.estoque_minimo;

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="slide"
      presentationStyle="fullScreen"
      statusBarTranslucent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: theme.background }]}
        edges={['top', 'bottom', 'left', 'right']}
      >
        {/* Cabeçalho Full-Screen */}
        <View style={[styles.headerBar, { borderBottomColor: theme.border, backgroundColor: theme.background }]}>
          <TouchableOpacity
            onPress={onClose}
            style={[styles.headerIconBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
            accessibilityLabel="Voltar"
          >
            <Feather name="arrow-left" size={20} color={theme.text} />
          </TouchableOpacity>

          <Text
            style={[styles.headerTitle, { color: theme.text, fontSize: 16 * fontScale }]}
            numberOfLines={1}
          >
            {headerTitle}
          </Text>

          <TouchableOpacity
            onPress={onClose}
            style={[styles.headerIconBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
            accessibilityLabel="Fechar"
          >
            <Feather name="x" size={20} color={theme.text} />
          </TouchableOpacity>
        </View>

        {produto && (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Área Delimitada da Imagem (Maior e ajustada inteira dentro da moldura) */}
            <View
              style={[
                styles.imageFrame,
                {
                  backgroundColor: isDarkOrHC ? theme.surface : '#F8FAFC',
                  borderColor: theme.border,
                },
              ]}
            >
              <Image
                source={resolverFotoProduto(produto.foto_url, produto.categoria)}
                style={styles.productImage}
                resizeMode="contain"
              />
            </View>

            {/* Identificação: Categoria + EAN */}
            <View style={styles.metaRow}>
              <View style={[styles.badge, { backgroundColor: `${corDestaque}18`, borderColor: `${corDestaque}40` }]}>
                <Feather name="tag" size={12} color={corDestaque} />
                <Text style={[styles.badgeText, { color: corDestaque, fontSize: 11.5 * fontScale }]}>
                  {produto.categoria || 'Geral'}
                </Text>
              </View>

              <View style={[styles.badge, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Feather name="maximize" size={12} color={theme.subtext} />
                <Text style={[styles.badgeText, { color: theme.subtext, fontSize: 11.5 * fontScale }]}>
                  Código: {produto.codigo_barra_produto || 'N/A'}
                </Text>
              </View>
            </View>

            {/* Nome do Produto */}
            <Text style={[styles.productName, { color: theme.text, fontSize: 21 * fontScale }]}>
              {produto.nome_produto}
            </Text>

            {/* Painel de Métricas do Produto */}
            <View style={styles.kpiRow}>
              <View
                style={[
                  styles.kpiCard,
                  {
                    backgroundColor: theme.surface,
                    borderColor: abaixoMinimo ? '#F97316' : theme.border,
                  },
                ]}
              >
                <Text style={[styles.kpiLabel, { color: theme.subtext, fontSize: 11 * fontScale }]}>
                  Estoque Atual
                </Text>
                <Text
                  style={[
                    styles.kpiValue,
                    { color: abaixoMinimo ? '#EA580C' : corDestaque, fontSize: 18 * fontScale },
                  ]}
                >
                  {produto.quantidade_total} pcts
                </Text>
              </View>

              <View style={[styles.kpiCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Text style={[styles.kpiLabel, { color: theme.subtext, fontSize: 11 * fontScale }]}>
                  Lotes Ativos
                </Text>
                <Text style={[styles.kpiValue, { color: theme.text, fontSize: 18 * fontScale }]}>
                  {produto.lotes.length}
                </Text>
              </View>

              {typeof produto.estoque_minimo === 'number' && (
                <View style={[styles.kpiCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  <Text style={[styles.kpiLabel, { color: theme.subtext, fontSize: 11 * fontScale }]}>
                    Mínimo
                  </Text>
                  <Text style={[styles.kpiValue, { color: theme.text, fontSize: 18 * fontScale }]}>
                    {produto.estoque_minimo} pcts
                  </Text>
                </View>
              )}
            </View>

            {abaixoMinimo && (
              <View style={[styles.alertBanner, { backgroundColor: isDarkOrHC ? '#431407' : '#FFF7ED', borderColor: '#FB923C' }]}>
                <Feather name="alert-triangle" size={16} color="#EA580C" />
                <Text style={[styles.alertText, { color: isDarkOrHC ? '#FDBA74' : '#9A3412', fontSize: 12.5 * fontScale }]}>
                  Estoque abaixo do mínimo recomendado ({produto.estoque_minimo} pacotes).
                </Text>
              </View>
            )}

            {instructionText && (
              <View
                style={[
                  styles.instructionBanner,
                  {
                    backgroundColor: `${corDestaque}14`,
                    borderColor: `${corDestaque}40`,
                  },
                ]}
              >
                <Feather name="info" size={16} color={corDestaque} />
                <Text style={[styles.instructionText, { color: corDestaque, fontSize: 12.5 * fontScale }]}>
                  {instructionText}
                </Text>
              </View>
            )}

            {/* Seção de Lotes */}
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.text, fontSize: 15 * fontScale }]}>
                {lotesTitle}
              </Text>
              <Text style={[styles.sectionCount, { color: theme.subtext, fontSize: 12 * fontScale }]}>
                {produto.lotes.length} {produto.lotes.length === 1 ? 'lote' : 'lotes'}
              </Text>
            </View>

            <View style={styles.lotesList}>
              {produto.lotes.map((lote, index) => {
                const status = avaliarValidade(lote.data_validade_lote);
                const isVencido = status === 'vencido';
                const isProximo = status === 'proximo_vencimento';
                const isFefoUrgente = highlightFefoFirst && index === 0;

                const statusColor = isVencido
                  ? '#DC2626'
                  : isProximo || isFefoUrgente
                    ? '#D97706'
                    : '#16A34A';

                const cardBorder = isVencido
                  ? '#EF4444'
                  : isFefoUrgente || isProximo
                    ? '#F59E0B'
                    : theme.border;

                const cardBg = isDarkOrHC
                  ? theme.surface
                  : isVencido
                    ? '#FEF2F2'
                    : isFefoUrgente || isProximo
                      ? '#FFFBEB'
                      : '#FFFFFF';

                const statusLabel = isVencido
                  ? 'Vencido'
                  : isFefoUrgente
                    ? 'Usar primeiro'
                    : isProximo
                      ? 'Vence logo'
                      : 'No prazo';

                const ConteudoLote = (
                  <View
                    style={[
                      styles.loteCard,
                      {
                        borderColor: cardBorder,
                        backgroundColor: cardBg,
                      },
                    ]}
                  >
                    <View style={styles.loteTopRow}>
                      <View style={styles.loteIdGroup}>
                        <Feather name="package" size={15} color={corDestaque} />
                        <Text style={[styles.loteCode, { color: theme.text, fontSize: 13.5 * fontScale }]}>
                          Lote {lote.numero_codigo_lote}
                        </Text>
                      </View>

                      <View style={styles.loteRightGroup}>
                        <View style={[styles.qtyPill, { backgroundColor: `${corDestaque}18` }]}>
                          <Text style={[styles.qtyPillText, { color: corDestaque, fontSize: 12.5 * fontScale }]}>
                            {lote.quantidade_atual_pacote} pcts
                          </Text>
                        </View>
                        {onSelectLote && (
                          <Feather name="chevron-right" size={18} color={theme.subtext} />
                        )}
                      </View>
                    </View>

                    <View style={styles.loteInfoRow}>
                      <Feather name="map-pin" size={13} color={theme.subtext} />
                      <Text style={[styles.loteInfoText, { color: theme.text, fontSize: 12.5 * fontScale }]}>
                        Prateleira: {lote.local_descricao}
                      </Text>
                    </View>

                    <View style={styles.loteFooterRow}>
                      <View style={styles.loteInfoRow}>
                        <Feather name="calendar" size={13} color={statusColor} />
                        <Text style={[styles.loteExpiryText, { color: statusColor, fontSize: 12 * fontScale }]}>
                          Validade: {lote.data_validade_lote}
                        </Text>
                      </View>

                      <View style={[styles.statusBadge, { backgroundColor: `${statusColor}18` }]}>
                        <Text style={[styles.statusBadgeText, { color: statusColor, fontSize: 11 * fontScale }]}>
                          {statusLabel}
                        </Text>
                      </View>
                    </View>
                  </View>
                );

                if (onSelectLote) {
                  return (
                    <TouchableOpacity
                      key={lote.id_lote_produto}
                      onPress={() => onSelectLote(lote)}
                      activeOpacity={0.75}
                    >
                      {ConteudoLote}
                    </TouchableOpacity>
                  );
                }

                return <View key={lote.id_lote_produto}>{ConteudoLote}</View>;
              })}
            </View>
          </ScrollView>
        )}

        {/* Rodapé fixo para fechar rapidamente quando modo visualização */}
        {!onSelectLote && (
          <View style={[styles.footerBar, { borderTopColor: theme.border, backgroundColor: theme.background }]}>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeFooterBtn, { backgroundColor: corDestaque }]}
              activeOpacity={0.85}
            >
              <Text style={[styles.closeFooterBtnText, { fontSize: 14 * fontScale }]}>
                {closeButtonLabel}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  imageFrame: {
    width: '100%',
    height: 260,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  badgeText: {
    fontWeight: '600',
  },
  productName: {
    fontWeight: '800',
    marginBottom: 14,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  kpiCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  kpiLabel: {
    fontWeight: '600',
    marginBottom: 3,
  },
  kpiValue: {
    fontWeight: '800',
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 14,
  },
  alertText: {
    flex: 1,
    fontWeight: '600',
  },
  instructionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 14,
  },
  instructionText: {
    flex: 1,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
    marginTop: 4,
  },
  sectionTitle: {
    fontWeight: '800',
    flexShrink: 1,
  },
  sectionCount: {
    fontWeight: '600',
  },
  lotesList: {
    gap: 10,
  },
  loteCard: {
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 14,
    gap: 8,
  },
  loteTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  loteIdGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    flexShrink: 1,
  },
  loteCode: {
    fontWeight: '800',
    flexShrink: 1,
  },
  loteRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  qtyPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  qtyPillText: {
    fontWeight: '800',
  },
  loteInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
  },
  loteInfoText: {
    fontWeight: '600',
    flex: 1,
    flexShrink: 1,
  },
  loteFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 2,
  },
  loteExpiryText: {
    fontWeight: '700',
    flexShrink: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontWeight: '700',
  },
  footerBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  closeFooterBtn: {
    minHeight: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeFooterBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
