# backend-serverless/src/services/mensageria.py
"""
Serviço de Mensageria e Comunicação com Doadores em Conformidade com a LGPD (Tela W13).
Garante envio estrito para destinatários com opt-in ativo e rodapé obrigatório de opt-out.
"""
from typing import Dict, Any, List

RODAPE_LGPD_OBRIGATORIO = (
    "Mensagem enviada com base no seu consentimento (LGPD). "
    "Para cancelar o recebimento, responda 'SAIR' ou acesse o seu perfil web."
)


def funcaoFiltrarDestinatariosOptIn(doadores: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Retorna apenas doadores que possuem consentimento explícito (opt_in_ativo=True)."""
    return [d for d in doadores if d.get("opt_in_ativo") is True]


def funcaoFormatarMensagemComOptOut(corpo_mensagem: str) -> str:
    """Anexa o aviso legal de descadastramento (opt-out) caso ainda não conste na mensagem."""
    texto = (corpo_mensagem or "").strip()
    if "SAIR" not in texto.upper() and "LGPD" not in texto.upper():
        return f"{texto}\n\n{RODAPE_LGPD_OBRIGATORIO}"
    return texto


def funcaoDispararComunicadoLgpd(
    doadores: List[Dict[str, Any]],
    mensagem: str,
    canal: str = "todos",
) -> Dict[str, Any]:
    if not (mensagem or "").strip():
        return {
            "sucesso": False,
            "status_code": 400,
            "mensagem": "O conteúdo da mensagem não pode estar vazio.",
        }

    destinatarios_aptos = funcaoFiltrarDestinatariosOptIn(doadores)
    mensagem_final = funcaoFormatarMensagemComOptOut(mensagem)

    return {
        "sucesso": True,
        "status_code": 200,
        "canal": canal,
        "total_enviados": len(destinatarios_aptos),
        "total_bloqueados_lgpd": len(doadores) - len(destinatarios_aptos),
        "mensagem_formatada": mensagem_final,
    }
