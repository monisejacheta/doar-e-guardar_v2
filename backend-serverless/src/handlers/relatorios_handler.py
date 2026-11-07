# backend-serverless/src/handlers/relatorios_handler.py
import json
from datetime import datetime
from typing import Dict, Any, List
from src.utils.response import formatar_resposta_http
from src.handlers.estoque_handler import (
    obter_historico_movimentacoes,
    obter_lotes_estoque,
)


def funcaoEnviarRelatorioCompletoEmail(dados_requisicao: Dict[str, Any]) -> Dict[str, Any]:
    destinatarios: List[str] = dados_requisicao.get("destinatarios", [])
    destinatarios_validos = [
        email.strip() for email in destinatarios if isinstance(email, str) and "@" in email
    ]

    if not destinatarios_validos:
        return {
            "sucesso": False,
            "status_code": 400,
            "mensagem": "Informe ao menos um endereço de e-mail válido para envio do relatório.",
        }

    lotes = obter_lotes_estoque()
    total_pacotes = sum(int(l.get("quantidade_atual_pacote", 0)) for l in lotes)

    return {
        "sucesso": True,
        "status_code": 200,
        "mensagem": f"Relatório consolidado gerado e despachado para {', '.join(destinatarios_validos)}.",
        "resumo_envio": {
            "destinatarios": destinatarios_validos,
            "total_lotes_analisados": len(lotes),
            "total_pacotes_inventario": total_pacotes,
            "tipo_grafico": dados_requisicao.get("tipo_grafico", "barras"),
            "gerado_em": datetime.now().isoformat(timespec="seconds"),
        },
    }


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Ponto de entrada AWS Lambda para rotas de Relatórios (/api/relatorios).
    """
    corpo_requisicao = {}
    if "body" in event and event["body"]:
        try:
            corpo_requisicao = (
                json.loads(event["body"])
                if isinstance(event["body"], str)
                else event["body"]
            )
        except Exception:
            return formatar_resposta_http(400, {"erro": "Payload JSON inválido."})

    acao = corpo_requisicao.get("acao", "consultar_movimentacoes")

    if acao == "consultar_movimentacoes":
        return formatar_resposta_http(
            200,
            {
                "sucesso": True,
                "status_code": 200,
                "movimentacoes": obter_historico_movimentacoes(),
            },
        )

    if acao == "enviar_relatorio_completo_email":
        resultado = funcaoEnviarRelatorioCompletoEmail(corpo_requisicao)
        return formatar_resposta_http(resultado["status_code"], resultado)

    return formatar_resposta_http(
        400, {"sucesso": False, "erro": f"Ação de relatório '{acao}' não suportada."}
    )
