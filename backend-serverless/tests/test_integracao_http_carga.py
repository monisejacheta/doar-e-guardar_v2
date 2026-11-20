# backend-serverless/tests/test_integracao_http_carga.py
import json
import os
import threading
import time
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from http.server import ThreadingHTTPServer

import pytest

from server_local import ServidorLocalHandler
from src.database.connection import GerenciadorConexaoBanco
from src.handlers.movimentacao_handler import funcaoMoverProdutoLocalizacao
from src.services.mensageria import funcaoDispararComunicadoLgpd


def _requisitar_http(base_url: str, metodo: str, rota: str, payload=None):
    url = f"{base_url}{rota}"
    dados_bytes = json.dumps(payload).encode("utf-8") if payload is not None else None
    headers = {"Content-Type": "application/json"} if payload is not None else {}
    req = urllib.request.Request(url, data=dados_bytes, headers=headers, method=metodo)
    inicio = time.perf_counter()
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            status = resp.getcode()
            resp_headers = dict(resp.headers.items())
            texto = resp.read().decode("utf-8")
    except urllib.error.HTTPError as err:
        status = err.code
        resp_headers = dict(err.headers.items())
        texto = err.read().decode("utf-8")
    latencia_ms = (time.perf_counter() - inicio) * 1000.0
    corpo = json.loads(texto) if texto else {}
    return status, corpo, resp_headers, latencia_ms


@pytest.fixture(scope="module")
def servidor_http_local():
    servidor = ThreadingHTTPServer(("127.0.0.1", 0), ServidorLocalHandler)
    porta = servidor.server_address[1]
    thread = threading.Thread(target=servidor.serve_forever, daemon=True)
    thread.start()
    yield f"http://127.0.0.1:{porta}"
    servidor.shutdown()
    servidor.server_close()


def test_cors_options_e_rota_inexistente(servidor_http_local):
    status_opt, _, headers_opt, _ = _requisitar_http(servidor_http_local, "OPTIONS", "/api/estoque")
    assert status_opt == 200
    assert headers_opt.get("Access-Control-Allow-Origin") == "*"

    status_404, corpo_404, _, _ = _requisitar_http(servidor_http_local, "GET", "/api/rota-inexistente")
    assert status_404 == 404
    assert "erro" in corpo_404


def test_integracao_http_auth_rotas(servidor_http_local):
    # 1. Bloqueio de token simulado
    st_sim, corpo_sim, _, _ = _requisitar_http(
        servidor_http_local,
        "POST",
        "/api/auth",
        {
            "tipo_login": "google",
            "id_token": "google_oauth_token_simulado",
            "perfil_usuario": {"email": "invasor@teste.com"},
        },
    )
    assert st_sim == 401
    assert corpo_sim["sucesso"] is False

    # 2. Credenciais inválidas
    st_inv, corpo_inv, _, _ = _requisitar_http(
        servidor_http_local,
        "POST",
        "/api/auth",
        {"tipo_login": "credenciais", "email": "errado@teste.com", "senha": "123"},
    )
    assert st_inv == 401
    assert corpo_inv["sucesso"] is False

    # 3. Login administrador institucional
    st_adm, corpo_adm, _, _ = _requisitar_http(
        servidor_http_local,
        "POST",
        "/api/auth",
        {
            "tipo_login": "credenciais",
            "email": "casadacrianca@adm",
            "senha": "casadacriancaadm",
            "plataforma": "portal_web",
        },
    )
    assert st_adm == 200
    assert corpo_adm["sucesso"] is True
    assert corpo_adm["usuario"]["nivel_acesso_permissao"] == "administrador"

    # 4. Tipo de login não suportado
    st_bad, _, _, _ = _requisitar_http(
        servidor_http_local, "POST", "/api/auth", {"tipo_login": "biometria"}
    )
    assert st_bad == 400


def test_integracao_http_estoque_completo(servidor_http_local):
    # 1. Cadastrar novo lote via HTTP
    st_cad, corpo_cad, _, _ = _requisitar_http(
        servidor_http_local,
        "POST",
        "/api/estoque",
        {
            "acao": "cadastrar_lote",
            "id_usuario": "integracao@casadacrianca.org.br",
            "lote": {
                "id_lote_produto": "lote_http_01",
                "id_produto": "prod_7891000999001",
                "codigo_barra_produto": "7891000999001",
                "nome_produto": "Feijão Preto Tipo 1",
                "marca_produto": "Camil",
                "categoria": "Grãos e Cereais",
                "numero_codigo_lote": "LOTE-HTTP-2026",
                "quantidade_inicial_pacote": 30,
                "data_validade_lote": "2027-06-30",
                "local_descricao": "Armário HTTP - Prat. 9",
            },
        },
    )
    assert st_cad == 201
    assert corpo_cad["sucesso"] is True
    assert corpo_cad["lote"]["local_descricao"] == "Armário HTTP - Prateleira 9"

    # 2. Consultar estoque e verificar presença do lote
    st_est, corpo_est, _, _ = _requisitar_http(
        servidor_http_local, "POST", "/api/estoque", {"acao": "consultar_estoque"}
    )
    assert st_est == 200
    assert any(l["id_lote_produto"] == "lote_http_01" for l in corpo_est["lotes"])

    # 3. Verificar EAN recém-cadastrado no catálogo
    st_ean, corpo_ean, _, _ = _requisitar_http(
        servidor_http_local,
        "POST",
        "/api/estoque",
        {"acao": "verificar_produto", "codigo_barras": "7891000999001"},
    )
    assert st_ean == 200
    assert corpo_ean["existe_no_banco"] is True

    # 4. Ajustar estoque físico
    st_aj, corpo_aj, _, _ = _requisitar_http(
        servidor_http_local,
        "POST",
        "/api/estoque",
        {
            "acao": "ajustar_estoque",
            "id_lote_produto": "lote_http_01",
            "nova_quantidade": 25,
            "justificativa": "Inventário HTTP",
            "id_usuario": "auditor@casadacrianca.org.br",
        },
    )
    assert st_aj == 200
    assert corpo_aj["novo_saldo"] == 25

    # 5. Bloqueio de saldo negativo
    st_neg, corpo_neg, _, _ = _requisitar_http(
        servidor_http_local,
        "POST",
        "/api/estoque",
        {
            "acao": "saida_produto",
            "id_lote_produto": "lote_http_01",
            "quantidade": 999,
            "motivo_saida": "saída para consumo",
        },
    )
    assert st_neg == 422
    assert corpo_neg["sucesso"] is False

    # 6. Bloqueio de descarte sem 'PERDA' em maiúsculas
    st_perda_fail, _, _, _ = _requisitar_http(
        servidor_http_local,
        "POST",
        "/api/estoque",
        {
            "acao": "saida_produto",
            "id_lote_produto": "lote_http_01",
            "quantidade": 2,
            "motivo_saida": "perda - descarte",
            "palavra_confirmacao": "perda",
            "justificativa": "Pacote furado",
        },
    )
    assert st_perda_fail == 403

    # 7. Descarte autorizado com 'PERDA'
    st_perda_ok, corpo_perda_ok, _, _ = _requisitar_http(
        servidor_http_local,
        "POST",
        "/api/estoque",
        {
            "acao": "saida_produto",
            "id_lote_produto": "lote_http_01",
            "quantidade": 5,
            "motivo_saida": "perda - descarte",
            "palavra_confirmacao": "PERDA",
            "justificativa": "Embalagem avariada",
        },
    )
    assert st_perda_ok == 200
    assert corpo_perda_ok["novo_saldo"] == 20

    # 8. Consultar doadores e logs de auditoria
    st_doa, corpo_doa, _, _ = _requisitar_http(
        servidor_http_local, "POST", "/api/estoque", {"acao": "consultar_doadores"}
    )
    assert st_doa == 200
    assert isinstance(corpo_doa["doadores"], list)

    # 9. Criar e consultar campanha via /api/estoque
    st_camp, corpo_camp, _, _ = _requisitar_http(
        servidor_http_local,
        "POST",
        "/api/estoque",
        {
            "acao": "criar_campanha",
            "titulo": "Campanha Integração HTTP",
            "descricao": "Arrecadação de grãos",
            "itemFoco": "Feijão Preto",
            "metaUnidades": 40,
        },
    )
    assert st_camp == 201
    id_camp = corpo_camp["campanha"]["id_campanha_doacao"]

    st_mod, corpo_mod, _, _ = _requisitar_http(
        servidor_http_local,
        "POST",
        "/api/estoque",
        {
            "acao": "moderar_campanha",
            "id_campanha_doacao": id_camp,
            "status_campanha": "Aprovada",
        },
    )
    assert st_mod == 200
    assert corpo_mod["status_campanha"] == "Aprovada"


def test_integracao_http_movimentacao_configuracoes_relatorios_dora_diagnostico(servidor_http_local):
    # 1. /api/movimentacao
    st_div_409, corpo_409, _, _ = _requisitar_http(
        servidor_http_local,
        "POST",
        "/api/movimentacao",
        {
            "lote_origem": {"id_lote_produto": "lote_m1", "id_local_armazenamento": 1, "quantidade_atual_pacote": 10},
            "local_destino": {"id_local_armazenamento": 2, "nome_local": "Armário B", "tipo_local": "armário", "sublocal_compartimento": "Prateleira 1"},
            "quantidade_mover": 4,
            "confirmacao_divisao_lote": False,
        },
    )
    assert st_div_409 == 409
    assert corpo_409["requer_confirmacao"] is True

    st_div_200, corpo_200, _, _ = _requisitar_http(
        servidor_http_local,
        "POST",
        "/api/movimentacao",
        {
            "lote_origem": {"id_lote_produto": "lote_m1", "id_local_armazenamento": 1, "quantidade_atual_pacote": 10},
            "local_destino": {"id_local_armazenamento": 2, "nome_local": "Armário B", "tipo_local": "armário", "sublocal_compartimento": "Prateleira 1"},
            "quantidade_mover": 4,
            "confirmacao_divisao_lote": True,
            "id_usuario_responsavel": "operador@casadacrianca.org.br",
        },
    )
    assert st_div_200 == 200
    assert corpo_200["saldo_remanescente_origem"] == 6

    st_corredor, _, _, _ = _requisitar_http(
        servidor_http_local,
        "POST",
        "/api/movimentacao",
        {
            "lote_origem": {"id_lote_produto": "lote_m1", "quantidade_atual_pacote": 6},
            "local_destino": {"tipo_local": "corredor", "nome_local": "Rua 2"},
            "quantidade_mover": 6,
        },
    )
    assert st_corredor == 400

    # 2. /api/configuracoes (locais, exclusão ocupada 409 vs vazia 200, moderação e categorias)
    st_loc_add, corpo_loc_add, _, _ = _requisitar_http(
        servidor_http_local,
        "POST",
        "/api/configuracoes",
        {
            "acao": "cadastrar_local",
            "nome_local": "Armário Vazio Teste",
            "tipo_local": "armário",
            "sublocal_compartimento": "Prateleira 7",
        },
    )
    assert st_loc_add == 201
    id_loc_vazio = corpo_loc_add["local"]["id_local_armazenamento"]

    # Tentar excluir a prateleira ocupada por lote_http_01 -> HTTP 409
    st_excl_409, _, _, _ = _requisitar_http(
        servidor_http_local,
        "POST",
        "/api/configuracoes",
        {"acao": "excluir_local", "local_descricao": "Armário HTTP - Prateleira 9"},
    )
    assert st_excl_409 == 409

    # Excluir a prateleira vazia recém-criada -> HTTP 200
    st_excl_200, _, _, _ = _requisitar_http(
        servidor_http_local,
        "POST",
        "/api/configuracoes",
        {"acao": "excluir_local", "id_local_armazenamento": id_loc_vazio},
    )
    assert st_excl_200 == 200

    st_mod_400, _, _, _ = _requisitar_http(
        servidor_http_local,
        "POST",
        "/api/configuracoes",
        {"acao": "moderar_campanha", "id_campanha_doacao": 99, "status_campanha": "Reprovada", "justificativa_parecer_tecnico": ""},
    )
    assert st_mod_400 == 400

    st_mod_200, _, _, _ = _requisitar_http(
        servidor_http_local,
        "POST",
        "/api/configuracoes",
        {"acao": "moderar_campanha", "id_campanha_doacao": 99, "status_campanha": "Reprovada", "justificativa_parecer_tecnico": "Meta fora do padrão."},
    )
    assert st_mod_200 == 200

    st_cat_list, corpo_cat_list, _, _ = _requisitar_http(
        servidor_http_local, "POST", "/api/configuracoes", {"acao": "listar_categorias"}
    )
    assert st_cat_list == 200
    assert corpo_cat_list["total_categorias"] >= 8

    # 3. /api/relatorios
    st_rel_mov, corpo_rel_mov, _, _ = _requisitar_http(
        servidor_http_local, "POST", "/api/relatorios", {"acao": "consultar_movimentacoes"}
    )
    assert st_rel_mov == 200
    assert isinstance(corpo_rel_mov["movimentacoes"], list)

    st_rel_email, corpo_rel_email, _, _ = _requisitar_http(
        servidor_http_local,
        "POST",
        "/api/relatorios",
        {"acao": "enviar_relatorio_completo_email", "destinatarios": ["coord@casadacrianca.org.br"]},
    )
    assert st_rel_email == 200
    assert corpo_rel_email["resumo_envio"]["total_lotes_analisados"] >= 1

    res_lgpd = funcaoDispararComunicadoLgpd(
        [{"nome": "Doador 1", "opt_in_ativo": True}, {"nome": "Doador 2", "opt_in_ativo": False}],
        "Campanha urgente de leite.",
    )
    assert res_lgpd["total_enviados"] == 1
    assert "SAIR" in res_lgpd["mensagem_formatada"]

    # 4. /api/dora
    st_dora_rec, corpo_dora_rec, _, _ = _requisitar_http(
        servidor_http_local,
        "POST",
        "/api/dora",
        {
            "mensagem": "Qual receita posso fazer com itens perto de vencer?",
            "lotes_estoque": [
                {"nome_produto": "Leite UHT", "numero_codigo_lote": "L1", "data_validade_lote": "2026-11-25", "status_validade_lote": "próximo do vencimento", "quantidade_atual_pacote": 5, "local_descricao": "Geladeira 1"}
            ],
        },
    )
    assert st_dora_rec == 200
    assert corpo_dora_rec["intencao"] == "receitas"

    st_dora_val, corpo_dora_val, _, _ = _requisitar_http(
        servidor_http_local,
        "POST",
        "/api/dora",
        {"mensagem": "Quais itens estão perto da validade?"},
    )
    assert st_dora_val == 200
    assert corpo_dora_val["intencao"] == "validade_estoque"

    st_dora_pred, corpo_dora_pred, _, _ = _requisitar_http(
        servidor_http_local,
        "POST",
        "/api/dora",
        {"mensagem": "Qual a previsão de consumo do estoque?"},
    )
    assert st_dora_pred == 200
    assert corpo_dora_pred["intencao"] == "predicao_consumo"

    # 5. /api/diagnostico
    st_diag, corpo_diag, _, _ = _requisitar_http(servidor_http_local, "GET", "/api/diagnostico")
    assert st_diag == 200
    assert corpo_diag["status_geral"] == "OPERACIONAL"
    assert corpo_diag["servicos_aws"]["status"] == "DISPONÍVEL"


def test_persistencia_schema_sql_e_retencao_reinicio_servidor():
    caminho_schema = os.path.join(
        os.path.dirname(__file__), "..", "src", "database", "schema.sql"
    )
    with open(caminho_schema, "r", encoding="utf-8") as arq:
        sql = arq.read()

    tabelas_esperadas = [
        "tb_categoriasAlimentos",
        "tb_locaisArmazenamento",
        "tb_produtos",
        "tb_doadores",
        "tb_lotesProdutos",
        "tb_motivosSaidas",
        "tb_movimentacoesEstoques",
        "tb_instituicoes",
        "tb_representantesInstituicoes",
        "tb_campanhasDoacoes",
        "tb_itensCampanhas",
        "tb_logsAuditorias",
    ]
    for tabela in tabelas_esperadas:
        assert tabela in sql, f"Tabela ausente em schema.sql: {tabela}"

    assert "CHECK (quantidade_atual_pacote >= 0)" in sql
    assert "CHECK (tipo_local IN ('armário', 'geladeira'))" in sql
    assert "ON DELETE CASCADE" in sql
    assert "ON DELETE RESTRICT" in sql

    # Rollback transacional em falha simulada
    conn = GerenciadorConexaoBanco()
    lote_rb = {"id_lote_produto": "lote_rb_1", "id_local_armazenamento": 1, "quantidade_atual_pacote": 12}
    res_rb = funcaoMoverProdutoLocalizacao(
        lote_origem=lote_rb,
        local_destino={"id_local_armazenamento": 2, "nome_local": "Armário B", "tipo_local": "armário", "sublocal_compartimento": "Prateleira 2"},
        quantidade_mover=12,
        id_usuario_responsavel="auditor@casadacrianca.org.br",
        confirmacao_divisao_lote=True,
        simular_erro_destino=True,
        conexao_banco=conn,
    )
    assert res_rb["rollback_executado"] is True
    assert conn.historico_operacoes == []
    assert conn.transacao_ativa is False
    assert lote_rb["quantidade_atual_pacote"] == 12

    # Retenção após reinício do servidor HTTP
    srv1 = ThreadingHTTPServer(("127.0.0.1", 0), ServidorLocalHandler)
    t1 = threading.Thread(target=srv1.serve_forever, daemon=True)
    t1.start()
    url1 = f"http://127.0.0.1:{srv1.server_address[1]}"
    st1, _, _, _ = _requisitar_http(
        url1,
        "POST",
        "/api/estoque",
        {
            "acao": "cadastrar_lote",
            "lote": {
                "id_lote_produto": "lote_persist_reinicio",
                "codigo_barra_produto": "7891000888002",
                "nome_produto": "Óleo de Soja",
                "numero_codigo_lote": "LOTE-PERSIST-01",
                "quantidade_inicial_pacote": 14,
                "data_validade_lote": "2027-08-20",
                "local_descricao": "Armário B - Prateleira 1",
            },
        },
    )
    assert st1 == 201
    srv1.shutdown()
    srv1.server_close()

    srv2 = ThreadingHTTPServer(("127.0.0.1", 0), ServidorLocalHandler)
    t2 = threading.Thread(target=srv2.serve_forever, daemon=True)
    t2.start()
    url2 = f"http://127.0.0.1:{srv2.server_address[1]}"
    st2, corpo2, _, _ = _requisitar_http(url2, "POST", "/api/estoque", {"acao": "consultar_estoque"})
    srv2.shutdown()
    srv2.server_close()

    assert st2 == 200
    assert any(l["id_lote_produto"] == "lote_persist_reinicio" for l in corpo2["lotes"])


def test_benchmark_carga_concorrente_150_requisicoes(servidor_http_local):
    cenarios = [
        ("POST", "/api/estoque", {"acao": "consultar_estoque"}),
        ("POST", "/api/relatorios", {"acao": "consultar_movimentacoes"}),
        ("POST", "/api/dora", {"mensagem": "Quais itens estão próximos do vencimento?"}),
        ("GET", "/api/diagnostico", None),
        ("POST", "/api/configuracoes", {"acao": "listar_locais"}),
    ]
    total_requisicoes = 150
    tarefas = [cenarios[i % len(cenarios)] for i in range(total_requisicoes)]

    def _executar(item):
        metodo, rota, payload = item
        status, _, _, lat_ms = _requisitar_http(servidor_http_local, metodo, rota, payload)
        return status, lat_ms

    inicio_global = time.perf_counter()
    with ThreadPoolExecutor(max_workers=25) as pool:
        resultados = list(pool.map(_executar, tarefas))
    duracao_total_s = time.perf_counter() - inicio_global

    latencias = sorted(lat for _, lat in resultados)
    erros = [st for st, _ in resultados if st != 200]
    n = len(latencias)
    media = sum(latencias) / n
    p50 = latencias[int(0.50 * (n - 1))]
    p95 = latencias[int(0.95 * (n - 1))]
    p99 = latencias[int(0.99 * (n - 1))]
    maxima = latencias[-1]
    throughput = n / duracao_total_s if duracao_total_s > 0 else 0.0

    print(
        f"\n[BENCHMARK HTTP CONCORRENTE] total={n} workers=25 erros={len(erros)} "
        f"duracao={duracao_total_s:.3f}s throughput={throughput:.1f}req/s "
        f"media={media:.2f}ms p50={p50:.2f}ms p95={p95:.2f}ms p99={p99:.2f}ms max={maxima:.2f}ms"
    )

    assert len(erros) == 0
    assert p95 < 800.0
    assert p99 < 2000.0
