// src/app/settings-categories.tsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAppTheme } from '../context/ThemeContext';
import { requisicaoApi } from '../services/api';
import { AppInput } from '../components/common/AppInput';
import {
  CategoriaAlimentoItem,
  alternarVisibilidadeCategoria,
  carregarCategoriasComEstado,
  criarEPersistirCategoria,
} from '../services/categoriesService';

export default function SettingsCategoriesScreen() {
  const roteador = useRouter();
  const { theme, tokens, fontScale } = useAppTheme();

  const [categorias, setCategorias] = useState<CategoriaAlimentoItem[]>([]);
  const [contagem, setContagem] = useState<Record<string, number>>({});
  const [carregando, setCarregando] = useState(true);
  const [mostrarOcultas, setMostrarOcultas] = useState(false);

  const [modalVisivel, setModalVisivel] = useState(false);
  const [nomeNovaCategoria, setNomeNovaCategoria] = useState('');
  const [salvandoCategoria, setSalvandoCategoria] = useState(false);

  const carregarDados = useCallback(async () => {
    setCarregando(true);
    try {
      const [resultadoCats, respEstoque]: any = await Promise.all([
        carregarCategoriasComEstado(),
        requisicaoApi('/api/estoque', {
          metodo: 'POST',
          dados: { modulo: 'estoque', acao: 'consultar_estoque' },
        }).catch(() => ({})),
      ]);

      setCategorias(resultadoCats.categorias);

      const mapa: Record<string, number> = {};
      const listaLotes = Array.isArray(respEstoque?.dados)
        ? respEstoque.dados
        : Array.isArray(respEstoque?.lotes)
          ? respEstoque.lotes
          : [];

      listaLotes.forEach((l: any) => {
        const cat = String(l.categoria || 'Outros').trim();
        mapa[cat] = (mapa[cat] || 0) + Number(l.quantidade_atual_pacote || 0);
      });
      setContagem(mapa);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void carregarDados();
    }, 0);
    return () => clearTimeout(timer);
  }, [carregarDados]);

  const categoriasVisiveis = useMemo(
    () => categorias.filter((c) => !c.oculta),
    [categorias],
  );
  const categoriasOcultas = useMemo(
    () => categorias.filter((c) => c.oculta),
    [categorias],
  );

  const adicionarNovaCategoria = async () => {
    const limpa = nomeNovaCategoria.trim();
    if (limpa.length < 2) {
      Alert.alert('Nome inválido', 'Informe pelo menos 2 caracteres para a nova categoria.');
      return;
    }

    setSalvandoCategoria(true);
    try {
      const res = await criarEPersistirCategoria(limpa);
      if (!res.sucesso) {
        Alert.alert('Atenção', res.mensagem || 'Não foi possível criar a categoria.');
        return;
      }

      setCategorias((prev) => {
        const existe = prev.some((c) => c.nome.toLowerCase() === res.nomeFinal.toLowerCase());
        if (existe) {
          return prev.map((c) =>
            c.nome.toLowerCase() === res.nomeFinal.toLowerCase() ? { ...c, oculta: false } : c,
          );
        }
        return [
          {
            id: `cat-${Date.now()}`,
            nome: res.nomeFinal,
            oculta: false,
            origem: res.sincronizadaAws ? 'dynamodb' : 'local',
          },
          ...prev,
        ];
      });

      setNomeNovaCategoria('');
      setModalVisivel(false);
      await carregarDados();
    } finally {
      setSalvandoCategoria(false);
    }
  };

  const lidarAlternarOculta = async (item: CategoriaAlimentoItem) => {
    const novoOcultar = !item.oculta;
    setCategorias((prev) =>
      prev.map((c) => (c.nome === item.nome ? { ...c, oculta: novoOcultar } : c)),
    );
    await alternarVisibilidadeCategoria(item.nome, novoOcultar);
  };

  const listaExibida = mostrarOcultas ? categorias : categoriasVisiveis;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 110 }}>
        <TouchableOpacity
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Voltar para Configurações"
          onPress={() => roteador.back()}
          style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14, minHeight: 48 }}
        >
          <Feather name="arrow-left" size={20} color={theme.primary} />
          <Text
            style={{
              color: theme.primary,
              fontWeight: 'bold',
              marginLeft: 8,
              fontSize: 15 * fontScale,
            }}
          >
            Voltar às Configurações
          </Text>
        </TouchableOpacity>

        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
            marginBottom: 10,
          }}
        >
          <View style={{ flex: 1, minWidth: 200 }}>
            <Text
              style={{
                fontWeight: '800',
                color: theme.primary,
                fontSize: tokens.typography.fontSize.xl * fontScale,
              }}
            >
              Categorias de Alimentos
            </Text>
            <Text style={{ color: theme.subtext, fontSize: 13 * fontScale, marginTop: 2 }}>
              Categorias sincronizadas com o AWS DynamoDB ({categoriasVisiveis.length} visíveis).
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => setModalVisivel(true)}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Adicionar Nova Categoria"
            style={{
              minHeight: 48,
              paddingHorizontal: 14,
              borderRadius: 12,
              backgroundColor: theme.secondary,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Feather name="plus-circle" size={18} color="#FFFFFF" />
            <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 13 * fontScale }}>
              Nova Categoria
            </Text>
          </TouchableOpacity>
        </View>

        {categoriasOcultas.length > 0 && (
          <TouchableOpacity
            onPress={() => setMostrarOcultas((v) => !v)}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Alternar exibição de categorias ocultas"
            style={{
              minHeight: 48,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 12,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: theme.border,
              backgroundColor: theme.surface,
              marginBottom: 14,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Feather
                name={mostrarOcultas ? 'eye' : 'eye-off'}
                size={16}
                color={theme.subtext}
              />
              <Text style={{ color: theme.subtext, fontSize: 12 * fontScale, fontWeight: '600' }}>
                {categoriasOcultas.length} categoria(s) oculta(s) na listagem
              </Text>
            </View>
            <Text style={{ color: theme.primary, fontSize: 12 * fontScale, fontWeight: '700' }}>
              {mostrarOcultas ? 'Ocultar novamente' : 'Gerenciar ocultas'}
            </Text>
          </TouchableOpacity>
        )}

        {carregando ? (
          <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 28 }} />
        ) : listaExibida.length === 0 ? (
          <View
            style={{
              backgroundColor: theme.surface,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: theme.border,
              padding: 24,
              alignItems: 'center',
            }}
          >
            <Feather name="tag" size={28} color={theme.subtext} />
            <Text
              style={{
                color: theme.text,
                fontWeight: '700',
                fontSize: 14 * fontScale,
                marginTop: 10,
              }}
            >
              Todas as categorias estão ocultas
            </Text>
            <Text
              style={{
                color: theme.subtext,
                fontSize: 12 * fontScale,
                textAlign: 'center',
                marginTop: 4,
              }}
            >
              Adicione uma Nova Categoria ou reexiba as ocultas acima.
            </Text>
          </View>
        ) : (
          listaExibida.map((cat) => {
            const qtd = contagem[cat.nome] || 0;
            return (
              <View
                key={cat.id}
                style={{
                  backgroundColor: theme.surface,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: cat.oculta ? `${theme.subtext}55` : theme.border,
                  paddingVertical: 10,
                  paddingLeft: 14,
                  paddingRight: 8,
                  marginBottom: 10,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  opacity: cat.oculta ? 0.65 : 1,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10 }}>
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      backgroundColor: `${theme.primary}12`,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Feather name="tag" size={18} color={theme.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: '700', color: theme.text, fontSize: 14 * fontScale }}>
                      {cat.nome}
                    </Text>
                    <Text style={{ color: theme.subtext, fontSize: 11.5 * fontScale, marginTop: 2 }}>
                      {cat.origem === 'dynamodb' ? 'AWS DynamoDB' : 'Catálogo local'} • {qtd} un.
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={() => lidarAlternarOculta(cat)}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={
                    cat.oculta
                      ? `Exibir categoria ${cat.nome}`
                      : `Ocultar categoria ${cat.nome}`
                  }
                  style={{
                    minWidth: 48,
                    minHeight: 48,
                    borderRadius: 10,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Feather
                    name={cat.oculta ? 'eye' : 'eye-off'}
                    size={18}
                    color={cat.oculta ? theme.secondary : theme.subtext}
                  />
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </ScrollView>

      <Modal
        visible={modalVisivel}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisivel(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            justifyContent: 'center',
            padding: 20,
          }}
        >
          <View
            style={{
              backgroundColor: theme.surface,
              borderRadius: 16,
              padding: 18,
              borderWidth: 1,
              borderColor: theme.border,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 12,
              }}
            >
              <Text style={{ fontSize: 16 * fontScale, fontWeight: '800', color: theme.primary }}>
                Nova Categoria
              </Text>
              <TouchableOpacity
                onPress={() => setModalVisivel(false)}
                style={{
                  minWidth: 48,
                  minHeight: 48,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                accessibilityRole="button"
                accessibilityLabel="Fechar modal"
              >
                <Feather name="x" size={20} color={theme.subtext} />
              </TouchableOpacity>
            </View>

            <AppInput
              rotulo="Nome da Categoria *"
              placeholder="Ex: Frutas e Legumes, Bebidas, Frios..."
              value={nomeNovaCategoria}
              onChangeText={setNomeNovaCategoria}
            />

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 6 }}>
              <TouchableOpacity
                onPress={() => setModalVisivel(false)}
                disabled={salvandoCategoria}
                style={{
                  flex: 1,
                  minHeight: 48,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: theme.border,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ color: theme.subtext, fontWeight: '700', fontSize: 13 * fontScale }}>
                  Cancelar
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={adicionarNovaCategoria}
                disabled={salvandoCategoria}
                style={{
                  flex: 1,
                  minHeight: 48,
                  borderRadius: 12,
                  backgroundColor: theme.primary,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {salvandoCategoria ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 13 * fontScale }}>
                    Salvar Categoria
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
