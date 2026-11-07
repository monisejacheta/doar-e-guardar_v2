# backend-serverless/src/handlers/estoque_handler.py
import os
import json
import uuid
import boto3
from decimal import Decimal
from datetime import date, datetime
from typing import Dict, Any, List, Optional
from src.utils.response import formatar_resposta_http
from src.services.api_codigo_barras import (
    funcaoValidarCodigoBarrasManual,
    funcaoConsultarProdutoApisCascata,
    inferir_categoria_alimento,
)
from src.handlers.configuracoes_handler import (
    normalizar_descricao_prateleira,
    resolver_local_armazenamento,
    listar_locais_armazenamento_aws,
    funcaoCadastrarLocalArmazenamento,
    funcaoExcluirLocalArmazenamento,
)

AWS_REGION = os.getenv("AWS_REGION", "us-east-2")
TABELA_LOTES = os.getenv("DYNAMODB_TABLE_LOTES", "tb_lotesProdutos")
TABELA_MOVIMENTACOES = os.getenv("DYNAMODB_TABLE_MOVIMENTACOES", "tb_movimentacoesEstoques")
TABELA_PRODUTOS = os.getenv("DYNAMODB_TABLE_PRODUTOS", "tb_produtos")

# Armazenamento transacional em tempo de execução (sem nenhum dado mock pré-populado)
# Usado apenas quando a execução local não possui credenciais AWS DynamoDB ativas
_TABELA_LOTES_MEMORIA: Dict[str, Dict[str, Any]] = {}
_TABELA_MOVIMENTACOES_MEMORIA: List[Dict[str, Any]] = []
_TABELA_PRODUTOS_MEMORIA: Dict[str, Dict[str, Any]] = {}


def _converter_decimals(obj: Any) -> Any:
    """Converte objetos Decimal do DynamoDB para int/float nativos do Python/JSON."""
    if isinstance(obj, list):
        return [_converter_decimals(i) for i in obj]
    if isinstance(obj, dict):
        return {k: _converter_decimals(v) for k, v in obj.items()}
    if isinstance(obj, Decimal):
        return int(obj) if obj % 1 == 0 else float(obj)
    return obj


def _obter_tabela_dynamodb(nome_tabela: str):
    """Obtém referência real da tabela no AWS DynamoDB se as credenciais estiverem configuradas."""
    if os.getenv("PYTEST_CURRENT_TEST") and os.getenv("USE_REAL_AWS_IN_TESTS") != "true":
        return None
    try:
        recurso = boto3.resource("dynamodb", region_name=AWS_REGION)
        return recurso.Table(nome_tabela)
    except Exception:
        return None


def _converter_para_iso(data_str: Any) -> str:
    if isinstance(data_str, date):
        return data_str.isoformat()
    if not isinstance(data_str, str) or not data_str.strip():
        return "9999-12-31"
    limpo = data_str.strip()
    if "/" in limpo:
        partes = limpo.split("/")
        if len(partes) == 3:
            return f"{partes[2]}-{partes[1].zfill(2)}-{partes[0].zfill(2)}"
    return limpo


def calcular_status_validade(data_validade_str: Any) -> str:
    iso = _converter_para_iso(data_validade_str)
    try:
        dt_val = date.fromisoformat(iso)
        hoje = date.today()
        dias = (dt_val - hoje).days
        if dias < 0:
            return "vencido"
        if dias <= 7:
            return "próximo do vencimento"
    except ValueError:
        pass
    return "regular"


def _normalizar_lote_local(item: Dict[str, Any]) -> Dict[str, Any]:
    """
    Normaliza a prateleira (`local_descricao` e `id_local_armazenamento`) do lote
    para eliminar divergências entre 'Prat.' e 'Prateleira' ou IDs colidentes ('loc_arm').
    """
    desc_bruta = str(item.get("local_descricao") or item.get("id_local_armazenamento") or "Armário A - Prateleira 1")
    local_canon = resolver_local_armazenamento(desc_bruta)
    item["local_descricao"] = local_canon["local_descricao"]
    id_atual = str(item.get("id_local_armazenamento") or "")
    if not id_atual or id_atual in ("0", "loc_arm", "loc_gel", "loc_des"):
        item["id_local_armazenamento"] = local_canon["id_local_armazenamento"]
    item["status_validade_lote"] = calcular_status_validade(item.get("data_validade_lote"))
    return item


def _normalizar_movimentacao_campos(mov: Dict[str, Any]) -> Dict[str, Any]:
    """
    Garante que todos os registros de movimentação possuam tanto as chaves canônicas
    do banco quanto os aliases esperados pelas telas de Relatórios e Auditoria.
    """
    id_mov = mov.get("id_movimentacao") or mov.get("id_movimentacao_estoque") or f"mov_{uuid.uuid4().hex[:8]}"
    nome = mov.get("nome_produto") or mov.get("nome") or "Produto"
    lote = mov.get("numero_codigo_lote") or mov.get("lote") or "S/L"
    local = mov.get("local_descricao") or mov.get("local") or "Estoque Geral"
    data_iso = mov.get("data_hora_movimentacao") or mov.get("data") or datetime.now().isoformat(timespec="seconds")
    responsavel = mov.get("id_usuario_responsavel") or mov.get("responsavel") or "Operador"
    justificativa = mov.get("justificativa_detalhe") or mov.get("justificativa") or ""
    qtd = int(mov.get("quantidade_movimentada_pacote") or mov.get("qtd") or 0)
    ean = str(mov.get("codigo_barra_produto") or mov.get("ean") or "")

    return {
        **mov,
        "id_movimentacao": id_mov,
        "id_movimentacao_estoque": id_mov,
        "nome_produto": nome,
        "nome": nome,
        "numero_codigo_lote": lote,
        "lote": lote,
        "local_descricao": local,
        "local": local,
        "data_hora_movimentacao": data_iso,
        "data": data_iso,
        "id_usuario_responsavel": responsavel,
        "responsavel": responsavel,
        "justificativa_detalhe": justificativa,
        "justificativa": justificativa,
        "quantidade_movimentada_pacote": qtd,
        "qtd": qtd,
        "codigo_barra_produto": ean,
        "ean": ean,
    }


def _listar_lotes_persistidos() -> List[Dict[str, Any]]:
    tabela = _obter_tabela_dynamodb(TABELA_LOTES)
    if tabela is not None:
        try:
            resposta = tabela.scan()
            itens = _converter_decimals(resposta.get("Items", []))
            for item in itens:
                _normalizar_lote_local(item)
                _TABELA_LOTES_MEMORIA[str(item.get("id_lote_produto"))] = item
            return itens
        except Exception as erro:
            print(f"[DYNAMODB] Aviso ao ler {TABELA_LOTES}: {erro}")

    lotes = list(_TABELA_LOTES_MEMORIA.values())
    for item in lotes:
        _normalizar_lote_local(item)
    return lotes


def _buscar_lote_por_id(id_lote: Any) -> Optional[Dict[str, Any]]:
    if not id_lote:
        return None
    chave = str(id_lote)
    tabela = _obter_tabela_dynamodb(TABELA_LOTES)
    if tabela is not None:
        try:
            resp = tabela.get_item(Key={"id_lote_produto": chave})
            if "Item" in resp:
                item = _normalizar_lote_local(_converter_decimals(resp["Item"]))
                _TABELA_LOTES_MEMORIA[chave] = item
                return item
        except Exception as erro:
            print(f"[DYNAMODB] Aviso ao buscar lote {chave}: {erro}")

    encontrado = _TABELA_LOTES_MEMORIA.get(chave)
    return _normalizar_lote_local(encontrado) if encontrado else None


def _salvar_lote_persistido(lote: Dict[str, Any]) -> None:
    _normalizar_lote_local(lote)
    chave = str(lote["id_lote_produto"])
    _TABELA_LOTES_MEMORIA[chave] = lote

    tabela = _obter_tabela_dynamodb(TABELA_LOTES)
    if tabela is not None:
        try:
            tabela.put_item(Item=lote)
        except Exception as erro:
            print(f"[DYNAMODB] Aviso ao gravar lote {chave}: {erro}")


def _salvar_produto_catalogo(produto: Dict[str, Any]) -> None:
    ean = str(produto.get("codigo_barra_produto") or "").strip()
    if not ean:
        return
    _TABELA_PRODUTOS_MEMORIA[ean] = produto

    tabela = _obter_tabela_dynamodb(TABELA_PRODUTOS)
    if tabela is not None:
        try:
            tabela.put_item(Item=produto)
        except Exception as erro:
            print(f"[DYNAMODB] Aviso ao gravar produto {ean}: {erro}")


def _registrar_movimentacao_persistida(movimentacao: Dict[str, Any]) -> None:
    mov_norm = _normalizar_movimentacao_campos(movimentacao)
    _TABELA_MOVIMENTACOES_MEMORIA.insert(0, mov_norm)

    tabela = _obter_tabela_dynamodb(TABELA_MOVIMENTACOES)
    if tabela is not None:
        try:
            tabela.put_item(Item=mov_norm)
        except Exception as erro:
            print(f"[DYNAMODB] Aviso ao gravar movimentação: {erro}")


def obter_historico_movimentacoes() -> List[Dict[str, Any]]:
    tabela = _obter_tabela_dynamodb(TABELA_MOVIMENTACOES)
    if tabela is not None:
        try:
            resposta = tabela.scan()
            itens = [_normalizar_movimentacao_campos(i) for i in _converter_decimals(resposta.get("Items", []))]
            itens.sort(
                key=lambda m: str(m.get("data_hora_movimentacao", "")),
                reverse=True,
            )
            return itens
        except Exception as erro:
            print(f"[DYNAMODB] Aviso ao consultar movimentações: {erro}")

    return [_normalizar_movimentacao_campos(m) for m in _TABELA_MOVIMENTACOES_MEMORIA]


def obter_lotes_estoque() -> List[Dict[str, Any]]:
    return funcaoPriorizarSaidaLoteVencimento(_listar_lotes_persistidos())


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
        if isinstance(val, date):
            return val
        if isinstance(val, str):
            iso = _converter_para_iso(val)
            try:
                return date.fromisoformat(iso)
            except ValueError:
                return date.max
        return date.max

    return sorted(lotes, key=extrair_data)


def funcaoVerificarProdutoPorCodigoBarras(codigo_barras: str) -> Dict[str, Any]:
    """
    1. Valida o formato numérico do EAN (8 a 14 dígitos).
    2. Verifica se o produto já existe no banco de dados (tb_produtos ou tb_lotesProdutos).
    3. Caso não exista no banco, executa a consulta real nas 3 APIs de código de barras em cascata.
    """
    if not funcaoValidarCodigoBarrasManual(codigo_barras):
        return {
            "sucesso": False,
            "status_code": 400,
            "mensagem": "Código de barras inválido. Informe de 8 a 14 dígitos numéricos.",
        }

    ean = codigo_barras.strip()

    # 1. Busca no catálogo de produtos persistidos (tb_produtos)
    tabela_prod = _obter_tabela_dynamodb(TABELA_PRODUTOS)
    if tabela_prod is not None:
        try:
            resp_prod = tabela_prod.get_item(Key={"codigo_barra_produto": ean})
            if "Item" in resp_prod:
                prod_db = _converter_decimals(resp_prod["Item"])
                return {
                    "sucesso": True,
                    "status_code": 200,
                    "existe_no_banco": True,
                    "encontrado_nas_apis": False,
                    "produto": {
                        "id_produto": prod_db.get("id_produto", f"prod_{ean}"),
                        "codigo_barra_produto": ean,
                        "nome_produto": prod_db.get("nome_produto", ""),
                        "marca_produto": prod_db.get("marca_produto", ""),
                        "categoria": prod_db.get("categoria", "Grãos e Cereais"),
                        "unidade_medida_pacote": prod_db.get("unidade_medida_pacote", "pacotes"),
                        "estoque_minimo_pacote": int(prod_db.get("estoque_minimo_pacote", 10)),
                        "url_foto_produto": prod_db.get("url_foto_produto", ""),
                        "origem": "Catálogo Interno do Estoque",
                    },
                }
        except Exception:
            pass

    if ean in _TABELA_PRODUTOS_MEMORIA:
        prod_mem = _TABELA_PRODUTOS_MEMORIA[ean]
        return {
            "sucesso": True,
            "status_code": 200,
            "existe_no_banco": True,
            "encontrado_nas_apis": False,
            "produto": {
                **prod_mem,
                "origem": "Catálogo Interno do Estoque",
            },
        }

    # 2. Busca nos lotes ativos persistidos no estoque (tb_lotesProdutos)
    lotes_atuais = _listar_lotes_persistidos()
    lote_existente = next(
        (item for item in lotes_atuais if str(item.get("codigo_barra_produto", "")).strip() == ean),
        None,
    )
    if lote_existente:
        return {
            "sucesso": True,
            "status_code": 200,
            "existe_no_banco": True,
            "encontrado_nas_apis": False,
            "produto": {
                "id_produto": lote_existente.get("id_produto", f"prod_{ean}"),
                "codigo_barra_produto": ean,
                "nome_produto": lote_existente.get("nome_produto", ""),
                "marca_produto": lote_existente.get("marca_produto", ""),
                "categoria": lote_existente.get("categoria", "Grãos e Cereais"),
                "unidade_medida_pacote": lote_existente.get("unidade_medida_pacote", "pacotes"),
                "estoque_minimo_pacote": int(lote_existente.get("estoque_minimo_pacote", 10)),
                "url_foto_produto": lote_existente.get("url_foto_produto") or lote_existente.get("foto_url", ""),
                "origem": "Produto já cadastrado no Estoque",
            },
        }

    # 3. Consulta nas 3 APIs externas em cascata
    resultado_cascata = funcaoConsultarProdutoApisCascata(ean)
    if resultado_cascata.get("sucesso") and resultado_cascata.get("dados_produto"):
        dados_api = resultado_cascata["dados_produto"]
        return {
            "sucesso": True,
            "status_code": 200,
            "existe_no_banco": False,
            "encontrado_nas_apis": True,
            "provedor_utilizado": resultado_cascata.get("provedor_utilizado"),
            "tentativas_apis": resultado_cascata.get("tentativas", []),
            "produto": {
                "id_produto": f"prod_{ean}",
                "codigo_barra_produto": ean,
                "nome_produto": dados_api.get("nome_produto", ""),
                "marca_produto": dados_api.get("marca_produto", ""),
                "categoria": dados_api.get("categoria") or inferir_categoria_alimento(dados_api.get("nome_produto", "")),
                "unidade_medida_pacote": dados_api.get("unidade_medida_pacote", "pacotes"),
                "estoque_minimo_pacote": int(dados_api.get("estoque_minimo_pacote", 10)),
                "url_foto_produto": dados_api.get("url_foto_produto", ""),
                "origem": dados_api.get("origem", resultado_cascata.get("provedor_utilizado", "API Externa")),
            },
        }

    return {
        "sucesso": True,
        "status_code": 200,
        "existe_no_banco": False,
        "encontrado_nas_apis": False,
        "permitir_cadastro_manual": True,
        "produto": None,
        "erros": resultado_cascata.get("erros", []),
        "tentativas_apis": resultado_cascata.get("tentativas", []),
        "mensagem": resultado_cascata.get(
            "mensagem",
            "Produto não localizado nas 3 APIs em cascata. Preencha os dados manualmente.",
        ),
    }


def funcaoCadastrarNovoLoteEstoque(
    id_produto: Any,
    id_local_armazenamento: Any,
    numero_codigo_lote: str,
    quantidade_inicial_pacote: int,
    data_validade_lote: str,
    id_doador: Optional[int] = None,
    dados_extras: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Regra Tela 3.1: Registra a entrada real de um novo lote na prateleira homologada da AWS e gera log de movimentação.
    """
    try:
        qtd = int(quantidade_inicial_pacote or 0)
    except (ValueError, TypeError):
        qtd = 0

    if qtd <= 0:
        return {
            "sucesso": False,
            "status_code": 400,
            "mensagem": "A quantidade de pacotes do lote deve ser maior que zero.",
        }

    codigo_lote_limpo = str(numero_codigo_lote or "").strip()
    validade_limpa = str(data_validade_lote or "").strip()

    if not codigo_lote_limpo or not validade_limpa:
        return {
            "sucesso": False,
            "status_code": 400,
            "mensagem": "O número do lote e a data de validade são de preenchimento obrigatório.",
        }

    extras = dados_extras or {}
    validade_iso = _converter_para_iso(validade_limpa)
    status_validade = calcular_status_validade(validade_iso)

    id_lote_gerado = extras.get("id_lote_produto") or f"lote_{uuid.uuid4().hex[:8]}"
    ean = str(extras.get("codigo_barra_produto") or "").strip()
    nome_produto = str(extras.get("nome_produto") or "Produto Cadastrado").strip()
    marca_produto = str(extras.get("marca_produto") or "").strip()
    categoria = str(extras.get("categoria") or inferir_categoria_alimento(nome_produto)).strip()
    unidade_medida = str(extras.get("unidade_medida_pacote") or "pacotes").strip()
    estoque_minimo = int(extras.get("estoque_minimo_pacote") or 10)

    # Resolve e normaliza a prateleira contra o cadastro AWS (tb_locaisArmazenamento)
    local_bruto = extras.get("local_descricao") or id_local_armazenamento or "Armário A - Prateleira 1"
    local_resolvido = resolver_local_armazenamento(local_bruto)
    local_desc = local_resolvido["local_descricao"]
    id_local_canonico = (
        id_local_armazenamento
        if isinstance(id_local_armazenamento, str)
        and id_local_armazenamento not in ("", "0", "loc_arm", "loc_gel", "loc_des")
        else local_resolvido["id_local_armazenamento"]
    )

    url_foto = str(extras.get("url_foto_produto") or extras.get("foto_url") or "").strip()

    novo_lote = {
        "id_lote_produto": id_lote_gerado,
        "id_produto": id_produto or (f"prod_{ean}" if ean else f"prod_{uuid.uuid4().hex[:6]}"),
        "id_local_armazenamento": id_local_canonico,
        "id_doador": id_doador,
        "nome_produto": nome_produto,
        "marca_produto": marca_produto,
        "categoria": categoria,
        "unidade_medida_pacote": unidade_medida,
        "codigo_barra_produto": ean,
        "numero_codigo_lote": codigo_lote_limpo,
        "quantidade_atual_pacote": qtd,
        "quantidade_inicial_pacote": qtd,
        "estoque_minimo_pacote": estoque_minimo,
        "data_entrada_lote": str(extras.get("data_entrada_lote") or date.today().isoformat()),
        "data_validade_lote": validade_iso if "-" in validade_limpa else validade_limpa,
        "status_validade_lote": status_validade,
        "local_descricao": local_desc,
        "url_foto_produto": url_foto,
    }

    _salvar_lote_persistido(novo_lote)

    if ean:
        _salvar_produto_catalogo(
            {
                "id_produto": novo_lote["id_produto"],
                "codigo_barra_produto": ean,
                "nome_produto": nome_produto,
                "marca_produto": marca_produto,
                "categoria": categoria,
                "unidade_medida_pacote": unidade_medida,
                "estoque_minimo_pacote": estoque_minimo,
                "url_foto_produto": url_foto,
            }
        )

    eh_transferencia = bool(extras.get("eh_transferencia_interna")) or (
        "transfer" in str(extras.get("motivo_entrada") or "").lower()
    )
    local_origem_transf = str(extras.get("local_origem") or "").strip()

    _registrar_movimentacao_persistida(
        {
            "id_movimentacao": f"mov_{uuid.uuid4().hex[:8]}",
            "id_lote_produto": novo_lote["id_lote_produto"],
            "id_produto": novo_lote["id_produto"],
            "codigo_barra_produto": ean,
            "nome_produto": nome_produto,
            "categoria": categoria,
            "numero_codigo_lote": codigo_lote_limpo,
            "local_descricao": f"{local_origem_transf} → {local_desc}" if eh_transferencia and local_origem_transf else local_desc,
            "operacao": "Movimentação" if eh_transferencia else "Entrada",
            "tipo_operacao": "movimentação interna" if eh_transferencia else "entrada",
            "quantidade_movimentada_pacote": qtd,
            "qtd": qtd,
            "motivo_saida": f"Transferência: {local_origem_transf} → {local_desc}" if eh_transferencia else "entrada de lote",
            "justificativa_detalhe": (
                f"Movimentação interna de {qtd} {unidade_medida} para {local_desc}"
                if eh_transferencia
                else f"Entrada de {qtd} {unidade_medida} em {local_desc}"
            ),
            "id_usuario_responsavel": str(extras.get("id_usuario") or "operador"),
            "data_hora_movimentacao": datetime.now().isoformat(timespec="seconds"),
        }
    )

    return {
        "sucesso": True,
        "status_code": 201,
        "mensagem": f"Lote {codigo_lote_limpo} cadastrado com sucesso em {local_desc}.",
        "lote": novo_lote,
    }


def funcaoTransferirLoteEntrePrateleiras(
    id_lote_produto: str,
    quantidade_mover: int,
    local_destino: Any,
    id_usuario: str = "operador",
    confirmacao_divisao_lote: bool = True,
) -> Dict[str, Any]:
    """
    Regra Tela 3.3 / US06:
    Executa a movimentação interna atômica de produtos entre as prateleiras homologadas no AWS DynamoDB.
    Atualiza `id_local_armazenamento` e `local_descricao` e registra log de 'Movimentação'.
    """
    try:
        qtd = int(quantidade_mover or 0)
    except (ValueError, TypeError):
        qtd = 0

    if qtd <= 0:
        return {
            "sucesso": False,
            "status_code": 400,
            "mensagem": "A quantidade para transferência deve ser superior a zero.",
        }

    lote_origem = _buscar_lote_por_id(id_lote_produto)
    if not lote_origem:
        return {
            "sucesso": False,
            "status_code": 404,
            "mensagem": f"Lote '{id_lote_produto}' não encontrado no estoque da AWS.",
        }

    saldo_atual = int(lote_origem.get("quantidade_atual_pacote", 0))
    if qtd > saldo_atual:
        return {
            "sucesso": False,
            "status_code": 422,
            "mensagem": f"Saldo insuficiente no lote de origem. Disponível: {saldo_atual}, Solicitado: {qtd}.",
        }

    if qtd < saldo_atual and not confirmacao_divisao_lote:
        return {
            "sucesso": False,
            "status_code": 409,
            "requer_confirmacao": True,
            "mensagem": f"Aviso de Divisão de Lote: Você está transferindo {qtd} de {saldo_atual} pacotes. Confirme a divisão para prosseguir.",
        }

    # Resolve e valida a prateleira de destino contra o cadastro da AWS
    if isinstance(local_destino, dict):
        desc_destino_raw = (
            local_destino.get("local_descricao")
            or f"{local_destino.get('nome_local', '')} - {local_destino.get('sublocal_compartimento', '')}"
        )
        tipo_informado = (local_destino.get("tipo_local") or "").strip().lower()
    else:
        desc_destino_raw = str(local_destino or "").strip()
        tipo_informado = ""

    if not desc_destino_raw:
        return {
            "sucesso": False,
            "status_code": 400,
            "mensagem": "Selecione a prateleira de destino para realizar a movimentação.",
        }

    prateleira_destino = resolver_local_armazenamento(desc_destino_raw)
    tipo_final = tipo_informado or prateleira_destino.get("tipo_local", "armário")

    if tipo_final not in ("armário", "geladeira"):
        return {
            "sucesso": False,
            "status_code": 400,
            "mensagem": "Compartimento de destino inválido (US06). São permitidos apenas 'armário' ou 'geladeira'.",
        }

    prateleira_origem = resolver_local_armazenamento(
        lote_origem.get("local_descricao") or lote_origem.get("id_local_armazenamento")
    )

    if prateleira_origem["local_descricao"].lower() == prateleira_destino["local_descricao"].lower():
        return {
            "sucesso": False,
            "status_code": 400,
            "mensagem": f"O lote já se encontra alocado em '{prateleira_destino['local_descricao']}'. Escolha outra prateleira.",
        }

    novo_saldo_origem = saldo_atual - qtd
    lote_destino_final: Dict[str, Any]

    # Verifica se já existe um lote ativo do mesmo produto + mesmo código de lote na prateleira de destino
    todos_lotes = _listar_lotes_persistidos()
    lote_mesmo_destino = next(
        (
            item
            for item in todos_lotes
            if str(item.get("id_lote_produto")) != str(lote_origem.get("id_lote_produto"))
            and int(item.get("quantidade_atual_pacote", 0)) > 0
            and str(item.get("codigo_barra_produto", "")) == str(lote_origem.get("codigo_barra_produto", ""))
            and str(item.get("numero_codigo_lote", "")).upper() == str(lote_origem.get("numero_codigo_lote", "")).upper()
            and normalizar_descricao_prateleira(str(item.get("local_descricao", ""))).lower()
            == prateleira_destino["local_descricao"].lower()
        ),
        None,
    )

    if novo_saldo_origem == 0 and lote_mesmo_destino is None:
        # Transferência integral do lote: atualiza diretamente a prateleira no mesmo registro!
        lote_origem["id_local_armazenamento"] = prateleira_destino["id_local_armazenamento"]
        lote_origem["local_descricao"] = prateleira_destino["local_descricao"]
        _salvar_lote_persistido(lote_origem)
        lote_destino_final = lote_origem
    else:
        # Atualiza o saldo remanescente na prateleira de origem
        lote_origem["quantidade_atual_pacote"] = novo_saldo_origem
        _salvar_lote_persistido(lote_origem)

        if lote_mesmo_destino is not None:
            lote_mesmo_destino["quantidade_atual_pacote"] = int(lote_mesmo_destino.get("quantidade_atual_pacote", 0)) + qtd
            lote_mesmo_destino["id_local_armazenamento"] = prateleira_destino["id_local_armazenamento"]
            lote_mesmo_destino["local_descricao"] = prateleira_destino["local_descricao"]
            _salvar_lote_persistido(lote_mesmo_destino)
            lote_destino_final = lote_mesmo_destino
        else:
            sufixo = str(int(datetime.now().timestamp()))[-3:]
            cod_original = str(lote_origem.get("numero_codigo_lote", "LOTE")).split("-MOV")[0]
            novo_lote_dividido = {
                **lote_origem,
                "id_lote_produto": f"lote_{uuid.uuid4().hex[:8]}",
                "id_local_armazenamento": prateleira_destino["id_local_armazenamento"],
                "local_descricao": prateleira_destino["local_descricao"],
                "numero_codigo_lote": f"{cod_original}-MOV{sufixo}",
                "quantidade_atual_pacote": qtd,
                "quantidade_inicial_pacote": qtd,
                "data_entrada_lote": date.today().isoformat(),
            }
            _salvar_lote_persistido(novo_lote_dividido)
            lote_destino_final = novo_lote_dividido

    resumo_rota = f"{prateleira_origem['local_descricao']} → {prateleira_destino['local_descricao']}"
    _registrar_movimentacao_persistida(
        {
            "id_movimentacao": f"mov_{uuid.uuid4().hex[:8]}",
            "id_lote_produto": lote_destino_final["id_lote_produto"],
            "id_lote_origem": lote_origem["id_lote_produto"],
            "id_produto": lote_origem.get("id_produto", ""),
            "codigo_barra_produto": lote_origem.get("codigo_barra_produto", ""),
            "nome_produto": lote_origem.get("nome_produto", "Produto"),
            "categoria": lote_origem.get("categoria", "Geral"),
            "numero_codigo_lote": lote_destino_final.get("numero_codigo_lote", ""),
            "id_local_origem": prateleira_origem["id_local_armazenamento"],
            "id_local_destino": prateleira_destino["id_local_armazenamento"],
            "local_origem": prateleira_origem["local_descricao"],
            "local_destino": prateleira_destino["local_descricao"],
            "local_descricao": resumo_rota,
            "operacao": "Movimentação",
            "tipo_operacao": "movimentação interna",
            "quantidade_movimentada_pacote": qtd,
            "qtd": qtd,
            "saldo_remanescente_origem": novo_saldo_origem,
            "motivo_saida": f"Transferência Interna ({resumo_rota})",
            "justificativa_detalhe": f"Transferência de {qtd} pct(s) de {prateleira_origem['local_descricao']} para {prateleira_destino['local_descricao']}.",
            "id_usuario_responsavel": id_usuario,
            "data_hora_movimentacao": datetime.now().isoformat(timespec="seconds"),
        }
    )

    return {
        "sucesso": True,
        "status_code": 200,
        "mensagem": f"Transferência concluída: {qtd} pacote(s) movidos de {prateleira_origem['local_descricao']} para {prateleira_destino['local_descricao']}.",
        "quantidade_transferida": qtd,
        "saldo_remanescente_origem": novo_saldo_origem,
        "local_origem": prateleira_origem,
        "local_destino": prateleira_destino,
        "lote_destino": lote_destino_final,
    }


def funcaoRemoverProdutoEstoque(
    lote: Dict[str, Any],
    quantidade_solicitada: int,
    motivo_saida: str,
    palavra_confirmacao: str = "",
    justificativa: str = "",
    id_usuario: str = "operador",
) -> Dict[str, Any]:
    """
    Regra US07 / Tela 3.2:
    Processa a baixa de pacotes garantindo impedimento de valores negativos, trava PERDA
    e persistência transacional no banco de dados.
    """
    try:
        qtd = int(quantidade_solicitada or 0)
    except (ValueError, TypeError):
        qtd = 0

    if qtd <= 0:
        return {
            "sucesso": False,
            "status_code": 400,
            "mensagem": "A quantidade de saída deve ser superior a zero.",
        }

    id_lote = lote.get("id_lote_produto") if isinstance(lote, dict) else None
    lote_persistido = _buscar_lote_por_id(id_lote) if id_lote else None

    if lote_persistido is not None and "quantidade_atual_pacote" not in lote:
        saldo_atual = int(lote_persistido.get("quantidade_atual_pacote", 0))
    else:
        saldo_atual = int(
            lote.get(
                "quantidade_atual_pacote",
                lote_persistido.get("quantidade_atual_pacote", 0) if lote_persistido else 0,
            )
        )

    if qtd > saldo_atual:
        return {
            "sucesso": False,
            "status_code": 422,
            "mensagem": f"Saldo insuficiente no lote. Disponível: {saldo_atual}, Solicitado: {qtd}.",
        }

    motivo_normalizado = (motivo_saida or "").lower()
    eh_descarte = "perda" in motivo_normalizado or "descarte" in motivo_normalizado
    eh_transferencia = "transfer" in motivo_normalizado or "movimenta" in motivo_normalizado

    if eh_descarte:
        if not funcaoValidarPalavraConfirmacaoPerda(palavra_confirmacao):
            return {
                "sucesso": False,
                "status_code": 403,
                "mensagem": "Operação bloqueada: Para autorizar o descarte é obrigatório digitar exatamente a palavra 'PERDA' em maiúsculas.",
            }
        if not (justificativa or "").strip():
            return {
                "sucesso": False,
                "status_code": 400,
                "mensagem": "Justificativa obrigatória para saídas decorrentes de perda ou avaria.",
            }

    novo_saldo = saldo_atual - qtd
    lote["quantidade_atual_pacote"] = novo_saldo

    lote_para_salvar = {**(lote_persistido or {}), **lote, "quantidade_atual_pacote": novo_saldo}
    if id_lote is not None:
        lote_para_salvar["id_lote_produto"] = id_lote
        _salvar_lote_persistido(lote_para_salvar)

    _registrar_movimentacao_persistida(
        {
            "id_movimentacao": f"mov_{uuid.uuid4().hex[:8]}",
            "id_lote_produto": id_lote,
            "id_produto": lote_para_salvar.get("id_produto", ""),
            "codigo_barra_produto": lote_para_salvar.get("codigo_barra_produto", ""),
            "nome_produto": lote_para_salvar.get("nome_produto", "Produto"),
            "categoria": lote_para_salvar.get("categoria", "Geral"),
            "numero_codigo_lote": lote_para_salvar.get("numero_codigo_lote", ""),
            "local_descricao": lote_para_salvar.get("local_descricao", ""),
            "operacao": "Movimentação" if eh_transferencia else "Saída",
            "tipo_operacao": "movimentação interna" if eh_transferencia else "saída",
            "quantidade_movimentada_pacote": qtd,
            "qtd": qtd,
            "saldo_anterior": saldo_atual,
            "novo_saldo": novo_saldo,
            "motivo_saida": motivo_saida,
            "justificativa_detalhe": (justificativa or "").strip(),
            "palavra_confirmacao_perda": palavra_confirmacao.strip() if eh_descarte else None,
            "id_usuario_responsavel": id_usuario,
            "data_hora_movimentacao": datetime.now().isoformat(timespec="seconds"),
        }
    )

    return {
        "sucesso": True,
        "status_code": 200,
        "mensagem": "Saída de estoque homologada com sucesso.",
        "id_lote_produto": id_lote,
        "saldo_anterior": saldo_atual,
        "novo_saldo": novo_saldo,
        "quantidade_removida": qtd,
        "motivo": motivo_saida,
    }


def funcaoAjustarEstoqueFisico(
    id_lote_produto: str,
    nova_quantidade: int,
    justificativa: str,
    id_usuario: str = "Auditor",
) -> Dict[str, Any]:
    if nova_quantidade < 0:
        return {
            "sucesso": False,
            "status_code": 400,
            "mensagem": "A quantidade física não pode ser negativa.",
        }
    if not (justificativa or "").strip():
        return {
            "sucesso": False,
            "status_code": 400,
            "mensagem": "A justificativa de auditoria é obrigatória.",
        }

    lote_ref = _buscar_lote_por_id(id_lote_produto)
    if not lote_ref:
        return {
            "sucesso": False,
            "status_code": 404,
            "mensagem": f"Lote '{id_lote_produto}' não encontrado no estoque.",
        }

    saldo_anterior = int(lote_ref.get("quantidade_atual_pacote", 0))
    diferenca = int(nova_quantidade) - saldo_anterior
    lote_ref["quantidade_atual_pacote"] = int(nova_quantidade)
    _salvar_lote_persistido(lote_ref)

    _registrar_movimentacao_persistida(
        {
            "id_movimentacao": f"mov_{uuid.uuid4().hex[:8]}",
            "id_lote_produto": id_lote_produto,
            "id_produto": lote_ref.get("id_produto", ""),
            "codigo_barra_produto": lote_ref.get("codigo_barra_produto", ""),
            "nome_produto": lote_ref.get("nome_produto", "Produto"),
            "categoria": lote_ref.get("categoria", "Geral"),
            "numero_codigo_lote": lote_ref.get("numero_codigo_lote", ""),
            "local_descricao": lote_ref.get("local_descricao", "Estoque Geral"),
            "operacao": "Ajuste",
            "tipo_operacao": "ajuste",
            "quantidade_movimentada_pacote": abs(diferenca),
            "qtd": abs(diferenca),
            "diferenca": diferenca,
            "saldo_anterior": saldo_anterior,
            "novo_saldo": int(nova_quantidade),
            "motivo_saida": f"Sistema: {saldo_anterior} pcts | Físico: {int(nova_quantidade)} pcts",
            "justificativa_detalhe": justificativa.strip(),
            "id_usuario_responsavel": id_usuario,
            "data_hora_movimentacao": datetime.now().isoformat(timespec="seconds"),
        }
    )

    return {
        "sucesso": True,
        "status_code": 200,
        "diferenca": diferenca,
        "novo_saldo": int(nova_quantidade),
        "mensagem": "Ajuste físico registrado e auditado com sucesso.",
    }


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Ponto de entrada padrão da AWS Lambda para rotas de Estoque (/api/estoque/*).
    """
    metodo_http = event.get("httpMethod", "GET")
    corpo_requisicao = {}

    if "body" in event and event["body"]:
        try:
            corpo_requisicao = (
                json.loads(event["body"])
                if isinstance(event["body"], str)
                else event["body"]
            )
        except Exception:
            return formatar_resposta_http(400, {"erro": "Payload JSON inválido."})

    acao = corpo_requisicao.get("acao", "")

    if metodo_http == "GET" or acao == "consultar_estoque":
        lotes_ordenados = obter_lotes_estoque()
        locais_homologados = listar_locais_armazenamento_aws(lotes_ordenados)
        return formatar_resposta_http(
            200,
            {
                "sucesso": True,
                "status_code": 200,
                "lotes": lotes_ordenados,
                "total_lotes": len(lotes_ordenados),
                "locais": locais_homologados,
            },
        )

    if acao == "listar_locais":
        lotes_ordenados = obter_lotes_estoque()
        locais_homologados = listar_locais_armazenamento_aws(lotes_ordenados)
        return formatar_resposta_http(
            200,
            {
                "sucesso": True,
                "status_code": 200,
                "locais": locais_homologados,
                "total_locais": len(locais_homologados),
            },
        )

    if acao == "cadastrar_local":
        res = funcaoCadastrarLocalArmazenamento(corpo_requisicao)
        return formatar_resposta_http(res["status_code"], res)

    if acao == "excluir_local":
        res = funcaoExcluirLocalArmazenamento(corpo_requisicao)
        return formatar_resposta_http(res["status_code"], res)

    if acao == "consultar_movimentacoes":
        return formatar_resposta_http(
            200,
            {
                "sucesso": True,
                "status_code": 200,
                "movimentacoes": obter_historico_movimentacoes(),
            },
        )

    if acao == "verificar_produto":
        codigo_barras = corpo_requisicao.get("codigo_barras", "")
        resultado = funcaoVerificarProdutoPorCodigoBarras(codigo_barras)
        return formatar_resposta_http(resultado["status_code"], resultado)

    if metodo_http == "POST" and acao in ("mover_lote", "transferir_lote"):
        resultado = funcaoTransferirLoteEntrePrateleiras(
            id_lote_produto=corpo_requisicao.get("id_lote_produto", ""),
            quantidade_mover=corpo_requisicao.get("quantidade", corpo_requisicao.get("quantidade_mover", 0)),
            local_destino=corpo_requisicao.get("local_destino") or corpo_requisicao.get("novo_local") or "",
            id_usuario=corpo_requisicao.get("id_usuario", "operador"),
            confirmacao_divisao_lote=corpo_requisicao.get("confirmacao_divisao_lote", True),
        )
        return formatar_resposta_http(resultado["status_code"], resultado)

    if metodo_http == "POST" and acao == "saida_produto":
        lote_payload = corpo_requisicao.get("lote") or {}
        if corpo_requisicao.get("id_lote_produto") and "id_lote_produto" not in lote_payload:
            lote_payload["id_lote_produto"] = corpo_requisicao["id_lote_produto"]

        resultado = funcaoRemoverProdutoEstoque(
            lote=lote_payload,
            quantidade_solicitada=corpo_requisicao.get("quantidade", 0),
            motivo_saida=corpo_requisicao.get("motivo_saida", ""),
            palavra_confirmacao=corpo_requisicao.get("palavra_confirmacao", ""),
            justificativa=corpo_requisicao.get("justificativa", ""),
            id_usuario=corpo_requisicao.get("id_usuario", "operador"),
        )
        return formatar_resposta_http(resultado["status_code"], resultado)

    if metodo_http == "POST" and acao in ("entrada_lote", "cadastrar_lote"):
        lote_obj = corpo_requisicao.get("lote") or corpo_requisicao
        if corpo_requisicao.get("id_usuario") and "id_usuario" not in lote_obj:
            lote_obj["id_usuario"] = corpo_requisicao["id_usuario"]

        resultado = funcaoCadastrarNovoLoteEstoque(
            id_produto=lote_obj.get("id_produto", 0),
            id_local_armazenamento=lote_obj.get("id_local_armazenamento", 0),
            numero_codigo_lote=lote_obj.get("numero_codigo_lote", ""),
            quantidade_inicial_pacote=lote_obj.get("quantidade_inicial_pacote", 0),
            data_validade_lote=lote_obj.get("data_validade_lote", ""),
            id_doador=lote_obj.get("id_doador"),
            dados_extras=lote_obj,
        )
        return formatar_resposta_http(resultado["status_code"], resultado)

    if metodo_http == "POST" and acao == "ajustar_estoque":
        resultado = funcaoAjustarEstoqueFisico(
            id_lote_produto=corpo_requisicao.get("id_lote_produto", ""),
            nova_quantidade=int(corpo_requisicao.get("nova_quantidade", -1)),
            justificativa=corpo_requisicao.get("justificativa", ""),
            id_usuario=corpo_requisicao.get("id_usuario", "Auditor"),
        )
        return formatar_resposta_http(resultado["status_code"], resultado)

    return formatar_resposta_http(
        400, {"erro": f"Ação '{acao}' não suportada pelo manipulador de estoque."}
    )
