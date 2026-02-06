# PRD Simple — WA-Module

**Foco:** Funcionalidades e UI/UX | **Versão:** 1.0 | **Data:** 2026-02-06

---

## 1. Visão do Produto

### O que é
Módulo para integrar WhatsApp em aplicações (Node.js), com API REST, autenticação, múltiplas sessões e um **dashboard web** para conectar números via QR Code e gerenciar envio de mensagens.

### Problema
- API oficial do WhatsApp é cara e limitada.
- Soluções existentes são acopladas a um framework ou sem interface para operadores.

### Solução
- API REST simples (Fastify).
- Dashboard para login, criar sessões, escanear QR e enviar mensagens.
- Suporte a múltiplas sessões (ex.: vendas, suporte).
- Webhooks para integrar com outros sistemas.

---

## 2. Funcionalidades (por área)

### 2.1 Autenticação
- **Registro** de usuário (nome, email, senha).
- **Login** com email/senha; retorno de JWT.
- **Logout** (invalidação de token no cliente).
- **Roles:** usuário comum e admin (admin vê gestão de usuários).

### 2.2 Sessões WhatsApp
- **Listar** sessões (ID, número vinculado, status, estado).
- **Criar** nova sessão (gera QR Code para vincular número).
- **Conectar:** exibir QR Code; ao escanear, sessão fica “active”.
- **Desconectar (logout)** da sessão (remove vínculo do número).
- **Excluir** sessão (remove dados da sessão do sistema).
- **Multi-sessão:** várias sessões simultâneas (ex.: vendas, suporte).

### 2.3 Mensagens
- **Enviar texto** para um número.
- **Enviar mídia:** imagem, vídeo, áudio, documento (com legenda opcional).
- **Enviar** localização, contato (vCard), listas e botões.
- **Responder** a mensagem (reply), **encaminhar**, **editar**, **excluir**, **reagir** com emoji.
- **Marcar como lida.**
- **Receber** mensagens via API e/ou webhook (para integrações).

### 2.4 Contatos
- Buscar contato por número.
- Listar contatos.
- Verificar se número existe no WhatsApp.
- Obter foto de perfil.

### 2.5 Grupos
- Criar grupo (nome + participantes).
- Listar grupos; ver dados do grupo.
- Adicionar participantes; atualizar nome do grupo.
- Sair do grupo.

### 2.6 Status/Stories
- Postar status (imagem/vídeo).
- Listar status de contatos.

### 2.7 Integrações
- **Webhooks:** notificar URL externa em eventos (ex.: nova mensagem).
- **Documentação da API:** Swagger UI para explorar e testar endpoints.

---

## 3. UI/UX — Dashboard e Experiência

### 3.1 Público-alvo
- Operadores que precisam conectar números ao sistema e enviar mensagens.
- Admins que gerenciam usuários e sessões.
- Desenvolvedores que usam a API (Swagger) e webhooks.

### 3.2 Telas principais

| Tela | Quem acessa | Objetivo |
|------|-------------|----------|
| **Login** | Todos | Entrar com email/senha. |
| **Registro** | Novos usuários | Criar conta (nome, email, senha). |
| **Dashboard — Sessões** | Usuários logados | Ver sessões; criar; conectar (QR); enviar mensagem; desconectar; excluir. |
| **Dashboard — Usuários** | Apenas admin | Listar usuários; criar usuário; excluir usuário. |
| **Modal QR Code** | Usuário que clica em “Connect” | Exibir QR; instrução “Escaneie com WhatsApp”; feedback “Conectado” e fechamento. |
| **Modal Enviar mensagem** | Usuário que clica em “Send” | Número, texto, anexo opcional; enviar; feedback de sucesso/erro. |
| **Modal Mensagens** | Usuário que clica em “Show” | Listar últimas mensagens da sessão (somente leitura). |
| **Swagger UI** | Desenvolvedores | Documentação interativa da API. |

### 3.3 Fluxos de uso

**Conectar um número (nova sessão)**
1. Dashboard → “New Session”.
2. Sessão aparece na tabela com status “aguardando QR”.
3. Usuário clica em “Connect” → abre modal com QR.
4. Usuário escaneia com WhatsApp no celular.
5. Modal mostra “Conectado com sucesso” e fecha; lista de sessões atualiza (status “active”, número exibido).

**Enviar mensagem de teste**
1. Na linha da sessão “active” → “Send”.
2. Modal: informar número (ex.: 5548999999999), texto e opcionalmente anexo.
3. “Send” → mensagem enviada; feedback claro (sucesso ou erro).

**Logout da sessão**
1. “Logout” na sessão → confirmação.
2. Sessão deixa de estar vinculada ao número; QR pode ser gerado de novo se desejado.

### 3.4 Princípios de UI/UX

- **Clareza:** uma ação principal por tela/modal (ex.: “Connect” só mostra QR; “Send” só envia mensagem).
- **Feedback imediato:** loading ao buscar QR; mensagem de sucesso/erro ao enviar; confirmação antes de logout/delete.
- **Consistência:** mesmos padrões de botões (primário/segundo/perigo), tabelas e modais em todo o dashboard.
- **Hierarquia:** cabeçalho com nome do produto e usuário; blocos (cards) para “Sessões” e “Usuários”; ações por linha na tabela.
- **Acessibilidade:** labels em campos; contraste adequado; botões com texto claro (não só ícone quando for ação crítica).
- **Responsividade:** dashboard utilizável em desktop e tablet (tabelas scrolláveis, modais adaptáveis).
- **Erro amigável:** mensagens de erro em português quando possível; orientar próximo passo (ex.: “Tente conectar novamente” ou “Verifique o número”).

### 3.5 Estados da interface

- **Loading:** “Loading…” em listas e “Loading QR Code…” no modal.
- **Vazio:** tabela de sessões vazia → CTA “New Session”; tabela de usuários vazia → “New User” (admin).
- **Erro:** mensagem visível no modal (ex.: envio falhou) ou alert/feedback na tela.
- **Sucesso:** texto de confirmação (ex.: “Conectado com sucesso”, “Mensagem enviada”) e atualização da lista.

### 3.6 Melhorias desejáveis (backlog UI/UX)

- Tema claro/escuro.
- Notificações toast em vez de apenas `alert` para sucesso/erro.
- Paginação ou “carregar mais” em listas grandes (sessões, usuários, mensagens).
- Busca/filtro na lista de sessões (por ID ou número).
- Indicador de “última atividade” ou “última mensagem” por sessão.
- Ajuda contextual (tooltip ou link) para formato do número no envio (ex.: 55 + DDD + número).
- Página de “esqueci minha senha” e redefinição por email.

---

## 4. API (visão para integradores)

- **Base:** REST (Fastify).
- **Auth:** Bearer JWT no header em rotas protegidas.
- **Principais grupos:** Auth (register/login), Sessions, Session/:id (status, QR, logout, delete), Messages (send text/media), Webhooks (configurar URL).
- **Documentação:** Swagger UI em `/docs` (ou conforme configurado no projeto).
- **Webhooks:** configurar URL para receber eventos (ex.: nova mensagem); payload em JSON.

*(Detalhes dos endpoints e payloads ficam no Swagger e em docs técnicas; este PRD não lista código.)*

---

## 5. Roadmap simplificado

| Fase | Foco | Entregas principais |
|------|------|---------------------|
| **1** | Core e uso básico | Login/registro, sessões, QR, envio de texto e mídia, dashboard atual. |
| **2** | Experiência do dashboard | Melhorar feedback (toasts), estados de loading/erro, pequenos ajustes de acessibilidade. |
| **3** | Funcionalidades avançadas | Grupos (promover/rebaixar, remover, convites), bloqueio de contatos, presença (digitando). |
| **4** | Escalabilidade e ops | Rate limiting, fila de mensagens, métricas, testes E2E. |
| **5** | Documentação e comunidade | API reference, guia de webhooks, troubleshooting, exemplos de integração. |

---

## 6. Métricas de sucesso (foco produto e UX)

- **Uso:** número de sessões ativas e mensagens enviadas por dia/semana.
- **Conclusão de fluxos:** % de sessões criadas que chegam a “conectado” (QR escaneado); % de envios que terminam em sucesso.
- **Tempo:** tempo médio para “conectar primeira sessão” (da criação ao QR escaneado).
- **Erros:** taxa de falha em envio e em geração de QR; redução após melhorias de mensagens e retry.
- **Satisfação:** feedback qualitativo sobre clareza do dashboard e da documentação (Swagger + guias).

---

## 7. Resumo

O **WA-Module** oferece **API REST** e **Dashboard** para conectar números ao WhatsApp via QR Code, gerenciar múltiplas sessões e enviar/receber mensagens. Este PRD Simple prioriza **funcionalidades** e **UI/UX**: telas, fluxos, princípios de design e melhorias desejáveis, com pouco ou nenhum código, para alinhar produto e experiência do usuário.

Documentação técnica detalhada (incluindo exemplos de código) permanece no **PRD.md** principal e no **Swagger**.
