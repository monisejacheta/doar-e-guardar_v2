# backend-serverless/tests/test_estoque.py
import json
import pytest
from datetime import date
from src.handlers.estoque_handler import (
    funcaoValidarPalavraConfirmacaoPerda,
    funcaoPriorizarSaidaLoteVencimento,
    funcaoRemoverProdutoEstoque,
    funcaoCadastrarNovoLoteEstoque,
    funcaoAjustarEstoqueFisico,
    funcaoVerificarProdutoPorCodigoBarras,
    funcaoTransferirLoteEntrePrateleiras,
    lambda_handler as estoque_lambda_handler,
)
from src.handlers.configuracoes_handler import (
    normalizar_descricao_prateleira,
    funcaoExcluirLocalArmazenamento,
)


def test_trava_palavra_perda_sucesso():
    assert funcaoValidarPalavraConfirmacaoPerda("PERDA") is True


def test_trava_palavra_perda_falha_minuscula():
    assert funcaoValidarPalavraConfirmacaoPerda("perda") is False


def test_ordenacao_fefo():
    lotes = [
        {"id": "L2", "data_validade_lote": date(2026, 12, 10)},
        {"id": "L1", "data_validade_lote": date(2026, 10, 24)},
    ]
    ordenados = funcaoPriorizarSaidaLoteVencimento(lotes)
    assert ordenados[0]["id"] == "L1"


def test_bloqueio_saldo_negativo():
    lote = {"id_lote_produto": 1, "quantidade_atual_pacote": 10}
    resultado = funcaoRemoverProdutoEstoque(lote, 15, "saída para consumo")
    assert resultado["sucesso"] is False
    assert resultado["status_code"] == 422
    assert lote["quantidade_atual_pacote"] == 10


def test_descarte_com_trava_perda():
    lote = {"id_lote_produto": 1, "quantidade_atual_pacote": 8}
    resultado = funcaoRemoverProdutoEstoque(
        lote, 3, "perda - descarte vencido", "PERDA", "Embalagem avariada"
    )
    assert resultado["sucesso"] is True
    assert resultado["novo_saldo"] == 5


def test_ciclo_completo_entrada_verificacao_saida_e_auditoria():
    # 1. Cadastra um lote real via handler (com abreviação 'Prat.' para validar normalização)
    resp_cadastro = estoque_lambda_handler(
        {
            "httpMethod": "POST",
            "body": json.dumps(
                {
                    "acao": "cadastrar_lote",
                    "lote": {
                        "id_lote_produto": "lote_real_01",
                        "id_produto": "prod_7891000100103",
                        "codigo_barra_produto": "7891000100103",
                        "nome_produto": "Leite Integral UHT",
                        "marca_produto": "Ninho",
                        "categoria": "Laticínios",
                        "numero_codigo_lote": "LOTE-REAL-2026",
                        "quantidade_inicial_pacote": 25,
                        "data_validade_lote": "2027-01-15",
                        "id_local_armazenamento": "loc_gel",
                        "local_descricao": "Geladeira 1 - Prat. Central",
                    },
                    "id_usuario": "operador@casadacrianca.org.br",
                }
            ),
        },
        None,
    )
    corpo_cad = json.loads(resp_cadastro["body"])
    assert resp_cadastro["statusCode"] == 201
    assert corpo_cad["sucesso"] is True
    # Verifica que 'Prat.' foi normalizado para 'Prateleira' e o ID colidente 'loc_gel' foi corrigido
    assert corpo_cad["lote"]["local_descricao"] == "Geladeira 1 - Prateleira Central"
    assert corpo_cad["lote"]["id_local_armazenamento"] == "loc_geladeira_1_prateleira_central"

    # 2. Verifica se o código de barras agora consta no banco
    verificacao = funcaoVerificarProdutoPorCodigoBarras("7891000100103")
    assert verificacao["sucesso"] is True
    assert verificacao["existe_no_banco"] is True
    assert verificacao["produto"]["nome_produto"] == "Leite Integral UHT"
    assert verificacao["produto"]["categoria"] == "Laticínios"

    # 3. Consulta estoque e movimentações
    resp_estoque = estoque_lambda_handler(
        {"httpMethod": "POST", "body": json.dumps({"acao": "consultar_estoque"})}, None
    )
    corpo_est = json.loads(resp_estoque["body"])
    assert resp_estoque["statusCode"] == 200
    assert corpo_est["sucesso"] is True
    assert any(l["id_lote_produto"] == "lote_real_01" for l in corpo_est["lotes"])
    assert isinstance(corpo_est.get("locais"), list)

    # 4. Ajusta estoque físico na auditoria
    resultado_ajuste = funcaoAjustarEstoqueFisico(
        id_lote_produto="lote_real_01",
        nova_quantidade=20,
        justificativa="Conferência física de prateleira",
        id_usuario="auditor@casadacrianca.org.br",
    )
    assert resultado_ajuste["sucesso"] is True
    assert resultado_ajuste["novo_saldo"] == 20
    assert resultado_ajuste["diferenca"] == -5

    # 5. Dá saída real de 5 pacotes pelo handler
    resp_saida = estoque_lambda_handler(
        {
            "httpMethod": "POST",
            "body": json.dumps(
                {
                    "acao": "saida_produto",
                    "id_lote_produto": "lote_real_01",
                    "lote": {"id_lote_produto": "lote_real_01"},
                    "quantidade": 5,
                    "motivo_saida": "saída para consumo",
                    "justificativa": "Café da manhã",
                    "id_usuario": "operador@casadacrianca.org.br",
                }
            ),
        },
        None,
    )
    corpo_saida = json.loads(resp_saida["body"])
    assert resp_saida["statusCode"] == 200
    assert corpo_saida["novo_saldo"] == 15


def test_movimentacao_prateleiras_homologadas_e_normalizacao():
    assert normalizar_descricao_prateleira("Armário A - Prat. 1") == "Armário A - Prateleira 1"
    assert normalizar_descricao_prateleira("Geladeira 1 - Prat. Central") == "Geladeira 1 - Prateleira Central"

    # Bloqueia tentativa de mover para a mesma prateleira (mesmo passando 'Prat.')
    res_mesmo_local = funcaoTransferirLoteEntrePrateleiras(
        id_lote_produto="lote_real_01",
        quantidade_mover=5,
        local_destino="Geladeira 1 - Prat. Central",
        id_usuario="operador@casadacrianca.org.br",
    )
    assert res_mesmo_local["sucesso"] is False
    assert res_mesmo_local["status_code"] == 400

    # Transfere 5 pacotes para 'Geladeira 2 - Gaveta Inferior'
    res_mov = estoque_lambda_handler(
        {
            "httpMethod": "POST",
            "body": json.dumps(
                {
                    "acao": "mover_lote",
                    "id_lote_produto": "lote_real_01",
                    "quantidade": 5,
                    "local_destino": "Geladeira 2 - Gaveta Inferior",
                    "id_usuario": "operador@casadacrianca.org.br",
                }
            ),
        },
        None,
    )
    corpo_mov = json.loads(res_mov["body"])
    assert res_mov["statusCode"] == 200
    assert corpo_mov["sucesso"] is True
    assert corpo_mov["saldo_remanescente_origem"] == 10
    assert corpo_mov["lote_destino"]["local_descricao"] == "Geladeira 2 - Gaveta Inferior"
    assert corpo_mov["lote_destino"]["id_local_armazenamento"] == "loc_geladeira_2_gaveta_inferior"

    # Bloqueia exclusão de prateleira que possui lotes ativos (US06)
    res_excluir = funcaoExcluirLocalArmazenamento({"local_descricao": "Geladeira 2 - Gaveta Inferior"})
    assert res_excluir["sucesso"] is False
    assert res_excluir["status_code"] == 409
