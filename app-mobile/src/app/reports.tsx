// src/app/reports.tsx
import React, { useState } from 'react';
import { Text, View, SafeAreaView, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppTheme } from '../context/ThemeContext';
import { ActionCard } from '../components/common/ActionCard';
import { AppInput } from '../components/common/AppInput';
import { AppButton } from '../components/common/AppButton';
import { estilosReports } from '../styles/reports.styles';

export default function ReportsScreen() {
  const roteador = useRouter();
  const { theme, tokens, fontScale } = useAppTheme();

  const [tipoGrafico, setTipoGrafico] = useState<'Barras' | 'Pizza' | 'Linhas' | 'Colunas'>('Barras');
  const [emailsDestino, setEmailsDestino] = useState('diretoria@casadacrianca.org.br');

  const dadosGrafico = [
    { label: 'Grãos e Cereais', valor: 75, cor: theme.primary },
    { label: 'Laticínios (Urgente)', valor: 40, cor: tokens.colors.accentAmber500 },
    { label: 'Óleos e Temperos', valor: 55, cor: theme.secondary },
    { label: 'Perdas no Mês', valor: 12, cor: theme.danger },
  ];

  const exportarPdfPorEmail = () => {
    if (!emailsDestino.trim() || !emailsDestino.includes('@')) {
      Alert.alert('E-mail Inválido', 'Informe ao menos um endereço de e-mail válido para envio do PDF.');
      return;
    }
    Alert.alert(
      'Relatório PDF Gerado!',
      `O relatório consolidado com gráfico de ${tipoGrafico} foi exportado em PDF e enviado para:\n${emailsDestino}`
    );
  };

  return (
    <SafeAreaView style={[estilosReports.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={estilosReports.rolagem} keyboardShouldPersistTaps="handled">
        <View style={estilosReports.cabecalho}>
          <Text style={[estilosReports.titulo, { color: theme.primary, fontSize: tokens.typography.fontSize.xl * fontScale }]}>
            Central de Relatórios
          </Text>
          <Text style={[estilosReports.subtitulo, { color: theme.subtext, fontSize: tokens.typography.fontSize.sm * fontScale }]}>
            Selecione o tipo de balanço, visualize gráficos comparativos e exporte em PDF por e-mail.
          </Text>
        </View>

        {/* Subtelas 4.1 a 4.4 */}
        <ActionCard
          titulo="4.1 Relatório de Estoque Atual"
          descricao="Posição consolidada de todos os lotes ativos, quantidades e validades."
          iconName="box"
          destaque={true}
          corDestaque={theme.primary}
          aoTocar={() => roteador.push('/reports-stock')}
        />
        <ActionCard
          titulo="4.2 Relatório de Movimentações"
          descricao="Histórico de entradas, saídas para refeições e trocas de armário."
          iconName="refresh-cw"
          aoTocar={() => roteador.push('/reports-movements')}
        />
        <ActionCard
          titulo="4.3 Relatório de Perdas e Descartes"
          descricao="Auditoria de itens vencidos ou avariados confirmados com a palavra PERDA."
          iconName="alert-triangle"
          corDestaque={theme.danger}
          aoTocar={() => roteador.push('/reports-losses')}
        />
        <ActionCard
          titulo="4.4 Relatório de Validades (FEFO)"
          descricao="Mapeamento de lotes próximos do vencimento para consumo prioritário."
          iconName="clock"
          corDestaque={tokens.colors.accentAmber500}
          aoTocar={() => roteador.push('/reports-expiry')}
        />

        {/* Visualização Gráfica Comparativa */}
        <View style={[estilosReports.secaoCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[estilosReports.tituloSecao, { color: theme.text, fontSize: tokens.typography.fontSize.md * fontScale }]}>
            Visualização Gráfica Comparativa
          </Text>

          <View style={estilosReports.linhaGraficos}>
            {(['Barras', 'Pizza', 'Linhas', 'Colunas'] as const).map((tipo) => {
              const ativo = tipoGrafico === tipo;
              return (
                <TouchableOpacity
                  key={tipo}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={`Selecionar formato de gráfico ${tipo}`}
                  onPress={() => setTipoGrafico(tipo)}
                  style={[
                    estilosReports.botaoTipoGrafico,
                    {
                      backgroundColor: ativo ? `${theme.primary}15` : theme.background,
                      borderColor: ativo ? theme.primary : theme.border,
                    },
                  ]}
                >
                  <Text style={{ fontWeight: 'bold', color: ativo ? theme.primary : theme.text }}>
                    {tipo}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={estilosReports.barraSimuladaContainer}>
            {dadosGrafico.map((item) => (
              <View key={item.label} style={estilosReports.linhaBarra}>
                <View style={estilosReports.rotuloBarra}>
                  <Text style={{ color: theme.text, fontSize: 12 * fontScale, fontWeight: '600' }}>
                    {item.label}
                  </Text>
                  <Text style={{ color: theme.subtext, fontSize: 12 * fontScale, fontWeight: 'bold' }}>
                    {item.valor}%
                  </Text>
                </View>
                <View style={[estilosReports.trilhoBarra, { backgroundColor: theme.border }]}>
                  <View style={[estilosReports.preenchimentoBarra, { width: `${item.valor}%`, backgroundColor: item.cor }]} />
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Exportação Rápida em PDF por E-mail (US09) */}
        <View style={[estilosReports.secaoCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[estilosReports.tituloSecao, { color: theme.text, fontSize: tokens.typography.fontSize.md * fontScale }]}>
            Exportar Balanço Geral em PDF
          </Text>
          <AppInput
            rotulo="E-mails destinatários (separe por vírgula)"
            placeholder="diretoria@casadacrianca.org.br"
            keyboardType="email-address"
            value={emailsDestino}
            onChangeText={setEmailsDestino}
          />
          <AppButton
            title="Gerar PDF e Enviar por E-mail"
            variant="secondary"
            onPress={exportarPdfPorEmail}
            accessibilityHint="Gera o documento PDF com gráficos e envia para os e-mails informados"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}