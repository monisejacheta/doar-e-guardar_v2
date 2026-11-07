# backend-serverless/teste_gravar.py
import os
import firebase_admin
from firebase_admin import credentials, firestore

caminho = "src/database/firebase-service-account.json"

if not os.path.exists(caminho):
    print(f"ERRO: Chave '{caminho}' não encontrada! Verifique o nome do arquivo.")
    exit(1)

cred = credentials.Certificate(caminho)
firebase_admin.initialize_app(cred)
db = firestore.client()

print("Tentando gravar teste na coleção tb_sessoesUsuarios...")

doc_ref = db.collection("tb_sessoesUsuarios").document("teste_manual_123")
doc_ref.set({
    "id_usuario": "usr_teste_manual",
    "email_usuario": "operador@casadacrianca.org.br",
    "nome_usuario": "Teste de Gravação",
    "plataforma_acesso": "terminal_python",
    "status_sessao_ativa": True,
    "data_hora_inicio_sessao": firestore.SERVER_TIMESTAMP
})

print("SUCESSO: Documento gravado com sucesso no Firebase Firestore!")