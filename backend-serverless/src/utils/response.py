# backend-serverless/src/utils/response.py
import json

def formatar_resposta_http(status_code: int, dados: dict):
    """Garante cabeçalhos CORS completos para conversar com o React Native e Web."""
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "OPTIONS,POST,GET,PUT,DELETE",
            "Access-Control-Allow-Headers": "Content-Type,Authorization"
        },
        "body": json.dumps(dados, ensure_ascii=False)
    }
