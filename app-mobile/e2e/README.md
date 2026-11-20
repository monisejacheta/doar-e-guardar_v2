# Testes E2E Mobile com Appium 2 (Python)

Suíte automatizada ponta a ponta para o aplicativo **Doar & Guardar** (`app-mobile`) usando **Appium 2** + **PyTest**, validando os fluxos principais com os seletores de acessibilidade (`accessibilityLabel`) reais do projeto:

1. **Login e validação de campos obrigatórios** (`index.tsx`)
2. **Home, resumo de estoque e barra inferior `BottomNavBar`** (`home.tsx`)
3. **Módulo de Estoque: Entrada e Saída / Baixa** (`stock.tsx`, `stock-add.tsx`, `stock-remove.tsx`)
4. **Assistente Dora: modal audiovisual e chat FEFO** (`dora.tsx`, `DoraAboutModal.tsx`)
5. **Menu Mais: Auditoria/Histórico e Status do App** (`audit.tsx`, `diagnostic.tsx`)
6. **Acessibilidade WCAG: Fonte 150%, Alto Contraste e Modo Escuro** (`accessibility.tsx`)

---

## Pré-requisitos

1. **Node.js (LTS)** e **Appium 2** instalados globalmente:
   ```bash
   npm install -g appium
   appium driver install uiautomator2
   # Em macOS para iOS:
   # appium driver install xcuitest
   ```
2. **Android SDK / `adb`** configurado no `PATH`, com um dispositivo físico (Depuração USB) ou emulador conectado (`adb devices`).
3. **Python 3.10+** com as dependências da suíte:
   ```bash
   pip install -r app-mobile/e2e/requirements.txt
   ```

---

## Como Executar

### 1. Subir o servidor Appium 2

```bash
appium --address 127.0.0.1 --port 4723
```

### 2. Executar os testes

**Contra o APK / aplicativo instalado (`com.danielcanivezo.appmobile`):**

```powershell
# Opcional: informe credenciais válidas para login automático caso o app não esteja autenticado
$env:APP_TEST_EMAIL="casadacrianca@adm"
$env:APP_TEST_PASSWORD="SUA_SENHA_DE_TESTE"

pytest -v -s app-mobile/e2e/test_app_mobile_appium.py
```

**Ou via Expo Go em rede local (`APPIUM_EXPO_URL`):**

```powershell
# Em outro terminal, inicie o bundler em app-mobile/: npx expo start
$env:APPIUM_EXPO_URL="exp://SEU_IP_LOCAL:8081"
python app-mobile/e2e/test_app_mobile_appium.py
```

---

## Variáveis de Ambiente Suportadas

| Variável | Padrão | Descrição |
| :--- | :--- | :--- |
| `APPIUM_SERVER_URL` | `http://127.0.0.1:4723` | URL do servidor Appium 2 |
| `APPIUM_PLATFORM` | `android` | Plataforma alvo (`android` ou `ios`) |
| `APPIUM_DEVICE_NAME` | `Android Emulator` | Nome do dispositivo/emulador |
| `APPIUM_UDID` | *(vazio)* | Serial do dispositivo (`adb devices`) |
| `APPIUM_APP_PACKAGE` | `com.danielcanivezo.appmobile` | Pacote Android (ou `host.exp.exponent` automático com `APPIUM_EXPO_URL`) |
| `APPIUM_APP_ACTIVITY` | `.MainActivity` | Activity inicial Android |
| `APPIUM_BUNDLE_ID` | `com.danielcanivezo.appmobile` | Bundle Identifier iOS |
| `APPIUM_APP_PATH` | *(vazio)* | Caminho opcional para instalar um `.apk` ou `.ipa` |
| `APPIUM_EXPO_URL` | *(vazio)* | Deep link do servidor Expo Metro (ex.: `exp://192.168.0.10:8081`) |
| `APPIUM_NO_RESET` | `true` | Preserva sessão e dados do app entre execuções |
| `APPIUM_TIMEOUT` | `20` | Timeout padrão (em segundos) para esperas explícitas |
| `APPIUM_SCREENSHOT_DIR` | `app-mobile/e2e/evidencias` | Pasta onde as capturas `.png` são gravadas |
| `APP_TEST_EMAIL` | *(vazio)* | E-mail de teste para login automático, se necessário |
| `APP_TEST_PASSWORD` | *(vazio)* | Senha de teste para login automático, se necessário |

---

## Evidências Geradas

Ao final da execução, as capturas de tela (`01_login.png` até `11_acessibilidade_modo_escuro.png`) são salvas automaticamente em `app-mobile/e2e/evidencias/`, prontas para anexação no relatório de testes.
