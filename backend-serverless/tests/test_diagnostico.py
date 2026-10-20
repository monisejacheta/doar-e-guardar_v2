# backend-serverless/tests/test_diagnostico.py
import pytest
from src.services.dora_ia import (
    funcaoProcessarComandoLinguagemNaturalDora,
    funcaoSugerirReceitasAntidesperdicioDora
)
from src.handlers.diagnostico_handler import (
    funcaoVerificarDisponibilidadeServicosAws,
    funcaoVerificarIntegridadeBancosDados
)


def test_dora_classificacao_intencao_receita():
    assert funcaoProcessarComandoLinguagemNaturalDora("Pode sugerir uma receita com itens a vencer?") == "receitas"
    assert funcaoProcessarComandoLinguagemNaturalDora("O que posso cozinhar com leite?") == "receitas"


def test_dora_classificacao_intencao_validade():
    assert funcaoProcessarComandoLinguagemNaturalDora("Quais produtos vencem nesta semana?") == "validade_estoque"
    assert funcaoProcessarComandoLinguagemNaturalDora("Como está o saldo de arroz?") == "validade_estoque"


def test_dora_sugestao_receita_fefo():
    lotes = [
        {"nome_produto": "Leite UHT", "numero_codigo_lote": "LOTE-A1", "data_validade_lote": "2026-10-24", "status_validade_lote": "próximo do vencimento", "local": "Geladeira 1"}
    ]
    resultado = funcaoSugerirReceitasAntidesperdicioDora(lotes)
    assert resultado["sucesso"] is True
    assert "Arroz Doce" in resultado["receita"]["titulo"]
    assert "https://" in resultado["receita"]["fonte_url"]
    assert len(resultado["receita"]["ingredientes_estoque"]) > 0


def test_health_check_servicos_aws():
    res = funcaoVerificarDisponibilidadeServicosAws()
    assert res["status"] == "DISPONÍVEL"
    assert res["regiao"] == "sa-east-1"
    assert res["latencia_ms"] > 0


def test_health_check_bancos_dados():
    res = funcaoVerificarIntegridadeBancosDados()
    assert res["banco_relacional_sql"]["status"] == "DISPONÍVEL"
    assert res["banco_nao_relacional_nosql"]["status"] == "DISPONÍVEL"