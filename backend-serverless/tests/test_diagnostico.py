# backend-serverless/tests/test_diagnostico.py
import json
import pytest
from src.services.dora_ia import (
    funcaoProcessarComandoLinguagemNaturalDora,
    funcaoSugerirReceitasAntidesperdicioDora,
    funcaoPredizerConsumoEstoqueDora,
)
from src.handlers.diagnostico_handler import (
    funcaoVerificarDisponibilidadeServicosAws,
    funcaoVerificarIntegridadeBancosDados,
)
from src.handlers.auth_handler import lambda_handler as auth_lambda_handler
from src.handlers.configuracoes_handler import (
    funcaoCadastrarLocalArmazenamento,
    funcaoModerarCampanhaDoacao,
)
from src.handlers.relatorios_handler import funcaoEnviarRelatorioCompletoEmail
from src.services.mensageria import funcaoDispararComunicadoLgpd
from src.database.firebase_client import funcaoAutenticarCredenciaisFirebase


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


def test_dora_predicao_consumo_ml():
    assert funcaoProcessarComandoLinguagemNaturalDora("Qual a previsão de consumo do estoque?") == "predicao_consumo"
    lotes = [
        {"nome_produto": "Arroz Tipo 1", "categoria": "Grãos", "quantidade_atual_pacote": 18, "local_descricao": "Armário A - Prateleira 1"},
        {"nome_produto": "Leite Integral UHT", "categoria": "Laticínios", "quantidade_atual_pacote": 11, "local_descricao": "Geladeira 1 - Prateleira Central"},
    ]
    resultado = funcaoPredizerConsumoEstoqueDora(lotes)
    assert resultado["sucesso"] is True
    assert resultado["intencao"] == "predicao_consumo"
    assert len(resultado["predicoes"]) == 2
    assert resultado["predicoes"][0]["dias_autonomia"] >= 1


def test_health_check_servicos_aws():
    res = funcaoVerificarDisponibilidadeServicosAws()
    assert res["status"] == "DISPONÍVEL"
    assert res["regiao"] == "sa-east-1"
    assert res["latencia_ms"] > 0


def test_health_check_bancos_dados():
    res = funcaoVerificarIntegridadeBancosDados()
    assert res["banco_relacional_sql"]["status"] == "DISPONÍVEL"
    assert res["banco_nao_relacional_nosql"]["status"] == "DISPONÍVEL"


def test_bloqueio_token_simulado_no_login():
    evento = {
        "httpMethod": "POST",
        "body": json.dumps(
            {
                "tipo_login": "google",
                "id_token": "google_oauth_token_simulado",
                "perfil_usuario": {"email": "invasor@teste.com"},
            }
        ),
    }
    resposta = auth_lambda_handler(evento, None)
    corpo = json.loads(resposta["body"])
    assert resposta["statusCode"] == 401
    assert corpo["sucesso"] is False


def test_validacao_credenciais_invalidas():
    evento = {
        "httpMethod": "POST",
        "body": json.dumps(
            {
                "tipo_login": "credenciais",
                "email": "invalido-sem-arroba",
                "senha": "123",
            }
        ),
    }
    resposta = auth_lambda_handler(evento, None)
    assert resposta["statusCode"] == 401


def test_configuracoes_bloqueio_corredores_e_moderacao():
    res_invalido = funcaoCadastrarLocalArmazenamento(
        {"nome_local": "Corredor B", "tipo_local": "corredor", "sublocal_compartimento": "Rua 1"}
    )
    assert res_invalido["sucesso"] is False
    assert res_invalido["status_code"] == 400

    res_reprovacao_sem_justificativa = funcaoModerarCampanhaDoacao(
        {"id_campanha_doacao": 10, "status_campanha": "Reprovada", "justificativa_parecer_tecnico": ""}
    )
    assert res_reprovacao_sem_justificativa["sucesso"] is False
    assert res_reprovacao_sem_justificativa["status_code"] == 400


def test_relatorios_e_mensageria_lgpd():
    res_rel = funcaoEnviarRelatorioCompletoEmail(
        {"destinatarios": ["diretoria@casadacrianca.org.br"], "tipo_grafico": "barras"}
    )
    assert res_rel["sucesso"] is True
    assert res_rel["status_code"] == 200

    doadores = [
        {"nome": "Ana", "opt_in_ativo": True},
        {"nome": "Carlos", "opt_in_ativo": False},
    ]
    res_msg = funcaoDispararComunicadoLgpd(doadores, "Precisamos de leite integral.")
    assert res_msg["sucesso"] is True
    assert res_msg["total_enviados"] == 1
    assert res_msg["total_bloqueados_lgpd"] == 1
    assert "SAIR" in res_msg["mensagem_formatada"]


def test_autenticacao_administrador_institucional():
    res_admin = funcaoAutenticarCredenciaisFirebase("casadacrianca@adm", "casadacriancaadm")
    assert res_admin["sucesso"] is True
    assert res_admin["role"] == "administrador"
    assert res_admin["email"] == "casadacrianca@adm"

    res_senha_errada = funcaoAutenticarCredenciaisFirebase("casadacrianca@adm", "senhaerrada")
    assert res_senha_errada["sucesso"] is False

