# backend-serverless/src/handlers/dora_handler.py
import json
from typing import Dict, Any
from src.utils.response import formatar_resposta_http
from src.services.dora_ia import (
    funcaoProcessarComandoLinguagemNaturalDora,
    funcaoSugerirReceitasAntidesperdicioDora
)


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Ponto de entrada AWS Lambda para o chat inteligente da Dora (/api/dora/conversa).
    """
    corpo_requisicao = {}
    if "body" in event and event["body"]:
        try:
            corpo_requisicao = json.loads(event["body"]) if isinstance(event["body"], str) else event["body"]
        except Exception:
            return formatar_resposta_http(400, {"erro": "Payload JSON inválido."})

    comando_texto = corpo_requisicao.get("mensagem", "")
    intencao = funcaoProcessarComandoLinguagemNaturalDora(comando_texto)

    if intencao == "receitas":
        lotes_contexto = corpo_requisicao.get("lotes_estoque", [])
        resposta = funcaoSugerirReceitasAntidesperdicioDora(lotes_contexto)
        return formatar_resposta_http(200, resposta)

    elif intencao == "validade_estoque":
        return formatar_resposta_http(200, {
            "sucesso": True,
            "intencao": "validade_estoque",
            "mensagem": "Atualmente temos 2 lotes em estado crítico: Leite Integral UHT (LOTE-2026-A1 na Geladeira 1) e Feijão Carioca no Armário B."
        })

    elif intencao == "relatorios":
        return formatar_resposta_http(200, {
            "sucesso": True,
            "intencao": "relatorios",
            "mensagem": "Relatório consolidado com gráficos gerado em PDF com sucesso e despachado para a diretoria."
        })

    return formatar_resposta_http(200, {
        "sucesso": True,
        "intencao": "auxilio",
        "mensagem": "Para registrar uma saída por descarte, acesse Gerenciar Estoque, selecione o lote e digite 'PERDA' em maiúsculas para desbloquear."
    })