"""Suíte de testes E2E (Appium 2) para o aplicativo Mobile Doar & Guardar (`app-mobile`).

Compatível com execução via PyTest:
    pytest -v -s app-mobile/e2e/test_app_mobile_appium.py

E também via execução direta Python:
    python app-mobile/e2e/test_app_mobile_appium.py
    python app-mobile/e2e/test_app_mobile_appium.py --help
"""

from __future__ import annotations

import argparse
import os
import sys
import time
from pathlib import Path
from typing import Any

import pytest

try:
    from appium import webdriver
    from appium.options.android import UiAutomator2Options
    from appium.options.ios import XCUITestOptions
    from appium.webdriver.common.appiumby import AppiumBy
    from selenium.common.exceptions import TimeoutException, WebDriverException
    from selenium.webdriver.common.actions import interaction
    from selenium.webdriver.common.actions.action_builder import ActionBuilder
    from selenium.webdriver.common.actions.pointer_input import PointerInput
    from selenium.webdriver.support import expected_conditions as EC
    from selenium.webdriver.support.ui import WebDriverWait

    APPIUM_DISPONIVEL = True
    ERRO_IMPORT_APPIUM = ""
except ImportError as exc:
    webdriver = None  # type: ignore[assignment]
    UiAutomator2Options = None  # type: ignore[assignment]
    XCUITestOptions = None  # type: ignore[assignment]
    AppiumBy = None  # type: ignore[assignment]
    TimeoutException = Exception  # type: ignore[assignment,misc]
    WebDriverException = Exception  # type: ignore[assignment,misc]
    APPIUM_DISPONIVEL = False
    ERRO_IMPORT_APPIUM = str(exc)

RAIZ_E2E = Path(__file__).resolve().parent
DIR_EVIDENCIAS_PADRAO = RAIZ_E2E / "evidencias"

EXPO_GO_PACKAGE_ANDROID = "host.exp.exponent"
EXPO_GO_ACTIVITY_ANDROID = "host.exp.exponent.experience.HomeActivity"
APP_PACKAGE_PADRAO = "com.danielcanivezo.appmobile"
APP_ACTIVITY_PADRAO = ".MainActivity"
BUNDLE_ID_PADRAO = "com.danielcanivezo.appmobile"


def ler_configuracao() -> dict[str, Any]:
    """Lê variáveis de ambiente do Appium usando defaults de `app-mobile/app.json`."""
    plataforma = os.getenv("APPIUM_PLATFORM", "android").strip().lower()
    if plataforma not in ("android", "ios"):
        raise ValueError(f"APPIUM_PLATFORM inválido: '{plataforma}'. Use 'android' ou 'ios'.")

    expo_url = os.getenv("APPIUM_EXPO_URL", "").strip()
    package_env = os.getenv("APPIUM_APP_PACKAGE", "").strip()
    activity_env = os.getenv("APPIUM_APP_ACTIVITY", "").strip()

    if expo_url and not package_env and plataforma == "android":
        app_package = EXPO_GO_PACKAGE_ANDROID
        app_activity = activity_env or EXPO_GO_ACTIVITY_ANDROID
    else:
        app_package = package_env or APP_PACKAGE_PADRAO
        app_activity = activity_env or APP_ACTIVITY_PADRAO

    return {
        "server_url": os.getenv("APPIUM_SERVER_URL", "http://127.0.0.1:4723").strip(),
        "platform": plataforma,
        "device_name": os.getenv(
            "APPIUM_DEVICE_NAME",
            "Android Emulator" if plataforma == "android" else "iPhone Simulator",
        ).strip(),
        "udid": os.getenv("APPIUM_UDID", "").strip(),
        "app_package": app_package,
        "app_activity": app_activity,
        "bundle_id": os.getenv("APPIUM_BUNDLE_ID", BUNDLE_ID_PADRAO).strip(),
        "app_path": os.getenv("APPIUM_APP_PATH", "").strip(),
        "expo_url": expo_url,
        "no_reset": os.getenv("APPIUM_NO_RESET", "true").strip().lower() not in ("0", "false", "no"),
        "timeout": int(os.getenv("APPIUM_TIMEOUT", "20")),
        "screenshot_dir": Path(os.getenv("APPIUM_SCREENSHOT_DIR", str(DIR_EVIDENCIAS_PADRAO))),
        "test_email": os.getenv("APP_TEST_EMAIL", "").strip(),
        "test_password": os.getenv("APP_TEST_PASSWORD", "").strip(),
    }


def _garantir_dependencias_appium() -> None:
    if APPIUM_DISPONIVEL:
        return
    msg = (
        "Dependências Appium/Selenium não instaladas "
        f"({ERRO_IMPORT_APPIUM}). Instale com: pip install -r app-mobile/e2e/requirements.txt"
    )
    if "pytest" in sys.modules:
        pytest.skip(msg)
    raise RuntimeError(msg)


def construir_opcoes_appium(cfg: dict[str, Any]) -> Any:
    """Constrói options W3C compatíveis com Appium 2 (UiAutomator2 / XCUITest)."""
    _garantir_dependencias_appium()

    if cfg["platform"] == "android":
        options = UiAutomator2Options()
        options.device_name = cfg["device_name"]
        options.automation_name = "UiAutomator2"
        options.no_reset = cfg["no_reset"]
        options.auto_grant_permissions = True
        options.new_command_timeout = 180
        if cfg["udid"]:
            options.udid = cfg["udid"]
        if cfg["app_path"]:
            options.app = cfg["app_path"]
        else:
            options.app_package = cfg["app_package"]
            options.app_activity = cfg["app_activity"]
        return options

    options = XCUITestOptions()
    options.device_name = cfg["device_name"]
    options.automation_name = "XCUITest"
    options.no_reset = cfg["no_reset"]
    options.auto_accept_alerts = True
    options.new_command_timeout = 180
    if cfg["udid"]:
        options.udid = cfg["udid"]
    if cfg["app_path"]:
        options.app = cfg["app_path"]
    else:
        options.bundle_id = cfg["bundle_id"]
    return options


def iniciar_driver(cfg: dict[str, Any]) -> Any:
    """Abre a sessão no servidor Appium 2 e carrega o link Expo Go se configurado."""
    _garantir_dependencias_appium()
    options = construir_opcoes_appium(cfg)
    driver_inst = webdriver.Remote(cfg["server_url"], options=options)
    driver_inst.implicitly_wait(0)

    if cfg["expo_url"]:
        if cfg["platform"] == "android":
            driver_inst.execute_script(
                "mobile: deepLink",
                {"url": cfg["expo_url"], "package": cfg["app_package"]},
            )
        else:
            driver_inst.get(cfg["expo_url"])
        time.sleep(3)

    return driver_inst


def _seletor_texto(plataforma: str, texto: str) -> tuple[str, str]:
    texto_escapado = texto.replace('"', '\\"')
    if plataforma == "android":
        return (
            AppiumBy.ANDROID_UIAUTOMATOR,
            f'new UiSelector().textContains("{texto_escapado}")',
        )
    return AppiumBy.IOS_PREDICATE, f'label CONTAINS "{texto_escapado}" OR name CONTAINS "{texto_escapado}"'


def _seletor_hint_ou_classe_input(plataforma: str, hint: str | None) -> tuple[str, str]:
    if plataforma == "android":
        if hint:
            hint_esc = hint.replace('"', '\\"')
            return AppiumBy.ANDROID_UIAUTOMATOR, f'new UiSelector().textContains("{hint_esc}").className("android.widget.EditText")'
        return AppiumBy.CLASS_NAME, "android.widget.EditText"
    if hint:
        hint_esc = hint.replace('"', '\\"')
        return AppiumBy.IOS_PREDICATE, f'(type == "XCUIElementTypeTextField" OR type == "XCUIElementTypeSecureTextField") AND (value CONTAINS "{hint_esc}" OR placeholderValue CONTAINS "{hint_esc}")'
    return AppiumBy.IOS_PREDICATE, 'type == "XCUIElementTypeTextField" OR type == "XCUIElementTypeSecureTextField"'


def aguardar_por_acessibilidade(driver: Any, label: str, timeout: int | None = None) -> Any:
    limite = timeout or ler_configuracao()["timeout"]
    return WebDriverWait(driver, limite).until(
        EC.presence_of_element_located((AppiumBy.ACCESSIBILITY_ID, label))
    )


def aguardar_por_texto(driver: Any, texto: str, timeout: int | None = None) -> Any:
    cfg = ler_configuracao()
    limite = timeout or cfg["timeout"]
    by, expr = _seletor_texto(cfg["platform"], texto)
    return WebDriverWait(driver, limite).until(EC.presence_of_element_located((by, expr)))


def elemento_visivel(driver: Any, by: str, valor: str, timeout: int = 3) -> bool:
    try:
        WebDriverWait(driver, timeout).until(EC.presence_of_element_located((by, valor)))
        return True
    except TimeoutException:
        return False


def tocar_por_acessibilidade(driver: Any, label: str, timeout: int | None = None) -> None:
    el = aguardar_por_acessibilidade(driver, label, timeout=timeout)
    el.click()


def tocar_por_texto(driver: Any, texto: str, timeout: int | None = None) -> None:
    el = aguardar_por_texto(driver, texto, timeout=timeout)
    el.click()


def preencher_input_por_hint_ou_indice(
    driver: Any,
    hint: str,
    valor: str,
    indice_fallback: int = 0,
    timeout: int = 8,
) -> None:
    cfg = ler_configuracao()
    by_hint, expr_hint = _seletor_hint_ou_classe_input(cfg["platform"], hint)
    try:
        campo = WebDriverWait(driver, timeout).until(EC.presence_of_element_located((by_hint, expr_hint)))
    except TimeoutException:
        by_cls, expr_cls = _seletor_hint_ou_classe_input(cfg["platform"], None)
        campos = WebDriverWait(driver, timeout).until(EC.presence_of_all_elements_located((by_cls, expr_cls)))
        campo = campos[indice_fallback]
    campo.click()
    campo.clear()
    campo.send_keys(valor)


def rolar_para_baixo(driver: Any, fator_inicio: float = 0.78, fator_fim: float = 0.25) -> None:
    """Desliza a tela usando W3C Actions (substituto moderno ao TouchAction)."""
    tamanho = driver.get_window_size()
    x = int(tamanho["width"] * 0.5)
    y_inicio = int(tamanho["height"] * fator_inicio)
    y_fim = int(tamanho["height"] * fator_fim)

    ponteiro = PointerInput(interaction.POINTER_TOUCH, "finger")
    acoes = ActionBuilder(driver, mouse=ponteiro)
    acoes.pointer_action.move_to_location(x, y_inicio)
    acoes.pointer_action.pointer_down()
    acoes.pointer_action.pause(0.15)
    acoes.pointer_action.move_to_location(x, y_fim)
    acoes.pointer_action.release()
    acoes.perform()


def salvar_evidencia(driver: Any, nome_arquivo: str) -> Path:
    cfg = ler_configuracao()
    destino = cfg["screenshot_dir"]
    destino.mkdir(parents=True, exist_ok=True)
    caminho = destino / nome_arquivo
    driver.save_screenshot(str(caminho))
    return caminho


def dispensar_alerta_se_visivel(driver: Any, texto_botao: str = "OK", timeout: int = 4) -> bool:
    cfg = ler_configuracao()
    by, expr = _seletor_texto(cfg["platform"], texto_botao)
    if elemento_visivel(driver, by, expr, timeout=timeout):
        driver.find_element(by, expr).click()
        return True
    return False


def voltar_tela(driver: Any) -> None:
    """Volta para a tela anterior testando labels conhecidos do app e fallback nativo."""
    for label in ("Voltar para a tela anterior", "Voltar para tela anterior", "Voltar para Configurações"):
        if elemento_visivel(driver, AppiumBy.ACCESSIBILITY_ID, label, timeout=2):
            driver.find_element(AppiumBy.ACCESSIBILITY_ID, label).click()
            return
    cfg = ler_configuracao()
    by, expr = _seletor_texto(cfg["platform"], "Voltar")
    if elemento_visivel(driver, by, expr, timeout=2):
        driver.find_element(by, expr).click()
        return
    driver.back()


def _executar_login_credenciais(driver: Any, email: str, senha: str) -> None:
    preencher_input_por_hint_ou_indice(driver, "exemplo@casadacrianca.org.br", email, indice_fallback=0)
    preencher_input_por_hint_ou_indice(driver, "Digite sua senha", senha, indice_fallback=1)
    tocar_por_acessibilidade(driver, "Entrar no aplicativo")
    aguardar_por_acessibilidade(driver, "Abrir meu perfil", timeout=25)


def garantir_autenticado(driver: Any) -> None:
    """Garante que a sessão atual está na Home autenticada antes dos testes protegidos."""
    if elemento_visivel(driver, AppiumBy.ACCESSIBILITY_ID, "Abrir meu perfil", timeout=4):
        return

    cfg = ler_configuracao()
    if elemento_visivel(driver, AppiumBy.ACCESSIBILITY_ID, "Entrar no aplicativo", timeout=4):
        if cfg["test_email"] and cfg["test_password"]:
            _executar_login_credenciais(driver, cfg["test_email"], cfg["test_password"])
            return
        pytest.skip(
            "App está na tela de login. Defina APP_TEST_EMAIL e APP_TEST_PASSWORD "
            "(ou autentique previamente no aparelho com APPIUM_NO_RESET=true)."
        )


@pytest.fixture(scope="module")
def driver() -> Any:
    """Fixture de ciclo de vida da sessão Appium compartilhada pela suíte E2E."""
    cfg = ler_configuracao()
    _garantir_dependencias_appium()
    try:
        drv = iniciar_driver(cfg)
    except WebDriverException as exc:
        pytest.skip(f"Servidor Appium ou dispositivo indisponível ({cfg['server_url']}): {exc}")
        return

    try:
        yield drv
    finally:
        drv.quit()


def test_01_tela_login_e_validacao_campos_vazios(driver: Any) -> None:
    """Valida botões de autenticação e alerta de campos obrigatórios na tela inicial (`index.tsx`)."""
    if elemento_visivel(driver, AppiumBy.ACCESSIBILITY_ID, "Abrir meu perfil", timeout=4):
        pytest.skip("Sessão já autenticada no dispositivo (`APPIUM_NO_RESET=true`); validação de login ignorada.")

    aguardar_por_acessibilidade(driver, "Fazer login com o Google")
    aguardar_por_acessibilidade(driver, "Entrar no aplicativo")

    tocar_por_acessibilidade(driver, "Entrar no aplicativo")
    aguardar_por_texto(driver, "Atenção", timeout=8)
    salvar_evidencia(driver, "01_login.png")
    dispensar_alerta_se_visivel(driver, "OK")

    cfg = ler_configuracao()
    if cfg["test_email"] and cfg["test_password"]:
        _executar_login_credenciais(driver, cfg["test_email"], cfg["test_password"])


def test_02_home_estoque_e_barra_navegacao(driver: Any) -> None:
    """Valida a tela inicial (`home.tsx`) e todos os itens da `BottomNavBar`."""
    garantir_autenticado(driver)

    aguardar_por_acessibilidade(driver, "Abrir meu perfil")
    aguardar_por_texto(driver, "Total de produtos atualmente no estoque")

    for item in ("Início", "Estoque", "Dora", "Avisos", "Abrir mais opções do menu"):
        aguardar_por_acessibilidade(driver, item)

    salvar_evidencia(driver, "02_home_estoque.png")


def test_03_modulo_estoque_entrada_e_saida(driver: Any) -> None:
    """Valida navegação do menu Estoque para Entrada (`stock-add`) e Saída (`stock-remove`)."""
    garantir_autenticado(driver)

    tocar_por_acessibilidade(driver, "Estoque")
    aguardar_por_texto(driver, "Gerenciamento de Estoque")
    salvar_evidencia(driver, "03_menu_estoque.png")

    tocar_por_texto(driver, "Entrada de Alimentos")
    aguardar_por_acessibilidade(driver, "Escanear código de barras usando a câmera")
    salvar_evidencia(driver, "04_estoque_entrada.png")
    voltar_tela(driver)

    aguardar_por_texto(driver, "Gerenciamento de Estoque")
    tocar_por_texto(driver, "Saída / Baixa")
    aguardar_por_acessibilidade(driver, "Escanear código de barras para dar saída")
    salvar_evidencia(driver, "05_estoque_saida.png")
    voltar_tela(driver)


def test_04_assistente_dora_chat_e_modal_video(driver: Any) -> None:
    """Valida abertura do modal audiovisual Sobre a Dora e pergunta de validade FEFO no chat."""
    garantir_autenticado(driver)

    tocar_por_acessibilidade(driver, "Dora")
    tocar_por_acessibilidade(driver, "Ver informações sobre a Dora")
    aguardar_por_texto(driver, "Oi! Eu sou a Dora")
    salvar_evidencia(driver, "06_dora_sobre_video.png")
    tocar_por_acessibilidade(driver, "Fechar apresentação da Dora")

    preencher_input_por_hint_ou_indice(
        driver,
        "Mensagem para a Dora...",
        "O que vence primeiro?",
        indice_fallback=0,
    )
    tocar_por_acessibilidade(driver, "Enviar mensagem para a Dora")
    aguardar_por_texto(driver, "Validades", timeout=15)
    salvar_evidencia(driver, "07_dora_chat_resposta.png")


def test_05_menu_mais_auditoria_e_diagnostico(driver: Any) -> None:
    """Valida acesso ao Histórico/Auditoria (`audit.tsx`) e Status do App (`diagnostic.tsx`)."""
    garantir_autenticado(driver)

    tocar_por_acessibilidade(driver, "Abrir mais opções do menu")
    tocar_por_acessibilidade(driver, "Histórico")
    aguardar_por_texto(driver, "Saúde da Despensa")
    aguardar_por_acessibilidade(driver, "Conferir Prateleira")
    salvar_evidencia(driver, "08_auditoria_historico.png")

    tocar_por_acessibilidade(driver, "Abrir mais opções do menu")
    tocar_por_acessibilidade(driver, "Status do App")
    aguardar_por_texto(driver, "Conexão com a Internet e Sistema")
    salvar_evidencia(driver, "09_diagnostico_status.png")


def test_06_acessibilidade_wcag_contraste_e_fonte(driver: Any) -> None:
    """Valida alternância de fonte (150%), alto contraste e modo escuro em `accessibility.tsx`."""
    garantir_autenticado(driver)

    tocar_por_acessibilidade(driver, "Início")
    tocar_por_acessibilidade(driver, "Abrir meu perfil")
    tocar_por_acessibilidade(driver, "Alterar Preferências e Acessibilidade")
    aguardar_por_texto(driver, "Acessibilidade e Leitura")

    tocar_por_acessibilidade(driver, "Tamanho da fonte Extra (150%)")
    tocar_por_acessibilidade(driver, "Ativar Alto Contraste (Letras Mais Fortes)")
    salvar_evidencia(driver, "10_acessibilidade_alto_contraste_150.png")

    tocar_por_acessibilidade(driver, "Ativar Modo Escuro (Descanso para os Olhos)")
    salvar_evidencia(driver, "11_acessibilidade_modo_escuro.png")

    # Restaura padrões para não impactar sessões posteriores do usuário
    tocar_por_acessibilidade(driver, "Tamanho da fonte Normal (100%)")
    tocar_por_acessibilidade(driver, "Ativar Modo Claro Padrão (Azul e Verde)")
    rolar_para_baixo(driver)
    tocar_por_acessibilidade(driver, "Salvar e Voltar")
    dispensar_alerta_se_visivel(driver, "Concluir", timeout=8)


def _executar_via_cli() -> int:
    parser = argparse.ArgumentParser(
        description="Executa os testes E2E em Appium 2 para o app mobile Doar & Guardar."
    )
    parser.add_argument(
        "--check-config",
        action="store_true",
        help="Exibe a configuração efetiva lida das variáveis de ambiente sem abrir sessão.",
    )
    args, pytest_args = parser.parse_known_args()

    cfg = ler_configuracao()
    if args.check_config:
        cfg_seguro = {
            **cfg,
            "screenshot_dir": str(cfg["screenshot_dir"]),
            "test_password": "***" if cfg["test_password"] else "",
        }
        print("Configuração Appium E2E:", cfg_seguro)
        return 0

    _garantir_dependencias_appium()
    return int(pytest.main(["-v", "-s", str(Path(__file__).resolve()), *pytest_args]))


if __name__ == "__main__":
    sys.exit(_executar_via_cli())
