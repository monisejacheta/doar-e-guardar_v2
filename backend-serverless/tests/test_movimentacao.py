# backend-serverless/tests/test_movimentacao.py
import pytest
from src.database.connection import GerenciadorConexaoBanco
from src.handlers.movimentacao_handler import (
    funcaoConfirmarDivisaoLoteMovimentacao,
    funcaoMoverProdutoLocalizacao
)

def test_transferencia_lote_completo_sucesso():
    lote_origem = {
        "id_lote_produto": 101,
        "id_local_armazenamento": 1,
        "quantidade_atual_pacote": 25
    }
    local_destino = {
        "id_local_armazenamento": 2,
        "nome_local": "Armário B",
        "tipo_local": "armário",
        "sublocal_compartimento": "Prateleira 1"
    }

    resultado = funcaoMoverProdutoLocalizacao(
        lote_origem=lote_origem,
        local_destino=local_destino,
        quantidade_mover=25,
        id_usuario_responsavel="operador-laura"
    )

    assert resultado["sucesso"] is True
    assert resultado["status_code"] == 200
    assert lote_origem["quantidade_atual_pacote"] == 0


def test_divisao_lote_bloqueada_sem_confirmacao():
    lote_origem = {
        "id_lote_produto": 102,
        "id_local_armazenamento": 1,
        "quantidade_atual_pacote": 20
    }
    local_destino = {
        "id_local_armazenamento": 3,
        "nome_local": "Geladeira 1",
        "tipo_local": "geladeira",
        "sublocal_compartimento": "Gaveta Central"
    }

    # Tentativa de mover 8 de 20 pacotes SEM confirmar divisão
    resultado = funcaoMoverProdutoLocalizacao(
        lote_origem=lote_origem,
        local_destino=local_destino,
        quantidade_mover=8,
        id_usuario_responsavel="operador-juliano",
        confirmacao_divisao_lote=False
    )

    assert resultado["sucesso"] is False
    assert resultado["status_code"] == 409
    assert resultado["requer_confirmacao"] is True
    # Saldo deve permanecer intacto
    assert lote_origem["quantidade_atual_pacote"] == 20


def test_divisao_lote_permitida_apos_confirmacao():
    lote_origem = {
        "id_lote_produto": 102,
        "id_local_armazenamento": 1,
        "quantidade_atual_pacote": 20
    }
    local_destino = {
        "id_local_armazenamento": 3,
        "nome_local": "Geladeira 1",
        "tipo_local": "geladeira",
        "sublocal_compartimento": "Gaveta Central"
    }

    resultado = funcaoMoverProdutoLocalizacao(
        lote_origem=lote_origem,
        local_destino=local_destino,
        quantidade_mover=8,
        id_usuario_responsavel="operador-juliano",
        confirmacao_divisao_lote=True
    )

    assert resultado["sucesso"] is True
    assert resultado["status_code"] == 200
    assert lote_origem["quantidade_atual_pacote"] == 12


def test_rollback_transacional_em_falha_de_destino():
    """
    Conformidade Seção 3.2 Fatec:
    Garante que em caso de queda de conexão ou erro no destino,
    o rollback é disparado e nenhuma alteração parcial é gravada.
    """
    conexao = GerenciadorConexaoBanco()
    lote_origem = {
        "id_lote_produto": 103,
        "id_local_armazenamento": 1,
        "quantidade_atual_pacote": 15
    }
    local_destino = {
        "id_local_armazenamento": 4,
        "nome_local": "Armário C",
        "tipo_local": "armário",
        "sublocal_compartimento": "Prateleira 3"
    }

    resultado = funcaoMoverProdutoLocalizacao(
        lote_origem=lote_origem,
        local_destino=local_destino,
        quantidade_mover=5,
        id_usuario_responsavel="operador-daniel",
        confirmacao_divisao_lote=True,
        simular_erro_destino=True, # Força falha transacional
        conexao_banco=conexao
    )

    assert resultado["sucesso"] is False
    assert resultado["status_code"] == 500
    assert resultado["rollback_executado"] is True
    # O saldo original deve permanecer inalterado
    assert lote_origem["quantidade_atual_pacote"] == 15
    assert len(conexao.historico_operacoes) == 0


def test_bloqueio_locais_com_ruas_ou_corredores():
    lote_origem = {
        "id_lote_produto": 104,
        "id_local_armazenamento": 1,
        "quantidade_atual_pacote": 10
    }
    local_invalido = {
        "id_local_armazenamento": 99,
        "nome_local": "Galpão A",
        "tipo_local": "rua_galpao", # Proibido pela regra US06
        "sublocal_compartimento": "Corredor 02"
    }

    resultado = funcaoMoverProdutoLocalizacao(
        lote_origem=lote_origem,
        local_destino=local_invalido,
        quantidade_mover=5,
        id_usuario_responsavel="operador-monise"
    )

    assert resultado["sucesso"] is False
    assert resultado["status_code"] == 400
    assert "armário" in resultado["mensagem"] and "geladeira" in resultado["mensagem"]