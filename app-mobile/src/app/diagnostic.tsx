// src/app/diagnostic.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Text, View, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAppTheme } from '../context/ThemeContext';
import { AppButton } from '../components/common/AppButton';
import { estilosDiagnostic } from '../styles/diagnostic.styles';
import { requisicaoApi, API_BASE_URL } from '../services/api';
import { carregarPrateleirasAws } from '../services/storageLocations';

export default function DiagnosticScreen() {
  const roteador = useRouter();
  const { theme, tokens, fontScale } = useAppTheme();
  const [verificando, setVerificando] = useState(false);
  const [latenciaMs, setLatenciaMs] = useState<number | null>(null);
  const [statusAws, setStatusAws] = useState<'DISPONÍVEL' | 'VERIFICANDO' | 'OFFLINE'>('VERIFICANDO');
  const [totalLotes, setTotalLotes] = useState<number>(0);
  const [totalPrateleiras, setTotalPrateleiras] = useState<number>(0);

  const executarDiagnosticoReal = useCallback(async (exibirAlerta = false) => {
    setVerificando(true);
    setStatusAws('VERIFICANDO');
    const inicio = Date.now();
    try {
      const [respEstoque, resPrateleiras] = await Promise.all([
        requisicaoApi<any>('/api/estoque', {
          metodo: 'POST',
          dados: { modulo: 'estoque', acao: 'consultar_estoque' },
        }),
        carregarPrateleirasAws(),
      ]);

      const tempo = Date.now() - inicio;
      setLatenciaMs(tempo);

      if (respEstoque?.sucesso && Array.isArray(respEstoque.lotes)) {
        const ativos = respEstoque.lotes.filter((l: any) => (Number(l.quantidade_atual_pacote) || 0) > 0);
        setTotalLotes(ativos.length);
        setTotalPrateleiras(resPrateleiras.locais.length);
        setStatusAws('DISPONÍVEL');

        if (exibirAlerta) {
          Alert.alert(
            'Tudo Funcionando!',
            `Conexão testada com sucesso (${tempo} ms).\n• ${ativos.length} lotes de alimentos guardados.\n• ${resPrateleiras.locais.length} prateleiras cadastradas.`
          );
        }
      } else {
        setStatusAws('OFFLINE');
        if (exibirAlerta) {
          Alert.alert('Atenção', 'O sistema respondeu, mas ainda está carregando os dados.');
        }
      }
    } catch (erro: any) {
      setStatusAws('OFFLINE');
      if (exibirAlerta) {
        Alert.alert('Sem Conexão', erro?.message || 'Não foi possível conectar ao sistema agora.');
      }
    } finally {
      setVerificando(false);
    }
  }, []);

  useEffect(() => {
    executarDiagnosticoReal(false);
  }, [executarDiagnosticoReal]);

  const servicos = [
    {
      rota: '/diagnostic-aws',
      nome: 'Conexão com a Internet e Sistema',
      detalhe:
        latenciaMs !== null
          ? `Resposta rápida • Tempo: ${latenciaMs} ms`
          : 'Verificando velocidade de resposta do aplicativo...',
      status: statusAws,
      cor: statusAws === 'DISPONÍVEL' ? theme.secondary : statusAws === 'VERIFICANDO' ? tokens.colors.accentAmber500 : theme.danger,
    },
    {
      rota: '/diagnostic-database',
      nome: 'Dados Salvos da Despensa',
      detalhe: `${totalLotes} lotes de alimentos • ${totalPrateleiras} prateleiras cadastradas`,
      status: statusAws === 'DISPONÍVEL' ? 'EM DIA' : statusAws,
      cor: statusAws === 'DISPONÍVEL' ? theme.secondary : theme.danger,
    },
    {
      rota: '/diagnostic-apis',
      nome: 'Leitura de Código de Barras',
      detalhe: 'Teste se a busca automática de alimentos pelo código está funcionando',
      status: 'TESTAR',
      cor: tokens.colors.accentAmber500,
    },
    {
      rota: '/diagnostic-config',
      nome: 'Informações do Aplicativo',
      detalhe: 'Veja os detalhes de funcionamento e conexão do app',
      status: 'VER MAIS',
      cor: theme.primary,
    },
  ];

  return (
    <SafeAreaView style={[estilosDiagnostic.container, { backgroundColor: 'transparent' }]}>
      <ScrollView contentContainerStyle={estilosDiagnostic.rolagem}>
        <TouchableOpacity
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Voltar para a tela anterior"
          onPress={() => roteador.back()}
          style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, minHeight: 44 }}
        >
          <Feather name="arrow-left" size={20} color={theme.primary} />
          <Text style={{ color: theme.primary, fontWeight: 'bold', marginLeft: 8, fontSize: 15 * fontScale }}>
            Voltar
          </Text>
        </TouchableOpacity>

        <View style={estilosDiagnostic.cabecalho}>
          <Text style={[estilosDiagnostic.titulo, { color: theme.primary, fontSize: tokens.typography.fontSize.xl * fontScale }]}>
            Status do Aplicativo
          </Text>
          <Text style={[estilosDiagnostic.subtitulo, { color: theme.subtext, fontSize: tokens.typography.fontSize.sm * fontScale }]}>
            Veja se a conexão com a internet, os dados salvos e o leitor de código de barras estão funcionando bem.
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
              <Text style={[estilosDiagnostic.detalheComponente, { color: theme.subtext, fontSize: 12 * fontScale }]}>
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
            title="Testar Tudo Agora"
            variant="primary"
            loading={verificando}
            onPress={() => executarDiagnosticoReal(true)}
            accessibilityHint="Testa a conexão do aplicativo e verifica se está tudo funcionando"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

