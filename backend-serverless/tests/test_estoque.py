# backend-serverless/tests/test_estoque.py
import pytest
from datetime import date
from src.handlers.estoque_handler import (
    funcaoValidarPalavraConfirmacaoPerda,
    funcaoPriorizarSaidaLoteVencimento,
    funcaoRemoverProdutoEstoque,
    funcaoCadastrarNovoLoteEstoque
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