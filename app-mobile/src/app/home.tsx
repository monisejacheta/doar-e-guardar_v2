// app-mobile/src/app/home.tsx
import React, { useEffect, useState } from 'react';
import {
  Text,
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Modal,
  useWindowDimensions,
} from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Feather, Ionicons } from '@expo/vector-icons';
import { auth } from '../services/firebaseConfig';
import { useAppTheme } from '../context/ThemeContext';

interface ItemEstoqueConsulta {
  id_produto: string;
  nome_produto: string;
  codigo_barra: string;
  categoria: string;
  lote: string;
  local_armazenamento: string;
  sublocal: string;
  quantidade_pacotes: number;
  data_validade: string;
  data_entrada: string;
  status_validade: 'regular' | 'proximo_vencimento' | 'vencido';
  observacao?: string;
}

export default function HomeScreen() {
  const roteador = useRouter();
  const rotaAtual = usePathname();
  const { theme, tokens, fontScale } = useAppTheme();
  const { width: larguraJanela } = useWindowDimensions();

  const [usuarioNome, setUsuarioNome] = useState('Colaborador');
  const [fotoPerfil, setFotoPerfil] = useState<string | null>(null);
  const [erroCarregarFoto, setErroCarregarFoto] = useState(false);
  const [termoBusca, setTermoBusca] = useState('');
  const [modoExibicao, setModoExibicao] = useState<'lista' | 'grid'>('lista');

  // Estado do Modal de Detalhes
  const [itemSelecionado, setItemSelecionado] = useState<ItemEstoqueConsulta | null>(null);
  const [modalVisivel, setModalVisivel] = useState(false);

  // Itens de estoque para consulta rápida (apenas leitura)
  const [itensEstoque] = useState<ItemEstoqueConsulta[]>([
    {
      id_produto: 'prod_001',
      nome_produto: 'Leite Integral UHT 1L (Líder)',
      codigo_barra: '7891000100103',
      categoria: 'Laticínios',
      lote: 'LOTE-2026-L01',
      local_armazenamento: 'Geladeira 1',
      sublocal: 'Prat. Central',
      quantidade_pacotes: 6,
      data_entrada: '10/10/2026',
      data_validade: '24/10/2026',
      status_validade: 'proximo_vencimento',
      observacao: 'Consumir com urgência na preparação dos lanches matinais.',
    },
    {
      id_produto: 'prod_002',
      nome_produto: 'Arroz Agulhinha Tipo 1 5kg (Camil)',
      codigo_barra: '7891000200204',
      categoria: 'Grãos e Cereais',
      lote: 'LOTE-AR-88',
      local_armazenamento: 'Armário A',
      sublocal: 'Prat. 2',
      quantidade_pacotes: 48,
      data_entrada: '05/10/2026',
      data_validade: '15/04/2027',
      status_validade: 'regular',
      observacao: 'Fardo fechado em embalagem secundária protegida contra umidade.',
    },
    {
      id_produto: 'prod_003',
      nome_produto: 'Feijão Carioca 1kg (Kicaldo)',
      codigo_barra: '7891000300305',
      categoria: 'Grãos e Cereais',
      lote: 'LOTE-FJ-12',
      local_armazenamento: 'Armário A',
      sublocal: 'Prat. 1',
      quantidade_pacotes: 30,
      data_entrada: '08/10/2026',
      data_validade: '10/01/2027',
      status_validade: 'regular',
      observacao: 'Doação de campanha comunitária paroquial.',
    },
    {
      id_produto: 'prod_004',
      nome_produto: 'Macarrão Espaguete 500g (Barilla)',
      codigo_barra: '7891000400406',
      categoria: 'Massas',
      lote: 'LOTE-MC-04',
      local_armazenamento: 'Armário B',
      sublocal: 'Prat. 3',
      quantidade_pacotes: 25,
      data_entrada: '12/09/2026',
      data_validade: '02/11/2026',
      status_validade: 'proximo_vencimento',
      observacao: 'Lote prioritário no critério FEFO da despensa.',
    },
    {
      id_produto: 'prod_005',
      nome_produto: 'Óleo de Soja 900ml (Soya)',
      codigo_barra: '7891000500507',
      categoria: 'Óleos e Gorduras',
      lote: 'LOTE-OL-30',
      local_armazenamento: 'Armário A',
      sublocal: 'Prat. 4',
      quantidade_pacotes: 12,
      data_entrada: '14/10/2026',
      data_validade: '30/08/2027',
      status_validade: 'regular',
      observacao: 'Armazenado ao abrigo da luz solar direta.',
    },
    {
      id_produto: 'prod_006',
      nome_produto: 'Açúcar Refinado 1kg (União)',
      codigo_barra: '7891000600608',
      categoria: 'Mercearia Doce',
      lote: 'LOTE-AC-19',
      local_armazenamento: 'Armário B',
      sublocal: 'Prat. 1',
      quantidade_pacotes: 18,
      data_entrada: '16/10/2026',
      data_validade: '12/12/2027',
      status_validade: 'regular',
      observacao: 'Pacotes íntegros sem rompimento de lacre.',
    },
  ]);

  useEffect(() => {
    const desinscrever = auth.onAuthStateChanged((user) => {
      if (user) {
        setUsuarioNome(user.displayName || user.email?.split('@')[0] || 'Colaborador');
        if (user.photoURL) {
          setFotoPerfil(user.photoURL);
          setErroCarregarFoto(false);
        }
      }
    });

    return () => desinscrever();
  }, []);

  const abrirDetalhesProduto = (item: ItemEstoqueConsulta) => {
    setItemSelecionado(item);
    setModalVisivel(true);
  };

  const fecharDetalhesProduto = () => {
    setModalVisivel(false);
    setItemSelecionado(null);
  };

  // Widgets da Barra Inferior
  const widgetsInferiores = [
    { nome: 'Início', icone: 'home', rota: '/home' },
    { nome: 'Estoque', icone: 'package', rota: '/stock' },
    { nome: 'Dora IA', icone: 'cpu', rota: '/dora' },
    { nome: 'Avisos', icone: 'bell', rota: '/notifications' },
    { nome: 'Perfil', icone: 'user', rota: '/profile' },
  ];

  const itensFiltrados = itensEstoque.filter((item) =>
    item.nome_produto.toLowerCase().includes(termoBusca.toLowerCase()) ||
    item.codigo_barra.includes(termoBusca) ||
    item.local_armazenamento.toLowerCase().includes(termoBusca.toLowerCase()) ||
    item.lote.toLowerCase().includes(termoBusca.toLowerCase())
  );

  // Grid de 3 colunas
  const paddingHorizontalTotal = 40;
  const espacamentoGrid = 8;
  const larguraCardGrid = (larguraJanela - paddingHorizontalTotal - espacamentoGrid * 2) / 3;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView
        contentContainerStyle={{
          padding: 20,
          paddingBottom: 96,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Cabeçalho Superior */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20,
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

          {/* Botão de Perfil */}
          <TouchableOpacity
            onPress={() => roteador.push('/profile')}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Abrir perfil do colaborador e configurações"
            style={{
              width: 50,
              height: 50,
              borderRadius: 25,
              backgroundColor: '#E5E7EB',
              borderWidth: 2,
              borderColor: '#10B981',
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

        {/* Alerta Informativo FEFO */}
        <View
          style={{
            backgroundColor: '#FFFBEB',
            borderRadius: 16,
            padding: 16,
            borderLeftWidth: 5,
            borderLeftColor: '#F59E0B',
            marginBottom: 20,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 3,
            elevation: 1,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
            <Feather name="alert-triangle" size={18} color="#D97706" style={{ marginRight: 8 }} />
            <Text style={{ fontWeight: '700', color: '#92400E', fontSize: 14 * fontScale }}>
              Critério FEFO Ativo: 2 itens com validade próxima
            </Text>
          </View>
          <Text style={{ color: '#B45309', fontSize: 12 * fontScale, lineHeight: 18 }}>
            Toque nos itens sinalizados em âmbar para conferir localização exata e dados do lote.
          </Text>
        </View>

        {/* Barra de Pesquisa e Alternador Lista/Grade */}
        <View style={{ marginBottom: 16 }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 10,
            }}
          >
            <Text
              style={{
                color: theme.text,
                fontSize: 16 * fontScale,
                fontWeight: '700',
              }}
            >
              Consulta Rápida do Estoque
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
                  minWidth: 44,
                  minHeight: 38,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: modoExibicao === 'lista' ? '#FFFFFF' : 'transparent',
                  borderRadius: 8,
                  shadowColor: modoExibicao === 'lista' ? '#000' : 'transparent',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: modoExibicao === 'lista' ? 0.08 : 0,
                  shadowRadius: 2,
                  elevation: modoExibicao === 'lista' ? 1 : 0,
                }}
              >
                <Feather
                  name="list"
                  size={18}
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
                  minWidth: 44,
                  minHeight: 38,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: modoExibicao === 'grid' ? '#FFFFFF' : 'transparent',
                  borderRadius: 8,
                  shadowColor: modoExibicao === 'grid' ? '#000' : 'transparent',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: modoExibicao === 'grid' ? 0.08 : 0,
                  shadowRadius: 2,
                  elevation: modoExibicao === 'grid' ? 1 : 0,
                }}
              >
                <Ionicons
                  name="grid-outline"
                  size={18}
                  color={modoExibicao === 'grid' ? '#1E3A8A' : '#6B7280'}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Campo de Busca */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#FFFFFF',
              borderRadius: 12,
              borderWidth: 1.5,
              borderColor: '#E5E7EB',
              paddingHorizontal: 12,
              height: 48,
            }}
          >
            <Feather name="search" size={18} color="#9CA3AF" style={{ marginRight: 8 }} />
            <TextInput
              placeholder="Buscar por produto, EAN, lote ou local..."
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
              <TouchableOpacity
                onPress={() => setTermoBusca('')}
                style={{ padding: 4 }}
                accessibilityLabel="Limpar pesquisa"
              >
                <Feather name="x-circle" size={16} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* LISTA TOUCHABLE */}
        {modoExibicao === 'lista' ? (
          <View style={{ gap: 12 }}>
            {itensFiltrados.map((item) => {
              const isAlerta = item.status_validade === 'proximo_vencimento';
              return (
                <TouchableOpacity
                  key={item.id_produto}
                  onPress={() => abrirDetalhesProduto(item)}
                  activeOpacity={0.7}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={`Visualizar detalhes de ${item.nome_produto}, saldo de ${item.quantidade_pacotes} pacotes em ${item.local_armazenamento}`}
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: 16,
                    padding: 16,
                    borderWidth: 1.5,
                    borderColor: isAlerta ? '#FCD34D' : '#E5E7EB',
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
                      marginBottom: 8,
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
                      <Text style={{ fontSize: 11 * fontScale, color: '#6B7280', marginTop: 2 }}>
                        EAN: {item.codigo_barra} • {item.categoria}
                      </Text>
                    </View>

                    <View
                      style={{
                        backgroundColor: '#EFF6FF',
                        borderRadius: 10,
                        paddingVertical: 4,
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
                        {item.quantidade_pacotes}
                      </Text>
                      <Text
                        style={{
                          fontSize: 9 * fontScale,
                          color: '#1E3A8A',
                          fontWeight: '600',
                        }}
                      >
                        pacotes
                      </Text>
                    </View>
                  </View>

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
                      <Feather name="box" size={13} color="#4B5563" style={{ marginRight: 5 }} />
                      <Text
                        style={{
                          fontSize: 11 * fontScale,
                          color: '#4B5563',
                          fontWeight: '500',
                        }}
                      >
                        {item.local_armazenamento} ({item.sublocal})
                      </Text>
                    </View>

                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: isAlerta ? '#FEF3C7' : '#F3F4F6',
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 8,
                      }}
                    >
                      <Feather
                        name={isAlerta ? 'alert-circle' : 'calendar'}
                        size={12}
                        color={isAlerta ? '#B45309' : '#4B5563'}
                        style={{ marginRight: 4 }}
                      />
                      <Text
                        style={{
                          fontSize: 10 * fontScale,
                          fontWeight: isAlerta ? '700' : '500',
                          color: isAlerta ? '#B45309' : '#4B5563',
                        }}
                      >
                        Vence: {item.data_validade}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          /* GRADE TOUCHABLE (3 POR LINHA) */
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: espacamentoGrid,
            }}
          >
            {itensFiltrados.map((item) => {
              const isAlerta = item.status_validade === 'proximo_vencimento';
              return (
                <TouchableOpacity
                  key={item.id_produto}
                  onPress={() => abrirDetalhesProduto(item)}
                  activeOpacity={0.7}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={`Visualizar detalhes de ${item.nome_produto}, ${item.quantidade_pacotes} pacotes em ${item.local_armazenamento}`}
                  style={{
                    width: larguraCardGrid,
                    minHeight: 130,
                    backgroundColor: '#FFFFFF',
                    borderRadius: 12,
                    padding: 8,
                    borderWidth: 1.5,
                    borderColor: isAlerta ? '#FCD34D' : '#E5E7EB',
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
                          {item.quantidade_pacotes}p
                        </Text>
                      </View>
                      {isAlerta ? (
                        <Feather name="alert-triangle" size={13} color="#D97706" />
                      ) : (
                        <Feather name="check-circle" size={13} color="#10B981" />
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
                      {item.local_armazenamento}
                    </Text>
                    <Text
                      style={{
                        fontSize: 8.5 * fontScale,
                        fontWeight: isAlerta ? '700' : '400',
                        color: isAlerta ? '#B45309' : '#9CA3AF',
                        marginTop: 1,
                      }}
                      numberOfLines={1}
                    >
                      {item.data_validade.slice(0, 5)}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {itensFiltrados.length === 0 && (
          <View
            style={{
              padding: 28,
              alignItems: 'center',
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              borderWidth: 1,
              borderColor: '#E5E7EB',
              marginTop: 8,
            }}
          >
            <Feather name="inbox" size={32} color="#9CA3AF" style={{ marginBottom: 8 }} />
            <Text style={{ fontWeight: '700', color: '#374151', fontSize: 13 * fontScale }}>
              Nenhum produto encontrado
            </Text>
            <Text style={{ color: '#9CA3AF', fontSize: 11 * fontScale, marginTop: 2 }}>
              Tente buscar por outro termo ou código de barras.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* MODAL DE INFORMAÇÕES COMPLETAS DO PRODUTO */}
      <Modal
        visible={modalVisivel}
        transparent={true}
        animationType="fade"
        onRequestClose={fecharDetalhesProduto}
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
              padding: 22,
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
                marginBottom: 16,
                borderBottomWidth: 1,
                borderBottomColor: '#F3F4F6',
                paddingBottom: 12,
              }}
            >
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text
                  style={{
                    fontSize: 16 * fontScale,
                    fontWeight: '800',
                    color: '#1E3A8A', // Azul Guardar
                    lineHeight: 22,
                  }}
                >
                  {itemSelecionado?.nome_produto}
                </Text>
                <Text
                  style={{
                    fontSize: 11 * fontScale,
                    color: '#6B7280',
                    marginTop: 2,
                    fontWeight: '500',
                  }}
                >
                  {itemSelecionado?.categoria}
                </Text>
              </View>

              <TouchableOpacity
                onPress={fecharDetalhesProduto}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Fechar janela de detalhes do produto"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: '#F3F4F6',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Feather name="x" size={20} color="#4B5563" />
              </TouchableOpacity>
            </View>

            {/* Informações Estruturadas do Produto */}
            <View style={{ gap: 10, marginBottom: 18 }}>
              {/* Saldo de Pacotes */}
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  backgroundColor: '#EFF6FF',
                  padding: 12,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: '#BFDBFE',
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Feather name="layers" size={16} color="#1E3A8A" style={{ marginRight: 8 }} />
                  <Text style={{ fontSize: 12 * fontScale, color: '#1E3A8A', fontWeight: '600' }}>
                    Saldo em Estoque:
                  </Text>
                </View>
                <Text style={{ fontSize: 13 * fontScale, fontWeight: '800', color: '#1E3A8A' }}>
                  {itemSelecionado?.quantidade_pacotes} pacotes
                </Text>
              </View>

              {/* Código EAN e Lote */}
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  paddingVertical: 4,
                }}
              >
                <Text style={{ fontSize: 12 * fontScale, color: '#6B7280' }}>Código de Barras:</Text>
                <Text style={{ fontSize: 12 * fontScale, fontWeight: '700', color: '#111827' }}>
                  {itemSelecionado?.codigo_barra}
                </Text>
              </View>

              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  paddingVertical: 4,
                }}
              >
                <Text style={{ fontSize: 12 * fontScale, color: '#6B7280' }}>Código do Lote:</Text>
                <Text style={{ fontSize: 12 * fontScale, fontWeight: '700', color: '#111827' }}>
                  {itemSelecionado?.lote}
                </Text>
              </View>

              {/* Localização Física (Armário / Geladeira) */}
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  paddingVertical: 4,
                }}
              >
                <Text style={{ fontSize: 12 * fontScale, color: '#6B7280' }}>Local Físico:</Text>
                <Text style={{ fontSize: 12 * fontScale, fontWeight: '700', color: '#111827' }}>
                  {itemSelecionado?.local_armazenamento} ({itemSelecionado?.sublocal})
                </Text>
              </View>

              {/* Entrada e Validade FEFO */}
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  paddingVertical: 4,
                }}
              >
                <Text style={{ fontSize: 12 * fontScale, color: '#6B7280' }}>Data de Entrada:</Text>
                <Text style={{ fontSize: 12 * fontScale, fontWeight: '600', color: '#374151' }}>
                  {itemSelecionado?.data_entrada}
                </Text>
              </View>

              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  paddingVertical: 4,
                }}
              >
                <Text style={{ fontSize: 12 * fontScale, color: '#6B7280' }}>Data de Validade:</Text>
                <Text
                  style={{
                    fontSize: 12 * fontScale,
                    fontWeight: '800',
                    color:
                      itemSelecionado?.status_validade === 'proximo_vencimento'
                        ? '#D97706'
                        : '#10B981',
                  }}
                >
                  {itemSelecionado?.data_validade}
                </Text>
              </View>

              {/* Observação / Notas */}
              {itemSelecionado?.observacao && (
                <View
                  style={{
                    backgroundColor: '#F9FAFB',
                    padding: 10,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: '#E5E7EB',
                    marginTop: 4,
                  }}
                >
                  <Text style={{ fontSize: 11 * fontScale, color: '#6B7280', fontStyle: 'italic' }}>
                    "{itemSelecionado.observacao}"
                  </Text>
                </View>
              )}
            </View>

            {/* Botão de Fechar Modal */}
            <TouchableOpacity
              onPress={fecharDetalhesProduto}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Entendido, fechar detalhes"
              style={{
                minHeight: 48,
                backgroundColor: '#1E3A8A', // Azul Guardar
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 3,
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

      {/* Widgets Inferiores de Navegação */}
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