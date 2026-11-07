# backend-serverless/server_local.py
import json
from http.server import HTTPServer, BaseHTTPRequestHandler
from src.handlers.auth_handler import lambda_handler as auth_handler
from src.handlers.estoque_handler import lambda_handler as estoque_handler
from src.handlers.movimentacao_handler import lambda_handler as movimentacao_handler
from src.handlers.relatorios_handler import lambda_handler as relatorios_handler
from src.handlers.configuracoes_handler import lambda_handler as configuracoes_handler
from src.handlers.dora_handler import lambda_handler as dora_handler
from src.handlers.diagnostico_handler import lambda_handler as diagnostico_handler
from src.database.firebase_client import inicializar_firebase

ROTAS_HANDLERS = {
    "/api/auth": auth_handler,
    "/api/estoque": estoque_handler,
    "/api/movimentacao": movimentacao_handler,
    "/api/relatorios": relatorios_handler,
    "/api/configuracoes": configuracoes_handler,
    "/api/dora": dora_handler,
    "/api/diagnostico": diagnostico_handler,
}


class ServidorLocalHandler(BaseHTTPRequestHandler):
    def _enviar_cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")

    def _rotear_requisicao(self, metodo: str, corpo: str = "{}"):
        evento_lambda = {
            "httpMethod": metodo,
            "path": self.path,
            "body": corpo,
        }

        handler_selecionado = None
        for prefixo, handler in ROTAS_HANDLERS.items():
            if self.path.startswith(prefixo):
                handler_selecionado = handler
                break

        if handler_selecionado:
            resposta = handler_selecionado(evento_lambda, None)
        else:
            resposta = {
                "statusCode": 404,
                "body": json.dumps({"erro": f"Rota {self.path} não encontrada."}),
            }

        status = resposta.get("statusCode", 200)
        corpo_resposta = resposta.get("body", "{}")

        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self._enviar_cors()
        self.end_headers()
        self.wfile.write(corpo_resposta.encode("utf-8"))

    def do_OPTIONS(self):
        self.send_response(200)
        self._enviar_cors()
        self.end_headers()

    def do_GET(self):
        print(f"\n[HTTP SERVER] Requisição recebida: GET {self.path}")
        self._rotear_requisicao("GET")

    def do_POST(self):
        tamanho = int(self.headers.get("Content-Length", 0))
        corpo = self.rfile.read(tamanho).decode("utf-8") if tamanho > 0 else "{}"

        print(f"\n[HTTP SERVER] Requisição recebida: POST {self.path}")
        self._rotear_requisicao("POST", corpo)


if __name__ == "__main__":
    inicializar_firebase()
    porta = 3000
    servidor = HTTPServer(("0.0.0.0", porta), ServidorLocalHandler)
    print("=" * 60)
    print(f" Servidor Doar&Guardar 2.0 ativo em: http://localhost:{porta}")
    print(" Rotas ativas: /api/auth, /api/estoque, /api/movimentacao, /api/relatorios, /api/configuracoes, /api/dora, /api/diagnostico")
    print("=" * 60)
    servidor.serve_forever()
