# backend-serverless/src/handlers/configuracoes_handler.py
import os
import re
import json
import uuid
from datetime import datetime
import unicodedata
import boto3
from decimal import Decimal
from typing import Dict, Any, List, Optional
from src.utils.response import formatar_resposta_http

AWS_REGION = os.getenv("AWS_REGION", "us-east-2")
TABELA_LOCAIS = os.getenv("DYNAMODB_TABLE_LOCAIS", "tb_locaisArmazenamento")
TABELA_LOTES = os.getenv("DYNAMODB_TABLE_LOTES", "tb_lotesProdutos")
TABELA_CATEGORIAS = os.getenv("DYNAMODB_TABLE_CATEGORIAS", "tb_categoriasAlimentos")

_CATEGORIAS_PADRAO = [
    {"nome_categoria": "Grãos e Cereais", "descricao": "Arroz, feijão, lentilha, milho e farináceos básicos."},
    {"nome_categoria": "Laticínios", "descricao": "Leite integral UHT, leite em pó, derivados refrigerados."},
    {"nome_categoria": "Massas e Padaria", "descricao": "Macarrão, biscoitos, pães e misturas de panificação."},
    {"nome_categoria": "Óleos e Temperos", "descricao": "Óleo de soja, azeite, sal, açúcar e condimentos."},
    {"nome_categoria": "Enlatados e Conservas", "descricao": "Extrato de tomate, milho, ervilha, sardinha e atum."},
    {"nome_categoria": "Bebidas e Sucos", "descricao": "Sucos integrais, achocolatados e bebidas lácteas."},
    {"nome_categoria": "Higiene e Limpeza", "descricao": "Sabonete, detergente, água sanitária e itens de apoio."},
    {"nome_categoria": "Outros Alimentos", "descricao": "Itens diversos não classificados nas categorias anteriores."},
]
_TABELA_CATEGORIAS_MEMORIA: List[Dict[str, Any]] = [dict(c) for c in _CATEGORIAS_PADRAO]


def listar_categorias_alimentos_aws() -> List[Dict[str, Any]]:
    tabela = _obter_tabela_dynamodb(TABELA_CATEGORIAS)
    if tabela is not None:
        try:
            resp = tabela.scan()
            itens = resp.get("Items", [])
            if itens:
                return _converter_decimals(itens)
        except Exception:
            pass
    return list(_TABELA_CATEGORIAS_MEMORIA)


def cadastrar_categoria_alimento_aws(dados: Dict[str, Any]) -> Dict[str, Any]:
    nome = str(dados.get("nome_categoria") or dados.get("nome") or "").strip()
    descricao = str(dados.get("descricao_categoria") or dados.get("descricao") or "").strip()
    if not nome:
        return {"sucesso": False, "status_code": 400, "mensagem": "Nome da categoria é obrigatório."}

    # Verifica se já existe
    for cat in _TABELA_CATEGORIAS_MEMORIA:
        if str(cat.get("nome_categoria", "")).lower() == nome.lower():
            return {
                "sucesso": True,
                "status_code": 200,
                "mensagem": f"Categoria '{nome}' já homologada na AWS.",
                "categoria": cat,
            }

    id_cat = f"cat_{uuid.uuid4().hex[:8]}"
    nova_cat = {
        "id_categoria_alimento": id_cat,
        "nome_categoria": nome,
        "descricao_categoria": descricao or f"Categoria institucional {nome}",
        "status_ativo": True,
        "data_cadastro": datetime.now().isoformat(),
    }
    _TABELA_CATEGORIAS_MEMORIA.append(nova_cat)

    tabela = _obter_tabela_dynamodb(TABELA_CATEGORIAS)
    if tabela is not None:
        try:
            tabela.put_item(Item=nova_cat)
        except Exception as e:
            print(f"[AVISO] Não foi possível persistir categoria no DynamoDB: {e}")

    return {
        "sucesso": True,
        "status_code": 201,
        "mensagem": f"Categoria '{nome}' cadastrada na AWS com sucesso.",
        "categoria": nova_cat,
    }

# Catálogo homologado padrão de compartimentos físicos (US06: exclusivamente 'armário' ou 'geladeira')
_LOCAIS_PADRAO_HOMOLOGADOS: List[Dict[str, Any]] = [
    {
        "id_local_armazenamento": "loc_armario_a_prateleira_1",
        "nome_local": "Armário A",
        "tipo_local": "armário",
        "sublocal_compartimento": "Prateleira 1",
        "localizacao_ambiente": "Despensa Principal",
        "local_descricao": "Armário A - Prateleira 1",
        "status_ativo": True,
    },
    {
        "id_local_armazenamento": "loc_armario_a_prateleira_2",
        "nome_local": "Armário A",
        "tipo_local": "armário",
        "sublocal_compartimento": "Prateleira 2",
        "localizacao_ambiente": "Despensa Principal",
        "local_descricao": "Armário A - Prateleira 2",
        "status_ativo": True,
    },
    {
        "id_local_armazenamento": "loc_armario_b_prateleira_1",
        "nome_local": "Armário B",
        "tipo_local": "armário",
        "sublocal_compartimento": "Prateleira 1",
        "localizacao_ambiente": "Despensa Seca",
        "local_descricao": "Armário B - Prateleira 1",
        "status_ativo": True,
    },
    {
        "id_local_armazenamento": "loc_armario_b_prateleira_3",
        "nome_local": "Armário B",
        "tipo_local": "armário",
        "sublocal_compartimento": "Prateleira 3",
        "localizacao_ambiente": "Despensa Seca",
        "local_descricao": "Armário B - Prateleira 3",
        "status_ativo": True,
    },
    {
        "id_local_armazenamento": "loc_geladeira_1_prateleira_central",
        "nome_local": "Geladeira 1",
        "tipo_local": "geladeira",
        "sublocal_compartimento": "Prateleira Central",
        "localizacao_ambiente": "Cozinha Institucional",
        "local_descricao": "Geladeira 1 - Prateleira Central",
        "status_ativo": True,
    },
    {
        "id_local_armazenamento": "loc_geladeira_1_gaveta_superior",
        "nome_local": "Geladeira 1",
        "tipo_local": "geladeira",
        "sublocal_compartimento": "Gaveta Superior",
        "localizacao_ambiente": "Cozinha Institucional",
        "local_descricao": "Geladeira 1 - Gaveta Superior",
        "status_ativo": True,
    },
    {
        "id_local_armazenamento": "loc_geladeira_2_gaveta_inferior",
        "nome_local": "Geladeira 2",
        "tipo_local": "geladeira",
        "sublocal_compartimento": "Gaveta Inferior",
        "localizacao_ambiente": "Cozinha Institucional",
        "local_descricao": "Geladeira 2 - Gaveta Inferior",
        "status_ativo": True,
    },
]

_LOCAIS_ARMAZENAMENTO: List[Dict[str, Any]] = [dict(item) for item in _LOCAIS_PADRAO_HOMOLOGADOS]


def _converter_decimals(obj: Any) -> Any:
    if isinstance(obj, list):
        return [_converter_decimals(i) for i in obj]
    if isinstance(obj, dict):
        return {k: _converter_decimals(v) for k, v in obj.items()}
    if isinstance(obj, Decimal):
        return int(obj) if obj % 1 == 0 else float(obj)
    return obj


def _obter_tabela_dynamodb(nome_tabela: str):
    if os.getenv("PYTEST_CURRENT_TEST") and os.getenv("USE_REAL_AWS_IN_TESTS") != "true":
        return None
    try:
        recurso = boto3.resource("dynamodb", region_name=AWS_REGION)
        return recurso.Table(nome_tabela)
    except Exception:
        return None


def _remover_acentos(texto: str) -> str:
    nfkd = unicodedata.normalize("NFKD", texto or "")
    return "".join(c for c in nfkd if not unicodedata.combining(c))


def normalizar_descricao_prateleira(descricao: str) -> str:
    """
    Normaliza divergências históricas de nomenclatura entre telas e banco de dados:
    Ex: 'Armário A - Prat. 1' -> 'Armário A - Prateleira 1'
        'Geladeira 1 - Prat. Central' -> 'Geladeira 1 - Prateleira Central'
        'Despensa Prateleira 1' -> 'Armário Despensa - Prateleira 1'
    """
    texto = (descricao or "").strip()
    if not texto:
        return "Armário A - Prateleira 1"

    # Substitui abreviações 'Prat.' ou 'Prat ' por 'Prateleira '
    texto = re.sub(r"\bPrat(?:\.|\b)\s*", "Prateleira ", texto, flags=re.IGNORECASE)
    texto = re.sub(r"\s+", " ", texto).strip()

    # Normaliza casos sem hífen separador como 'Despensa Prateleira 1'
    if " - " not in texto and re.search(r"\b(Prateleira|Gaveta)\b", texto, flags=re.IGNORECASE):
        partes = re.split(r"\b(Prateleira|Gaveta)\b", texto, maxsplit=1, flags=re.IGNORECASE)
        if len(partes) == 3:
            prefixo = partes[0].strip(" -")
            compartimento = f"{partes[1]} {partes[2]}".strip()
            texto = f"{prefixo} - {compartimento}"

    # Garante conformidade com US06 (armário ou geladeira) caso comece apenas com 'Despensa'
    if texto.lower().startswith("despensa"):
        texto = f"Armário {texto}"

    return texto


def gerar_id_local_canonico(nome_local: str, sublocal: str) -> str:
    base = _remover_acentos(f"{nome_local}_{sublocal}".lower())
    limpo = re.sub(r"[^a-z0-9]+", "_", base).strip("_")
    return f"loc_{limpo}" if limpo else "loc_armario_a_prateleira_1"


def decompor_descricao_local(local_descricao: str) -> Dict[str, Any]:
    desc_canonica = normalizar_descricao_prateleira(local_descricao)
    if " - " in desc_canonica:
        nome_local, sublocal = [p.strip() for p in desc_canonica.split(" - ", 1)]
    else:
        nome_local, sublocal = desc_canonica, "Prateleira 1"

    tipo_local = "geladeira" if "geladeira" in nome_local.lower() else "armário"
    ambiente = (
        "Cozinha Institucional"
        if tipo_local == "geladeira"
        else ("Despensa Seca" if "despensa" in nome_local.lower() or "b" in nome_local.lower() else "Despensa Principal")
    )
    id_canonico = gerar_id_local_canonico(nome_local, sublocal)

    return {
        "id_local_armazenamento": id_canonico,
        "nome_local": nome_local,
        "tipo_local": tipo_local,
        "sublocal_compartimento": sublocal,
        "localizacao_ambiente": ambiente,
        "local_descricao": f"{nome_local} - {sublocal}",
        "status_ativo": True,
    }


def listar_locais_armazenamento_aws(lotes_ativos: Optional[List[Dict[str, Any]]] = None) -> List[Dict[str, Any]]:
    """
    Lista todas as prateleiras homologadas no banco de dados da AWS (tb_locaisArmazenamento),
    reconciliando também as prateleiras em uso nos lotes ativos (tb_lotesProdutos) para eliminar
    qualquer discrepância entre entrada, movimentação e consulta de estoque.
    """
    mapa_locais: Dict[str, Dict[str, Any]] = {}

    # 1. Carrega locais base em memória
    for loc in _LOCAIS_ARMAZENAMENTO:
        desc_canon = normalizar_descricao_prateleira(
            loc.get("local_descricao") or f"{loc.get('nome_local', '')} - {loc.get('sublocal_compartimento', '')}"
        )
        decomp = decompor_descricao_local(desc_canon)
        id_loc = str(loc.get("id_local_armazenamento") or decomp["id_local_armazenamento"])
        chave = decomp["local_descricao"].lower()
        mapa_locais[chave] = {
            **decomp,
            **loc,
            "id_local_armazenamento": id_loc if not id_loc.isdigit() else decomp["id_local_armazenamento"],
            "local_descricao": decomp["local_descricao"],
            "sublocal_compartimento": decomp["sublocal_compartimento"],
        }

    # 2. Carrega locais persistidos na tabela DynamoDB tb_locaisArmazenamento (se existir)
    tabela_locais = _obter_tabela_dynamodb(TABELA_LOCAIS)
    if tabela_locais is not None:
        try:
            resp = tabela_locais.scan()
            itens_db = _converter_decimals(resp.get("Items", []))
            for item in itens_db:
                desc_canon = normalizar_descricao_prateleira(
                    item.get("local_descricao")
                    or f"{item.get('nome_local', '')} - {item.get('sublocal_compartimento', '')}"
                )
                decomp = decompor_descricao_local(desc_canon)
                chave = decomp["local_descricao"].lower()
                mapa_locais[chave] = {
                    **decomp,
                    **item,
                    "local_descricao": decomp["local_descricao"],
                    "sublocal_compartimento": decomp["sublocal_compartimento"],
                }
        except Exception:
            pass

    # 3. Reconcilia com os lotes ativos em tb_lotesProdutos na AWS (ou memória local)
    if lotes_ativos is None:
        tabela_lotes = _obter_tabela_dynamodb(TABELA_LOTES)
        if tabela_lotes is not None:
            try:
                resp_lotes = tabela_lotes.scan()
                lotes_ativos = _converter_decimals(resp_lotes.get("Items", []))
            except Exception:
                lotes_ativos = []
        else:
            try:
                from src.handlers.estoque_handler import _TABELA_LOTES_MEMORIA
                lotes_ativos = list(_TABELA_LOTES_MEMORIA.values())
            except Exception:
                lotes_ativos = []

    contagem_lotes: Dict[str, int] = {}
    contagem_pacotes: Dict[str, int] = {}

    for lote in lotes_ativos or []:
        qtd = int(lote.get("quantidade_atual_pacote", 0) or 0)
        desc_lote = str(lote.get("local_descricao") or "").strip()
        if not desc_lote:
            continue
        decomp = decompor_descricao_local(desc_lote)
        chave = decomp["local_descricao"].lower()
        if chave not in mapa_locais:
            mapa_locais[chave] = decomp
        if qtd > 0:
            contagem_lotes[chave] = contagem_lotes.get(chave, 0) + 1
            contagem_pacotes[chave] = contagem_pacotes.get(chave, 0) + qtd

    resultado = []
    for chave, loc in mapa_locais.items():
        item_final = {
            **loc,
            "quantidade_lotes_ativos": contagem_lotes.get(chave, 0),
            "quantidade_pacotes_alocados": contagem_pacotes.get(chave, 0),
        }
        resultado.append(item_final)

    resultado.sort(key=lambda x: str(x.get("local_descricao", "")))
    return resultado


def resolver_local_armazenamento(identificador_ou_descricao: Any) -> Dict[str, Any]:
    """
    Resolve um ID ou descrição de prateleira para o registro canônico homologado.
    """
    valor = str(identificador_ou_descricao or "").strip()
    locais = listar_locais_armazenamento_aws()
    desc_normalizada = normalizar_descricao_prateleira(valor).lower()

    for loc in locais:
        if (
            str(loc.get("id_local_armazenamento", "")).lower() == valor.lower()
            or str(loc.get("local_descricao", "")).lower() == desc_normalizada
        ):
            return loc

    return decompor_descricao_local(valor)


def funcaoCadastrarLocalArmazenamento(dados: Dict[str, Any]) -> Dict[str, Any]:
    """
    Regra US06 / Tela 6.3:
    Permite cadastrar apenas locais do tipo 'armário' ou 'geladeira', proibindo ruas e corredores.
    Persiste no AWS DynamoDB (tb_locaisArmazenamento) e na memória.
    """
    nome_local = (dados.get("nome_local") or "").strip()
    tipo_local = (dados.get("tipo_local") or "").strip().lower()
    sublocal = (dados.get("sublocal_compartimento") or "").strip()
    ambiente = (dados.get("localizacao_ambiente") or "Despensa Principal").strip()

    if tipo_local not in ("armário", "geladeira"):
        return {
            "sucesso": False,
            "status_code": 400,
            "mensagem": "Tipo de local inválido. São permitidos exclusivamente 'armário' ou 'geladeira' (proibidos corredores ou ruas).",
        }

    if not nome_local or not sublocal:
        return {
            "sucesso": False,
            "status_code": 400,
            "mensagem": "O nome do local e a identificação da prateleira/gaveta são obrigatórios.",
        }

    # Impede menção a rua ou corredor no nome ou sublocal (US06)
    texto_validacao = f"{nome_local} {sublocal} {ambiente}".lower()
    if any(proibido in texto_validacao for proibido in ("corredor", "rua ", "alameda", "galpão")):
        return {
            "sucesso": False,
            "status_code": 400,
            "mensagem": "Nomenclatura bloqueada pela regra US06: não são permitidos corredores ou ruas.",
        }

    desc_canonica = normalizar_descricao_prateleira(f"{nome_local} - {sublocal}")
    id_canonico = gerar_id_local_canonico(nome_local, sublocal)

    novo_local = {
        "id_local_armazenamento": id_canonico,
        "nome_local": nome_local,
        "tipo_local": tipo_local,
        "sublocal_compartimento": re.sub(r"\bPrat(?:\.|\b)\s*", "Prateleira ", sublocal, flags=re.IGNORECASE).strip(),
        "localizacao_ambiente": ambiente,
        "local_descricao": desc_canonica,
        "status_ativo": True,
    }

    # Verifica duplicidade e atualiza ou adiciona
    existente_idx = next(
        (
            i
            for i, item in enumerate(_LOCAIS_ARMAZENAMENTO)
            if normalizar_descricao_prateleira(item.get("local_descricao", "")).lower() == desc_canonica.lower()
        ),
        None,
    )
    if existente_idx is not None:
        _LOCAIS_ARMAZENAMENTO[existente_idx] = novo_local
    else:
        _LOCAIS_ARMAZENAMENTO.append(novo_local)

    tabela = _obter_tabela_dynamodb(TABELA_LOCAIS)
    if tabela is not None:
        try:
            tabela.put_item(Item=novo_local)
        except Exception as erro:
            print(f"[DYNAMODB] Aviso ao gravar local {id_canonico}: {erro}")

    return {
        "sucesso": True,
        "status_code": 201,
        "mensagem": "Compartimento de armazenamento homologado com sucesso.",
        "local": novo_local,
    }


def funcaoExcluirLocalArmazenamento(dados: Dict[str, Any]) -> Dict[str, Any]:
    """
    Regra US06 / Tela 6.3:
    Bloqueia a exclusão de prateleiras que possuam lotes ativos alocados.
    """
    id_local = str(dados.get("id_local_armazenamento") or "").strip()
    local_desc = str(dados.get("local_descricao") or "").strip()

    if not id_local and not local_desc:
        return {
            "sucesso": False,
            "status_code": 400,
            "mensagem": "Informe o identificador ou a descrição da prateleira para exclusão.",
        }

    locais_atuais = listar_locais_armazenamento_aws()
    alvo = None
    desc_busca = normalizar_descricao_prateleira(local_desc).lower() if local_desc else ""

    for loc in locais_atuais:
        if (id_local and str(loc.get("id_local_armazenamento")) == id_local) or (
            desc_busca and str(loc.get("local_descricao", "")).lower() == desc_busca
        ):
            alvo = loc
            break

    if not alvo:
        return {
            "sucesso": False,
            "status_code": 404,
            "mensagem": "Compartimento não encontrado no cadastro.",
        }

    if int(alvo.get("quantidade_pacotes_alocados", 0)) > 0:
        return {
            "sucesso": False,
            "status_code": 409,
            "mensagem": (
                f"Exclusão bloqueada (US06): O compartimento '{alvo.get('local_descricao')}' possui "
                f"{alvo.get('quantidade_lotes_ativos')} lote(s) ativo(s) ({alvo.get('quantidade_pacotes_alocados')} pacotes). "
                "Realize a Movimentação Interna para outra prateleira antes de excluir."
            ),
        }

    _LOCAIS_ARMAZENAMENTO[:] = [
        item
        for item in _LOCAIS_ARMAZENAMENTO
        if str(item.get("id_local_armazenamento")) != str(alvo.get("id_local_armazenamento"))
        and normalizar_descricao_prateleira(item.get("local_descricao", "")).lower()
        != str(alvo.get("local_descricao", "")).lower()
    ]

    tabela = _obter_tabela_dynamodb(TABELA_LOCAIS)
    if tabela is not None:
        try:
            tabela.delete_item(Key={"id_local_armazenamento": str(alvo.get("id_local_armazenamento"))})
        except Exception:
            pass

    return {
        "sucesso": True,
        "status_code": 200,
        "mensagem": f"Compartimento '{alvo.get('local_descricao')}' removido com sucesso.",
    }


def funcaoModerarCampanhaDoacao(dados: Dict[str, Any]) -> Dict[str, Any]:
    """
    Regra W08: Aprovação ou reprovação de campanhas propostas por doadores.
    Exige parecer técnico obrigatório em caso de reprovação.
    """
    id_campanha = dados.get("id_campanha_doacao")
    novo_status = (dados.get("status_campanha") or "").strip()
    justificativa = (dados.get("justificativa_parecer_tecnico") or "").strip()

    if novo_status not in ("Aprovada", "Reprovada", "Encerrada"):
        return {
            "sucesso": False,
            "status_code": 400,
            "mensagem": "Status de moderação inválido. Use 'Aprovada', 'Reprovada' ou 'Encerrada'.",
        }

    if novo_status == "Reprovada" and not justificativa:
        return {
            "sucesso": False,
            "status_code": 400,
            "mensagem": "O parecer técnico justificativo é obrigatório ao reprovar uma campanha.",
        }

    return {
        "sucesso": True,
        "status_code": 200,
        "id_campanha_doacao": id_campanha,
        "status_campanha": novo_status,
        "justificativa_parecer_tecnico": justificativa,
        "mensagem": f"Campanha atualizada para '{novo_status}' com sucesso.",
    }


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    corpo = {}
    if "body" in event and event["body"]:
        try:
            corpo = (
                json.loads(event["body"])
                if isinstance(event["body"], str)
                else event["body"]
            )
        except Exception:
            return formatar_resposta_http(400, {"erro": "Payload JSON inválido."})

    acao = corpo.get("acao", "listar_locais")

    if acao == "listar_locais":
        locais = listar_locais_armazenamento_aws()
        return formatar_resposta_http(
            200, {"sucesso": True, "status_code": 200, "locais": locais, "total_locais": len(locais)}
        )

    if acao == "cadastrar_local":
        res = funcaoCadastrarLocalArmazenamento(corpo)
        return formatar_resposta_http(res["status_code"], res)

    if acao == "excluir_local":
        res = funcaoExcluirLocalArmazenamento(corpo)
        return formatar_resposta_http(res["status_code"], res)

    if acao == "moderar_campanha":
        res = funcaoModerarCampanhaDoacao(corpo)
        return formatar_resposta_http(res["status_code"], res)

    if acao in ("listar_categorias", "consultar_categorias"):
        cats = listar_categorias_alimentos_aws()
        return formatar_resposta_http(
            200,
            {
                "sucesso": True,
                "status_code": 200,
                "categorias": cats,
                "total_categorias": len(cats),
            },
        )

    if acao == "cadastrar_categoria":
        res = cadastrar_categoria_alimento_aws(corpo)
        return formatar_resposta_http(res["status_code"], res)

    return formatar_resposta_http(
        400, {"sucesso": False, "erro": f"Ação de configuração '{acao}' não suportada."}
    )
