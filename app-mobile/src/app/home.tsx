// app-mobile/src/app/home.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  Text,
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Modal,
  ActivityIndicator,
  RefreshControl,
  useWindowDimensions,
} from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Feather, Ionicons } from '@expo/vector-icons';
import { auth } from '../services/firebaseConfig';
import { requisicaoApi } from '../services/api';
import { useAppTheme } from '../context/ThemeContext';

interface LoteDynamoDB {
  id_lote_produto: string;
  id_produto: string;
  nome_produto: string;
  categoria: string;
  codigo_barra_produto: string;
  numero_codigo_lote: string;
  quantidade_atual_pacote: number;
  quantidade_inicial_pacote?: number;
  estoque_minimo_pacote?: number;
  data_entrada_lote?: string;
  data_validade_lote: string;
  status_validade_lote: string;
  id_local_armazenamento?: string;
  local_descricao: string;
  observacao?: string;
}

export default function HomeScreen() {
  const roteador = useRouter();
  const rotaAtual = usePathname();
  const { theme, tokens, fontScale } = useAppTheme();
  const { width: larguraJanela } = useWindowDimensions();

  // Estados do Usuário (Firebase Auth)
  const [usuarioNome, setUsuarioNome] = useState('Colaborador');
  const [fotoPerfil, setFotoPerfil] = useState<string | null>(null);
  const [erroCarregarFoto, setErroCarregarFoto] = useState(false);

  // Estados dos Dados Vindos do DynamoDB
  const [lotes, setLotes] = useState<LoteDynamoDB[]>([]);
  const [totalPacotesGeral, setTotalPacotesGeral] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [recarregando, setRecarregando] = useState(false);

  // Filtros e Visualização
  const [termoBusca, setTermoBusca] = useState('');
  const [modoExibicao, setModoExibicao] = useState<'lista' | 'grid'>('lista');

  // Estado do Modal de Detalhes
  const [itemSelecionado, setItemSelecionado] = useState<LoteDynamoDB | null>(null);
  const [modalVisivel, setModalVisivel] = useState(false);

  // Carrega os dados reais do DynamoDB via AWS Lambda
  const buscarEstoqueDynamoDB = useCallback(async () => {
    try {
      const resposta: any = await requisicaoApi('/api/estoque', {
        metodo: 'POST',
        dados: { modulo: 'estoque', acao: 'consultar_estoque' },
      });

      if (resposta?.sucesso && Array.isArray(resposta.lotes)) {
        setLotes(resposta.lotes);
        setTotalPacotesGeral(resposta.total_pacotes || 0);
      }
    } catch (erro) {
      console.warn('[DYNAMODB HOME] Falha ao recuperar estoque:', erro);
    } finally {
      setCarregando(false);
      setRecarregando(false);
    }
  }, []);

  useEffect(() => {
    // Escuta sessão ativa do Firebase
    const desinscrever = auth.onAuthStateChanged((user) => {
      if (user) {
        setUsuarioNome(user.displayName || user.email?.split('@')[0] || 'Colaborador');
        if (user.photoURL) {
          setFotoPerfil(user.photoURL);
          setErroCarregarFoto(false);
        }
      }
    });

    buscarEstoqueDynamoDB();

    return () => desinscrever();
  }, [buscarEstoqueDynamoDB]);

  // Totalizadores de Alerta Operacional
  const totalLotesVencendo = lotes.filter(
    (l) => l.status_validade_lote === 'próximo do vencimento'
  ).length;

  const totalItensCriticos = lotes.filter(
    (l) => (l.quantidade_atual_pacote || 0) < (l.estoque_minimo_pacote || 10)
  ).length;

  // Filtragem em tempo real na barra de busca
  const itensFiltrados = lotes.filter((item) => {
    const termo = termoBusca.toLowerCase();
    return (
      item.nome_produto?.toLowerCase().includes(termo) ||
      item.codigo_barra_produto?.includes(termo) ||
      item.local_descricao?.toLowerCase().includes(termo) ||
      item.numero_codigo_lote?.toLowerCase().includes(termo) ||
      item.categoria?.toLowerCase().includes(termo)
    );
  });

  const abrirDetalhes = (item: LoteDynamoDB) => {
    setItemSelecionado(item);
    setModalVisivel(true);
  };

  const fecharDetalhes = () => {
    setModalVisivel(false);
    setItemSelecionado(null);
  };

  // Cálculo de Grid (3 por linha)
  const paddingHorizontalTotal = 40;
  const espacamentoGrid = 8;
  const larguraCardGrid = (larguraJanela - paddingHorizontalTotal - espacamentoGrid * 2) / 3;

  // Widgets Fixos da Barra Inferior
  const widgetsInferiores = [
    { nome: 'Início', icone: 'home', rota: '/home' },
    { nome: 'Estoque', icone: 'package', rota: '/stock' },
    { nome: 'Dora IA', icone: 'cpu', rota: '/dora' },
    { nome: 'Avisos', icone: 'bell', rota: '/notifications' },
    { nome: 'Perfil', icone: 'user', rota: '/profile' },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView
        contentContainerStyle={{
          padding: 20,
          paddingBottom: 96,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={recarregando}
            onRefresh={() => {
              setRecarregando(true);
              buscarEstoqueDynamoDB();
            }}
            tintColor={theme.primary}
          />
        }
      >
        {/* Cabeçalho Superior com Perfil do Google */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
          }}
        >
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text
              style={{
                color: theme.subtext,
                fontSize: 12 * fontScale,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                fontWeight: '600',
              }}
            >
              Casa da Criança • Gestão de Estoque
            </Text>
            <Text
              style={{
                color: theme.primary,
                fontSize: 22 * fontScale,
                fontWeight: '800',
              }}
              numberOfLines={1}
            >
              Olá, {usuarioNome}
            </Text>
          </View>

          {/* Avatar com Foto do Google */}
          <TouchableOpacity
            onPress={() => roteador.push('/profile')}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Abrir perfil do usuário e configurações"
            style={{
              width: 50,
              height: 50,
              borderRadius: 25,
              backgroundColor: '#E5E7EB',
              borderWidth: 2,
              borderColor: '#10B981', // Verde Doar
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            {fotoPerfil && !erroCarregarFoto ? (
              <Image
                source={{
                  uri: fotoPerfil,
                  headers: { 'Referrer-Policy': 'no-referrer' },
                }}
                style={{ width: 50, height: 50 }}
                onError={() => setErroCarregarFoto(true)}
              />
            ) : (
              <Feather name="user" size={24} color="#4B5563" />
            )}
          </TouchableOpacity>
        </View>

        {/* Card Resumo do DynamoDB */}
        <View
          style={{
            backgroundColor: theme.primary,
            borderRadius: 16,
            padding: 16,
            marginBottom: 16,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
          }}
        >
          <View>
            <Text style={{ color: '#E0E7FF', fontSize: 12 * fontScale, fontWeight: '600' }}>
              Total no Banco DynamoDB
            </Text>
            <Text style={{ color: '#FFFFFF', fontSize: 24 * fontScale, fontWeight: '800', marginTop: 2 }}>
              {totalPacotesGeral} pacotes
            </Text>
          </View>
          <View style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 }}>
            <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 12 * fontScale }}>
              {lotes.length} lotes ativos
            </Text>
          </View>
        </View>

        {/* Card de Alertas FEFO & Estoque Mínimo */}
        {totalLotesVencendo > 0 && (
          <View
            style={{
              backgroundColor: '#FFFBEB',
              borderRadius: 16,
              padding: 14,
              borderLeftWidth: 5,
              borderLeftColor: '#F59E0B',
              marginBottom: 18,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 3,
              elevation: 1,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
              <Feather name="alert-triangle" size={16} color="#D97706" style={{ marginRight: 6 }} />
              <Text style={{ fontWeight: '700', color: '#92400E', fontSize: 13 * fontScale }}>
                Atenção FEFO: {totalLotesVencendo} lote(s) próximo(s) do vencimento
              </Text>
            </View>
            <Text style={{ color: '#B45309', fontSize: 11 * fontScale, lineHeight: 16 }}>
              Priorize os itens sinalizados em âmbar na preparação das refeições diárias.
            </Text>
          </View>
        )}

        {/* Cabeçalho da Seção de Busca e Alternador de Visão */}
        <View style={{ marginBottom: 14 }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 10,
            }}
          >
            <Text style={{ color: theme.text, fontSize: 16 * fontScale, fontWeight: '700' }}>
              Itens em Estoque ({itensFiltrados.length})
            </Text>

            {/* Alternador Lista / Grade */}
            <View
              style={{
                flexDirection: 'row',
                backgroundColor: '#F3F4F6',
                borderRadius: 10,
                padding: 2,
                borderWidth: 1,
                borderColor: '#E5E7EB',
              }}
            >
              <TouchableOpacity
                onPress={() => setModoExibicao('lista')}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Exibir estoque em lista detalhada"
                accessibilityState={{ selected: modoExibicao === 'lista' }}
                style={{
                  minWidth: 40,
                  minHeight: 34,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: modoExibicao === 'lista' ? '#FFFFFF' : 'transparent',
                  borderRadius: 8,
                  elevation: modoExibicao === 'lista' ? 1 : 0,
                }}
              >
                <Feather
                  name="list"
                  size={16}
                  color={modoExibicao === 'lista' ? '#1E3A8A' : '#6B7280'}
                />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setModoExibicao('grid')}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Exibir estoque em grade de 3 colunas"
                accessibilityState={{ selected: modoExibicao === 'grid' }}
                style={{
                  minWidth: 40,
                  minHeight: 34,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: modoExibicao === 'grid' ? '#FFFFFF' : 'transparent',
                  borderRadius: 8,
                  elevation: modoExibicao === 'grid' ? 1 : 0,
                }}
              >
                <Ionicons
                  name="grid-outline"
                  size={16}
                  color={modoExibicao === 'grid' ? '#1E3A8A' : '#6B7280'}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Campo de Entrada de Busca */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#FFFFFF',
              borderRadius: 12,
              borderWidth: 1.5,
              borderColor: '#E5E7EB',
              paddingHorizontal: 12,
              height: 46,
            }}
          >
            <Feather name="search" size={16} color="#9CA3AF" style={{ marginRight: 8 }} />
            <TextInput
              placeholder="Buscar por produto, lote, armário ou EAN..."
              placeholderTextColor="#9CA3AF"
              value={termoBusca}
              onChangeText={setTermoBusca}
              style={{
                flex: 1,
                fontSize: 13 * fontScale,
                color: theme.text,
              }}
            />
            {termoBusca.length > 0 && (
              <TouchableOpacity onPress={() => setTermoBusca('')} style={{ padding: 4 }}>
                <Feather name="x-circle" size={16} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Indicador de Carregamento */}
        {carregando ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={{ marginTop: 10, color: theme.subtext, fontSize: 13 * fontScale }}>
              Sincronizando dados com o DynamoDB...
            </Text>
          </View>
        ) : modoExibicao === 'lista' ? (
          /* MODO 1: Lista Detalhada */
          <View style={{ gap: 10 }}>
            {itensFiltrados.map((item) => {
              const isVencendo = item.status_validade_lote === 'próximo do vencimento';
              const isCritico = (item.quantidade_atual_pacote || 0) < (item.estoque_minimo_pacote || 10);

              return (
                <TouchableOpacity
                  key={item.id_lote_produto}
                  onPress={() => abrirDetalhes(item)}
                  activeOpacity={0.75}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={`${item.nome_produto}, saldo de ${item.quantidade_atual_pacote} pacotes em ${item.local_descricao}`}
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: 14,
                    padding: 14,
                    borderWidth: 1.5,
                    borderColor: isVencendo ? '#FCD34D' : isCritico ? '#FCA5A5' : '#E5E7EB',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.04,
                    shadowRadius: 3,
                    elevation: 1,
                  }}
                >
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: 6,
                    }}
                  >
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <Text
                        style={{
                          fontSize: 14 * fontScale,
                          fontWeight: '700',
                          color: '#111827',
                          lineHeight: 18,
                        }}
                      >
                        {item.nome_produto}
                      </Text>
                      <Text style={{ fontSize: 11 * fontScale, color: '#6B7280', marginTop: 1 }}>
                        Lote: {item.numero_codigo_lote} • {item.categoria}
                      </Text>
                    </View>

                    {/* Saldo de Pacotes */}
                    <View
                      style={{
                        backgroundColor: '#EFF6FF',
                        borderRadius: 8,
                        paddingVertical: 3,
                        paddingHorizontal: 8,
                        borderWidth: 1,
                        borderColor: '#BFDBFE',
                        alignItems: 'center',
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 13 * fontScale,
                          fontWeight: '800',
                          color: '#1E3A8A',
                        }}
                      >
                        {item.quantidade_atual_pacote}
                      </Text>
                      <Text style={{ fontSize: 9 * fontScale, color: '#1E3A8A', fontWeight: '600' }}>
                        pacotes
                      </Text>
                    </View>
                  </View>

                  {/* Linha Inferior: Localização e Vencimento */}
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingTop: 8,
                      borderTopWidth: 1,
                      borderTopColor: '#F3F4F6',
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Feather name="box" size={12} color="#4B5563" style={{ marginRight: 5 }} />
                      <Text style={{ fontSize: 11 * fontScale, color: '#4B5563', fontWeight: '500' }}>
                        {item.local_descricao}
                      </Text>
                    </View>

                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: isVencendo ? '#FEF3C7' : '#F3F4F6',
                        paddingHorizontal: 7,
                        paddingVertical: 3,
                        borderRadius: 6,
                      }}
                    >
                      <Feather
                        name={isVencendo ? 'alert-circle' : 'calendar'}
                        size={11}
                        color={isVencendo ? '#B45309' : '#4B5563'}
                        style={{ marginRight: 4 }}
                      />
                      <Text
                        style={{
                          fontSize: 10 * fontScale,
                          fontWeight: isVencendo ? '700' : '500',
                          color: isVencendo ? '#B45309' : '#4B5563',
                        }}
                      >
                        Vence: {item.data_validade_lote}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          /* MODO 2: Grade (3 Colunas por Linha) */
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: espacamentoGrid,
            }}
          >
            {itensFiltrados.map((item) => {
              const isVencendo = item.status_validade_lote === 'próximo do vencimento';
              return (
                <TouchableOpacity
                  key={item.id_lote_produto}
                  onPress={() => abrirDetalhes(item)}
                  activeOpacity={0.7}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={`Visualizar detalhes de ${item.nome_produto}`}
                  style={{
                    width: larguraCardGrid,
                    minHeight: 125,
                    backgroundColor: '#FFFFFF',
                    borderRadius: 12,
                    padding: 8,
                    borderWidth: 1.5,
                    borderColor: isVencendo ? '#FCD34D' : '#E5E7EB',
                    justifyContent: 'space-between',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.04,
                    shadowRadius: 2,
                    elevation: 1,
                  }}
                >
                  <View>
                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 4,
                      }}
                    >
                      <View
                        style={{
                          backgroundColor: '#EFF6FF',
                          borderRadius: 6,
                          paddingHorizontal: 5,
                          paddingVertical: 2,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 10 * fontScale,
                            fontWeight: '800',
                            color: '#1E3A8A',
                          }}
                        >
                          {item.quantidade_atual_pacote}p
                        </Text>
                      </View>
                      {isVencendo ? (
                        <Feather name="alert-triangle" size={12} color="#D97706" />
                      ) : (
                        <Feather name="check-circle" size={12} color="#10B981" />
                      )}
                    </View>

                    <Text
                      style={{
                        fontSize: 11 * fontScale,
                        fontWeight: '700',
                        color: '#111827',
                        lineHeight: 14,
                      }}
                      numberOfLines={2}
                    >
                      {item.nome_produto}
                    </Text>
                  </View>

                  <View style={{ borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 4 }}>
                    <Text
                      style={{
                        fontSize: 9 * fontScale,
                        color: '#6B7280',
                        fontWeight: '500',
                      }}
                      numberOfLines={1}
                    >
                      {item.local_descricao?.split('-')[0]?.trim()}
                    </Text>
                    <Text
                      style={{
                        fontSize: 8.5 * fontScale,
                        fontWeight: isVencendo ? '700' : '400',
                        color: isVencendo ? '#B45309' : '#9CA3AF',
                        marginTop: 1,
                      }}
                      numberOfLines={1}
                    >
                      {item.data_validade_lote?.slice(5)}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Estado Vazio de Busca */}
        {!carregando && itensFiltrados.length === 0 && (
          <View
            style={{
              padding: 28,
              alignItems: 'center',
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              borderWidth: 1,
              borderColor: '#E5E7EB',
              marginTop: 10,
            }}
          >
            <Feather name="inbox" size={32} color="#9CA3AF" style={{ marginBottom: 8 }} />
            <Text style={{ fontWeight: '700', color: '#374151', fontSize: 13 * fontScale }}>
              Nenhum lote encontrado
            </Text>
            <Text style={{ color: '#9CA3AF', fontSize: 11 * fontScale, marginTop: 2 }}>
              Tente buscar por outro termo, local ou código de barras.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* MODAL DE DETALHES COMPLETOS DO LOTE (DYNAMODB) */}
      <Modal
        visible={modalVisivel}
        transparent={true}
        animationType="fade"
        onRequestClose={fecharDetalhes}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.55)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
          }}
        >
          <View
            style={{
              width: '100%',
              maxWidth: 420,
              backgroundColor: '#FFFFFF',
              borderRadius: 20,
              padding: 20,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 10,
              elevation: 8,
            }}
          >
            {/* Topo do Modal */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: 14,
                borderBottomWidth: 1,
                borderBottomColor: '#F3F4F6',
                paddingBottom: 10,
              }}
            >
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text
                  style={{
                    fontSize: 16 * fontScale,
                    fontWeight: '800',
                    color: '#1E3A8A', // Azul Guardar
                    lineHeight: 20,
                  }}
                >
                  {itemSelecionado?.nome_produto}
                </Text>
                <Text style={{ fontSize: 11 * fontScale, color: '#6B7280', marginTop: 2, fontWeight: '500' }}>
                  Categoria: {itemSelecionado?.categoria}
                </Text>
              </View>

              <TouchableOpacity
                onPress={fecharDetalhes}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Fechar janela"
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 17,
                  backgroundColor: '#F3F4F6',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Feather name="x" size={18} color="#4B5563" />
              </TouchableOpacity>
            </View>

            {/* Informações Estruturadas do Lote */}
            <View style={{ gap: 8, marginBottom: 16 }}>
              {/* Saldo de Pacotes */}
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  backgroundColor: '#EFF6FF',
                  padding: 10,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: '#BFDBFE',
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Feather name="layers" size={15} color="#1E3A8A" style={{ marginRight: 6 }} />
                  <Text style={{ fontSize: 12 * fontScale, color: '#1E3A8A', fontWeight: '600' }}>
                    Saldo Disponível:
                  </Text>
                </View>
                <Text style={{ fontSize: 13 * fontScale, fontWeight: '800', color: '#1E3A8A' }}>
                  {itemSelecionado?.quantidade_atual_pacote} pacotes
                </Text>
              </View>

              {/* Código EAN e Lote */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 }}>
                <Text style={{ fontSize: 12 * fontScale, color: '#6B7280' }}>Código de Barras:</Text>
                <Text style={{ fontSize: 12 * fontScale, fontWeight: '700', color: '#111827' }}>
                  {itemSelecionado?.codigo_barra_produto}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 }}>
                <Text style={{ fontSize: 12 * fontScale, color: '#6B7280' }}>Número do Lote:</Text>
                <Text style={{ fontSize: 12 * fontScale, fontWeight: '700', color: '#111827' }}>
                  {itemSelecionado?.numero_codigo_lote}
                </Text>
              </View>

              {/* Localização Física (Armário / Geladeira) */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 }}>
                <Text style={{ fontSize: 12 * fontScale, color: '#6B7280' }}>Compartimento:</Text>
                <Text style={{ fontSize: 12 * fontScale, fontWeight: '700', color: '#111827' }}>
                  {itemSelecionado?.local_descricao}
                </Text>
              </View>

              {/* Data de Entrada e Validade FEFO */}
              {itemSelecionado?.data_entrada_lote && (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 }}>
                  <Text style={{ fontSize: 12 * fontScale, color: '#6B7280' }}>Data de Entrada:</Text>
                  <Text style={{ fontSize: 12 * fontScale, fontWeight: '600', color: '#374151' }}>
                    {itemSelecionado.data_entrada_lote}
                  </Text>
                </View>
              )}

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 }}>
                <Text style={{ fontSize: 12 * fontScale, color: '#6B7280' }}>Data de Validade (FEFO):</Text>
                <Text
                  style={{
                    fontSize: 12 * fontScale,
                    fontWeight: '800',
                    color:
                      itemSelecionado?.status_validade_lote === 'próximo do vencimento'
                        ? '#D97706'
                        : '#10B981',
                  }}
                >
                  {itemSelecionado?.data_validade_lote}
                </Text>
              </View>
            </View>

            {/* Botão de Fechar Modal */}
            <TouchableOpacity
              onPress={fecharDetalhes}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Fechar janela de detalhes"
              style={{
                minHeight: 46,
                backgroundColor: '#1E3A8A', // Azul Guardar
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center',
                elevation: 2,
              }}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 14 * fontScale }}>
                Fechar Visualização
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Widgets Inferiores Fixos de Navegação */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 68,
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1.5,
          borderTopColor: '#E5E7EB',
          flexDirection: 'row',
          justifyContent: 'space-around',
          alignItems: 'center',
          paddingBottom: 4,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.08,
          shadowRadius: 4,
          elevation: 8,
        }}
      >
        {widgetsInferiores.map((widget, idx) => {
          const ativo = rotaAtual === widget.rota;
          return (
            <TouchableOpacity
              key={idx}
              onPress={() => roteador.push(widget.rota as any)}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={`Ir para ${widget.nome}`}
              accessibilityState={{ selected: ativo }}
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: 48,
                minHeight: 48,
              }}
            >
              <Feather
                name={widget.icone as any}
                size={20}
                color={ativo ? '#1E3A8A' : '#6B7280'}
                style={{ marginBottom: 2 }}
              />
              <Text
                style={{
                  fontSize: 10 * fontScale,
                  fontWeight: ativo ? '700' : '500',
                  color: ativo ? '#1E3A8A' : '#6B7280',
                }}
              >
                {widget.nome}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}