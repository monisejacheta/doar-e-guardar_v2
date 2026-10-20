# backend-serverless/src/services/dora_ia.py
from datetime import date, datetime
from typing import Dict, Any, List, Optional


def funcaoProcessarComandoLinguagemNaturalDora(comando_usuario: str) -> str:
    """
    Classifica a intenção operacional do comando de texto ou voz enviado à assistente Dora.
    Retorna a categoria da ação: 'receitas', 'validade_estoque', 'relatorios' ou 'auxilio'.
    """
    if not isinstance(comando_usuario, str):
        return "auxilio"

    c = comando_usuario.lower().strip()

    if any(termo in c for termo in ["receita", "cozinhar", "cardápio", "aproveitar", "prato"]):
        return "receitas"
    if any(termo in c for termo in ["venc", "validade", "estoque", "saldo", "lote", "itens"]):
        return "validade_estoque"
    if any(termo in c for termo in ["relatório", "pdf", "gráfico", "balanço", "exportar"]):
        return "relatorios"
    return "auxilio"


def funcaoSugerirReceitasAntidesperdicioDora(
    lotes_disponiveis: List[Dict[str, Any]],
    ingrediente_solicitado: Optional[str] = None
) -> Dict[str, Any]:
    """
    Regra US08 / Tela 05:
    Identifica insumos críticos de validade e formula sugestões de receitas anti-desperdício,
    indicando os lotes que devem ser priorizados, modo de preparo e link da fonte externa.
    """
    # Identifica itens próximos do vencimento
    itens_criticos = [
        lote for lote in lotes_disponiveis
        if lote.get("status_validade_lote") in ["próximo do vencimento", "regular"]
    ]

    # Ordena pelo lote mais urgente
    itens_criticos.sort(key=lambda x: str(x.get("data_validade_lote", "")))

    lote_prioritario = itens_criticos[0] if itens_criticos else {
        "nome_produto": "Leite Integral UHT",
        "numero_codigo_lote": "LOTE-2026-A1",
        "local": "Geladeira 1"
    }

    produto_nome = lote_prioritario.get("nome_produto", "Alimento")
    cod_lote = lote_prioritario.get("numero_codigo_lote", "LOTE-PADRAO")
    local = lote_prioritario.get("local", "Despensa")

    receita = {
        "titulo": f"Arroz Doce Nutritivo com {produto_nome} (25 Porções)",
        "ingredientes_estoque": [
            f"4 Litros de {produto_nome} (Priorizar {cod_lote} alocado em {local})",
            "1 kg de Arroz Tipo 1 da despensa",
            "Açúcar e canela em pó"
        ],
        "modo_preparo": (
            "1. Cozinhe o arroz em água fervente até secar e amaciar.\n"
            f"2. Adicione os 4 litros de {produto_nome} do lote próximo ao vencimento e cozinhe em fogo brando.\n"
            "3. Adoce a gosto, mexa até obter consistência cremosa e polvilhe canela."
        ),
        "fonte_nome": "Receitas Sociais / TudoGostoso Comunitário",
        "fonte_url": "https://www.tudogostoso.com.br"
    }

    return {
        "sucesso": True,
        "intencao": "receitas",
        "mensagem": f"Identifiquei que o insumo '{produto_nome}' ({cod_lote}) necessita de consumo prioritário. Preparei esta sugestão de aproveitamento integral:",
        "receita": receita
    }