import React from 'react';
import { Alert } from 'react-native';
import { fireEvent, renderWithTheme, waitFor } from '../test-utils';
import { mockRouter } from '../setup';
import * as apiModule from '../../services/api';
import StockScreen from '../../app/stock';
import StockAddScreen from '../../app/stock-add';
import StockMoveScreen from '../../app/stock-move';
import StockRemoveScreen from '../../app/stock-remove';

describe('Telas de Estoque (stock, stock-add, stock-move, stock-remove)', () => {
  const lotesFixture = [
    {
      id_lote_produto: 'l1',
      id_produto: 'p1',
      nome_produto: 'Leite Integral UHT',
      categoria: 'Laticínios',
      codigo_barra_produto: '7891000100103',
      numero_codigo_lote: 'LT-01',
      quantidade_atual_pacote: 10,
      data_validade_lote: '2026-12-30',
      local_descricao: 'Geladeira 1 - Prateleira Central',
    },
    {
      id_lote_produto: 'l2',
      id_produto: 'p1',
      nome_produto: 'Leite Integral UHT',
      categoria: 'Laticínios',
      codigo_barra_produto: '7891000100103',
      numero_codigo_lote: 'LT-02',
      quantidade_atual_pacote: 6,
      data_validade_lote: '2027-06-30',
      local_descricao: 'Geladeira 1 - Prateleira Central',
    },
  ];

  const locaisFixture = [
    {
      id_local_armazenamento: 'loc_geladeira_1_prateleira_central',
      local_descricao: 'Geladeira 1 - Prateleira Central',
      tipo_local: 'geladeira',
    },
    {
      id_local_armazenamento: 'loc_armario_a_prateleira_1',
      local_descricao: 'Armário A - Prateleira 1',
      tipo_local: 'armário',
    },
  ];

  it('StockScreen deve listar operações de estoque e navegar', async () => {
    const spyApi = jest.spyOn(apiModule, 'requisicaoApi').mockResolvedValue({
      sucesso: true,
      locais: locaisFixture,
      lotes: lotesFixture,
    });

    const { getByText } = await renderWithTheme(<StockScreen />);
    expect(getByText('Gerenciamento de Estoque')).toBeTruthy();
    await fireEvent.press(getByText('Entrada de Alimentos'));
    expect(mockRouter.push).toHaveBeenCalledWith('/stock-add');
    spyApi.mockRestore();
  });

  it('StockAddScreen deve validar EAN inválido, fallback manual, criar categoria, bloquear vencido e cadastrar', async () => {
    const spyApi = jest.spyOn(apiModule, 'requisicaoApi').mockImplementation(async (_rota, opts) => {
      const acao = opts?.dados?.acao;
      if (acao === 'listar_locais') return { sucesso: true, locais: locaisFixture };
      if (acao === 'listar_categorias') return { sucesso: true, categorias: ['Laticínios', 'Grãos'] };
      if (acao === 'cadastrar_categoria') return { sucesso: true };
      if (acao === 'verificar_produto') {
        if (opts?.dados?.codigo_barras === '99999999') {
          return { sucesso: true, existe_no_banco: false, encontrado_nas_apis: false, permitir_cadastro_manual: true };
        }
        return {
          sucesso: true,
          existe_no_banco: false,
          encontrado_nas_apis: true,
          provedor_utilizado: 'API 2 (Open Food Facts)',
          produto: {
            nome_produto: 'Leite Integral',
            marca_produto: 'Parmalat',
            categoria: 'Laticínios',
            unidade_medida_pacote: 'litros',
          },
        };
      }
      if (acao === 'cadastrar_lote') {
        return { sucesso: true, lote: { id_lote_produto: 'novo_1' } };
      }
      return { sucesso: true, lotes: lotesFixture };
    });

    const { getByPlaceholderText, getByLabelText, getByText } = await renderWithTheme(
      <StockAddScreen />
    );

    await waitFor(() => expect(getByText('Identificação do Código de Barras')).toBeTruthy());

    // EAN inválido < 8 dígitos
    await fireEvent.changeText(getByPlaceholderText('Digite os 8 a 14 números da embalagem'), '123');
    await fireEvent.press(getByLabelText('Buscar código de barras e preencher dados'));
    expect(Alert.alert).toHaveBeenCalledWith(
      'Código Inválido',
      expect.stringContaining('8 a 14 números')
    );

    // Scanner câmera modal e fechar
    await fireEvent.press(getByLabelText('Escanear código de barras usando a câmera'));
    await fireEvent.press(getByLabelText('Alternar lanterna'));
    await fireEvent.press(getByLabelText('Voltar para a tela de cadastro'));

    // EAN válido localizado
    await fireEvent.changeText(
      getByPlaceholderText('Digite os 8 a 14 números da embalagem'),
      '7891000100103'
    );
    await fireEvent.press(getByLabelText('Buscar código de barras e preencher dados'));
    await waitFor(() => expect(getByText('Confirmar Dados do Alimento ➔')).toBeTruthy());

    // Abrir modal Nova Categoria e alternar dropdown de categorias
    await fireEvent.press(getByLabelText('Adicionar Nova Categoria'));
    await fireEvent.press(getByLabelText('Fechar modal de nova categoria'));
    await fireEvent.press(getByLabelText(/Categoria selecionada:/));
    await fireEvent.press(getByLabelText('Categoria Grãos'));

    await fireEvent.press(getByText('Confirmar Dados do Alimento ➔'));
    await waitFor(() => expect(getByText('3. Informações do Lote')).toBeTruthy());

    // Filtrar local por Geladeiras, Armários e Todos + busca local
    await fireEvent.press(getByText(/Geladeiras/));
    await fireEvent.press(getByText(/Armários/));
    await fireEvent.press(getByText(/Todos/));
    await fireEvent.changeText(getByPlaceholderText('Filtrar prateleira ou compartimento...'), 'Geladeira');
    await fireEvent.changeText(getByPlaceholderText('Filtrar prateleira ou compartimento...'), '');

    await fireEvent.changeText(getByPlaceholderText('Digite o código impresso na embalagem'), 'LOTE-2026');
    await fireEvent.changeText(getByLabelText('Quantidade (pacotes) *'), '12');

    // Data vencida bloqueia entrada
    await fireEvent.changeText(getByLabelText('Validade (DD/MM/AAAA) *'), '01012020');
    expect(getByText('Entrada Bloqueada (Produto Vencido)')).toBeTruthy();

    // Data futura válida salva
    await fireEvent.changeText(getByLabelText('Validade (DD/MM/AAAA) *'), '31122027');
    await fireEvent.press(getByText('Cadastrar Produto e Lote'));
    await waitFor(() => {
      expect(spyApi).toHaveBeenCalledWith(
        '/api/estoque',
        expect.objectContaining({
          dados: expect.objectContaining({ acao: 'cadastrar_lote' }),
        })
      );
    });
    spyApi.mockRestore();
  });

  it('StockRemoveScreen deve validar trava PERDA, quantidade excessiva e executar saída regular', async () => {
    const spyApi = jest.spyOn(apiModule, 'requisicaoApi').mockImplementation(async (_r, opts) => {
      const acao = opts?.dados?.acao;
      if (acao === 'saida_produto') {
        return { sucesso: true, novo_saldo: 7 };
      }
      return { sucesso: true, lotes: lotesFixture };
    });

    const { getByText, getByPlaceholderText, getByLabelText, getAllByText } = await renderWithTheme(
      <StockRemoveScreen />
    );

    await waitFor(() => expect(getByText('Leite Integral UHT')).toBeTruthy());
    await fireEvent.press(getByText('Leite Integral UHT'));
    await fireEvent.press(getByText('Lote LT-01'));

    expect(getAllByText('Confirmar Retirada').length).toBeGreaterThanOrEqual(1);

    // Alternar para Perda de produtos e validar trava PERDA
    await fireEvent.press(getByText('Perda de produtos'));
    expect(getByText('🔒 Trava de Segurança Obrigatória')).toBeTruthy();

    await fireEvent.changeText(
      getByLabelText('Quantidade a retirar (Disponível: 10)'),
      '3'
    );
    await fireEvent.changeText(getByPlaceholderText('Digite PERDA aqui'), 'perda');
    await fireEvent.press(getByLabelText('Confirmar Descarte'));
    expect(Alert.alert).toHaveBeenCalledWith(
      'Trava de Segurança Obrigatória',
      expect.stringContaining('PERDA')
    );

    // Preencher corretamente PERDA mas deixar justificativa vazia -> bloqueia
    await fireEvent.changeText(getByPlaceholderText('Digite PERDA aqui'), 'PERDA');
    await fireEvent.press(getByLabelText('Confirmar Descarte'));
    expect(Alert.alert).toHaveBeenCalledWith('Motivo Obrigatório', expect.any(String));

    // Preencher observação e concluir descarte
    await fireEvent.changeText(
      getByPlaceholderText('Ex: Embalagem rasgada / Passou da validade'),
      'Embalagem violada'
    );
    await fireEvent.press(getByLabelText('Confirmar Descarte'));

    await waitFor(() => expect(getByText('Saída Registrada!')).toBeTruthy());
    spyApi.mockRestore();
  });

  it('StockMoveScreen deve filtrar prateleiras, dividir lote e confirmar transferência', async () => {
    const spyApi = jest.spyOn(apiModule, 'requisicaoApi').mockImplementation(async (_r, opts) => {
      const acao = opts?.dados?.acao;
      if (acao === 'listar_locais') return { sucesso: true, locais: locaisFixture };
      if (acao === 'saida_produto' || acao === 'cadastrar_lote' || acao === 'mover_lote') {
        return {
          sucesso: true,
          novo_saldo: 6,
          lote: { numero_codigo_lote: 'LT-01-MOV' },
        };
      }
      return { sucesso: true, lotes: lotesFixture };
    });

    const { getByText, getByLabelText, getAllByText } = await renderWithTheme(<StockMoveScreen />);

    await waitFor(() => expect(getByText('Leite Integral UHT')).toBeTruthy());
    await fireEvent.press(getByText('grid'));
    await fireEvent.press(getByText('list'));

    await fireEvent.press(getByText('Leite Integral UHT'));
    await fireEvent.press(getByText('Lote LT-01'));

    expect(getByText('Mudar de Prateleira')).toBeTruthy();
    await fireEvent.changeText(getByLabelText('Quantidade a transferir (Máx: 10) *'), '4');
    const opcoesArmario = getAllByText(/Armário A - Prateleira 1/);
    await fireEvent.press(opcoesArmario[opcoesArmario.length - 1]);
    await fireEvent.press(getByLabelText('Separar e Mudar de Lugar'));

    // Confirma o modal de divisão de lote
    await waitFor(() => {
      expect(getByText('Divisão de Lote Detectada!')).toBeTruthy();
    });
    await fireEvent.press(getByLabelText('Sim, Dividir e Mover'));

    await waitFor(() =>
      expect(spyApi).toHaveBeenCalledWith(
        '/api/estoque',
        expect.objectContaining({
          dados: expect.objectContaining({
            acao: 'saida_produto',
            motivo_saida: 'saída - movimentação estoque',
          }),
        })
      )
    );
    await waitFor(() => expect(getByText('Concluir e Atualizar Estoque')).toBeTruthy());
    await fireEvent.press(getByText('Concluir e Atualizar Estoque'));
    spyApi.mockRestore();
  });

  it('StockAddScreen deve cobrir produto existente, cadastro manual, nova categoria, validacoes e falha de envio', async () => {
    const spyApi = jest.spyOn(apiModule, 'requisicaoApi').mockImplementation(async (_r, opts) => {
      const acao = opts?.dados?.acao;
      if (acao === 'listar_locais') return { sucesso: true, locais: locaisFixture };
      if (acao === 'listar_categorias') {
        return { sucesso: true, categorias: ['Grãos e Cereais', 'Laticínios'] };
      }
      if (acao === 'cadastrar_categoria') return { sucesso: true };
      if (acao === 'verificar_produto') {
        if (opts?.dados?.codigo_barras === '7891000100103') {
          return {
            sucesso: true,
            existe_no_banco: true,
            produto: {
              id_produto: 'p1',
              nome_produto: 'Leite Integral UHT',
              marca_produto: 'Parmalat',
              categoria: 'Laticínios',
              unidade_medida_pacote: 'litros',
              estoque_minimo_pacote: 12,
              url_foto_produto: 'https://img.example/leite.png',
            },
          };
        }
        return {
          sucesso: true,
          existe_no_banco: false,
          encontrado_nas_apis: false,
          permitir_cadastro_manual: true,
          erros: ['Timeout API 1'],
        };
      }
      if (acao === 'cadastrar_lote') {
        return { sucesso: false, mensagem: 'Falha controlada ao salvar lote' };
      }
      return { sucesso: true, lotes: lotesFixture };
    });

    const { getByPlaceholderText, getByLabelText, getByText } = await renderWithTheme(
      <StockAddScreen />
    );
    await waitFor(() => expect(getByText('Identificação do Código de Barras')).toBeTruthy());

    // Digitar manual pelo modal da câmera
    await fireEvent.press(getByLabelText('Escanear código de barras usando a câmera'));
    await fireEvent.press(getByLabelText('Digitar código de barras manualmente'));
    await fireEvent.changeText(getByPlaceholderText('Ex: 7891000100103'), '99999999');
    await fireEvent.press(getByText('Confirmar'));

    // Cenário C: não encontrado -> cadastro manual
    await waitFor(() => expect(Alert.alert).toHaveBeenCalledWith('Produto Novo', expect.any(String)));
    await waitFor(() => expect(getByText('Confirmar Dados do Alimento ➔')).toBeTruthy());

    // Salvar nova categoria no modal + alternar visibilidade
    await fireEvent.press(getByLabelText('Adicionar Nova Categoria'));
    await fireEvent.press(getByText('Salvar Categoria'));
    expect(Alert.alert).toHaveBeenCalledWith('Atenção', 'Informe o nome da categoria para cadastrar.');
    await fireEvent.changeText(getByPlaceholderText('Ex: Frutas e Verduras, Padaria, Doces...'), 'Padaria');
    await fireEvent.press(getByText('Salvar Categoria'));
    await waitFor(() => expect(Alert.alert).toHaveBeenCalledWith('Categoria Salva', expect.any(String)));

    // Preencher campos manuais e validar obrigatoriedades na etapa 3
    await fireEvent.changeText(getByPlaceholderText('Ex: Leite Integral UHT 1L'), 'Pão Integral');
    await fireEvent.changeText(getByPlaceholderText('Ex: Italac / Camil'), 'Pulman');
    await fireEvent.press(getByText('Confirmar Dados do Alimento ➔'));

    await waitFor(() => expect(getByText('3. Informações do Lote')).toBeTruthy());
    await fireEvent.press(getByText('Cadastrar Produto e Lote'));
    expect(Alert.alert).toHaveBeenCalledWith('Lote Obrigatório', expect.any(String));

    await fireEvent.changeText(getByPlaceholderText('Digite o código impresso na embalagem'), 'L-PAD');
    await fireEvent.press(getByText('Cadastrar Produto e Lote'));
    expect(Alert.alert).toHaveBeenCalledWith('Quantidade Inválida', expect.any(String));

    await fireEvent.changeText(getByLabelText('Quantidade (pacotes) *'), '5');
    await fireEvent.press(getByText('Cadastrar Produto e Lote'));
    expect(Alert.alert).toHaveBeenCalledWith('Validade Inválida', expect.any(String));

    // Digita validade válida -> dispara erro da API e fecha feedback
    await fireEvent.changeText(getByLabelText('Validade (DD/MM/AAAA) *'), '31122028');
    await fireEvent.press(getByText('Cadastrar Produto e Lote'));
    await waitFor(() => expect(getByText('Ok, entendi')).toBeTruthy());
    await fireEvent.press(getByText('Ok, entendi'));

    // Cenário A: Produto já existente no banco vai direto à Etapa de Adicionar Novo Lote
    await fireEvent.changeText(
      getByPlaceholderText('Digite os 8 a 14 números da embalagem'),
      '7891000100103'
    );
    await fireEvent.press(getByLabelText('Buscar código de barras e preencher dados'));
    await waitFor(() => expect(getByText('2. Adicionar Novo Lote ao Produto')).toBeTruthy());

    spyApi.mockResolvedValueOnce({ sucesso: true, lote: { id_lote_produto: 'ok' } });
    await fireEvent.press(getByLabelText('Voltar para a tela anterior'));
    spyApi.mockRestore();
  });

  it('StockRemoveScreen deve exercitar alerta FEFO, scanner manual, validacoes de qtd e baixa regular', async () => {
    const spyApi = jest.spyOn(apiModule, 'requisicaoApi').mockImplementation(async (_r, opts) => {
      const acao = opts?.dados?.acao;
      if (acao === 'saida_produto') {
        return { sucesso: true, novo_saldo: 4 };
      }
      return { sucesso: true, lotes: lotesFixture };
    });

    const { getByText, getByPlaceholderText, getByLabelText, getAllByText } = await renderWithTheme(
      <StockRemoveScreen />
    );
    await waitFor(() => expect(getByText('Leite Integral UHT')).toBeTruthy());

    // Busca e modal de câmera -> entrada manual
    await fireEvent.changeText(getByPlaceholderText('Buscar por nome ou código de barras...'), 'Leite');
    await fireEvent.press(getByLabelText('Escanear código de barras para dar saída'));
    await fireEvent.press(getByLabelText('Realizar Leitura do código de barras'));
    await fireEvent.press(getByLabelText('Digitar código de barras manualmente'));
    await fireEvent.changeText(getByPlaceholderText('Ex: 7891000100103'), '7891000100103');
    await fireEvent.press(getByText('Confirmar'));

    // Alerta FEFO ao escolher lote LT-02 tendo LT-01 antes -> confirma via callback 'Continuar'
    await waitFor(() => expect(getByText('Lote LT-02')).toBeTruthy());
    (Alert.alert as jest.Mock).mockImplementationOnce((_t, _m, botoes) => {
      botoes?.[1]?.onPress?.();
    });
    await fireEvent.press(getByText('Lote LT-02'));

    await waitFor(() => expect(getAllByText('Confirmar Retirada').length).toBeGreaterThanOrEqual(1));
    await fireEvent.press(getByLabelText('Confirmar Retirada'));
    expect(Alert.alert).toHaveBeenCalledWith('Quantidade Inválida', expect.any(String));

    // AppNumericInput respeita max=6 bloqueando '99', garantindo proteção contra saída excessiva
    await fireEvent.changeText(getByLabelText('Quantidade a retirar (Disponível: 6)'), '99');
    expect(getByLabelText('Quantidade a retirar (Disponível: 6)').props.value).not.toBe('99');

    // Retirada regular válida e conclusão
    await fireEvent.changeText(getByLabelText('Quantidade a retirar (Disponível: 6)'), '2');
    await fireEvent.press(getByLabelText('Confirmar Retirada'));
    await waitFor(() => expect(getByText('Ok, Entendi')).toBeTruthy());
    await fireEvent.press(getByText('Ok, Entendi'));

    spyApi.mockRestore();
  });

  it('StockMoveScreen deve validar erros de formulario, scanner e movimentacao integral sem divisao', async () => {
    const spyApi = jest.spyOn(apiModule, 'requisicaoApi').mockImplementation(async (_r, opts) => {
      const acao = opts?.dados?.acao;
      if (acao === 'listar_locais') return { sucesso: true, locais: locaisFixture };
      if (acao === 'saida_produto' || acao === 'cadastrar_lote') {
        return { sucesso: true, novo_saldo: 0 };
      }
      return { sucesso: true, lotes: lotesFixture };
    });

    const { getByText, getByPlaceholderText, getByLabelText, getAllByText } = await renderWithTheme(
      <StockMoveScreen />
    );
    await waitFor(() => expect(getByText('Leite Integral UHT')).toBeTruthy());

    await fireEvent.press(getByLabelText('Gerenciar prateleiras e armários'));
    expect(mockRouter.push).toHaveBeenCalledWith('/settings-storage');

    await fireEvent.press(getByLabelText('Ler código de barras para movimentar lote'));
    await fireEvent.press(getByText('Cancelar Leitura'));

    await fireEvent.changeText(getByPlaceholderText('Buscar produto, lote ou prateleira...'), 'LT-01');
    await fireEvent.press(getByText('Leite Integral UHT'));
    await fireEvent.press(getByText('Lote LT-01'));

    // Erro 1: sem prateleira destino
    await fireEvent.press(getByLabelText('Confirmar Mudança'));
    expect(getByText(/Selecione uma das prateleiras/)).toBeTruthy();

    // Erro 2: quantidade inválida zero
    await fireEvent.changeText(getByLabelText('Quantidade a transferir (Máx: 10) *'), '0');
    await fireEvent.press(getByLabelText('Confirmar Mudança'));
    expect(getByText(/quantidade válida maior que zero/)).toBeTruthy();

    // Erro 3: mesma prateleira de origem
    await fireEvent.changeText(getByLabelText('Quantidade a transferir (Máx: 10) *'), '10');
    const opcoesGeladeira = getAllByText(/Geladeira 1 - Prateleira Central/);
    await fireEvent.press(opcoesGeladeira[opcoesGeladeira.length - 1]);
    await fireEvent.press(getByLabelText('Confirmar Mudança'));
    expect(getByText(/já está alocado/)).toBeTruthy();

    // Transferência integral válida (10)
    const opcoesArmario = getAllByText(/Armário A - Prateleira 1/);
    await fireEvent.press(opcoesArmario[opcoesArmario.length - 1]);
    await fireEvent.press(getByLabelText('Confirmar Mudança'));
    await waitFor(() => expect(getByText('Concluir e Atualizar Estoque')).toBeTruthy());
    await fireEvent.press(getByText('Concluir e Atualizar Estoque'));

    spyApi.mockRestore();
  });

  it('deve exercitar inferência de categorias, scanner moderno Android, negação de câmera e erros de rede nas 3 telas', async () => {
    const { Platform } = require('react-native');
    const { mockUseCameraPermissions } = require('../setup');
    const { CameraView } = require('expo-camera');

    const spyApi = jest.spyOn(apiModule, 'requisicaoApi').mockImplementation(async (_r, opts) => {
      const acao = opts?.dados?.acao;
      if (acao === 'listar_locais') return { sucesso: true, locais: locaisFixture };
      if (acao === 'listar_categorias') {
        return {
          sucesso: true,
          categorias: ['Grãos e Cereais', 'Laticínios', 'Massas', 'Óleos e Gorduras', 'Enlatados', 'Higiene e Limpeza'],
        };
      }
      if (acao === 'verificar_produto') {
        return {
          sucesso: true,
          existe_no_banco: false,
          encontrado_nas_apis: true,
          produto: { nome_produto: 'Macarrão Espaguete', categoria: '' },
        };
      }
      return { sucesso: true, lotes: lotesFixture };
    });

    // 1) StockAddScreen: permissão negada + modern scanner Android + inferirCategoriaAlimento
    mockUseCameraPermissions.mockReturnValue([
      { granted: false, canAskAgain: true },
      jest.fn(() => Promise.resolve({ granted: false })),
    ]);
    const addDeny = await renderWithTheme(<StockAddScreen />);
    await waitFor(() => expect(addDeny.getByLabelText('Escanear código de barras usando a câmera')).toBeTruthy());
    await fireEvent.press(addDeny.getByLabelText('Escanear código de barras usando a câmera'));
    await waitFor(() =>
      expect(Alert.alert).toHaveBeenCalledWith('Permissão da Câmera', expect.any(String))
    );
    await addDeny.unmount();

    mockUseCameraPermissions.mockReturnValue([
      { granted: true, canAskAgain: true },
      jest.fn(() => Promise.resolve({ granted: true })),
    ]);
    const add = await renderWithTheme(<StockAddScreen />);
    await waitFor(() => expect(add.getByLabelText('Escanear código de barras usando a câmera')).toBeTruthy());
    await fireEvent.press(add.getByLabelText('Escanear código de barras usando a câmera'));
    const origOs = Platform.OS;
    Platform.OS = 'android';
    await fireEvent.press(add.getByLabelText('Realizar Leitura do código de barras'));
    Platform.OS = origOs;
    expect(CameraView.launchScanner).toHaveBeenCalled();

    // Testa categorias inferidas no dropdown (abrir, ocultar categoria e mostrar ocultas)
    await waitFor(() => expect(add.getByLabelText(/Categoria selecionada:/)).toBeTruthy());
    await fireEvent.press(add.getByLabelText(/Categoria selecionada:/));
    await fireEvent.press(add.getByLabelText('Categoria Massas'));
    await add.unmount();

    // 2) StockRemoveScreen: permissão negada + modern scanner Android
    mockUseCameraPermissions.mockReturnValue([
      { granted: false, canAskAgain: true },
      jest.fn(() => Promise.resolve({ granted: false })),
    ]);
    const remDeny = await renderWithTheme(<StockRemoveScreen />);
    await waitFor(() => expect(remDeny.getByLabelText('Escanear código de barras para dar saída')).toBeTruthy());
    await fireEvent.press(remDeny.getByLabelText('Escanear código de barras para dar saída'));
    await waitFor(() =>
      expect(Alert.alert).toHaveBeenCalledWith('Permissão Necessária', expect.any(String))
    );
    await remDeny.unmount();

    mockUseCameraPermissions.mockReturnValue([
      { granted: true, canAskAgain: true },
      jest.fn(() => Promise.resolve({ granted: true })),
    ]);
    const rem = await renderWithTheme(<StockRemoveScreen />);
    await waitFor(() => expect(rem.getByText('Leite Integral UHT')).toBeTruthy());
    await fireEvent.press(rem.getByLabelText('Escanear código de barras para dar saída'));
    Platform.OS = 'android';
    await fireEvent.press(rem.getByLabelText('Realizar Leitura do código de barras'));
    Platform.OS = origOs;
    await rem.unmount();

    // 3) StockMoveScreen: permissão negada
    mockUseCameraPermissions.mockReturnValue([
      { granted: false, canAskAgain: true },
      jest.fn(() => Promise.resolve({ granted: false })),
    ]);
    const mov = await renderWithTheme(<StockMoveScreen />);
    await waitFor(() => expect(mov.getByText('Leite Integral UHT')).toBeTruthy());
    await fireEvent.press(mov.getByLabelText('Ler código de barras para movimentar lote'));
    await waitFor(() =>
      expect(mov.getByText('Permissão de Câmera Necessária')).toBeTruthy()
    );
    await mov.unmount();

    // 4) StockMoveScreen: camera barcodeScanned (não encontrado e encontrado) + erro de carregamento
    mockUseCameraPermissions.mockReturnValue([
      { granted: true, canAskAgain: true },
      jest.fn(() => Promise.resolve({ granted: true })),
    ]);
    const movScan = await renderWithTheme(<StockMoveScreen />);
    await waitFor(() => expect(movScan.getByText('Leite Integral UHT')).toBeTruthy());
    await fireEvent.press(movScan.getByLabelText('Ler código de barras para movimentar lote'));
    await fireEvent(movScan.getByTestId('camera-view'), 'barcodeScanned', { data: '8888888888' });
    await waitFor(() => expect(movScan.getByText('Produto Não Encontrado')).toBeTruthy());
    await fireEvent.press(movScan.getByText('Entendi'));
    await fireEvent.press(movScan.getByLabelText('Ler código de barras para movimentar lote'));
    await fireEvent(movScan.getByTestId('camera-view'), 'barcodeScanned', { data: '7891000100103' });
    await waitFor(() => expect(movScan.getByText('Lote LT-01')).toBeTruthy());
    await movScan.unmount();

    // 5) StockRemoveScreen: barcodeScanned não encontrado e falha de carregamento
    const remScan = await renderWithTheme(<StockRemoveScreen />);
    await waitFor(() => expect(remScan.getByText('Leite Integral UHT')).toBeTruthy());
    await fireEvent.press(remScan.getByLabelText('Escanear código de barras para dar saída'));
    await fireEvent(remScan.getByTestId('camera-view'), 'barcodeScanned', { data: '8888888888' });
    await waitFor(() =>
      expect(Alert.alert).toHaveBeenCalledWith('Código Identificado', expect.any(String))
    );
    await remScan.unmount();

    // 6) StockAddScreen: inferirCategoriaAlimento em múltiplas categorias
    const spyInf = jest.spyOn(apiModule, 'requisicaoApi').mockImplementation(async (_r, opts) => {
      const acao = opts?.dados?.acao;
      if (acao === 'listar_locais') return { sucesso: true, locais: locaisFixture };
      if (acao === 'listar_categorias') {
        return {
          sucesso: true,
          categorias: ['Grãos e Cereais', 'Laticínios', 'Massas', 'Óleos e Gorduras', 'Enlatados', 'Higiene e Limpeza'],
        };
      }
      if (acao === 'verificar_produto') {
        const cb = String(opts?.dados?.codigo_barras || '');
        const nomes: Record<string, string> = {
          '11111111': 'Queijo Mussarela',
          '22222222': 'Óleo de Soja Liza',
          '33333333': 'Extrato de Tomate Elefante',
          '44444444': 'Detergente Ypê',
        };
        return {
          sucesso: true,
          existe_no_banco: false,
          encontrado_nas_apis: true,
          produto: { nome_produto: nomes[cb] || 'Feijão Preto', categoria: 'Outro' },
        };
      }
      return { sucesso: true, lotes: lotesFixture };
    });
    const addInf = await renderWithTheme(<StockAddScreen />);
    await waitFor(() => expect(addInf.getByPlaceholderText('Digite os 8 a 14 números da embalagem')).toBeTruthy());
    for (const cb of ['11111111', '22222222', '33333333', '44444444']) {
      await fireEvent.changeText(addInf.getByPlaceholderText('Digite os 8 a 14 números da embalagem'), cb);
      await fireEvent.press(addInf.getByLabelText('Buscar código de barras e preencher dados'));
      await waitFor(() => expect(addInf.getByText('Confirmar Dados do Alimento ➔')).toBeTruthy());
    }
    await addInf.unmount();
    spyInf.mockRestore();

    // 7) StockMoveScreen: erro de rede ao carregar estoque e prateleiras
    const spyMoveErr = jest.spyOn(apiModule, 'requisicaoApi').mockRejectedValue(new Error('Timeout Rede'));
    const movErr = await renderWithTheme(<StockMoveScreen />);
    await waitFor(() => expect(movErr.getByText('Erro de Conexão')).toBeTruthy());
    await movErr.unmount();
    spyMoveErr.mockRestore();

    spyApi.mockRestore();
  });
});
