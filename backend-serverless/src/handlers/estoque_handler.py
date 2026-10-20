# backend-serverless/src/handlers/estoque_handler.py
import json
from datetime import date
from typing import Dict, Any, List
from src.utils.response import formatar_resposta_http


def funcaoValidarPalavraConfirmacaoPerda(palavra_digitada: str) -> bool:
    """
    Regra US07 / Tela 3.2: Exige a digitação exata da palavra 'PERDA' em maiúsculas
    para homologar saídas por avaria ou término da validade.
    """
    if not isinstance(palavra_digitada, str):
        return False
    return palavra_digitada.strip() == "PERDA"


def funcaoPriorizarSaidaLoteVencimento(lotes: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Regra FEFO (First Expire, First Out):
    Ordena os lotes ativos crescentemente pela data de validade mais próxima.
    """
    def extrair_data(lote):
        val = lote.get("data_validade_lote")
        if isinstance(val, str):
            return date.fromisoformat(val)
        return val

    return sorted(lotes, key=extrair_data)


def funcaoCadastrarNovoLoteEstoque(
    id_produto: int,
    id_local_armazenamento: int,
    numero_codigo_lote: str,
    quantidade_inicial_pacote: int,
    data_validade_lote: str,
    id_doador: int = None
) -> Dict[str, Any]:
    """
    Regra Tela 3.1: Registra a entrada de um novo lote associado a um produto existente.
    """
    if quantidade_inicial_pacote <= 0:
        return {
            "sucesso": False,
            "status_code": 400,
            "mensagem": "A quantidade de pacotes do lote deve ser maior que zero."
        }

    if not numero_codigo_lote or not data_validade_lote:
        return {
            "sucesso": False,
            "status_code": 400,
            "mensagem": "O número do lote e a data de validade são de preenchimento obrigatório."
        }

    novo_lote = {
        "id_lote_produto": 1,  # Atribuído via SERIAL do banco
        "id_produto": id_produto,
        "id_local_armazenamento": id_local_armazenamento,
        "id_doador": id_doador,
        "numero_codigo_lote": numero_codigo_lote.strip(),
        "quantidade_atual_pacote": quantidade_inicial_pacote,
        "quantidade_inicial_pacote": quantidade_inicial_pacote,
        "data_validade_lote": data_validade_lote,
        "status_validade_lote": "regular"
    }

    return {
        "sucesso": True,
        "status_code": 201,
        "mensagem": f"Lote {numero_codigo_lote} cadastrado com sucesso no inventário.",
        "lote": novo_lote
    }


def funcaoRemoverProdutoEstoque(
    lote: Dict[str, Any],
    quantidade_solicitada: int,
    motivo_saida: str,
    palavra_confirmacao: str = "",
    justificativa: str = ""
) -> Dict[str, Any]:
    """
    Regra US07 / Tela 3.2:
    Processa a baixa de pacotes garantindo impedimento de valores negativos e a trava PERDA.
    """
    if quantidade_solicitada <= 0:
        return {
            "sucesso": False,
            "status_code": 400,
            "mensagem": "A quantidade de saída deve ser superior a zero."
        }

    saldo_atual = lote.get("quantidade_atual_pacote", 0)
    if quantidade_solicitada > saldo_atual:
        return {
            "sucesso": False,
            "status_code": 422,
            "mensagem": f"Saldo insuficiente no lote. Disponível: {saldo_atual}, Solicitado: {quantidade_solicitada}."
        }

    motivo_normalizado = motivo_saida.lower()
    eh_descarte = "perda" in motivo_normalizado or "descarte" in motivo_normalizado

    if eh_descarte:
        if not funcaoValidarPalavraConfirmacaoPerda(palavra_confirmacao):
            return {
                "sucesso": False,
                "status_code": 403,
                "mensagem": "Operação bloqueada: Para autorizar o descarte é obrigatório digitar exatamente a palavra 'PERDA' em maiúsculas."
            }
        if not justificativa.strip():
            return {
                "sucesso": False,
                "status_code": 400,
                "mensagem": "Justificativa obrigatória para saídas decorrentes de perda ou avaria."
            }

    novo_saldo = saldo_atual - quantidade_solicitada
    lote["quantidade_atual_pacote"] = novo_saldo

    return {
        "sucesso": True,
        "status_code": 200,
        "mensagem": "Saída de estoque homologada com sucesso.",
        "novo_saldo": novo_saldo,
        "quantidade_removida": quantidade_solicitada,
        "motivo": motivo_saida
    }


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Ponto de entrada padrão da AWS Lambda para rotas de Estoque (/api/estoque/*).
    """
    metodo_http = event.get("httpMethod", "GET")
    corpo_requisicao = {}

    if "body" in event and event["body"]:
        try:
            corpo_requisicao = json.loads(event["body"]) if isinstance(event["body"], str) else event["body"]
        except Exception:
            return formatar_resposta_http(400, {"erro": "Payload JSON inválido."})

    acao = corpo_requisicao.get("acao", "")

    if metodo_http == "POST" and acao == "saida_produto":
        lote_mock = corpo_requisicao.get("lote", {})
        resultado = funcaoRemoverProdutoEstoque(
            lote=lote_mock,
            quantidade_solicitada=corpo_requisicao.get("quantidade", 0),
            motivo_saida=corpo_requisicao.get("motivo_saida", ""),
            palavra_confirmacao=corpo_requisicao.get("palavra_confirmacao", ""),
            justificativa=corpo_requisicao.get("justificativa", "")
        )
        return formatar_resposta_http(resultado["status_code"], resultado)

    if metodo_http == "POST" and acao == "entrada_lote":
        resultado = funcaoCadastrarNovoLoteEstoque(
            id_produto=corpo_requisicao.get("id_produto", 0),
            id_local_armazenamento=corpo_requisicao.get("id_local_armazenamento", 0),
            numero_codigo_lote=corpo_requisicao.get("numero_codigo_lote", ""),
            quantidade_inicial_pacote=corpo_requisicao.get("quantidade_inicial_pacote", 0),
            data_validade_lote=corpo_requisicao.get("data_validade_lote", ""),
            id_doador=corpo_requisicao.get("id_doador")
        )
        return formatar_resposta_http(resultado["status_code"], resultado)

    return formatar_resposta_http(400, {"erro": f"Ação '{acao}' não suportada pelo manipulador de estoque."})