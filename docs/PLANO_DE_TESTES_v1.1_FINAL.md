# PLANO E EXECUÇÃO DE TESTE DE SOFTWARE

**FATEC ITAPIRA — DR. OGARI DE CASTRO PACHECO**  
**CURSO SUPERIOR DE TECNOLOGIA EM DESENVOLVIMENTO DE SOFTWARE MULTIPLATAFORMA (DSM)**  
**WORKSHOP DE APRESENTAÇÃO DOS PROJETOS INTERDISCIPLINARES (PI)**  
*Modelo Oficial Fatec Itapira 2026 — Qualidade e Teste de Software*

| Campo | Informação |
| :--- | :--- |
| **Nome do Sistema / Projeto:** | Doar&Guardar |
| **Módulo do PI:** | PI- SEMESTRE VI |
| **Grupo / Equipe:** | Equipe Doar&Guardar |
| **Autores / Integrantes:** | Daniel Canivezo Soares<br>Fabricio de Paula do Carmo<br>Juliano Mancini<br>Laura Nadiani Cirino Brianti<br>Monise Leite Jacheta |
| **Professor Orientador:** | Prof. Me. Reginaldo Donizeti Cândido |
| **Disciplina:** | Qualidade e Teste de Software (IQS004) |
| **Data da Release / Entrega:** | 20 / 11 / 2026 — Versão 1.1 Final |

---

## Histórico das Alterações do Documento

Registre nesta tabela a evolução das versões deste plano de testes ao longo das iterações do semestre:

| Data | Versão | Descrição da Alteração | Autor(a) |
| :--- | :--- | :--- | :--- |
| 06/05/2026 | 0.1 | Release inicial e estruturação do plano de testes | Reginaldo Cândido |
| 06/05/2026 | 0.2 | Implementação de requisitos e cronograma de testes | Monise Leite Jacheta |
| 19/10/2026 | 0.3 | Definição das baterias de testes e casos de uso | Monise Leite Jacheta |
| 11/11/2026 | 0.4 | Atualização com o progresso atual do projeto, testes PyTest (30/30 e 44/44), evidências Postman AWS (5/5) e análise estática Mobile | Equipe Doar&Guardar |
| 17/11/2026 | 1.0 | Previsão de execução final (Jest/RNTL, Artillery, Appium, TalkBack/VoiceOver), registro complementar e Teste Beta | Equipe Doar&Guardar |
| 20/11/2026 | 1.1 | Execução completa das suítes automatizadas locais nos módulos Backend Serverless (PyTest 34/34 + benchmark HTTP concorrente 150 req.), Mobile (Jest + RNTL 25/25 suítes, 73/73 testes, **85,67% Statements / 87,29% Lines**, `tsc` em produção = 0 erros, ESLint 23 achados pré-existentes) e Portal Web (Jest 9/9 suítes, 35/35 testes, **92,49% Statements / 95,23% Lines**, 14 HTMLs, WCAG/CSS/LGPD), consolidando status honesto do que permanece manual/externo e guia de evidências para o `.docx`. | Equipe Doar&Guardar |

---

## 1 – Introdução

Este documento descreve os requisitos a testar, os tipos de testes definidos para cada iteração do projeto, os recursos de hardware e software a serem empregados e o cronograma de testes ao longo do desenvolvimento. As seções referentes aos requisitos, recursos e cronograma servem para permitir ao gerente de projeto e aos professores acompanhar de forma objetiva a evolução da qualidade do software.

**Objetivos Principais deste Documento:**
- Identificar as informações do projeto e os componentes de software que devem ser testados.
- Listar rigorosamente os Requisitos Funcionais (RF) e Não-Funcionais (RNF) a testar.
- Recomendar e descrever as estratégias e tipos de testes a serem empregados (Caixa Branca e Caixa Preta).
- Identificar os recursos de hardware, software e ferramentas de automação necessários.
- Prover uma estimativa realista dos esforços, prazos e cronograma de execução dos testes.
- Registrar as evidências reais (prints, logs e relatórios) dos resultados obtidos.

---

## 2 – Requisitos a Testar

Esta seção mapeia os casos de uso e requisitos não-funcionais identificados como objetos de teste no projeto. Preencha as tabelas abaixo relacionando as funcionalidades que serão submetidas às baterias de testes:

### 2.1 – Casos de Uso e Requisitos Funcionais (RF)

| ID | Nome do Caso de Uso / Requisito Funcional | Prioridade | Status do Teste |
| :--- | :--- | :--- | :--- |
| **RF01** | **RF1 — Módulos da plataforma** | Alta | `[ X ] Pendente [ ] Aprovado [ ] Reprovado`<br>**Parcialmente Aprovado (20/11/2026):** Backend Serverless validado via PyTest (34/34 testes; 7 rotas HTTP em `server_local.py` + Postman AWS 5/5). Mobile validado com 0 erros TypeScript em produção e 25/25 suítes Jest+RNTL aprovadas (73/73 testes, 85,67% stmts). Portal Web validado com 9/9 suítes Jest aprovadas (35/35 testes, 92,49% stmts) cobrindo 14 páginas HTML e 17 módulos JS. Pendente automação E2E física (Appium) e inspeção manual cross-browser (Chrome/Edge/Firefox). |
| **RF02** | **RF2 — Autenticação e Perfis** | Alta | `[ ] Pendente [ X ] Aprovado [ ] Reprovado`<br>**Aprovado em Unidade, Integração HTTP Local e Fluxos Mockados (20/11/2026):** Backend (`test_diagnostico.py` + `test_integracao_http_carga.py`) validou bloqueio de token simulado (HTTP 401), credenciais inválidas (HTTP 401), corpo inválido (HTTP 400) e login administrativo (HTTP 200). Mobile (`authService.test.ts` + `auth.test.tsx`) validou JWT Base64URL, deep link/popup Google, fallback modal e login `casadacrianca@adm`. Web (`auth.test.js` + `admin.js`) validou `casadacrianca@adm`, Firebase Google Popup + `tb_sessoesUsuarios`, logout e guarda de sessão `dg_sessao_admin`. |
| **RF03** | **RF3 — Gestão de Estoque e Armazenamento (CRUD)** | Média | `[ ] Pendente [ X ] Aprovado [ ] Reprovado`<br>**Aprovado (20/11/2026):** Coberto integralmente no Backend (PyTest `test_estoque.py` + `test_movimentacao.py` + `test_integracao_http_carga.py` HTTP 201/200/422/403/409 + Postman AWS 5/5: Consultar Estoque, Saída, Perda e Ajustar Estoque 200 OK), no Mobile (`stock.test.tsx` + `settings.test.tsx` + `storageLocations.test.ts` + `categoriesService.test.ts`: cascata EAN, bloqueio vencido, FEFO, trava `'PERDA'`, divisão de lote, normalização e bloqueio de prateleira em uso) e no Portal Web (`admin-consulta-avancada.js`, `admin-locais.js`, `estoque-publico.js`, `donor-estoque.js`). |
| **RF04** | **RF4 — Campanhas de Arrecadação** | Alta | `[ X ] Pendente [ ] Aprovado [ ] Reprovado`<br>**Parcialmente Aprovado (20/11/2026):** Regra de moderação com parecer obrigatório na reprovação aprovada no Backend (`test_diagnostico.py`), criação/detalhamento de campanhas coberto no Mobile (`settings-campaigns.tsx` em `settings.test.tsx`) e ciclos completos de moderação/baixa/proposta aprovados no Portal Web (`admin-campanhas.js`, `donor-campanhas.js`, `donor-minhas-campanhas.js`, `index-publico.js`). Pendente captura E2E em aparelho físico (Appium) e envio via Postman para `/api/configuracoes` em produção. |
| **RF05** | **RF5 — Mensageria e Notificações Externas** | Alta | `[ X ] Pendente [ ] Aprovado [ ] Reprovado`<br>**Parcialmente Aprovado (20/11/2026):** Filtro Opt-In e rodapé obrigatório LGPD (`SAIR`) aprovados no PyTest; preferência Opt-In WhatsApp do doador coberta em `donor-configuracoes.js`; central de alertas/filtros/dispensa e configuração de avisos aprovadas no Mobile (`notifications.test.tsx`). Pendente validação de disparo externo real (API WhatsApp / SMTP em produção) e existência formal de testes em dispositivo (E2E). |
| **RF06** | **RF6 — Relatórios Consolidados e Gráficos** | Alta | `[ X ] Pendente [ ] Aprovado [ ] Reprovado`<br>**Parcialmente Aprovado (20/11/2026):** Backend validou envio de relatório por e-mail via `/api/relatorios` e movimentações no Postman AWS (`200 OK`). Mobile aprovou `reports.tsx` (gráfico SVG), `reports-stock.tsx`, `reports-expiry.tsx`, `reports-losses.tsx` e `reports-movements.tsx` (`reports.test.tsx`). Portal Web aprovou `admin-relatorios.js` (95,66% stmts / 97,30% lines) com gráficos mockados `Chart.js`, 10 visões, modais CRUD/WhatsApp, exportação CSV (`URL.createObjectURL`) e exportação PDF (`html2pdf` mockado + fallback `window.print`). Pendente execução de carga Artillery contra a AWS em produção e exportação PDF visual em navegador real. |
| **RF07** | **RF7 — Assistente Inteligente (Dora)** | Alta | `[ X ] Pendente [ ] Aprovado [ ] Reprovado`<br>**Parcialmente Aprovado (20/11/2026):** Backend validou classificação de intenções, receita FEFO e predição de consumo em `test_diagnostico.py` + rota HTTP `POST /api/dora` em `test_integracao_http_carga.py`. Mobile aprovou 100% de `doraService.test.ts` (95,27% stmts / 96,74% lines / 100% funções), `dora-components.test.tsx` (incluindo `DoraAboutModal` com vídeo `DoraGreeting.mp4` 100% coberto) e `dora.test.tsx`. Pendente Postman `/api/dora` em produção AWS, teste de carga Artillery e Teste Beta com usuários reais. |
| **RF08** | **RF8 — Auditoria de Rastreabilidade** | Alta | `[ ] Pendente [ X ] Aprovado [ ] Reprovado`<br>**Aprovado (20/11/2026):** Ciclo auditado e rollback transacional aprovados no PyTest (`test_movimentacao.py`, `test_estoque.py`, `test_integracao_http_carga.py`), endpoints AWS `Consultar Movimentacoes` e `Ajustar Estoque` (`200 OK`) aprovados no Postman, conferência de prateleira com ajuste físico e exportação aprovadas no Mobile (`audit.test.tsx`) e relatório `LOGS_AUDITORIA` / ajuste em lote aprovados no Portal Web (`admin-consulta-avancada.js` + `admin-relatorios.js`). |

---

### 2.2 – Requisitos Não-Funcionais (RNF)

| ID | Nome do Requisito Não-Funcional | Tipo / Categoria | Critério de Aceitação Esperado e Status Atual |
| :--- | :--- | :--- | :--- |
| **RNF01** | **RNF1 — Arquitetura de Backend** | Desempenho / Arquitetura | **Critério:** 95% das requisições devem ser processadas em menos de 2 segundos, sob condições normais de uso.<br>**Status atual (20/11/2026): Parcial** — *(1) Homologação AWS (Postman 10/11/2026):* 5/5 requisições à AWS Lambda executadas abaixo de 1,2 s (média 461 ms; máx. 1184 ms em Consultar Estoque). *(2) Benchmark HTTP concorrente local (`test_integracao_http_carga.py`, 20/11/2026):* 150 requisições simultâneas com 25 threads no `server_local.py`, **0 erros**, throughput **207,8 req/s**, duração **0,722 s**, latência média **81,37 ms**, **p50 17,63 ms**, **p95 518,01 ms** (bem abaixo de 2.000 ms), p99 527,28 ms, max 533,23 ms. Pendente execução real do script criado (`backend-serverless/tests/artillery-load.yml`) contra o endpoint AWS de produção (p95/p99 em rede pública). |
| **RNF02** | **RNF2 — Front End Mobile e Web** | Compatibilidade / Responsividade | **Critério:** A interface deve funcionar corretamente em navegadores modernos e em dispositivos móveis, adaptando-se a diferentes tamanhos de tela.<br>**Status atual (20/11/2026): Parcial** — *(1) Mobile:* código de produção sem erros TypeScript; ESLint reportou 23 problemas pré-existentes no código-fonte (11 erros `react-hooks/set-state-in-effect` e 12 warnings); **25/25 suítes Jest+RNTL aprovadas (73/73 testes, 85,67% stmts / 87,29% lines)**. *(2) Web:* **9/9 suítes Jest aprovadas (35/35 testes, 92,49% stmts / 95,23% lines)** cobrindo 14 arquivos HTML (viewport `device-width` nas 13 telas interativas e classes responsivas Tailwind `md:`/`lg:`) e 17 módulos JS. Pendente automação E2E em aparelho/emulador (Appium) e verificação visual manual cross-browser (Chrome, Edge e Firefox). |
| **RNF03** | **RNF3 — Persistência de Dados e Poliglota** | Persistência / Integridade de dados | **Critério:** Os dados cadastrados devem permanecer armazenados após o encerramento ou reinício da aplicação, sem perda ou corrupção das informações confirmadas.<br>**Status atual (20/11/2026): Parcialmente Aprovado (Aprovado em Simulação Local e DynamoDB AWS)** — PyTest validou `schema.sql` (12 tabelas PostgreSQL e constraints), rollback integral em falha (`GerenciadorConexaoBanco`) e retenção em memória simulada entre reinícios do servidor HTTP local. Persistência em AWS DynamoDB confirmada via Postman (Saída, Perda, Ajuste e Consultas `200 OK`). Portal Web validou persistência local de preferências (`localStorage`) e payload Firebase (`tb_sessoesUsuarios` mockado). Pendente evidência direta de reinício em instância RDS PostgreSQL real. |
| **RNF04** | **RNF4 — Diretrizes de Acessibilidade (WCAG)** | Acessibilidade | **Critério:** A interface deve atender aos critérios aplicáveis do nível AA das WCAG 2.2, incluindo navegação por teclado, contraste adequado e textos alternativos para imagens relevantes.<br>**Status atual (20/11/2026): Parcial** — *(1) Mobile:* `themes-wcag.test.ts` + `ThemeContext.test.tsx` validaram matematicamente a razão de contraste WCAG (claro/escuro >= 4,5:1 e alto contraste >= 7,0:1), ampliação de fonte (`100%` / `125%` / `150%`) e telas de acessibilidade (`accessibility.test.tsx`). *(2) Portal Web:* `wcag-responsividade-seguranca.test.js` validou `lang="pt-BR"` nas 14 HTMLs, atributo `alt` nas tags `<img>`, regras `.high-contrast` no `styles.css`, escala de fonte (`115%`/`130%`/`100%`) em `accessibility.js` e navegação por teclado (`ArrowLeft`/`ArrowRight` no carrossel). Pendente auditoria manual com leitor de tela físico (TalkBack/VoiceOver) e Lighthouse/axe em navegador real. |
| **RNF05** | **RNF5 — Segurança e Privacidade** | Segurança / Privacidade | **Critério:** As senhas devem ser armazenadas com hash seguro, as informações devem ser protegidas contra acessos não autorizados e os dados pessoais devem ser tratados conforme a LGPD.<br>**Status atual (20/11/2026): Parcial** — PyTest validou bloqueio de token simulado (HTTP 401), validação de credenciais inválidas, trava `'PERDA'` em maiúsculas (HTTP 403 em descarte sem confirmação), filtro Opt-In e rodapé LGPD `'SAIR'`. Portal Web (`wcag-responsividade-seguranca.test.js` + `core-public.test.js` + `admin-core-e-dashboard.test.js`) comprovou ausência de chaves `AKIA...`/`aws_secret_access_key` nos scripts JS, escape XSS (`escaparHtml`) e controles Opt-In LGPD. Pendente teste de intrusão/autenticação em produção e validação formal do fluxo de armazenamento de hash em banco de produção. |

---

## 3 – Tipos de Teste e Estratégias

Esta seção define as abordagens de teste selecionadas para o projeto. Marque e descreva as técnicas aplicadas ao sistema:

| Técnicas de Caixa Branca (Estruturais) | Técnicas de Caixa Preta (Funcionais) e Outras |
| :--- | :--- |
| - Testes de Cobertura de Código<br>- Testes de Caminho e Fluxo Lógico<br>- Testes de Comandos e Instruções<br>- Testes de Condições e Decisão | - Testes Baseados em Cenários de Uso<br>- Testes de Análise de Valores Limites<br>- Testes de Casos de Uso (Funcionais)<br>- Testes de Interface de Usuário (UI/UX)<br>- Testes de Performance, Carga e Estresse<br>- Testes de Segurança e Controle de Acesso<br>- Testes de Persistência de Dados e Banco<br>- Testes Beta e Validação com Usuários |

---

### 3.1 – Métodos da Classe (Testes de Unidade)

Teste de funcionalidade para verificar se métodos e classes retornam os valores esperados. Recomenda-se teste automatizado (xUnit/JUnit/Jest/PyTest).

| SUBSEÇÃO: 3.1 – MÉTODOS DA CLASSE | Conteúdo / Evidências |
| :--- | :--- |
| **Objetivo do Teste:** | Verificar o correto funcionamento lógico dos métodos das classes e módulos do sistema (Backend, Mobile e Portal Web). |
| **Técnica Aplicada:** | `[ ] Manual` `[ X ] Automática` |
| **Estágio / Nível:** | `[ ] Integração` `[ ] Sistema` `[ X ] Unidade` `[ ] Aceitação` |
| **Abordagem de Teste:** | `[ X ] Caixa Branca` `[ ] Caixa Preta` |
| **Responsável(is):** | Programadores / Equipe de Testes |
| **Casos de Teste e Evidências:** | **Status Atual (20/11/2026): Executado nos 3 Módulos (Backend, Mobile e Web — Meta mínima de 85% superada no Mobile e no Web)**<br><br>**1. Suíte PyTest — Backend Serverless (`backend-serverless/tests/`, executada em 20/11/2026):** **`34 passed in 3.92s` (100% aprovados)** e cobertura global de **64%** (1.292 statements, 462 miss):<br>• `test_estoque.py` (7/7): trava obrigatória `'PERDA'` em maiúsculas (rejeitando `'perda'`), ordenação FEFO, bloqueio de saldo negativo (HTTP 422), descarte com `'PERDA'`, ciclo completo entrada/EAN/consulta/ajuste/saída/auditoria e normalização de prateleiras (`Prat.` → `Prateleira`).<br>• `test_movimentacao.py` (5/5): transferência integral, bloqueio de divisão sem confirmação (HTTP 409), permissão após confirmação, rollback transacional completo em falha no destino (HTTP 500) e bloqueio de locais com ruas/corredores (HTTP 400).<br>• `test_codigo_barras.py` (5/5): validação EAN-8/UPC/EAN-13/GTIN-14 (8 a 14 dígitos), sucesso API 1, fallback sequencial API 2 e API 3, habilitação de cadastro manual (HTTP 404).<br>• `test_diagnostico.py` (11/11): classificação de intenções/receita FEFO/predição da Dora, health check AWS e bancos SQL/NoSQL, rejeição de token simulado (HTTP 401), credenciais inválidas, login admin (`casadacrianca@adm`), moderação com justificativa obrigatória, relatório por e-mail e mensageria LGPD (`SAIR`).<br>• `test_integracao_http_carga.py` (6/6): cobertura adicional de endpoints HTTP locais e integridade (`diagnostico_handler.py` 100%, `response.py` 100%, `connection.py` 95%, `movimentacao_handler.py` 91%, `auth_handler.py` 87%, `mensageria.py` 87%, `relatorios_handler.py` 85%, `dora_handler.py` 83%).<br><br>**2. Frontend Mobile (`app-mobile/`) — Análise Estática e Jest + RNTL (executada em 20/11/2026):**<br>• **TypeScript (`tsc --noEmit`):** **0 erros nos arquivos de produção** (`src/app/**`, `src/components/**`, `src/context/**`, `src/hooks/**`, `src/services/**`, `src/theme/**`, `src/utils/**`). *Nota transparente:* ao incluir `src/__tests__/**`, `tsc --noEmit` retorna código 2 exclusivamente pela ausência do pacote `@types/jest` em `devDependencies` para globais (`describe`, `it`, `expect`, `jest`).<br>• **ESLint (`eslint`):** código de produção apresenta **23 problemas pré-existentes** (`11 errors` de `react-hooks/set-state-in-effect` e `12 warnings`); considerando também `src/__tests__/`, soma **51 problemas** (`15 errors`, `36 warnings`).<br>• **Jest + RNTL (`node .\node_modules\jest\bin\jest.js --coverage`):** **25/25 suítes aprovadas (100%)**, **73/73 testes aprovados (100%)** em **4,844 s**. Cobertura medida em `app-mobile/coverage/coverage-summary.json` (meta >= 85% atingida via mocks de câmera/OAuth/Firebase): **85,67% Statements** (`3648/4258`), **87,29% Lines** (`3462/3966`), **80,35% Functions** (`814/1013`), **70,72% Branches** (`2911/4116`). Destaque: `services/` (**91,83% stmts / 93,53% lines**; `doraService.ts` 95,27% stmts / 96,74% lines; `authService.ts` 89,82% stmts / 90,66% lines), `utils/` (**95,94% stmts / 98,52% lines**), `theme/` (**100%**).<br><br>**3. Portal Web (`web/`) — Suíte Jest + DomMock + VM + Auditoria HTML/CSS (executada em 20/11/2026):**<br>• **Jest (`node ..\app-mobile\node_modules\jest\bin\jest.js --config ./jest.config.js --coverage`):** **9/9 suítes aprovadas (100%)**, **35/35 testes aprovados (100%)** em **1,231 s**.<br>• Cobertura medida em `web/coverage/coverage-summary.json` sobre os 16 scripts em `web/public/js/` (`auth.js` testado separadamente via VM em `scripts/auth.test.js` pelos imports CDN ESM; meta >= 85% superada com mocks DOM/Canvas/html2pdf/window.open/print): **92,49% Statements** (`2491/2693`), **95,23% Lines** (`2296/2411`), **93,69% Functions** (`401/428`), **66,74% Branches** (`1475/2210`). Todos os módulos entre 81,90% e 100%, com destaque para `accessibility.js` (100% stmts / 100% lines), `carousel.js` (97,82% / 100%), `donor-estoque.js` (97,00% / 98,87%), `donor-minhas-campanhas.js` (96,32% / 99,14%), `admin-relatorios.js` (95,66% / 97,30%), `index-publico.js` (94,79% / 96,42%), `admin-consulta-avancada.js` (94,48% / 95,49%), `donor-campanhas.js` (93,90% / 97,70%), `admin-campanhas.js` (93,78% / 96,61%), `admin-locais.js` (92,85% / 93,33%) e `donor-configuracoes.js` (91,76% / 93,67%). *(Observação de auditoria em leitura: `web/public/js/donor-campanhas.js`, linhas 237 e 321, referencia `exibirAlertaCampanhaDoador` sem declará-la no próprio arquivo — comportamento simulado por mock em teste para preservar intacto o código de produção).* |

---

### 3.2 – Persistência de Dados (Integridade do Banco)

Verificar se os dados não se perdem ao desligar o programa e se o sistema consegue se recuperar em caso de falha ou fechamento repentino.

| SUBSEÇÃO: 3.2 – PERSISTÊNCIA DE DADOS | Conteúdo / Evidências |
| :--- | :--- |
| **Objetivo do Teste:** | Verificar se os dados são mantidos de forma íntegra após o desligamento ou falha repentina do sistema. |
| **Técnica Aplicada:** | `[ ] Manual` `[ X ] Automática` |
| **Estágio / Nível:** | `[ ] Integração` `[ X ] Sistema` `[ ] Unidade` `[ ] Aceitação` |
| **Abordagem de Teste:** | `[ ] Caixa Branca` `[ X ] Caixa Preta` |
| **Responsável(is):** | Programadores / Equipe de Testes |
| **Evidências da Retenção de Dados:** | **Status Atual (20/11/2026): Parcialmente Executado — Validado em Backend Simulado/HTTP + DynamoDB AWS (Postman); Pendente Log de Reinício em RDS PostgreSQL Real**<br>• **Integridade `schema.sql`, Rollback Transacional e Persistência entre Reinícios HTTP (`test_integracao_http_carga.py`):** verificado estruturalmente o esquema relacional PostgreSQL (`src/database/schema.sql`, 12 tabelas com chaves estrangeiras e `CHECK`), validado o rollback completo de transações em `GerenciadorConexaoBanco` e confirmada a persistência de lotes cadastrados via servidor HTTP mesmo após reinício da instância de servidor de testes.<br>• **Persistência Real no AWS DynamoDB (Postman — 10/11/2026):** bateria na AWS Lambda (`https://zqc7b27zwivnfyczo5kedb3vta0evazc.lambda-url.us-east-2.on.aws`) confirmou leitura e gravação persistida (`200 OK`) em Consultar Estoque (81,449 KB), Consultar Movimentações (38,512 KB), Saída Produto, Perda e Ajustar Estoque (`postman_requisicoes.mp4`).<br>• **Persistência Client-Side e Sessão (Mobile + Web):** `AsyncStorage` (sessão Google, contas memorizadas, preferências de acessibilidade/tema e notificações no Mobile) e `localStorage` (`dg_sessao_admin`, `dg_alto_contraste`, `dg_fonte` no Portal Web) validados com `setDoc` mockado para `tb_sessoesUsuarios` (Firestore). Pendente registro físico de reinício contra PostgreSQL RDS/Firestore real. |

---

### 3.3 – Integração dos Componentes

Verificar se as classes, métodos e APIs realizam a integração de forma correta para uma sequência de ações do programa.

| SUBSEÇÃO: 3.3 – INTEGRAÇÃO DOS COMPONENTES | Conteúdo / Evidências |
| :--- | :--- |
| **Objetivo do Teste:** | Verificar a comunicação e troca de dados entre módulos, APIs e serviços do sistema. |
| **Técnica Aplicada:** | `[ X ] Manual` `[ X ] Automática` |
| **Estágio / Nível:** | `[ X ] Integração` `[ ] Sistema` `[ ] Unidade` `[ ] Aceitação` |
| **Abordagem de Teste:** | `[ X ] Caixa Cinzenta` `[ X ] Caixa Preta` |
| **Responsável(is):** | Programadores / Equipe de Testes |
| **Logs de Requisição e Resposta:** | **Status Atual (20/11/2026): Executado Localmente em Todas as Rotas HTTP + Validado na AWS Lambda (Estoque/Movimentação via Postman); Pendente Newman/Postman `/api/dora` e Cascata EAN em Rede Real**<br>• **Integração HTTP Local Completa (`server_local.py` + `test_integracao_http_carga.py`, 20/11/2026):** todas as 7 rotas da API integradas end-to-end contra o roteador HTTP real: CORS `OPTIONS` (`200`), rota inexistente (`404`), `POST /api/auth` (`401`/`200`/`400`), `POST /api/estoque` (`201`/`200`/`422`/`403`), `POST /api/movimentacao` (`409`/`400`/`200`), `POST /api/configuracoes` (`200`), `POST /api/relatorios` (`200`), `POST /api/dora` (`200`) e `GET /api/diagnostico` (`200`).<br>• **Evidência AWS Lambda (Postman Collection Runner — 10/11/2026):** coleção `DoarEGuardar` (`5/5` aprovados, `0` falhas, duração total `3s 173ms`, média `461 ms`): POST Consultar Estoque (`200`, 1184 ms, 81,449 KB), POST Consultar Movimentacoes (`200`, 317 ms, 38,512 KB), POST Saida Produto (`200`, 248 ms), POST Perda (`200`, 295 ms) e POST Ajustar Estoque (`200`, 262 ms). Arquivo registrado: `teste_automatizado_postaman.mp4`.<br>• **Integração Front–Back (Mocks HTTP):** Mobile (`api.ts`, `doraService.ts`, `storageLocations.ts`, `categoriesService.ts`, `entitiesCrudService.ts`) e Web (`admin.js`, `admin-campanhas.js`, `admin-consulta-avancada.js`, `admin-relatorios.js`, `donor-*.js`) verificados quanto a serialização de payloads JSON, headers e tratamento de falhas de rede.<br>• **Pendências:** expandir Postman/Newman para `/api/auth`, `/api/dora`, `/api/campanhas`, `/api/relatorios` em produção AWS e registrar captura EAN real contra APIs externas com internet ativa. |

---

### 3.4 – Tempo de Resposta (Desempenho)

Verificar se os tempos de resposta das requisições e ações do programa são considerados aceitáveis pelos critérios do projeto.

| SUBSEÇÃO: 3.4 – TEMPO DE RESPOSTA | Conteúdo / Evidências |
| :--- | :--- |
| **Objetivo do Teste:** | Avaliar a latência, tempo de carregamento e tempo de resposta das rotinas sob uso normal e concorrente. |
| **Técnica Aplicada:** | `[ ] Manual` `[ X ] Automática (PyTest Concurrent + Artillery pronto)` |
| **Estágio / Nível:** | `[ ] Integração` `[ X ] Sistema` `[ ] Unidade` `[ ] Aceitação` |
| **Abordagem de Teste:** | `[ ] Caixa Branca` `[ X ] Caixa Preta` |
| **Responsável(is):** | Programadores / Equipe de Testes |
| **Gráficos e Relatórios de Desempenho:** | **Status Atual (20/11/2026): Benchmark Concorrente Local Executado + Medição Preliminar AWS (Postman); Artillery Produção AWS Pendente**<br>• **Benchmark HTTP Concorrente Local (`test_integracao_http_carga.py` contra `server_local.py`, 20/11/2026):** **150 requisições simultâneas** distribuídas em **25 workers paralelos** por `/api/estoque`, `/api/configuracoes`, `/api/relatorios`, `/api/dora` e `/api/diagnostico` → **`erros = 0`**, duração total **`0,722 s`**, throughput **`207,8 req/s`**, média **`81,37 ms`**, **p50 `17,63 ms`**, **p95 `518,01 ms`** (meta < 800 ms e critério RNF01 < 2.000 ms atendidos), p99 `527,28 ms`, máx. `533,23 ms`.<br>• **Latências reais observadas na AWS Lambda (Postman 10/11/2026):** média `461 ms` nas 5 requisições (`Saida Produto` 248 ms, `Ajustar Estoque` 262 ms, `Perda` 295 ms, `Consultar Movimentacoes` 317 ms, `Consultar Estoque` 1184 ms — abaixo de 2,0 s).<br>• **Pendência / Artefato Pronto:** o cenário completo de carga em produção foi codificado em `backend-serverless/tests/artillery-load.yml` apontando para a URL oficial AWS (`https://zqc7b27zwivnfyczo5kedb3vta0evazc.lambda-url.us-east-2.on.aws`), aguardando execução externa com pacote Artillery em máquina com acesso à internet. |

---

### 3.5 – Animações e Interface Visual

Verificar se as animações, transições e efeitos visuais do sistema são disparados nos momentos corretos e mantêm a fluidez.

| SUBSEÇÃO: 3.5 – ANIMAÇÕES E INTERFACE VISUAL | Conteúdo / Evidências |
| :--- | :--- |
| **Objetivo do Teste:** | Verificar a correta execução, sincronismo e acionamento das animações e elementos visuais da UI. |
| **Técnica Aplicada:** | `[ X ] Manual` `[ X ] Automática` |
| **Estágio / Nível:** | `[ ] Integração` `[ X ] Sistema` `[ ] Unidade` `[ ] Aceitação` |
| **Abordagem de Teste:** | `[ ] Caixa Branca` `[ X ] Caixa Preta` |
| **Responsável(is):** | Programadores / Equipe de Testes |
| **Evidências Visuais (Screenshots):** | **Status Atual (20/11/2026): Validado em Renderização Automatizada Mobile/Web; E2E Appium e Capturas Visuais Manuais Pendentes**<br>• **Mobile (Jest + RNTL):** testados componentes `AnimatedIcon` (`ui-and-hooks.test.tsx`), `Collapsible`, alternância de temas Claro / Escuro / Alto Contraste com verificação matemática de razão de contraste WCAG (`themes-wcag.test.ts` + `ThemeContext.test.tsx`), ampliação de fonte (`100%` / `125%` / `150%`) e telas de acessibilidade (`accessibility.test.tsx`).<br>• **Portal Web (Jest):** testado carrossel de slides com transformações CSS (`carousel.js`), classes `.high-contrast` (`styles.css`), escala de fonte (`115%` / `130%` / `100%` em `accessibility.js`) e breakpoints responsivos (`wcag-responsividade-seguranca.test.js`).<br>• **Pendências:** execução E2E real no Appium (emulador Android/iOS), vistoria cross-browser (Chrome/Edge/Firefox) e coleta de screenshots comprobatórios para anexo neste relatório. |

---

### 3.6 – Efeitos Sonoros e Audiovisuais

Verificar a correta reprodução, volume, sincronia e acionamento de efeitos sonoros, alertas de áudio e respostas por voz.

| SUBSEÇÃO: 3.6 – EFEITOS SONOROS | Conteúdo / Evidências |
| :--- | :--- |
| **Objetivo do Teste:** | Verificar a fidelidade de áudio, gatilhos de reprodução sonora, reprodução audiovisual e suporte a leitores de tela sem ruídos ou travamentos. |
| **Técnica Aplicada:** | `[ X ] Manual` `[ X ] Automática (Módulo Simulado)` |
| **Estágio / Nível:** | `[ ] Integração` `[ X ] Sistema` `[ ] Unidade` `[ ] Aceitação` |
| **Abordagem de Teste:** | `[ ] Caixa Branca` `[ X ] Caixa Preta` |
| **Responsável(is):** | Programadores / Equipe de Testes |
| **Relatório de Reprodução Sonora / Audiovisual:** | **Status Atual (20/11/2026): Parcial — Componentes de Vídeo/Vibração/Acessibilidade Auditiva Validados via Jest + RNTL (Mocks); Teste Físico com TalkBack / VoiceOver e Reprodução Real em Aparelho Pendentes**<br>• **Mídia Integrada à Assistente Dora (`dora-components.test.tsx`):** verificado `DoraAboutModal.tsx` com componente `VideoView` (`expo-video`) carregando `DoraGreeting.mp4`, estado de erro/fallback visual quando a reprodução falha, e controles de navegação por voz/leitor de tela (`accessibility-screen-reader.tsx`, `accessibility-voice-nav.tsx`).<br>• **Feedback Tátil/Scanner:** verificado disparo seguro de `Vibration.vibrate(100)` na leitura de código de barras em `stock-add.tsx`, `stock-move.tsx` e `stock-remove.tsx` (`stock.test.tsx`).<br>• **Pendência:** gravação manual em smartphone físico testando TalkBack (Android) e VoiceOver (iOS) + som/áudio real do vídeo da Dora e vibração física do scanner. |

---

## 4 – Recursos e Ambiente de Testes

Esta seção descreve a infraestrutura de hardware, software, servidores e ferramentas específicas de automação necessárias para a execução do plano de testes.

### 4.1 – Ambiente de Teste (Hardware e Software)

| Tipo de Recurso | Especificação Técnica do Componente / Plataforma | Finalidade no Ambiente de Teste |
| :--- | :--- | :--- |
| **Hardware Local** | Computadores da equipe; smartphones Android físicos e/ou emuladores. Para iOS, simuladores do Xcode e iPhones físicos quando disponíveis. | Executar testes locais, validar responsividade e testar leitura de código de barras pela câmera. |
| **Sistema Operacional** | Windows ou Linux nos computadores de desenvolvimento; Android 10+; iOS 15+. | Executar ferramentas de desenvolvimento e verificar a compatibilidade dos clientes mobile. |
| **Servidores / Nuvem** | AWS (funções serverless AWS Lambda na região `us-east-2` — `https://zqc7b27zwivnfyczo5kedb3vta0evazc.lambda-url.us-east-2.on.aws` — e servidor local `server_local.py`); Firebase Auth/Google Identity. | Hospedar backend de teste e validar autenticação e integração. |
| **Banco de Dados** | AWS DynamoDB (13 tabelas `tb_*` ativas em homologação/produção) e esquema SQL PostgreSQL/RDS (`schema.sql`); Firebase Firestore/NoSQL (`tb_sessoesUsuarios`) para usuários e sessões. | Verificar persistência, integridade referencial, transações e dados de autenticação. |
| **Navegadores Web** | Google Chrome, Microsoft Edge e Mozilla Firefox; versões atuais disponíveis no ambiente de teste. | Testar compatibilidade, responsividade e funcionamento do portal web. |

### 4.2 – Ferramentas de Teste Automatizado

| Ferramenta / Framework | Categoria de Teste | Descrição e Aplicação no Projeto |
| :--- | :--- | :--- |
| **PyTest + pytest-cov** | Testes Unitários e Integração HTTP (Backend) | Automatizar testes das regras de negócio Python (`test_estoque.py`, `test_movimentacao.py`, `test_codigo_barras.py`, `test_diagnostico.py`) e integração HTTP + benchmark concorrente em `server_local.py` (`test_integracao_http_carga.py`). |
| **Jest + React Native Testing Library (RNTL)** | Testes Unitários e Componentes (Mobile) | Automatizar testes de serviços, utilitários WCAG, componentes visuais/Dora e fluxos interativos das telas React Native/Expo (25 suítes, 73 testes, 85,67% statements / 87,29% lines). |
| **Jest (TestEnvironment Node + DomMock + VM)** | Testes Unitários, Estruturais, WCAG e Segurança (Web) | Validar 14 páginas HTML, CSS (alto contraste e responsividade), LGPD/XSS e os 17 módulos JS públicos, administrativos e do doador em `web/tests/` (9 suítes, 35 testes, 92,49% statements / 95,23% lines). |
| **Postman + Newman** | Testes de API e Integração (Nuvem AWS) | Validar endpoints HTTP reais na AWS Lambda, contratos JSON, autenticação, códigos de resposta e fallback sequencial das APIs. |
| **Appium** *(Pendente Execução)* | Testes E2E, Interface e Acessibilidade | Automatizar fluxos de interface em dispositivos/emuladores físicos e apoiar inspeção de leitores de tela, ampliação da fonte e alto contraste. |
| **Artillery** *(Script Pronto — Execução Produção Pendente)* | Testes de Carga e Desempenho | Simular acessos concorrentes contra a AWS Lambda (`backend-serverless/tests/artillery-load.yml`) e medir latência p95/p99 em rede pública. |

---

## 5 – Testes Beta (Validação com Usuários Reais)

O Teste Beta consiste na validação do sistema com o público-alvo real. Os testes devem ser registrados por meio de entrevistas, questionários objetivos de usabilidade (como a **Escala SUS — System Usability Scale**) ou testes guiados de tarefas. Declarações escritas, avaliações quantitativas e depoimentos audiovisuais corroboram com a evidência de qualidade.

| Sessão | Perfil do Testador / Usuário | Roteiro / Tarefa Executada | Resultado / Avaliação | Observações / Bugs Relatados |
| :--- | :--- | :--- | :--- | :--- |
| **Beta 01** | Voluntário ou colaborador da Casa da Criança, familiaridade digital a registrar. | Autenticar-se com conta Google via Firebase e cadastrar entrada de produto por código de barras. | **Pendente de execução** (previsto para validação presencial com a equipe da instituição); registrar pontuação SUS após a sessão. | Preencher durante a observação; anotar dificuldades, tempo e mensagens de erro. |
| **Beta 02** | Voluntário ou colaborador da Casa da Criança, perfil a registrar. | Dar baixa em lote vencido digitando “PERDA” e ativar alto contraste/ampliar a fonte. | **Pendente de execução**; registrar pontuação SUS após a sessão. | Preencher durante a observação; verificar clareza dos alertas e acessibilidade. |
| **Beta 03** | Voluntário ou colaborador da Casa da Criança; perfil a registrar. | Consultar a Dora por linguagem natural e solicitar sugestão de receita com itens próximos do vencimento. | **Pendente de execução**; registrar pontuação SUS após a sessão. | Preencher durante a observação; registrar tempo, compreensão e qualidade do retorno. |

---

## 6 – Cronograma de Testes

Mapeamento do tempo e prazos previstos para cada etapa do ciclo de vida de testes do projeto:

| Etapa do Projeto de Teste | Duração Estimada | Data de Início | Data de Término | Responsável | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1. Planejar Testes** | 5 dias | 19/10/2026 | 23/10/2026 | Equipe Doar&Guardar | `[ X ] Concluído` |
| **2. Projetar Testes (Casos de Uso)** | 7 dias | 24/10/2026 | 30/10/2026 | Equipe Doar&Guardar | `[ X ] Concluído` |
| **3. Implementar Testes (Automação)** | 10 dias | 31/10/2026 | 06/11/2026 (estendido até 20/11/2026) | Equipe Doar&Guardar | `[ X ] Concluído (PyTest, Jest Mobile e Jest Web finalizados; script Artillery pronto)` |
| **4. Executar Testes e Baterias** | 7 dias | 07/11/2026 | 20/11/2026 | Equipe Doar&Guardar | `[ X ] Em Andamento (PyTest 34/34, Benchmark HTTP local, Postman AWS 5/5, Jest Mobile 25/25 e Jest Web 9/9 executados; pendentes Appium, Artillery AWS em produção, TalkBack/VoiceOver e cross-browser manual)` |
| **5. Avaliar Testes e Teste Beta** | 4 dias | 17/11/2026 | 20/11/2026 | Todos do Grupo | `[ ] Em Aberto / Pendente (aguardando validação presencial Casa da Criança e anexação de evidências visuais/audiovisuais)` |

---

## Apêndice A — Sugestões Práticas de Evidências para Coletar e Anexar ao `.docx` Final

Abaixo estão sugestões objetivas de evidências fáceis de capturar para transformar os itens marcados como *Parciais* ou *Pendentes* em **Aprovados com Comprovação Completa** na entrega final da disciplina IQS004:

### 1. Evidências de Terminal e Relatórios de Cobertura (Prontos para Print Imediato)
- **Print 1 — Backend PyTest + Cobertura (`3.1` / `3.2` / `3.3` / `3.4`):** executar no terminal `cd backend-serverless` -> `python -m pytest -v -s --cov=src --cov-report=term-missing` e capturar o resumo `34 passed in 3.92s`, a tabela de cobertura (64%) e a linha `[BENCHMARK HTTP CONCORRENTE] total=150 workers=25 erros=0 duracao=0.722s throughput=207.8req/s media=81.37ms p50=17.63ms p95=518.01ms`.
- **Print 2 — Mobile Jest + Coverage HTML (`3.1` / `RNF04`):** executar `cd app-mobile` -> `node .\node_modules\jest\bin\jest.js --coverage` e abrir `app-mobile/coverage/lcov-report/index.html` no navegador para tirar print visual verde da árvore de cobertura (**25/25 suítes, 73/73 testes, 85,67% statements, 87,29% lines**; `services/` 91,83%; `utils/` 95,94%).
- **Print 3 — Portal Web Jest + Coverage HTML (`3.1` / `RNF02` / `RNF04` / `RNF05`):** executar `cd web` -> `node ..\app-mobile\node_modules\jest\bin\jest.js --config ./jest.config.js --coverage` e abrir `web/coverage/lcov-report/index.html` no navegador para capturar os **9/9 PASS (35/35 testes)** e a matriz de cobertura (**92,49% statements, 95,23% lines**).

### 2. Evidências de Desempenho em Produção AWS (Artillery — Seção `3.4` e `RNF01`)
- O roteiro pronto já existe em `backend-serverless/tests/artillery-load.yml`. Em computador com Node.js e internet liberada:
  ```powershell
  cd backend-serverless
  npx artillery run tests/artillery-load.yml --output report.json
  npx artillery report report.json
  ```
- **O que anexar:** print do terminal com `http.response_time.p95` e `p99`, além dos gráficos gerados em `report.json.html` abertos no navegador (anexar na Subseção `3.4`).

### 3. Evidências de APIs Extras no Postman / Newman (`RF04`, `RF07`, `RNF05`, Seção `3.3`)
- Complementar o vídeo `teste_automatizado_postaman.mp4` rodando requisições para:
  1. `POST /api/dora` (pergunta de receita FEFO em linguagem natural → `200 OK`);
  2. `POST /api/auth/login` com credencial inválida (`401 Unauthorized`) e válida (`200 OK`);
  3. `POST /api/estoque` com `acao: "verificar_produto"` e EAN real brasileiro (ex.: `7891000100103`) comprovando retorno da cascata de APIs públicas externas em rede real.
- **O que anexar:** print do **Postman Collection Runner** mostrando `All Tests Passed` e códigos `200`, `401` e `422`/`403`.

### 4. Evidências Visuais, Responsividade e Cross-Browser (`RF01`, `RNF02`, `RNF04`, Seção `3.5`)
- **Portal Web Cross-Browser & Responsividade (F12 DevTools):** abrir `web/index.html`, `views/admin/dashboard.html` e `views/donor/dashboardDoador.html` lado a lado em **Chrome**, **Edge** e **Firefox** no modo normal e no modo **DevTools Mobile (375×812 px)**, ativando o botão de **Alto Contraste** e **Tamanho da Fonte (`130%`)**.
- **Lighthouse (Auditoria Oficial WCAG & Desempenho no Chrome):** abrir `F12 -> Lighthouse -> Analyze page load` na página inicial pública e no painel do doador e anexar o print com as notas de *Accessibility* e *Best Practices*.
- **App Mobile (Android/Expo Go):** gravar vídeo curto (~30s) mostrando: (a) leitura de código de barras com câmera real, (b) alerta de bloqueio ao tentar cadastrar item vencido, (c) trava `'PERDA'` no descarte, (d) alternância entre Tema Claro, Tema Escuro, Alto Contraste e Fonte `150%`.

### 5. Evidências Audiovisuais & Leitores de Tela (`3.6` e `RNF04`)
- Gravar vídeo com captura de áudio no celular físico demonstrando:
  1. Abertura do modal **"Sobre a Dora"** reproduzindo o vídeo com áudio `DoraGreeting.mp4`;
  2. Navegação pelas abas principais (`Home`, `Estoque`, `Dora`, `Acessibilidade`) com **TalkBack** (Android) ou **VoiceOver** (iOS) ativo lendo corretamente os `accessibilityLabel` configurados nos botões e cards.

### 6. Roteiro Rápido para Fechar os 3 Testes Beta (`Seção 5`)
- Aplicar as 3 tarefas (`Beta 01`, `Beta 02`, `Beta 03`) com 2 a 3 colaboradores/voluntários da Casa da Criança usando um formulário simples da **Escala SUS (10 perguntas de 1 a 5)** e registrar:
  - Tempo médio gasto por tarefa (ex.: `< 2 min`);
  - Nota SUS calculada (meta acadêmica: `>= 75/100`);
  - Print do formulário preenchido ou termo/foto de validação presencial (preservando anonimato se desejado).
