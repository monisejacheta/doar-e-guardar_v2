// src/app/settings-institutions.tsx
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
  InstituicaoRegistro,
  excluirInstituicao,
  listarInstituicoes,
  salvarInstituicao,
} from '../services/entitiesCrudService';

const TIPOS_UNIDADE = ['Sede Principal', 'Unidade Escolar', 'Cozinha Parceira'];

export default function SettingsInstitutionsScreen() {
  const roteador = useRouter();
  const { theme, tokens, fontScale } = useAppTheme();

  const [instituicoes, setInstituicoes] = useState<InstituicaoRegistro[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  // Modal Criar / Editar
  const [modalFormVisivel, setModalFormVisivel] = useState(false);
  const [idEdicao, setIdEdicao] = useState<string | undefined>(undefined);
  const [nomeFantasia, setNomeFantasia] = useState('');
  const [razaoSocial, setRazaoSocial] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [tipoUnidade, setTipoUnidade] = useState('Sede Principal');
  const [endereco, setEndereco] = useState('');
  const [telefone, setTelefone] = useState('');
  const [responsavel, setResponsavel] = useState('');
  const [dataFundacao, setDataFundacao] = useState(formatarDataDDMMAAAA(new Date()));
  const [statusAtivo, setStatusAtivo] = useState(true);

  // Modal Confirmar Exclusão
  const [alvoExclusao, setAlvoExclusao] = useState<InstituicaoRegistro | null>(null);

  const carregarLista = useCallback(async () => {
    setCarregando(true);
    try {
      const lista = await listarInstituicoes();
      setInstituicoes(lista);
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
    setNomeFantasia('');
    setRazaoSocial('');
    setCnpj('');
    setTipoUnidade('Unidade Escolar');
    setEndereco('');
    setTelefone('');
    setResponsavel('');
    setDataFundacao(formatarDataDDMMAAAA(new Date()));
    setStatusAtivo(true);
    setModalFormVisivel(true);
  };

  const abrirModalEditar = (item: InstituicaoRegistro) => {
    setIdEdicao(item.id);
    setNomeFantasia(item.nome_fantasia);
    setRazaoSocial(item.razao_social);
    setCnpj(item.cnpj);
    setTipoUnidade(item.tipo_unidade || 'Unidade Parceira');
    setEndereco(item.endereco);
    setTelefone(item.telefone);
    setResponsavel(item.responsavel);
    setDataFundacao(item.data_fundacao || formatarDataDDMMAAAA(new Date()));
    setStatusAtivo(item.status_ativo);
    setModalFormVisivel(true);
  };

  const lidarSalvar = async () => {
    if (!nomeFantasia.trim()) {
      Alert.alert('Campo obrigatório', 'Informe o nome fantasia ou nome da unidade.');
      return;
    }

    setSalvando(true);
    try {
      const listaAtualizada = await salvarInstituicao({
        id: idEdicao,
        nome_fantasia: nomeFantasia.trim(),
        razao_social: razaoSocial.trim() || nomeFantasia.trim(),
        cnpj: cnpj.trim(),
        tipo_unidade: tipoUnidade,
        endereco: endereco.trim(),
        telefone: telefone.trim(),
        responsavel: responsavel.trim(),
        data_fundacao: dataFundacao.trim() || formatarDataDDMMAAAA(new Date()),
        status_ativo: statusAtivo,
      });
      setInstituicoes(listaAtualizada);
      setModalFormVisivel(false);
    } finally {
      setSalvando(false);
    }
  };

  const confirmarExclusao = async () => {
    if (!alvoExclusao) return;
    const idRemover = alvoExclusao.id;
    setAlvoExclusao(null);
    const listaAtualizada = await excluirInstituicao(idRemover);
    setInstituicoes(listaAtualizada);
  };

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
              Instituições e Unidades
            </Text>
            <Text style={{ color: theme.subtext, fontSize: 13 * fontScale, marginTop: 2 }}>
              Gerencie matrizes, núcleos e unidades parceiras ({instituicoes.length} cadastro(s)).
            </Text>
          </View>

          <TouchableOpacity
            onPress={abrirModalNovo}
            accessibilityRole="button"
            accessibilityLabel="Adicionar nova instituição"
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
            <Feather name="plus-circle" size={18} color="#FFFFFF" />
            <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 13 * fontScale }}>
              Nova Instituição
            </Text>
          </TouchableOpacity>
        </View>

        {carregando ? (
          <ActivityIndicator size="large" color="#1E3A8A" style={{ marginTop: 28 }} />
        ) : instituicoes.length === 0 ? (
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
            <Feather name="home" size={30} color={theme.subtext} />
            <Text style={{ color: theme.text, fontWeight: '700', fontSize: 14 * fontScale, marginTop: 10 }}>
              Nenhuma instituição cadastrada
            </Text>
            <Text style={{ color: theme.subtext, fontSize: 12 * fontScale, textAlign: 'center', marginTop: 4 }}>
              Toque em Nova Instituição para adicionar a primeira unidade.
            </Text>
          </View>
        ) : (
          instituicoes.map((inst) => (
            <View
              key={inst.id}
              style={{
                backgroundColor: theme.surface,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: theme.border,
                borderLeftWidth: 4,
                borderLeftColor: inst.status_ativo ? '#1E3A8A' : theme.subtext,
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
                        {inst.tipo_unidade}
                      </Text>
                    </View>
                    <Text style={{ color: inst.status_ativo ? '#10B981' : '#DC2626', fontWeight: '700', fontSize: 11 * fontScale }}>
                      {inst.status_ativo ? 'Operacional' : 'Inativa'}
                    </Text>
                  </View>

                  <Text style={{ fontWeight: '800', color: theme.text, fontSize: 15 * fontScale }}>
                    {inst.nome_fantasia}
                  </Text>

                  {inst.razao_social && inst.razao_social !== inst.nome_fantasia ? (
                    <Text style={{ color: theme.subtext, fontSize: 12 * fontScale, marginTop: 2 }}>
                      {inst.razao_social}
                    </Text>
                  ) : null}

                  {inst.cnpj ? (
                    <Text style={{ color: theme.subtext, fontSize: 12 * fontScale, marginTop: 3 }}>
                      CNPJ: {inst.cnpj}
                    </Text>
                  ) : null}

                  {inst.endereco ? (
                    <Text style={{ color: theme.subtext, fontSize: 12 * fontScale, marginTop: 2 }}>
                      Endereço: {inst.endereco}
                    </Text>
                  ) : null}

                  <Text style={{ color: theme.subtext, fontSize: 11.5 * fontScale, marginTop: 3 }}>
                    {[inst.responsavel, inst.telefone].filter(Boolean).join(' • ') || 'Sem contato informado'}
                  </Text>

                  <Text style={{ color: theme.subtext, fontSize: 11.5 * fontScale, marginTop: 2 }}>
                    Data do convênio/fundação: {inst.data_fundacao}
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', gap: 4 }}>
                  <TouchableOpacity
                    onPress={() => abrirModalEditar(inst)}
                    accessibilityRole="button"
                    accessibilityLabel={`Editar instituição ${inst.nome_fantasia}`}
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
                    onPress={() => setAlvoExclusao(inst)}
                    accessibilityRole="button"
                    accessibilityLabel={`Excluir instituição ${inst.nome_fantasia}`}
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

      {/* Modal Criar / Editar Instituição */}
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
                {idEdicao ? 'Editar Instituição' : 'Nova Instituição'}
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
                rotulo="Nome Fantasia / Unidade *"
                placeholder="Ex: Casa da Criança - Unidade Norte"
                value={nomeFantasia}
                onChangeText={setNomeFantasia}
              />

              <AppInput
                rotulo="Razão Social"
                placeholder="Ex: Associação Beneficente..."
                value={razaoSocial}
                onChangeText={setRazaoSocial}
              />

              <Text style={{ fontWeight: '600', color: theme.text, fontSize: 13 * fontScale, marginBottom: 6 }}>
                Tipo de Unidade
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
                {TIPOS_UNIDADE.map((opcao) => {
                  const ativo = tipoUnidade === opcao;
                  return (
                    <TouchableOpacity
                      key={opcao}
                      onPress={() => setTipoUnidade(opcao)}
                      style={{
                        minHeight: 48,
                        paddingHorizontal: 12,
                        borderRadius: 12,
                        borderWidth: 1.5,
                        borderColor: ativo ? '#1E3A8A' : theme.border,
                        backgroundColor: ativo ? '#1E3A8A14' : theme.background,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text style={{ color: ativo ? '#1E3A8A' : theme.text, fontWeight: '700', fontSize: 12.5 * fontScale }}>
                        {opcao}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <AppInput
                rotulo="CNPJ"
                placeholder="00.000.000/0001-00"
                value={cnpj}
                onChangeText={setCnpj}
              />

              <AppInput
                rotulo="Endereço Completo"
                placeholder="Rua, número, bairro..."
                value={endereco}
                onChangeText={setEndereco}
              />

              <AppInput
                rotulo="Telefone"
                placeholder="(11) 4002-8922"
                keyboardType="phone-pad"
                value={telefone}
                onChangeText={setTelefone}
              />

              <AppInput
                rotulo="Pessoa Responsável"
                placeholder="Ex: Maria Clara (Nutrição)"
                value={responsavel}
                onChangeText={setResponsavel}
              />

              <AppDateInput
                rotulo="Data de Fundação / Convênio (DD/MM/AAAA)"
                value={dataFundacao}
                onChangeText={setDataFundacao}
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
                  Unidade Ativa
                </Text>
                <Switch
                  value={statusAtivo}
                  onValueChange={setStatusAtivo}
                  trackColor={{ false: theme.border, true: '#10B981' }}
                />
              </View>

              <AppButton
                title={idEdicao ? 'Salvar Alterações' : 'Cadastrar Instituição'}
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
              Deseja realmente remover a instituição &ldquo;{alvoExclusao?.nome_fantasia}&rdquo;?
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
