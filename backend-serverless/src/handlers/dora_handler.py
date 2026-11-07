# backend-serverless/src/handlers/dora_handler.py
import json
from typing import Dict, Any
from src.utils.response import formatar_resposta_http
from src.services.dora_ia import (
    funcaoProcessarComandoLinguagemNaturalDora,
    funcaoSugerirReceitasAntidesperdicioDora,
    funcaoPredizerConsumoEstoqueDora,
)
from src.handlers.estoque_handler import obter_lotes_estoque


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Ponto de entrada AWS Lambda para o chat inteligente da Dora (/api/dora).
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

    comando_texto = corpo_requisicao.get("mensagem") or corpo_requisicao.get("pergunta") or ""
    intencao = funcaoProcessarComandoLinguagemNaturalDora(comando_texto)
    lotes_contexto = corpo_requisicao.get("lotes_estoque")
    if lotes_contexto is None:
        lotes_contexto = obter_lotes_estoque()

    lotes_ativos = [
        l for l in (lotes_contexto or []) if int(l.get("quantidade_atual_pacote", 0) or 0) > 0
    ]

    if intencao == "receitas":
        resposta = funcaoSugerirReceitasAntidesperdicioDora(lotes_ativos)
        return formatar_resposta_http(200, resposta)

    elif intencao == "predicao_consumo":
        resposta = funcaoPredizerConsumoEstoqueDora(lotes_ativos)
        return formatar_resposta_http(200, resposta)

    elif intencao == "validade_estoque":
        if not lotes_ativos:
            return formatar_resposta_http(
                200,
                {
                    "sucesso": True,
                    "intencao": "validade_estoque",
                    "mensagem": "Dei uma olhadinha nas nossas prateleiras e no momento não temos pacotes guardados no estoque! 📦✨",
                },
            )
        criticos = [
            l
            for l in lotes_ativos
            if l.get("status_validade_lote") in ("vencido", "próximo do vencimento")
        ]
        alvos = (criticos or lotes_ativos)[:4]
        linhas = [
            f"• {l.get('nome_produto')}: {l.get('quantidade_atual_pacote')} pct(s) em {l.get('local_descricao')} — Validade: {l.get('data_validade_lote')} ({l.get('status_validade_lote')})"
            for l in alvos
        ]
        cabecalho = (
            f"Olha só! Encontrei {len(criticos)} item(ns) que pedem nossa atenção primeiro para não desperdiçarmos nada: ⏰👀\n\n"
            if criticos
            else f"Temos {len(lotes_ativos)} lote(s) guardados com carinho nas prateleiras! 📦✨ Os que vencem mais cedo são:\n\n"
        )
        return formatar_resposta_http(
            200,
            {
                "sucesso": True,
                "intencao": "validade_estoque",
                "mensagem": cabecalho + "\n".join(linhas),
            },
        )

    elif intencao == "relatorios":
        return formatar_resposta_http(
            200,
            {
                "sucesso": True,
                "intencao": "relatorios",
                "mensagem": f"Temos {len(lotes_ativos)} lote(s) organizados nas prateleiras! 📊📄 Você pode ver os resumos completos de validades, movimentações e perdas lá na Central de Relatórios!",
            },
        )

    return formatar_resposta_http(
        200,
        {
            "sucesso": True,
            "intencao": "auxilio",
            "mensagem": (
                "Estou aqui para ajudar você com tudo no aplicativo! 😊💛 Olha como é fácil:\n"
                "📥 Entrada: leia o código de barras com a câmera e escolha em qual armário ou geladeira guardar.\n"
                "📤 Saída: anote o que foi usado na cozinha ou digite PERDA em maiúsculas quando precisar descartar um item vencido.\n"
                "🔄 Movimentação: mude pacotes de uma prateleira para outra rapidinho!"
            ),
        },
    )
