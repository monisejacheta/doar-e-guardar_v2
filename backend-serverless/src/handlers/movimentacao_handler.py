# backend-serverless/src/handlers/movimentacao_handler.py
import json
from typing import Dict, Any
from src.utils.response import formatar_resposta_http
from src.database.connection import (
    GerenciadorConexaoBanco,
    contexto_transacional,
    TransacaoFalhaException
)


def funcaoConfirmarDivisaoLoteMovimentacao(
    quantidade_lote_atual: int,
    quantidade_solicitada: int,
    confirmacao_divisao: bool
) -> bool:
    """
    Regra Tela 3.3: Exige confirmação explícita do operador caso a quantidade a mover
    seja inferior ao volume total do lote original.
    """
    if quantidade_solicitada < quantidade_lote_atual:
        return confirmacao_divisao is True
    return True


def funcaoMoverProdutoLocalizacao(
    lote_origem: Dict[str, Any],
    local_destino: Dict[str, Any],
    quantidade_mover: int,
    id_usuario_responsavel: str,
    confirmacao_divisao_lote: bool = False,
    simular_erro_destino: bool = False,
    conexao_banco: GerenciadorConexaoBanco = None
) -> Dict[str, Any]:
    """
    Regra Tela 3.3 / Seção 3.2:
    Executa a transferência entre compartimentos físicos. Registra saída e entrada atômicas;
    se houver erro, executa rollback total sem persistir dados parciais.
    """
    if conexao_banco is None:
        conexao_banco = GerenciadorConexaoBanco()

    if quantidade_mover <= 0:
        return {
            "sucesso": False,
            "status_code": 400,
            "mensagem": "A quantidade para transferência deve ser superior a zero."
        }

    saldo_origem = lote_origem.get("quantidade_atual_pacote", 0)
    if quantidade_mover > saldo_origem:
        return {
            "sucesso": False,
            "status_code": 422,
            "mensagem": f"Saldo insuficiente no lote de origem. Disponível: {saldo_origem}, Solicitado: {quantidade_mover}."
        }

    # Bloqueio de corredores e ruas (restrito a armário ou geladeira)
    tipo_local = local_destino.get("tipo_local", "").lower()
    if tipo_local not in ["armário", "geladeira"]:
        return {
            "sucesso": False,
            "status_code": 400,
            "mensagem": "Compartimento de destino inválido. São permitidos apenas 'armário' ou 'geladeira' sem ruas ou corredores."
        }

    # Verificação de divisão de lote
    if not funcaoConfirmarDivisaoLoteMovimentacao(saldo_origem, quantidade_mover, confirmacao_divisao_lote):
        return {
            "sucesso": False,
            "status_code": 409,
            "requer_confirmacao": True,
            "mensagem": f"Aviso de Divisão de Lote: Está a transferir {quantidade_mover} de {saldo_origem} pacotes. Confirme a divisão para prosseguir."
        }

    # Bloco transacional atómico
    try:
        with contexto_transacional(conexao_banco):
            # 1. Registro de saída da origem
            saida_origem = {
                "tabela": "tb_movimentacoesEstoques",
                "tipo_operacao": "saída",
                "motivo": "saída - movimentação estoque",
                "id_lote_produto": lote_origem.get("id_lote_produto"),
                "id_local_origem": lote_origem.get("id_local_armazenamento"),
                "quantidade_movimentada_pacote": quantidade_mover,
                "id_usuario_responsavel": id_usuario_responsavel
            }
            conexao_banco.registrar_operacao(saida_origem)

            # Simulação de erro para validação de rollback
            if simular_erro_destino:
                raise TransacaoFalhaException("Falha ao registrar a entrada no local de destino.")

            # 2. Registro de entrada no destino
            entrada_destino = {
                "tabela": "tb_movimentacoesEstoques",
                "tipo_operacao": "entrada",
                "motivo": "entrada por transferência",
                "id_lote_produto": lote_origem.get("id_lote_produto"),
                "id_local_destino": local_destino.get("id_local_armazenamento"),
                "quantidade_movimentada_pacote": quantidade_mover,
                "id_usuario_responsavel": id_usuario_responsavel
            }
            conexao_banco.registrar_operacao(entrada_destino)

            # Atualização do saldo em memória
            lote_origem["quantidade_atual_pacote"] -= quantidade_mover

        return {
            "sucesso": True,
            "status_code": 200,
            "mensagem": f"Lote transferido com sucesso para {local_destino.get('nome_local')} ({local_destino.get('sublocal_compartimento')}).",
            "quantidade_transferida": quantidade_mover,
            "saldo_remanescente_origem": lote_origem["quantidade_atual_pacote"]
        }

    except TransacaoFalhaException as erro_transacao:
        return {
            "sucesso": False,
            "status_code": 500,
            "rollback_executado": True,
            "mensagem": f"Transação cancelada com sucesso (Rollback executado). Detalhe: {str(erro_transacao)}"
        }


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Ponto de entrada padrão da AWS Lambda para rotas de Movimentação (/api/movimentacao/*).
    """
    metodo_http = event.get("httpMethod", "POST")
    corpo_requisicao = {}

    if "body" in event and event["body"]:
        try:
            corpo_requisicao = json.loads(event["body"]) if isinstance(event["body"], str) else event["body"]
        except Exception:
            return formatar_resposta_http(400, {"erro": "Payload JSON inválido."})

    resultado = funcaoMoverProdutoLocalizacao(
        lote_origem=corpo_requisicao.get("lote_origem", {}),
        local_destino=corpo_requisicao.get("local_destino", {}),
        quantidade_mover=corpo_requisicao.get("quantidade_mover", 0),
        id_usuario_responsavel=corpo_requisicao.get("id_usuario_responsavel", "sistema"),
        confirmacao_divisao_lote=corpo_requisicao.get("confirmacao_divisao_lote", False)
    )

    return formatar_resposta_http(resultado["status_code"], resultado)