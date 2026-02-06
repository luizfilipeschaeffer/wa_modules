# Instruções para Agente de IA – WA-Module

Este documento descreve como um agente de IA deve usar o **WA-Module** (API + WhatsApp) para fazer chamadas à API, configurar webhooks e trocar mensagens com usuários finais.

---

## Visão geral

- **Base URL da API:** `http://localhost:3000` (desenvolvimento) ou a URL do seu servidor em produção.
- **Documentação interativa:** `http://localhost:3000/docs` (Swagger).
- Quase todos os endpoints (exceto login e QR público) exigem **autenticação JWT** no header `Authorization: Bearer <token>`.

---

## 1. Autenticação

### Obter o token (login)

**Endpoint:** `POST /auth/login`  
**Autenticação:** Não requerida.

**Body (JSON):**
```json
{
  "email": "admin@admin.com",
  "password": "admin"
}
```

**Resposta de sucesso (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "name": "...",
    "email": "admin@admin.com",
    "role": "admin"
  }
}
```

**Uso do token:** em todas as requisições seguintes, envie:
```
Authorization: Bearer <token>
```

---

## 2. Sessões e conexão WhatsApp

### Listar sessões

**Endpoint:** `GET /sessions`  
**Headers:** `Authorization: Bearer <token>`

**Query (opcional):**
- `status`: `active` | `inactive`
- `phoneNumber`: filtrar por número (sessões ativas)

**Resposta:** lista de sessões com `sessionId`, `status`, `state`, `user`, `phoneNumber`.

### Ver status de uma sessão

**Endpoint:** `GET /session/:sessionId/status`  
**Exemplo:** `GET /session/main-session/status`

**Resposta:** `status`, `state`, `user` (dados do WhatsApp quando conectado).

### Iniciar conexão (gerar QR Code)

**Endpoint:** `POST /session/:sessionId/connect`  
**Exemplo:** `POST /session/main-session/connect`

**Resposta:** inclui `qrUrl` (URL para exibir o QR Code). O usuário deve escanear com WhatsApp (Linked Devices).

### Criar nova sessão

**Endpoint:** `POST /sessions`  
**Resposta:** `sessionId`, `qrUrl`, etc. Depois use esse `sessionId` nas rotas de mensagem e webhook.

### Logout e deletar sessão

- **Logout:** `POST /session/:sessionId/logout` – desconecta e limpa dados da sessão.
- **Deletar sessão (inativa):** `DELETE /session/:sessionId`.

---

## 3. Enviar mensagens para o usuário destinatário

### Enviar mensagem de texto

**Endpoint:** `POST /session/:sessionId/message/text`  
**Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`

**Body (JSON):**
```json
{
  "to": "5511999999999",
  "message": "Olá! Esta é a mensagem para o usuário."
}
```

- **`to`:** número do destinatário com código do país e DDD, **sem** `@s.whatsapp.net`. Ex.: `5548996846044`.
- **`message`:** texto da mensagem.

**Resposta de sucesso (200):**
```json
{
  "success": true,
  "messageId": "..."
}
```

**Erros comuns:**
- **404:** Sessão não está ativa (conectar antes).
- **400:** Sessão não está conectada ao WhatsApp.

### Listar mensagens recebidas (histórico)

**Endpoint:** `GET /session/:sessionId/messages`  
**Query (opcional):** `limit` (padrão: 50)

**Resposta:** array de mensagens com `id`, `chatId`, `sender`, `fromMe`, `timestamp`, `type`, `body`.

---

## 4. Webhooks – receber eventos em tempo real

O agente pode **registrar uma URL de webhook** para receber eventos (mensagens recebidas, conexão, QR) em tempo real. Assim, quando um usuário envia uma mensagem no WhatsApp, o WA-Module faz um **POST** para a URL configurada.

### Registrar webhook

**Endpoint:** `POST /session/:sessionId/webhooks`  
**Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`

**Body (JSON):**
```json
{
  "url": "https://seu-servidor.com/webhook/whatsapp",
  "events": ["message", "connection", "qr"]
}
```

- **`url`:** URL pública que receberá os POSTs (deve ser acessível pela internet se o WA-Module estiver em servidor).
- **`events`:** array com um ou mais de:
  - **`message`** – nova mensagem recebida ou enviada (entrega no seu sistema).
  - **`connection`** – sessão conectada ou desconectada.
  - **`qr`** – novo QR Code gerado.

**Resposta:** objeto do webhook criado (`id`, `url`, `events`).

### Listar webhooks

**Endpoint:** `GET /session/:sessionId/webhooks`

### Remover webhook

**Endpoint:** `DELETE /session/:sessionId/webhooks/:webhookId`

---

## 5. Formato do payload enviado ao webhook (como o agente recebe)

O WA-Module envia **POST** para a URL do webhook com:

**Headers:**
- `Content-Type: application/json`
- `X-Event-Type`: tipo do evento (`message`, `connection`, `qr`)
- `X-Session-ID`: ID da sessão
- `User-Agent`: `WhatsAppModule/1.0`

**Body (JSON):**
```json
{
  "event": "message",
  "sessionId": "main-session",
  "timestamp": "2025-02-06T12:00:00.000Z",
  "data": { ... }
}
```

### Evento `message`

`data` tem a estrutura do Baileys (biblioteca WhatsApp):

```json
{
  "messages": [
    {
      "key": {
        "remoteJid": "5511999999999@s.whatsapp.net",
        "fromMe": false,
        "id": "MSG_ID"
      },
      "message": {
        "conversation": "Texto da mensagem"
      },
      "messageTimestamp": "1234567890"
    }
  ],
  "type": "notify"
}
```

- **Para identificar o chat e responder:** use `key.remoteJid` como destinatário. Pode enviar como `5511999999999` (sem sufixo) na API de envio; a API normaliza para JID.
- **Para saber se foi enviada por você:** `key.fromMe === true`.
- **Conteúdo de texto:** em `message.conversation` ou, em alguns tipos, em `message.extendedTextMessage.text`. Mensagens de mídia têm outras chaves em `message`.

### Evento `connection`

```json
{
  "event": "connection",
  "sessionId": "main-session",
  "timestamp": "...",
  "data": {
    "status": "connected",
    "info": { ... }
  }
}
```

Ou `status: "disconnected"` com `reason`.

### Evento `qr`

```json
{
  "event": "qr",
  "sessionId": "main-session",
  "timestamp": "...",
  "data": {
    "qr": "string_do_qrcode_base64_ou_dataurl"
  }
}
```

---

## 6. Fluxo recomendado para o agente: receber e enviar mensagens

1. **Autenticar:** `POST /auth/login` → guardar `token`.
2. **Verificar sessão:** `GET /session/main-session/status`. Se não estiver conectada, usar `POST /session/main-session/connect` e exibir/processar o QR.
3. **Registrar webhook:** `POST /session/main-session/webhooks` com a URL do sistema do agente e `events: ["message"]` (e outros se precisar).
4. **Receber mensagens:** o servidor do agente expõe um endpoint (ex.: `POST /webhook/whatsapp`) que recebe o body descrito acima. Para cada `event === "message"`, percorrer `data.messages`, ler `key.remoteJid` e o texto em `message.conversation` (ou equivalente).
5. **Responder ao usuário:** usar `POST /session/main-session/message/text` com:
   - `to`: número extraído de `remoteJid` (ex.: `5511999999999` removendo `@s.whatsapp.net`),
   - `message`: texto da resposta.
6. **Opcional:** consultar histórico com `GET /session/main-session/messages?limit=50`.

---

## 7. Resumo rápido de endpoints

| Ação                    | Método | Endpoint                                      | Auth |
|-------------------------|--------|-----------------------------------------------|------|
| Login                   | POST   | `/auth/login`                                 | Não  |
| Listar sessões          | GET    | `/sessions`                                   | Sim  |
| Status da sessão        | GET    | `/session/:sessionId/status`                  | Sim  |
| Conectar (QR)           | POST   | `/session/:sessionId/connect`                 | Sim  |
| Enviar texto            | POST   | `/session/:sessionId/message/text`            | Sim  |
| Listar mensagens        | GET    | `/session/:sessionId/messages`                | Sim  |
| Registrar webhook       | POST   | `/session/:sessionId/webhooks`               | Sim  |
| Listar webhooks         | GET    | `/session/:sessionId/webhooks`                | Sim  |
| Remover webhook         | DELETE | `/session/:sessionId/webhooks/:webhookId`    | Sim  |
| QR Code (página)        | GET    | `/session/:sessionId/qr-code`                 | Não  |

**Session ID padrão:** `main-session` (pode ser outro se criado via `POST /sessions`).

---

## 8. Exemplo de código (pseudo) para o agente

```text
# 1. Login
POST /auth/login
Body: {"email":"admin@admin.com","password":"admin"}
→ token = response.token

# 2. Registrar webhook (URL do meu servidor)
POST /session/main-session/webhooks
Headers: Authorization: Bearer {token}
Body: {"url":"https://meu-servidor.com/wa-webhook","events":["message"]}

# 3. No meu endpoint POST /wa-webhook (quando receber uma mensagem):
payload = body do request
if payload.event == "message":
  for msg in payload.data.messages:
    if msg.key.fromMe: continue
    chat_id = msg.key.remoteJid   # ex: 5511999999999@s.whatsapp.net
    text = msg.message.conversation ou msg.message.extendedTextMessage.text
    # Gerar resposta (ex.: com LLM)
    reply = meu_agente.responder(text)
    # Enviar resposta
    POST /session/main-session/message/text
    Headers: Authorization: Bearer {token}
    Body: {"to": chat_id.replace("@s.whatsapp.net",""), "message": reply}
```

Com isso, o agente de IA consegue usar a API para autenticar, configurar webhooks, receber mensagens dos usuários via POST no webhook e enviar respostas usando o endpoint de mensagem de texto.
