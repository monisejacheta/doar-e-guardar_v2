# backend/functions/auth/login_handler.py
import json
import os
import boto3
from datetime import datetime, timezone
import firebase_admin
from firebase_admin import auth as firebase_auth

# Inicializa o serviço do Google/Firebase caso ainda não esteja ativo
if not firebase_admin._apps:
    firebase_admin.initialize_app()

botoes_banco = boto3.resource('dynamodb')
tabela_usuarios = botoes_banco.Table(os.environ.get('USERS_TABLE_NAME', 'doar_guardar_usuarios'))

def enviar_resposta(codigo_status: int, conteudo: dict):
    """Monta a resposta com cabeçalhos adequados para o celular."""
    return {
        "statusCode": codigo_status,
        "headers": {
            "Content-Type": "application/json; charset=utf-8",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type,Authorization",
            "Access-Control-Allow-Methods": "POST,OPTIONS"
        },
        "body": json.dumps(conteudo, ensure_ascii=False)
    }

def lambda_handler(evento, contexto):
    """
    Função simples de entrada:
    Recebe os dados enviados pelo celular, confirma a identidade e libera o acesso.
    """
    # Resposta automática para verificação de rotas
    if evento.get("httpMethod") == "OPTIONS":
        return enviar_resposta(200, {"mensagem": "Conexão pronta."})

    try:
        dados = json.loads(evento.get("body", "{}"))
        chave_identificacao = dados.get("idToken")

        # 1. Se a informação não foi enviada pelo celular
        if not chave_identificacao:
            return enviar_resposta(400, {
                "sucesso": False,
                "mensagem": "Não conseguimos identificar sua conta. Por favor, tente tocar no botão para entrar novamente."
            })

        # 2. Conferir os dados na identificação do Google
        dados_usuario = firebase_auth.verify_id_token(chave_identificacao)
        codigo_pessoa = dados_usuario.get("uid")
        email = dados_usuario.get("email")
        nome = dados_usuario.get("name", "Colaborador da Casa da Criança")
        foto = dados_usuario.get("picture", "")

        horario_atual = datetime.now(timezone.utc).isoformat()

        # 3. Localizar o cadastro do colaborador no banco
        registro = tabela_usuarios.get_item(Key={"uid": codigo_pessoa}).get("Item")

        if not registro:
            # Primeiro acesso: cadastra a pessoa com funções normais de atendimento
            registro = {
                "uid": codigo_pessoa,
                "email": email,
                "name": nome,
                "picture": foto,
                "role": "funcionario",
                "status": "ativo",
                "createdAt": horario_atual,
                "lastLoginAt": horario_atual,
            }
            tabela_usuarios.put_item(Item=registro)
        else:
            # Atualiza o registro do horário de entrada
            tabela_usuarios.update_item(
                Key={"uid": codigo_pessoa},
                UpdateExpression="SET lastLoginAt = :agora",
                ExpressionAttributeValues={":agora": horario_atual}
            )

        # 4. Libera a entrada com uma saudação
        return enviar_resposta(200, {
            "sucesso": True,
            "mensagem": f"Seja bem-vindo(a), {registro['name']}!",
            "usuario": {
                "nome": registro["name"],
                "email": registro["email"],
                "funcao": registro["role"],
                "foto": registro["picture"]
            }
        })

    except firebase_auth.InvalidIdTokenError:
        # Quando a chave da conta expirou ou não confere
        return enviar_resposta(401, {
            "sucesso": False,
            "mensagem": "Sua identificação não foi reconhecida ou o tempo de espera terminou. Vamos tentar entrar de novo?"
        })
    except Exception as erro:
        # Qualquer outra situação inesperada
        print(f"Aviso interno: {str(erro)}")
        return enviar_resposta(500, {
            "sucesso": False,
            "mensagem": "Nosso serviço está indisponível neste momento. Por favor, aguarde alguns instantes e tente outra vez."
        })