// src/app/settings-donors.tsx
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAppTheme } from '../context/ThemeContext';
import { AppInput } from '../components/common/AppInput';
import { AppDateInput } from '../components/common/AppDateInput';
import { AppButton } from '../components/common/AppButton';
import { formatarDataDDMMAAAA } from '../utils/dateValidation';
import {
  DoadorRegistro,
  excluirDoador,
  listarDoadores,
  salvarDoador,
} from '../services/entitiesCrudService';

export default function SettingsDonorsScreen() {
  const roteador = useRouter();
  const { theme, tokens, fontScale } = useAppTheme();

  const [doadores, setDoadores] = useState<DoadorRegistro[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  // Modal Criar / Editar
  const [modalFormVisivel, setModalFormVisivel] = useState(false);
  const [idEdicao, setIdEdicao] = useState<string | undefined>(undefined);
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [tipo, setTipo] = useState<'PF' | 'PJ'>('PF');
  const [documento, setDocumento] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [dataCadastro, setDataCadastro] = useState(formatarDataDDMMAAAA(new Date()));
  const [observacoes, setObservacoes] = useState('');
  const [statusAtivo, setStatusAtivo] = useState(true);

  // Modal Confirmar Exclusão
  const [alvoExclusao, setAlvoExclusao] = useState<DoadorRegistro | null>(null);

  const carregarLista = useCallback(async () => {
    setCarregando(true);
    try {
      const lista = await listarDoadores();
      setDoadores(lista);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void carregarLista();
    }, 0);
    return () => clearTimeout(timer);
  }, [carregarLista]);

  const abrirModalNovo = () => {
    setIdEdicao(undefined);
    setNomeCompleto('');
    setTipo('PF');
    setDocumento('');
    setTelefone('');
    setEmail('');
    setDataCadastro(formatarDataDDMMAAAA(new Date()));
    setObservacoes('');
    setStatusAtivo(true);
    setModalFormVisivel(true);
  };

  const abrirModalEditar = (item: DoadorRegistro) => {
    setIdEdicao(item.id);
    setNomeCompleto(item.nome_completo);
    setTipo(item.tipo);
    setDocumento(item.documento);
    setTelefone(item.telefone);
    setEmail(item.email);
    setDataCadastro(item.data_cadastro || formatarDataDDMMAAAA(new Date()));
    setObservacoes(item.observacoes);
    setStatusAtivo(item.status_ativo);
    setModalFormVisivel(true);
  };

  const lidarSalvar = async () => {
    if (!nomeCompleto.trim()) {
      Alert.alert('Campo obrigatório', 'Informe o nome completo ou razão social do doador.');
      return;
    }

    setSalvando(true);
    try {
      const listaAtualizada = await salvarDoador({
        id: idEdicao,
        nome_completo: nomeCompleto.trim(),
        tipo,
        documento: documento.trim(),
        telefone: telefone.trim(),
        email: email.trim(),
        data_cadastro: dataCadastro.trim() || formatarDataDDMMAAAA(new Date()),
        observacoes: observacoes.trim(),
        status_ativo: statusAtivo,
      });
      setDoadores(listaAtualizada);
      setModalFormVisivel(false);
    } finally {
      setSalvando(false);
    }
  };

  const confirmarExclusao = async () => {
    if (!alvoExclusao) return;
    const idRemover = alvoExclusao.id;
    setAlvoExclusao(null);
    const listaAtualizada = await excluirDoador(idRemover);
    setDoadores(listaAtualizada);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 110 }}>
        <TouchableOpacity
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Voltar para Configurações"
          onPress={() => roteador.back()}
          style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14, minHeight: 48 }}
        >
          <Feather name="arrow-left" size={20} color="#1E3A8A" />
          <Text style={{ color: '#1E3A8A', fontWeight: 'bold', marginLeft: 8, fontSize: 15 * fontScale }}>
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
            marginBottom: 16,
          }}
        >
          <View style={{ flex: 1, minWidth: 190 }}>
            <Text
              style={{
                fontWeight: '800',
                color: '#1E3A8A',
                fontSize: tokens.typography.fontSize.xl * fontScale,
              }}
            >
              Doadores Cadastrados
            </Text>
            <Text style={{ color: theme.subtext, fontSize: 13 * fontScale, marginTop: 2 }}>
              Gerencie parceiros físicos e jurídicos ({doadores.length} registro(s)).
            </Text>
          </View>

          <TouchableOpacity
            onPress={abrirModalNovo}
            accessibilityRole="button"
            accessibilityLabel="Adicionar novo doador"
            style={{
              minHeight: 48,
              paddingHorizontal: 14,
              borderRadius: 12,
              backgroundColor: '#10B981',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Feather name="user-plus" size={18} color="#FFFFFF" />
            <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 13 * fontScale }}>
              Novo Doador
            </Text>
          </TouchableOpacity>
        </View>

        {carregando ? (
          <ActivityIndicator size="large" color="#1E3A8A" style={{ marginTop: 28 }} />
        ) : doadores.length === 0 ? (
          <View
            style={{
              backgroundColor: theme.surface,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: theme.border,
              padding: 26,
              alignItems: 'center',
            }}
          >
            <Feather name="users" size={30} color={theme.subtext} />
            <Text style={{ color: theme.text, fontWeight: '700', fontSize: 14 * fontScale, marginTop: 10 }}>
              Nenhum doador cadastrado
            </Text>
            <Text style={{ color: theme.subtext, fontSize: 12 * fontScale, textAlign: 'center', marginTop: 4 }}>
              Toque em Novo Doador para cadastrar o primeiro parceiro.
            </Text>
          </View>
        ) : (
          doadores.map((doador) => (
            <View
              key={doador.id}
              style={{
                backgroundColor: theme.surface,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: theme.border,
                borderLeftWidth: 4,
                borderLeftColor: doador.status_ativo ? '#10B981' : theme.subtext,
                padding: 14,
                marginBottom: 12,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 4 }}>
                    <View
                      style={{
                        backgroundColor: '#1E3A8A15',
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                        borderRadius: 6,
                      }}
                    >
                      <Text style={{ color: '#1E3A8A', fontWeight: '800', fontSize: 11 * fontScale }}>
                        {doador.tipo === 'PJ' ? 'Pessoa Jurídica' : 'Pessoa Física'}
                      </Text>
                    </View>
                    <Text style={{ color: doador.status_ativo ? '#10B981' : '#DC2626', fontWeight: '700', fontSize: 11 * fontScale }}>
                      {doador.status_ativo ? 'Ativo' : 'Inativo'}
                    </Text>
                  </View>

                  <Text style={{ fontWeight: '800', color: theme.text, fontSize: 15 * fontScale }}>
                    {doador.nome_completo}
                  </Text>

                  {doador.documento ? (
                    <Text style={{ color: theme.subtext, fontSize: 12 * fontScale, marginTop: 3 }}>
                      Documento: {doador.documento}
                    </Text>
                  ) : null}

                  {doador.telefone || doador.email ? (
                    <Text style={{ color: theme.subtext, fontSize: 12 * fontScale, marginTop: 2 }}>
                      {[doador.telefone, doador.email].filter(Boolean).join(' • ')}
                    </Text>
                  ) : null}

                  <Text style={{ color: theme.subtext, fontSize: 11.5 * fontScale, marginTop: 3 }}>
                    Cadastro: {doador.data_cadastro}
                  </Text>

                  {doador.observacoes ? (
                    <Text style={{ color: theme.text, fontSize: 12 * fontScale, marginTop: 6 }}>
                      {doador.observacoes}
                    </Text>
                  ) : null}
                </View>

                <View style={{ flexDirection: 'row', gap: 4 }}>
                  <TouchableOpacity
                    onPress={() => abrirModalEditar(doador)}
                    accessibilityRole="button"
                    accessibilityLabel={`Editar doador ${doador.nome_completo}`}
                    style={{
                      minWidth: 48,
                      minHeight: 48,
                      borderRadius: 10,
                      backgroundColor: '#1E3A8A12',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Feather name="edit-2" size={18} color="#1E3A8A" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setAlvoExclusao(doador)}
                    accessibilityRole="button"
                    accessibilityLabel={`Excluir doador ${doador.nome_completo}`}
                    style={{
                      minWidth: 48,
                      minHeight: 48,
                      borderRadius: 10,
                      backgroundColor: '#DC262612',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Feather name="trash-2" size={18} color="#DC2626" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Modal Criar / Editar Doador */}
      <Modal
        visible={modalFormVisivel}
        transparent
        animationType="slide"
        onRequestClose={() => setModalFormVisivel(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'center', padding: 16 }}>
          <View
            style={{
              backgroundColor: theme.surface,
              borderRadius: 18,
              borderWidth: 1,
              borderColor: theme.border,
              padding: 18,
              maxHeight: '90%',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={{ fontSize: 17 * fontScale, fontWeight: '800', color: '#1E3A8A' }}>
                {idEdicao ? 'Editar Doador' : 'Novo Doador'}
              </Text>
              <TouchableOpacity
                onPress={() => setModalFormVisivel(false)}
                style={{ minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center' }}
                accessibilityRole="button"
                accessibilityLabel="Fechar formulário"
              >
                <Feather name="x" size={20} color={theme.subtext} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <AppInput
                rotulo="Nome Completo ou Razão Social *"
                placeholder="Ex: Maria Silva ou Mercado Bom Preço"
                value={nomeCompleto}
                onChangeText={setNomeCompleto}
              />

              <Text style={{ fontWeight: '600', color: theme.text, fontSize: 13 * fontScale, marginBottom: 6 }}>
                Tipo de Doador
              </Text>
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
                {(['PF', 'PJ'] as const).map((opcao) => {
                  const ativo = tipo === opcao;
                  return (
                    <TouchableOpacity
                      key={opcao}
                      onPress={() => setTipo(opcao)}
                      style={{
                        flex: 1,
                        minHeight: 48,
                        borderRadius: 12,
                        borderWidth: 1.5,
                        borderColor: ativo ? '#1E3A8A' : theme.border,
                        backgroundColor: ativo ? '#1E3A8A14' : theme.background,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text style={{ color: ativo ? '#1E3A8A' : theme.text, fontWeight: '700', fontSize: 13 * fontScale }}>
                        {opcao === 'PF' ? 'Pessoa Física (PF)' : 'Pessoa Jurídica (PJ)'}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <AppInput
                rotulo={tipo === 'PJ' ? 'CNPJ' : 'CPF (opcional LGPD)'}
                placeholder={tipo === 'PJ' ? '00.000.000/0001-00' : '000.000.000-00'}
                value={documento}
                onChangeText={setDocumento}
              />

              <AppInput
                rotulo="Telefone / WhatsApp"
                placeholder="(11) 99999-9999"
                keyboardType="phone-pad"
                value={telefone}
                onChangeText={setTelefone}
              />

              <AppInput
                rotulo="E-mail de Contato"
                placeholder="contato@exemplo.com"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />

              <AppDateInput
                rotulo="Data de Cadastro (DD/MM/AAAA)"
                value={dataCadastro}
                onChangeText={setDataCadastro}
              />

              <AppInput
                rotulo="Observações"
                placeholder="Frequência de doação, observações logísticas..."
                value={observacoes}
                onChangeText={setObservacoes}
              />

              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  minHeight: 48,
                  paddingHorizontal: 12,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: theme.border,
                  marginBottom: 16,
                }}
              >
                <Text style={{ color: theme.text, fontWeight: '700', fontSize: 13 * fontScale }}>
                  Cadastro Ativo
                </Text>
                <Switch
                  value={statusAtivo}
                  onValueChange={setStatusAtivo}
                  trackColor={{ false: theme.border, true: '#10B981' }}
                />
              </View>

              <AppButton
                title={idEdicao ? 'Salvar Alterações' : 'Cadastrar Doador'}
                variant="secondary"
                loading={salvando}
                onPress={lidarSalvar}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal Confirmar Exclusão */}
      <Modal
        visible={Boolean(alvoExclusao)}
        transparent
        animationType="fade"
        onRequestClose={() => setAlvoExclusao(null)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.65)', justifyContent: 'center', padding: 20 }}>
          <View
            style={{
              backgroundColor: theme.surface,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: theme.border,
              padding: 18,
            }}
          >
            <Text style={{ fontWeight: '800', color: '#DC2626', fontSize: 16 * fontScale, marginBottom: 6 }}>
              Confirmar Exclusão
            </Text>
            <Text style={{ color: theme.text, fontSize: 13 * fontScale, marginBottom: 16 }}>
              Deseja realmente excluir o doador &ldquo;{alvoExclusao?.nome_completo}&rdquo;?
            </Text>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                onPress={() => setAlvoExclusao(null)}
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
                <Text style={{ color: theme.text, fontWeight: '700' }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmarExclusao}
                style={{
                  flex: 1,
                  minHeight: 48,
                  borderRadius: 12,
                  backgroundColor: '#DC2626',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '800' }}>Excluir</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
