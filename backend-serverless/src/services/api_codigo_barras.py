# backend-serverless/src/services/api_codigo_barras.py
from typing import Dict, Any, List, Optional, Callable

def funcaoValidarCodigoBarrasManual(codigo_barras: str) -> bool:
    """
    Regra Tela 3.1: Valida se o código de barras informado manualmente ou
    capturado pela câmara possui formato numérico padrão (EAN-8 a EAN-14).
    """
    if not isinstance(codigo_barras, str):
        return False
    limpo = codigo_barras.strip()
    return limpo.isdigit() and 8 <= len(limpo) <= 14


def funcaoConsultarProdutoApisCascata(
    codigo_barras: str,
    provedores_customizados: Optional[List[Callable[[str], Optional[Dict[str, Any]]]]] = None
) -> Dict[str, Any]:
    """
    Regra Tela 3.1 / Seção 3.3 Fatec:
    Consulta dados cadastrais de produtos acionando até 3 APIs de código de barras em cascata.
    Se a primária falhar, aciona a secundária e, subsequentemente, a terciária.
    Caso as 3 falhem, retorna instrução para preenchimento manual no frontend.
    """
    if not funcaoValidarCodigoBarrasManual(codigo_barras):
        return {
            "sucesso": False,
            "status_code": 400,
            "mensagem": "Formato de código de barras inválido. Deve conter entre 8 e 14 dígitos numéricos."
        }

    # Provedores padrão de mercado mapeados para o inventário
    if provedores_customizados is None:
        provedores = [
            # API 1: Primária (Simulação Cosmos / Bluesoft)
            lambda ean: {
                "nome_produto": "Leite Integral UHT 1L",
                "marca_produto": "Líder",
                "unidade_medida_pacote": "pacotes",
                "estoque_minimo_pacote": 10,
                "origem": "API 1 (Primária)"
            } if ean == "7891000100103" else None,

            # API 2: Secundária (Simulação Open Food Facts)
            lambda ean: {
                "nome_produto": "Arroz Tipo 1 1kg",
                "marca_produto": "Camil",
                "unidade_medida_pacote": "pacotes",
                "estoque_minimo_pacote": 15,
                "origem": "API 2 (Secundária)"
            } if ean == "7896006711114" else None,

            # API 3: Terciária (Simulação Base Pública de Contingência)
            lambda ean: {
                "nome_produto": "Feijão Carioca 1kg",
                "marca_produto": "Kicaldo",
                "unidade_medida_pacote": "pacotes",
                "estoque_minimo_pacote": 12,
                "origem": "API 3 (Terciária)"
            } if ean == "7891234567890" else None,
        ]
    else:
        provedores = provedores_customizados

    erros_rastreados: List[str] = []

    for indice, provedor in enumerate(provedores, start=1):
        try:
            dados = provedor(codigo_barras)
            if dados:
                return {
                    "sucesso": True,
                    "status_code": 200,
                    "provedor_utilizado": f"API {indice}",
                    "dados_produto": dados
                }
            erros_rastreados.append(f"API {indice}: Produto não encontrado no catálogo.")
        except Exception as excecao_api:
            erros_rastreados.append(f"API {indice}: Indisponível ou falha de timeout ({str(excecao_api)})")

    # Caso as 3 APIs falhem ou o produto não exista em nenhuma delas
    return {
        "sucesso": False,
        "status_code": 404,
        "permitir_cadastro_manual": True,
        "erros": erros_rastreados,
        "mensagem": "Produto não localizado nas 3 APIs em cascata. Prossiga com o preenchimento manual das informações."
    }