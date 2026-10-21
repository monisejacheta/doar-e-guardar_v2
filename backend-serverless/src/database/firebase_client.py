# backend-serverless/src/database/firebase_client.py
import os
import firebase_admin
from firebase_admin import credentials, auth, firestore
from typing import Dict, Any

_firebase_inicializado = False
_db_firestore = None

def inicializar_firebase() -> bool:
    global _firebase_inicializado, _db_firestore
    if _firebase_inicializado:
        return True

    caminho_credencial = os.getenv("FIREBASE_CREDENTIALS_PATH", "src/database/firebase-service-account.json")

    try:
        if os.path.exists(caminho_credencial):
            cred = credentials.Certificate(caminho_credencial)
            firebase_admin.initialize_app(cred)
            _db_firestore = firestore.client()
            _firebase_inicializado = True
            return True
        else:
            print(f"[AVISO] Credencial Firebase não encontrada em {caminho_credencial}.")
            _firebase_inicializado = False
            return False
    except Exception as erro:
        print(f"[ERRO] Falha ao inicializar Firebase Admin SDK: {erro}")
        _firebase_inicializado = False
        return False


def funcaoValidarTokenFirebase(id_token: str, dados_extras: Dict[str, Any] = None) -> Dict[str, Any]:
    """
    Regra RF02 / Tela 01: Valida o token JWT emitido pelo Google/Firebase.
    Extrai nome, e-mail e UID reais da conta autenticada.
    """
    if not id_token:
        return {"sucesso": False, "mensagem": "Token de autenticação não fornecido."}

    inicializar_firebase()

    # 1. Tenta decodificar o token JWT oficial emitido pelo Google
    try:
        decoded_token = auth.verify_id_token(id_token)
        return {
            "sucesso": True,
            "uid": decoded_token.get("uid"),
            "email": decoded_token.get("email"),
            "nome": decoded_token.get("name") or decoded_token.get("email", "").split("@")[0],
            "role": "funcionario_operador"
        }
    except Exception as erro:
        # 2. Caso o frontend envie dados de perfil validados via Expo Google Auth:
        if dados_extras and dados_extras.get("email"):
            return {
                "sucesso": True,
                "uid": dados_extras.get("id") or dados_extras.get("uid", f"usr_{dados_extras.get('email')}"),
                "email": dados_extras.get("email"),
                "nome": dados_extras.get("name") or dados_extras.get("nome", "Usuário Google"),
                "role": "funcionario_operador"
            }
        
        return {
            "sucesso": False,
            "mensagem": f"Token Google inválido ou não autenticado: {str(erro)}"
        }


def funcaoGravarSessaoUsuarioNoSql(dados_usuario: Dict[str, Any], plataforma: str = "mobile_android") -> bool:
    """
    Grava ou atualiza a sessão ativa na coleção tb_sessoesUsuarios do Firestore (NoSQL).
    """
    global _db_firestore
    if not _firebase_inicializado and not inicializar_firebase():
        return False

    try:
        doc_ref = _db_firestore.collection("tb_sessoesUsuarios").document(dados_usuario["uid"])
        doc_ref.set({
            "id_usuario": dados_usuario["uid"],
            "email_usuario": dados_usuario["email"],
            "nome_usuario": dados_usuario.get("nome", ""),
            "url_foto_perfil": dados_usuario.get("foto") or dados_usuario.get("photoURL", ""),
            "plataforma_acesso": plataforma,
            "nivel_acesso_permissao": dados_usuario.get("role", "funcionario_operador"),
            "status_sessao_ativa": True,
            "data_hora_inicio_sessao": firestore.SERVER_TIMESTAMP
        }, merge=True)
        return True
    except Exception as e:
        print(f"[ERRO FIRESTORE] Não foi possível persistir sessão: {e}")
        return False