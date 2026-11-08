// src/app/notifications-config.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Text,
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppTheme } from '../context/ThemeContext';

const CHAVE_PREFERENCIAS_ALERTA = '@doareguardar:preferencias_alerta';

interface PreferenciasAlerta {
  alertaVencimento7d: boolean;
  alertaVencimento30d: boolean;
  alertaEstoqueMinimo: boolean;
  sugestoesDora: boolean;
}

const PREFERENCIAS_PADRAO: PreferenciasAlerta = {
  alertaVencimento7d: true,
  alertaVencimento30d: true,
  alertaEstoqueMinimo: true,
  sugestoesDora: true,
};

export default function NotificationsConfigScreen() {
  const roteador = useRouter();
  const { theme, tokens, fontScale } = useAppTheme();

  const [preferencias, setPreferencias] = useState<PreferenciasAlerta>(PREFERENCIAS_PADRAO);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  // Carrega as preferências salvas ao abrir a tela
  const carregarPreferencias = useCallback(async () => {
    try {
      const json = await AsyncStorage.getItem(CHAVE_PREFERENCIAS_ALERTA);
      if (json) {
        const salvas: PreferenciasAlerta = JSON.parse(json);
        setPreferencias({ ...PREFERENCIAS_PADRAO, ...salvas });
      }
    } catch (erro) {
      console.warn('[NotificationsConfig] Erro ao carregar:', erro);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarPreferencias();
  }, [carregarPreferencias]);

  const atualizarPreferencia = (campo: keyof PreferenciasAlerta) => (valor: boolean) => {
    setPreferencias((prev) => ({ ...prev, [campo]: valor }));
  };

  // Salva no AsyncStorage — botão nativo TouchableOpacity para evitar conflitos com BottomNavBar
  const salvarPreferencias = async () => {
    if (salvando) return;
    setSalvando(true);
    try {
      await AsyncStorage.setItem(CHAVE_PREFERENCIAS_ALERTA, JSON.stringify(preferencias));
      Alert.alert(
        'Preferências Salvas',
        'Regras de alerta FEFO atualizadas com sucesso.',
        [{ text: 'OK', onPress: () => roteador.back() }],
      );
    } catch (erro) {
      Alert.alert('Erro ao Salvar', 'Não foi possível salvar suas preferências. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  };

  if (carregando) {
    return (
      <SafeAreaView style={[estilos.container, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 60 }} />
        <Text style={[estilos.carregandoTexto, { color: theme.subtext, fontSize: 14 * fontScale }]}>
          Carregando preferências…
        </Text>
      </SafeAreaView>
    );
  }

  const itensAlerta = [
    {
      campo: 'alertaVencimento7d' as keyof PreferenciasAlerta,
      titulo: 'Alerta Crítico (≤ 7 dias para vencer)',
      descricao: 'Destaca lotes em vermelho na Home e nas prateleiras.',
      corAtivo: theme.danger,
    },
    {
      campo: 'alertaVencimento30d' as keyof PreferenciasAlerta,
      titulo: 'Alerta Preventivo FEFO (≤ 30 dias)',
      descricao: 'Sinaliza lotes em âmbar para priorizar o consumo na cozinha.',
      corAtivo: tokens.colors.accentAmber500,
    },
    {
      campo: 'alertaEstoqueMinimo' as keyof PreferenciasAlerta,
      titulo: 'Aviso de Estoque Mínimo',
      descricao: 'Notifica quando a quantidade de pacotes atingir o limite de segurança.',
      corAtivo: theme.primary,
    },
    {
      campo: 'sugestoesDora' as keyof PreferenciasAlerta,
      titulo: 'Sugestões Anti-Desperdício da Dora',
      descricao: 'Permite que a Dora sugira receitas para lotes próximos do vencimento.',
      corAtivo: theme.secondary,
    },
  ];

  return (
    <SafeAreaView style={[estilos.container, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={estilos.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* Voltar */}
        <TouchableOpacity
          accessible
          accessibilityRole="button"
          accessibilityLabel="Voltar para Notificações"
          onPress={() => roteador.back()}
          style={estilos.voltar}
        >
          <Feather name="arrow-left" size={20} color={theme.primary} />
          <Text style={[estilos.voltarTexto, { color: theme.primary, fontSize: 15 * fontScale }]}>
            Voltar às Notificações
          </Text>
        </TouchableOpacity>

        <Text style={[estilos.titulo, { color: theme.primary, fontSize: tokens.typography.fontSize.xl * fontScale }]}>
          Configurar Alertas de Validade
        </Text>
        <Text style={[estilos.subtitulo, { color: theme.subtext, fontSize: 13 * fontScale }]}>
          Defina quais regras preventivas FEFO e de estoque mínimo devem gerar avisos prioritários.
        </Text>

        {/* Card de Switches */}
        <View style={[estilos.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {itensAlerta.map((item, idx) => (
            <View
              key={item.campo}
              style={[
                estilos.itemAlerta,
                idx < itensAlerta.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border },
              ]}
            >
              <View style={estilos.itemTexto}>
                <Text style={[estilos.itemTitulo, { color: theme.text, fontSize: 14 * fontScale }]}>
                  {item.titulo}
                </Text>
                <Text style={[estilos.itemDescricao, { color: theme.subtext, fontSize: 12 * fontScale }]}>
                  {item.descricao}
                </Text>
              </View>
              <Switch
                value={preferencias[item.campo]}
                onValueChange={atualizarPreferencia(item.campo)}
                trackColor={{ false: theme.border, true: item.corAtivo }}
                thumbColor="#FFFFFF"
                accessibilityLabel={`Ativar: ${item.titulo}`}
              />
            </View>
          ))}
        </View>

        {/* Botão Salvar — TouchableOpacity nativo para evitar conflitos com BottomNavBar overlay */}
        <TouchableOpacity
          accessible
          accessibilityRole="button"
          accessibilityLabel="Salvar Preferências de Alerta"
          accessibilityHint="Persiste as configurações de alerta FEFO no dispositivo"
          onPress={salvarPreferencias}
          disabled={salvando}
          activeOpacity={0.75}
          style={[estilos.botaoSalvar, { backgroundColor: theme.primary, opacity: salvando ? 0.7 : 1 }]}
        >
          {salvando ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <Feather name="check" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={[estilos.botaoSalvarTexto, { fontSize: 15 * fontScale }]}>
                Salvar Preferências de Alerta
              </Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  container: {
    flex: 1,
  },
  // paddingBottom de 100 garante que o botão não fique atrás do BottomNavBar (height 72)
  scroll: {
    padding: 20,
    paddingBottom: 100,
  },
  carregandoTexto: {
    textAlign: 'center',
    marginTop: 12,
  },
  voltar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    minHeight: 44,
  },
  voltarTexto: {
    fontWeight: 'bold',
    marginLeft: 8,
  },
  titulo: {
    fontWeight: '800',
    marginBottom: 6,
  },
  subtitulo: {
    marginBottom: 18,
    lineHeight: 20,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1.5,
    marginBottom: 24,
    overflow: 'hidden',
  },
  itemAlerta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  itemTexto: {
    flex: 1,
    paddingRight: 12,
  },
  itemTitulo: {
    fontWeight: 'bold',
    marginBottom: 2,
  },
  itemDescricao: {
    lineHeight: 16,
  },
  botaoSalvar: {
    flexDirection: 'row',
    minHeight: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  botaoSalvarTexto: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
