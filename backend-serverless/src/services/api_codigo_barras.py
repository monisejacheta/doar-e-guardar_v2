# backend-serverless/src/services/api_codigo_barras.py
"""
Serviço de Barramento em Cascata com 3 APIs Brasileiras Gratuitas (EAN/GTIN).
1. API 1 (Primária): EAN Pictures Brasil (eanpictures.com.br)
2. API 2 (Secundária): Open Food Facts Brasil (br.openfoodfacts.org)
3. API 3 (Terciária): Busca Unificada Brasil / Catálogo MLB
"""

import json
import gzip
import urllib.request
from typing import Dict, Any, List, Optional, Callable

TIMEOUT_REQUISICAO_SEGUNDOS = 3.5
FOTO_PLACEHOLDER_PADRAO = (
    "https://images.unsplash.com/photo-1584473457406-6240486418e9?auto=format&fit=crop&w=400&q=80"
)


def funcaoValidarCodigoBarrasManual(codigo_barras: str) -> bool:
    """Valida se o código de barras possui entre 8 e 14 dígitos numéricos."""
    if not isinstance(codigo_barras, str):
        return False
    limpo = codigo_barras.strip()
    return limpo.isdigit() and 8 <= len(limpo) <= 14


def _ler_json(resp) -> Dict[str, Any]:
    bruto = resp.read()
    if bruto.startswith(b"\x1f\x8b") or resp.headers.get("Content-Encoding") == "gzip":
        bruto = gzip.decompress(bruto)
    try:
        return json.loads(bruto.decode("utf-8"))
    except UnicodeDecodeError:
        return json.loads(bruto.decode("latin-1", errors="ignore"))


def consultar_api_eanpictures_brasil(ean: str) -> Optional[Dict[str, Any]]:
    """API 1 (Primária): Base brasileira gratuita EAN Pictures."""
    url = f"http://www.eanpictures.com.br:9000/api/desc/{ean}"
    req = urllib.request.Request(url, headers={"User-Agent": "DoarEGuardar/2.0"}, method="GET")
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT_REQUISICAO_SEGUNDOS) as resp:
            dados = _ler_json(resp)
            nome = (dados.get("Nome") or "").strip()
            if str(dados.get("Status")) == "200" and nome and "nao encontrada" not in nome.lower():
                marca = (dados.get("Marca") or "").strip()
                return {
                    "nome_produto": nome.title() if nome.isupper() else nome,
                    "marca_produto": marca.title() if marca.isupper() else marca,
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
    req = urllib.request.Request(url, headers={"User-Agent": "DoarEGuardar/2.0"}, method="GET")
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT_REQUISICAO_SEGUNDOS) as resp:
            if resp.status == 200:
                dados = _ler_json(resp)
                if dados.get("status") == 1 and "product" in dados:
                    prod = dados["product"]
                    nome = prod.get("product_name_pt") or prod.get("product_name")
                    if nome:
                        marca = (prod.get("brands") or "").split(",")[0].strip()
                        foto = prod.get("image_front_url") or prod.get("image_url") or FOTO_PLACEHOLDER_PADRAO
                        return {
                            "nome_produto": nome.strip(),
                            "marca_produto": marca,
                            "unidade_medida_pacote": "pacotes",
                            "estoque_minimo_pacote": 10,
                            "url_foto_produto": foto,
                            "origem": "API 2 (Open Food Facts Brasil)",
                        }
    except Exception:
        pass
    return None


def consultar_api_busca_unificada_brasil(ean: str) -> Optional[Dict[str, Any]]:
    """API 3 (Terciária): Busca Unificada Nacional / Catálogo MLB."""
    url = f"https://api-produtos.seunegocionanuvem.com.br/api/{ean}"
    req = urllib.request.Request(url, headers={"User-Agent": "DoarEGuardar/2.0"}, method="GET")
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT_REQUISICAO_SEGUNDOS) as resp:
            if resp.status == 200:
                dados = _ler_json(resp)
                if isinstance(dados, list) and dados:
                    dados = dados[0]
                if isinstance(dados, dict):
                    nome = (dados.get("descricao") or dados.get("nome") or "").strip()
                    if nome:
                        return {
                            "nome_produto": nome.title() if nome.isupper() else nome,
                            "marca_produto": (dados.get("marca") or "").strip(),
                            "unidade_medida_pacote": "pacotes",
                            "estoque_minimo_pacote": 10,
                            "url_foto_produto": dados.get("imagem") or FOTO_PLACEHOLDER_PADRAO,
                            "origem": "API 3 (Busca Unificada Brasil)",
                        }
    except Exception:
        pass
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
            "mensagem": "Formato de código de barras inválido. Deve conter entre 8 e 14 dígitos numéricos.",
        }

    codigo_limpo = codigo_barras.strip()
    provedores = provedores_customizados or [
        consultar_api_eanpictures_brasil,
        consultar_api_open_food_facts_brasil,
        consultar_api_busca_unificada_brasil,
    ]

    erros_rastreados: List[str] = []

    for indice, provedor in enumerate(provedores, start=1):
        try:
            dados = provedor(codigo_limpo)
            if dados and isinstance(dados, dict):
                return {
                    "sucesso": True,
                    "status_code": 200,
                    "provedor_utilizado": f"API {indice}",
                    "dados_produto": dados,
                }
            erros_rastreados.append(f"API {indice}: Produto não encontrado no catálogo.")
        except Exception as excecao_api:
            erros_rastreados.append(f"API {indice}: Indisponível ou falha de timeout ({str(excecao_api)})")

    return {
        "sucesso": False,
        "status_code": 404,
        "permitir_cadastro_manual": True,
        "erros": erros_rastreados,
        "mensagem": "Produto não localizado nas 3 APIs em cascata. Prossiga com o preenchimento manual das informações.",
    }