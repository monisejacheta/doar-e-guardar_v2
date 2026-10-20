# backend-serverless/tests/test_codigo_barras.py
import pytest
from src.services.api_codigo_barras import (
    funcaoValidarCodigoBarrasManual,
    funcaoConsultarProdutoApisCascata
)

def test_validacao_formato_codigo_barras():
    assert funcaoValidarCodigoBarrasManual("7891000100103") is True
    assert funcaoValidarCodigoBarrasManual("78912345") is True
    assert funcaoValidarCodigoBarrasManual("123") is False # Menor que 8 dígitos
    assert funcaoValidarCodigoBarrasManual("123456789012345") is False # Maior que 14 dígitos
    assert funcaoValidarCodigoBarrasManual("LEITE1234567") is False # Contém letras


def test_sucesso_na_primeira_api():
    mock_api1 = lambda ean: {"nome_produto": "Leite UHT 1L", "origem": "API 1"}
    mock_api2 = lambda ean: None
    mock_api3 = lambda ean: None

    resultado = funcaoConsultarProdutoApisCascata("7891000100103", [mock_api1, mock_api2, mock_api3])
    assert resultado["sucesso"] is True
    assert resultado["provedor_utilizado"] == "API 1"
    assert resultado["dados_produto"]["nome_produto"] == "Leite UHT 1L"


def test_fallback_segunda_api_quando_primeira_falha():
    mock_api1 = lambda ean: None # Falhou / não encontrou
    mock_api2 = lambda ean: {"nome_produto": "Arroz Tipo 1", "origem": "API 2"}
    mock_api3 = lambda ean: None

    resultado = funcaoConsultarProdutoApisCascata("7896006711114", [mock_api1, mock_api2, mock_api3])
    assert resultado["sucesso"] is True
    assert resultado["provedor_utilizado"] == "API 2"
    assert resultado["dados_produto"]["nome_produto"] == "Arroz Tipo 1"


def test_fallback_terceira_api_quando_duas_primeiras_falham():
    mock_api1 = lambda ean: None
    mock_api2 = lambda ean: None
    mock_api3 = lambda ean: {"nome_produto": "Feijão Carioca", "origem": "API 3"}

    resultado = funcaoConsultarProdutoApisCascata("7891234567890", [mock_api1, mock_api2, mock_api3])
    assert resultado["sucesso"] is True
    assert resultado["provedor_utilizado"] == "API 3"
    assert resultado["dados_produto"]["nome_produto"] == "Feijão Carioca"


def test_falha_nas_tres_apis_habilita_cadastro_manual():
    mock_api1 = lambda ean: None
    mock_api2 = lambda ean: None
    mock_api3 = lambda ean: None

    resultado = funcaoConsultarProdutoApisCascata("7899999999999", [mock_api1, mock_api2, mock_api3])
    assert resultado["sucesso"] is False
    assert resultado["status_code"] == 404
    assert resultado["permitir_cadastro_manual"] is True
    assert len(resultado["erros"]) == 3