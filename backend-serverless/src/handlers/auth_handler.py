# backend-serverless/src/handlers/auth_handler.py
import json
from typing import Dict, Any
from src.utils.response import formatar_resposta_http
from src.database.firebase_client import (
    funcaoValidarTokenFirebase,
    funcaoGravarSessaoUsuarioNoSql
)


def funcaoAutenticarLoginGoogle(dados_requisicao: Dict[str, Any], plataforma: str = "mobile_android") -> Dict[str, Any]:
    id_token = dados_requisicao.get("id_token", "")
    dados_perfil = dados_requisicao.get("perfil_usuario", None)

    validacao = funcaoValidarTokenFirebase(id_token, dados_perfil)

    if not validacao.get("sucesso"):
        return {
            "sucesso": False,
            "status_code": 401,
            "mensagem": validacao.get("mensagem", "Falha na autenticação Google.")
        }

    usuario = {
        "id_usuario": validacao["uid"],
        "nome_usuario": validacao["nome"],
        "email_usuario": validacao["email"],
        "nivel_acesso_permissao": validacao.get("role", "funcionario_operador"),
        "token_sessao": id_token or "jwt_google_auth_token"
    }

    # Persiste na coleção NoSQL de sessões
    funcaoGravarSessaoUsuarioNoSql(validacao, plataforma)

    return {
        "sucesso": True,
        "status_code": 200,
        "mensagem": "Sessão registrada com sucesso.",
        "usuario": usuario
    }


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    corpo = {}
    if "body" in event and event["body"]:
        try:
            corpo = json.loads(event["body"]) if isinstance(event["body"], str) else event["body"]
        except Exception:
            return formatar_resposta_http(400, {"erro": "Payload JSON inválido."})

    tipo_login = corpo.get("tipo_login", "google")
    plataforma = corpo.get("plataforma", "mobile_android")

    if tipo_login == "google":
        res = funcaoAutenticarLoginGoogle(corpo, plataforma)
        return formatar_resposta_http(res["status_code"], res)

    return formatar_resposta_http(400, {"erro": "Tipo de autenticação não suportado."})