# backend-serverless/src/services/api_codigo_barras.py
"""
Serviço de Barramento em Cascata com 3 APIs Brasileiras Gratuitas (EAN/GTIN).
1. API 1 (Primária): EAN Pictures Brasil (eanpictures.com.br)
2. API 2 (Secundária): Open Food Facts Brasil (br.openfoodfacts.org)
3. API 3 (Terciária): Busca Unificada Brasil / Catálogo Nacional
"""

import json
import gzip
import urllib.request
import urllib.error
from typing import Dict, Any, List, Optional, Callable

TIMEOUT_REQUISICAO_SEGUNDOS = 4.0


def funcaoValidarCodigoBarrasManual(codigo_barras: str) -> bool:
    """Valida se o código de barras possui entre 8 e 14 dígitos numéricos (EAN-8, UPC, EAN-13, GTIN-14)."""
    if not isinstance(codigo_barras, str):
        return False
    limpo = codigo_barras.strip()
    return limpo.isdigit() and 8 <= len(limpo) <= 14


def inferir_categoria_alimento(nome: str, categoria_bruta: str = "") -> str:
    """Mapeia o nome ou categoria retornada pela API externa para as categorias institucionais."""
    texto = f"{nome} {categoria_bruta}".lower()
    if any(k in texto for k in ["leite", "queijo", "iogurte", "manteiga", "requeijão", "latic", "lacteo", "dairy", "creme de leite", "leite condensado"]):
        return "Laticínios"
    if any(k in texto for k in ["macarrão", "macarrao", "massa", "espaguete", "parafuso", "lasanha", "noodle", "pasta"]):
        return "Massas"
    if any(k in texto for k in ["óleo", "oleo", "azeite", "margarina", "banha", "gordura"]):
        return "Óleos e Gorduras"
    if any(k in texto for k in ["sardinha", "atum", "milho", "ervilha", "seleta", "molho", "extrato", "conserva", "enlatado", "lata"]):
        return "Enlatados"
    if any(k in texto for k in ["sabonete", "sabão", "sabao", "detergente", "desinfetante", "água sanitária", "agua sanitaria", "papel higiênico", "pasta de dente", "creme dental", "shampoo", "limpeza", "higiene"]):
        return "Higiene e Limpeza"
    if any(k in texto for k in ["arroz", "feijão", "feijao", "lentilha", "grão", "grao", "aveia", "farinha", "fubá", "fuba", "cereal", "milho de pipoca", "açúcar", "acucar", "café", "cafe", "biscoito", "bolacha", "achocolatado"]):
        return "Grãos e Cereais"
    return "Grãos e Cereais"


def _ler_json(resp) -> Any:
    bruto = resp.read()
    if not bruto:
        return {}
    if bruto.startswith(b"\x1f\x8b") or resp.headers.get("Content-Encoding") == "gzip":
        bruto = gzip.decompress(bruto)
    try:
        return json.loads(bruto.decode("utf-8"))
    except UnicodeDecodeError:
        return json.loads(bruto.decode("latin-1", errors="ignore"))


def _normalizar_retorno_produto(
    ean: str,
    dados_brutos: Dict[str, Any],
    indice_provedor: int,
) -> Dict[str, Any]:
    nome = (dados_brutos.get("nome_produto") or "").strip()
    marca = (dados_brutos.get("marca_produto") or "").strip()
    categoria_informada = (dados_brutos.get("categoria") or "").strip()
    categoria_final = (
        categoria_informada
        if categoria_informada
        in {
            "Grãos e Cereais",
            "Laticínios",
            "Massas",
            "Enlatados",
            "Óleos e Gorduras",
            "Higiene e Limpeza",
        }
        else inferir_categoria_alimento(nome, categoria_informada)
    )

    return {
        "codigo_barra_produto": ean,
        "nome_produto": nome,
        "marca_produto": marca,
        "categoria": categoria_final,
        "unidade_medida_pacote": dados_brutos.get("unidade_medida_pacote") or "pacotes",
        "estoque_minimo_pacote": int(dados_brutos.get("estoque_minimo_pacote") or 10),
        "url_foto_produto": (dados_brutos.get("url_foto_produto") or "").strip(),
        "origem": dados_brutos.get("origem") or f"API {indice_provedor}",
        "provedor_indice": indice_provedor,
    }


def consultar_api_eanpictures_brasil(ean: str) -> Optional[Dict[str, Any]]:
    """API 1 (Primária): Base brasileira gratuita EAN Pictures."""
    url = f"http://www.eanpictures.com.br:9000/api/desc/{ean}"
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": "DoarEGuardar/2.0",
            "Accept": "application/json",
        },
        method="GET",
    )
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT_REQUISICAO_SEGUNDOS) as resp:
            dados = _ler_json(resp)
            if not isinstance(dados, dict):
                return None
            nome = (dados.get("Nome") or "").strip()
            status_api = str(dados.get("Status") or "").strip()
            if (
                status_api == "200"
                and nome
                and "nao encontrada" not in nome.lower()
                and "não encontrada" not in nome.lower()
            ):
                marca = (dados.get("Marca") or "").strip()
                categoria_raw = (dados.get("Categoria") or dados.get("Ncm") or "").strip()
                nome_formatado = nome.title() if nome.isupper() else nome
                marca_formatada = marca.title() if marca.isupper() else marca
                return {
                    "codigo_barra_produto": ean,
                    "nome_produto": nome_formatado,
                    "marca_produto": marca_formatada,
                    "categoria": inferir_categoria_alimento(nome_formatado, categoria_raw),
                    "unidade_medida_pacote": "pacotes",
                    "estoque_minimo_pacote": 10,
                    "url_foto_produto": f"https://wsrv.nl/?url=http://www.eanpictures.com.br:9000/api/gtin/{ean}&w=400&output=jpg",
                    "origem": "API 1 (EAN Pictures Brasil)",
                }
    except Exception:
        pass
    return None


def consultar_api_open_food_facts_brasil(ean: str) -> Optional[Dict[str, Any]]:
    """API 2 (Secundária): Base aberta Open Food Facts Brasil."""
    url = f"https://br.openfoodfacts.org/api/v2/product/{ean}.json"
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": "DoarEGuardar/2.0 - CasaDaCrianca",
            "Accept": "application/json",
        },
        method="GET",
    )
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT_REQUISICAO_SEGUNDOS) as resp:
            if resp.status == 200:
                dados = _ler_json(resp)
                if isinstance(dados, dict) and dados.get("status") == 1 and isinstance(dados.get("product"), dict):
                    prod = dados["product"]
                    nome = (
                        prod.get("product_name_pt")
                        or prod.get("product_name_br")
                        or prod.get("product_name")
                        or prod.get("generic_name_pt")
                        or prod.get("generic_name")
                        or ""
                    ).strip()
                    if nome:
                        marca = (prod.get("brands") or "").split(",")[0].strip()
                        foto = (
                            prod.get("image_front_url")
                            or prod.get("image_url")
                            or prod.get("image_front_small_url")
                            or ""
                        ).strip()
                        categorias_off = (prod.get("categories") or "").strip()
                        return {
                            "codigo_barra_produto": ean,
                            "nome_produto": nome,
                            "marca_produto": marca,
                            "categoria": inferir_categoria_alimento(nome, categorias_off),
                            "unidade_medida_pacote": "pacotes",
                            "estoque_minimo_pacote": 10,
                            "url_foto_produto": foto,
                            "origem": "API 2 (Open Food Facts Brasil)",
                        }
    except Exception:
        pass
    return None


def consultar_api_busca_unificada_brasil(ean: str) -> Optional[Dict[str, Any]]:
    """API 3 (Terciária): Busca Unificada Nacional / Catálogo Global OpenFoodFacts v0."""
    urls_terciarias = [
        f"https://api-produtos.seunegocionanuvem.com.br/api/{ean}",
        f"https://world.openfoodfacts.org/api/v0/product/{ean}.json",
    ]
    for url in urls_terciarias:
        req = urllib.request.Request(
            url,
            headers={
                "User-Agent": "DoarEGuardar/2.0",
                "Accept": "application/json",
            },
            method="GET",
        )
        try:
            with urllib.request.urlopen(req, timeout=TIMEOUT_REQUISICAO_SEGUNDOS) as resp:
                if resp.status == 200:
                    dados = _ler_json(resp)
                    if isinstance(dados, list) and dados:
                        dados = dados[0]
                    if isinstance(dados, dict):
                        # Formato Catálogo Nacional
                        nome = (dados.get("descricao") or dados.get("nome") or "").strip()
                        if nome:
                            nome_fmt = nome.title() if nome.isupper() else nome
                            marca_fmt = (dados.get("marca") or "").strip()
                            return {
                                "codigo_barra_produto": ean,
                                "nome_produto": nome_fmt,
                                "marca_produto": marca_fmt,
                                "categoria": inferir_categoria_alimento(nome_fmt, str(dados.get("categoria") or "")),
                                "unidade_medida_pacote": "pacotes",
                                "estoque_minimo_pacote": 10,
                                "url_foto_produto": (dados.get("imagem") or dados.get("foto") or "").strip(),
                                "origem": "API 3 (Busca Unificada Brasil)",
                            }
                        # Formato OpenFoodFacts Global v0
                        if dados.get("status") == 1 and isinstance(dados.get("product"), dict):
                            prod = dados["product"]
                            nome_off = (prod.get("product_name") or prod.get("generic_name") or "").strip()
                            if nome_off:
                                marca_off = (prod.get("brands") or "").split(",")[0].strip()
                                foto_off = (prod.get("image_front_url") or prod.get("image_url") or "").strip()
                                return {
                                    "codigo_barra_produto": ean,
                                    "nome_produto": nome_off,
                                    "marca_produto": marca_off,
                                    "categoria": inferir_categoria_alimento(nome_off, str(prod.get("categories") or "")),
                                    "unidade_medida_pacote": "pacotes",
                                    "estoque_minimo_pacote": 10,
                                    "url_foto_produto": foto_off,
                                    "origem": "API 3 (Busca Unificada Brasil)",
                                }
        except Exception:
            continue
    return None


def funcaoConsultarProdutoApisCascata(
    codigo_barras: str,
    provedores_customizados: Optional[List[Callable[[str], Optional[Dict[str, Any]]]]] = None,
) -> Dict[str, Any]:
    """Executa a busca sequencial nas 3 APIs gratuitas brasileiras com fallback manual."""
    if not funcaoValidarCodigoBarrasManual(codigo_barras):
        return {
            "sucesso": False,
            "status_code": 400,
            "permitir_cadastro_manual": False,
            "mensagem": "Formato de código de barras inválido. Deve conter entre 8 e 14 dígitos numéricos.",
        }

    codigo_limpo = codigo_barras.strip()
    provedores = provedores_customizados or [
        consultar_api_eanpictures_brasil,
        consultar_api_open_food_facts_brasil,
        consultar_api_busca_unificada_brasil,
    ]

    erros_rastreados: List[str] = []
    tentativas_detalhadas: List[Dict[str, Any]] = []

    for indice, provedor in enumerate(provedores, start=1):
        nome_api = f"API {indice}"
        try:
            dados = provedor(codigo_limpo)
            if dados and isinstance(dados, dict) and (dados.get("nome_produto") or "").strip():
                produto_normalizado = _normalizar_retorno_produto(codigo_limpo, dados, indice)
                tentativas_detalhadas.append(
                    {"api": nome_api, "status": "encontrado", "origem": produto_normalizado["origem"]}
                )
                return {
                    "sucesso": True,
                    "status_code": 200,
                    "provedor_utilizado": nome_api,
                    "dados_produto": produto_normalizado,
                    "tentativas": tentativas_detalhadas,
                }
            erros_rastreados.append(f"{nome_api}: Produto não encontrado no catálogo.")
            tentativas_detalhadas.append({"api": nome_api, "status": "nao_encontrado"})
        except Exception as excecao_api:
            erros_rastreados.append(
                f"{nome_api}: Indisponível ou falha de timeout ({str(excecao_api)})"
            )
            tentativas_detalhadas.append(
                {"api": nome_api, "status": "erro", "detalhe": str(excecao_api)}
            )

    return {
        "sucesso": False,
        "status_code": 404,
        "permitir_cadastro_manual": True,
        "erros": erros_rastreados,
        "tentativas": tentativas_detalhadas,
        "mensagem": "Produto não localizado nas 3 APIs em cascata. Prossiga com o preenchimento manual das informações.",
    }
