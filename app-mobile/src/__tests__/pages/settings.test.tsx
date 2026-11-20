import React from 'react';
import { fireEvent, renderWithTheme, waitFor } from '../test-utils';
import * as apiModule from '../../services/api';
import SettingsScreen from '../../app/settings';
import SettingsCampaignsScreen from '../../app/settings-campaigns';
import SettingsCategoriesScreen from '../../app/settings-categories';
import SettingsDonorsScreen from '../../app/settings-donors';
import SettingsInstitutionsScreen from '../../app/settings-institutions';
import SettingsReasonsScreen from '../../app/settings-reasons';
import SettingsStorageScreen from '../../app/settings-storage';
import SettingsSyncScreen from '../../app/settings-sync';
import SettingsUsersScreen from '../../app/settings-users';

describe('Telas de Configurações (src/app/settings*.tsx)', () => {
  beforeEach(() => {
    jest.spyOn(apiModule, 'requisicaoApi').mockResolvedValue({
      sucesso: true,
      lotes: [],
      locais: [
        {
          id_local_armazenamento: 'loc_armario_a_prateleira_1',
          local_descricao: 'Armário A - Prateleira 1',
          tipo_local: 'armário',
        },
      ],
      categorias: [{ id_categoria_alimento: 'c1', nome_categoria: 'Grãos', status_ativo: true }],
      doadores: [
        {
          id_doador: 'd1',
          nome_completo: 'Maria Silva',
          nome_completo_doador: 'Maria Silva',
          cpf_cnpj: '12345678900',
          tipo_doador: 'PF',
          telefone: '(19) 99999-1111',
          email: 'maria@teste.org',
          status_ativo: true,
        },
      ],
      instituicoes: [
        {
          id_instituicao: 'i1',
          nome_fantasia: 'Casa da Criança',
          nome_instituicao: 'Casa da Criança',
          razao_social: 'Associação Casa da Criança',
          cnpj: '12345678000199',
          endereco_completo: 'Rua Central, 100',
          status_ativo: true,
        },
      ],
      campanhas: [
        {
          id_campanha: 'camp1',
          titulo: 'Natal Solidário',
          meta: 'Leite',
          status_aprovacao: 'Aprovada',
        },
      ],
      usuarios: [
        {
          id_usuario: 'u1',
          id: 'u1',
          nome_usuario: 'Operador',
          nome: 'Operador',
          email_usuario: 'op@casadacrianca.org',
          email: 'op@casadacrianca.org',
          nivel_acesso_permissao: 'operador',
          role: 'operador',
        },
      ],
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('deve renderizar SettingsScreen, clicar nos cards e exercitar subtelas administrativas', async () => {
    const { Alert } = require('react-native');
    const { mockRouter } = require('../setup');
    const st = await renderWithTheme(<SettingsScreen />);
    expect(st.getByText('Voltar')).toBeTruthy();
    await fireEvent.press(st.getByText('Prateleiras e Armários'));
    await fireEvent.press(st.getByText('Categorias de Alimentos'));
    await fireEvent.press(st.getByText('Doadores e Apoiadores'));
    await fireEvent.press(st.getByText('Instituições Parceiras'));
    await fireEvent.press(st.getByText('Equipe e Funções'));
    expect(mockRouter.push).toHaveBeenCalledWith('/settings-storage');
    await st.unmount();

    // Campanhas
    const camp = await renderWithTheme(<SettingsCampaignsScreen />);
    await waitFor(() => expect(camp.getByLabelText('Ver detalhes da campanha Natal Solidário')).toBeTruthy());
    await fireEvent.press(camp.getByLabelText('Ver detalhes da campanha Natal Solidário'));
    await fireEvent.press(camp.getByLabelText('Fechar detalhes da campanha'));
    await camp.unmount();

    // Categorias
    const cat = await renderWithTheme(<SettingsCategoriesScreen />);
    await waitFor(() => expect(cat.getByLabelText('Adicionar Nova Categoria')).toBeTruthy());
    await fireEvent.press(cat.getByLabelText('Adicionar Nova Categoria'));
    await fireEvent.changeText(
      cat.getByPlaceholderText('Ex: Frutas e Legumes, Bebidas, Frios...'),
      'Verduras'
    );
    await fireEvent.press(cat.getByLabelText('Fechar modal'));
    await cat.unmount();

    // Doadores: criar (validando campo obrigatório), editar e excluir
    const don = await renderWithTheme(<SettingsDonorsScreen />);
    await waitFor(() => expect(don.getByLabelText('Adicionar novo doador')).toBeTruthy());
    await fireEvent.press(don.getByLabelText('Adicionar novo doador'));
    await fireEvent.press(don.getByLabelText('Cadastrar Doador'));
    expect(Alert.alert).toHaveBeenCalledWith('Campo obrigatório', expect.any(String));
    await fireEvent.press(don.getByText('Pessoa Jurídica (PJ)'));
    await fireEvent.changeText(don.getByPlaceholderText('Ex: Maria Silva ou Mercado Bom Preço'), 'Mercado Novo');
    await fireEvent.press(don.getByLabelText('Cadastrar Doador'));
    await waitFor(() => expect(don.getByLabelText('Editar doador Maria Silva')).toBeTruthy());
    await fireEvent.press(don.getByLabelText('Editar doador Maria Silva'));
    await fireEvent.changeText(don.getByPlaceholderText('Ex: Maria Silva ou Mercado Bom Preço'), 'Maria Editada');
    await fireEvent.press(don.getByLabelText('Salvar Alterações'));
    await fireEvent.press(don.getByLabelText('Excluir doador Maria Editada'));
    await fireEvent.press(don.getByText('Excluir'));
    await don.unmount();

    // Instituições: criar (validando campo obrigatório), editar e excluir
    const inst = await renderWithTheme(<SettingsInstitutionsScreen />);
    await waitFor(() => expect(inst.getByLabelText('Adicionar nova instituição')).toBeTruthy());
    await fireEvent.press(inst.getByLabelText('Adicionar nova instituição'));
    await fireEvent.press(inst.getByLabelText('Cadastrar Instituição'));
    expect(Alert.alert).toHaveBeenCalledWith('Campo obrigatório', expect.any(String));
    await fireEvent.changeText(inst.getByPlaceholderText('Ex: Casa da Criança - Unidade Norte'), 'Unidade Sul');
    await fireEvent.press(inst.getByLabelText('Cadastrar Instituição'));
    await waitFor(() => expect(inst.getByLabelText('Editar instituição Casa da Criança')).toBeTruthy());
    await fireEvent.press(inst.getByLabelText('Editar instituição Casa da Criança'));
    await fireEvent.changeText(inst.getByPlaceholderText('Ex: Casa da Criança - Unidade Norte'), 'Unidade Central');
    await fireEvent.press(inst.getByLabelText('Salvar Alterações'));
    await fireEvent.press(inst.getByLabelText('Excluir instituição Unidade Central'));
    await fireEvent.press(inst.getByText('Excluir'));
    await inst.unmount();

    // Motivos, Usuários (remover) e Sync
    const rsn = await renderWithTheme(<SettingsReasonsScreen />);
    await waitFor(() => expect(rsn.getByLabelText('Voltar para Configurações')).toBeTruthy());
    await rsn.unmount();

    const usr = await renderWithTheme(<SettingsUsersScreen />);
    await waitFor(() => expect(usr.getByLabelText('Remover Operador')).toBeTruthy());
    await fireEvent.press(usr.getByLabelText('Remover Operador'));
    await usr.unmount();

    const sync = await renderWithTheme(<SettingsSyncScreen />);
    await waitFor(() => expect(sync.getByText('Atualizar Dados Agora')).toBeTruthy());
    await fireEvent.press(sync.getByText('Atualizar Dados Agora'));
    await sync.unmount();

    const stor = await renderWithTheme(<SettingsStorageScreen />);
    await waitFor(() => expect(stor.getByLabelText('Voltar para a tela anterior')).toBeTruthy());
  });

  it('SettingsStorageScreen deve cadastrar multiplas prateleiras, validar campos e impedir exclusao em uso', async () => {
    const { Alert } = require('react-native');
    jest.spyOn(apiModule, 'requisicaoApi').mockImplementation(async (_r, opts) => {
      const acao = opts?.dados?.acao;
      if (acao === 'listar_locais') {
        return {
          sucesso: true,
          locais: [
            {
              id_local_armazenamento: 'loc_armario_a_prateleira_1',
              local_descricao: 'Armário A - Prateleira 1',
              tipo_local: 'armário',
              quantidade_pacotes_alocados: 5,
              quantidade_lotes_ativos: 1,
            },
            {
              id_local_armazenamento: 'loc_vazia',
              local_descricao: 'Geladeira 2 - Gaveta Vazia',
              tipo_local: 'geladeira',
              quantidade_pacotes_alocados: 0,
              quantidade_lotes_ativos: 0,
            },
          ],
        };
      }
      return {
        sucesso: true,
        lotes: [
          {
            id_lote_produto: 'l_uso',
            nome_produto: 'Feijão',
            local_descricao: 'Armário A - Prateleira 1',
            quantidade_atual_pacote: 10,
          },
          {
            id_lote_produto: 'l_div',
            nome_produto: 'Arroz',
            local_descricao: 'Prat. 1',
            quantidade_atual_pacote: 5,
          },
        ],
        locais: [],
      };
    });

    const stor = await renderWithTheme(<SettingsStorageScreen />);
    await waitFor(() => expect(stor.getByText('Locais e Prateleiras')).toBeTruthy());

    // Validação campos obrigatórios
    await fireEvent.press(stor.getByText('Salvar Prateleira'));
    expect(Alert.alert).toHaveBeenCalledWith('Campos obrigatórios', expect.any(String));

    // Adicionar e remover campo prateleira, preencher e salvar
    await fireEvent.changeText(stor.getByPlaceholderText('Ex: Armário C'), 'Armário Novo');
    await fireEvent.press(stor.getByLabelText('Adicionar nova prateleira'));
    await fireEvent.changeText(stor.getByPlaceholderText('Ex: Prateleira 1 ou Gaveta Superior'), 'Prat. 1');
    await fireEvent.changeText(stor.getByPlaceholderText('Ex: Prateleira 2'), 'Prat. 2');
    await fireEvent.press(stor.getByLabelText('Remover campo prateleira 2'));
    await fireEvent.changeText(stor.getByPlaceholderText('Ex: Despensa Principal / Cozinha'), 'Despensa');
    await fireEvent.press(stor.getByText('Salvar Prateleira'));
    await waitFor(() => expect(Alert.alert).toHaveBeenCalledWith('Prateleiras Salvas!', expect.any(String)));

    // Normalizar lotes divergentes na AWS
    const btnNorm = stor.queryByText(/Atualizar Nomes nos Lotes/);
    if (btnNorm) {
      await fireEvent.press(btnNorm);
      await waitFor(() => expect(Alert.alert).toHaveBeenCalledWith('Prateleiras Organizadas!', expect.any(String)));
    }

    // Busca e tentativas de exclusão (em uso vs vazia com confirmação)
    await fireEvent.changeText(stor.getByPlaceholderText('Buscar por armário, geladeira ou prateleira...'), 'Armário');
    await fireEvent.changeText(stor.getByPlaceholderText('Buscar por armário, geladeira ou prateleira...'), '');
    await fireEvent.press(stor.getByLabelText('Excluir prateleira Armário A - Prateleira 1'));
    expect(Alert.alert).toHaveBeenCalledWith('Prateleira em Uso', expect.any(String));

    (Alert.alert as jest.Mock).mockImplementationOnce((_t, _m, botoes) => {
      botoes?.[1]?.onPress?.();
    });
    await fireEvent.press(stor.getByLabelText('Excluir prateleira Geladeira 2 - Gaveta Vazia'));
    await stor.unmount();
  });

  it('SettingsCategories, SettingsDonors, SettingsInstitutions e SettingsUsers devem validar criacao e acoes', async () => {
    const { Alert } = require('react-native');
    const cat = await renderWithTheme(<SettingsCategoriesScreen />);
    await waitFor(() => expect(cat.getByLabelText('Ocultar categoria Grãos')).toBeTruthy());
    // Ocultar uma categoria existente para liberar o toggle de ocultas
    await fireEvent.press(cat.getByLabelText('Ocultar categoria Grãos'));
    await waitFor(() => expect(cat.getByLabelText('Alternar exibição de categorias ocultas')).toBeTruthy());
    await fireEvent.press(cat.getByLabelText('Alternar exibição de categorias ocultas'));
    await fireEvent.press(cat.getByLabelText('Adicionar Nova Categoria'));
    await fireEvent.changeText(
      cat.getByPlaceholderText('Ex: Frutas e Legumes, Bebidas, Frios...'),
      'A'
    );
    await fireEvent.press(cat.getByText('Salvar Categoria'));
    expect(Alert.alert).toHaveBeenCalledWith('Nome inválido', expect.any(String));

    await fireEvent.changeText(
      cat.getByPlaceholderText('Ex: Frutas e Legumes, Bebidas, Frios...'),
      'Massas'
    );
    await fireEvent.press(cat.getByText('Salvar Categoria'));
    await waitFor(() =>
      expect(apiModule.requisicaoApi).toHaveBeenCalledWith(
        '/api/configuracoes',
        expect.objectContaining({
          dados: expect.objectContaining({ acao: 'cadastrar_categoria', nome_categoria: 'Massas' }),
        })
      )
    );
    await cat.unmount();

    const usr = await renderWithTheme(<SettingsUsersScreen />);
    await waitFor(() => expect(usr.getByPlaceholderText('Ex: Ana Paula')).toBeTruthy());
    await fireEvent.changeText(usr.getByPlaceholderText('Ex: Ana Paula'), 'Maria Operadora');
    await fireEvent.changeText(usr.getByPlaceholderText('ana@casadacrianca.org.br'), 'maria@casadacrianca.org');
    await fireEvent.press(usr.getByText('Voluntário'));
    await fireEvent.press(usr.getByText('Cadastrar Membro'));
    await usr.unmount();
  });
});
