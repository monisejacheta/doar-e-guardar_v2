# backend-serverless/server_local.py
import json
from http.server import HTTPServer, BaseHTTPRequestHandler
from src.handlers.auth_handler import lambda_handler as auth_handler
from src.database.firebase_client import inicializar_firebase

class ServidorLocalHandler(BaseHTTPRequestHandler):
    def _enviar_cors(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    def do_OPTIONS(self):
        self.send_response(200)
        self._enviar_cors()
        self.end_headers()

    def do_POST(self):
        tamanho = int(self.headers.get('Content-Length', 0))
        corpo = self.rfile.read(tamanho).decode('utf-8') if tamanho > 0 else "{}"

        print(f"\n[HTTP SERVER] Requisição recebida: POST {self.path}")
        print(f"[HTTP SERVER] Payload: {corpo}")

        evento_lambda = {
            "httpMethod": "POST",
            "path": self.path,
            "body": corpo
        }

        if self.path.startswith('/api/auth'):
            resposta = auth_handler(evento_lambda, None)
        else:
            resposta = {
                "statusCode": 404,
                "body": json.dumps({"erro": f"Rota {self.path} não encontrada."})
            }

        status = resposta.get("statusCode", 200)
        corpo_resposta = resposta.get("body", "{}")

        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self._enviar_cors()
        self.end_headers()
        self.wfile.write(corpo_resposta.encode('utf-8'))
        print(f"[HTTP SERVER] Resposta enviada: Status {status}")

if __name__ == '__main__':
    inicializar_firebase()
    porta = 3000
    servidor = HTTPServer(('0.0.0.0', porta), ServidorLocalHandler)
    print("=" * 60)
    print(f" Servidor Doar&Guardar 2.0 ativo em: http://localhost:{porta}")
    print(" Pronto para receber chamadas de autenticação do App Mobile")
    print("=" * 60)
    servidor.serve_forever()