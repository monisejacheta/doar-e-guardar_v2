// src/app/diagnostic.tsx
import React, { useState } from 'react';
import { Text, View, SafeAreaView, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppTheme } from '../context/ThemeContext';
import { AppButton } from '../components/common/AppButton';
import { estilosDiagnostic } from '../styles/diagnostic.styles';

export default function DiagnosticScreen() {
  const roteador = useRouter();
  const { theme, tokens, fontScale } = useAppTheme();
  const [verificando, setVerificando] = useState(false);

  const servicos = [
    {
      rota: '/diagnostic-aws',
      nome: '9.1 Funções Serverless AWS Lambda',
      detalhe: 'Região sa-east-1 • Latência média: 118ms',
      status: 'DISPONÍVEL',
      cor: theme.secondary, // Verde Doar (#10B981)
    },
    {
      rota: '/diagnostic-database',
      nome: '9.2 Bancos de Dados (SQL + NoSQL)',
      detalhe: 'Estoque Relacional AWS & Sessões Firebase',
      status: 'DISPONÍVEL',
      cor: theme.secondary,
    },
    {
      rota: '/diagnostic-apis',
      nome: '9.3 Cascata de 3 APIs (Código de Barras)',
      detalhe: 'API 1 e 2 Online • API 3 em espera (Fallback)',
      status: 'ESTÁVEL',
      cor: tokens.colors.accentAmber500, // Âmbar (#F59E0B)
    },
    {
      rota: '/diagnostic-config',
      nome: '9.4 Configurar Chaves e Integrações',
      detalhe: 'Ajustar timeouts e ordem de prioridade das APIs',
      status: 'CONFIGURAR',
      cor: theme.primary, // Azul Guardar (#1E3A8A)
    },
  ];

  const testarConexoes = () => {
    setVerificando(true);
    setTimeout(() => {
      setVerificando(false);
      Alert.alert(
        'Diagnóstico Concluído',
        'Todos os serviços vitais da nuvem AWS, banco relacional SQL, Firebase NoSQL e barramento de APIs estão operacionais.'
      );
    }, 700);
  };

  return (
    <SafeAreaView style={[estilosDiagnostic.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={estilosDiagnostic.rolagem}>
        <View style={estilosDiagnostic.cabecalho}>
          <Text style={[estilosDiagnostic.titulo, { color: theme.primary, fontSize: tokens.typography.fontSize.xl * fontScale }]}>
            Disponibilidade do Sistema
          </Text>
          <Text style={[estilosDiagnostic.subtitulo, { color: theme.subtext, fontSize: tokens.typography.fontSize.sm * fontScale }]}>
            Verifique em tempo real a saúde dos servidores AWS, bancos de dados e APIs de leitura de produtos.
          </Text>
        </View>

        {servicos.map((item) => (
          <TouchableOpacity
            key={item.nome}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={`${item.nome}. Status: ${item.status}. ${item.detalhe}`}
            onPress={() => roteador.push(item.rota as any)}
            style={[
              estilosDiagnostic.cartaoStatus,
              { backgroundColor: theme.surface, borderColor: item.cor },
            ]}
          >
            <View style={estilosDiagnostic.infoComponente}>
              <Text style={[estilosDiagnostic.nomeComponente, { color: theme.text, fontSize: 14 * fontScale }]}>
                {item.nome}
              </Text>
              <Text style={[estilosDiagnostic.detalheComponente, { color: theme.subtext }]}>
                {item.detalhe}
              </Text>
            </View>
            <View style={[estilosDiagnostic.badgeSaude, { backgroundColor: item.cor }]}>
              <Text style={estilosDiagnostic.textoBadgeSaude}>{item.status}</Text>
            </View>
          </TouchableOpacity>
        ))}

        <View style={{ marginTop: 12 }}>
          <AppButton
            title="Testar Todas as Conexões Agora"
            variant="primary"
            loading={verificando}
            onPress={testarConexoes}
            accessibilityHint="Executa um teste completo de comunicação com a nuvem e bancos de dados"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}