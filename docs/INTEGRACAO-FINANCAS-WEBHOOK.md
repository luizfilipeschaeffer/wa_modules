# Integração Financas ↔ wa-modules via Webhook

Este documento descreve como conectar o projeto **Financas** ao **wa-modules** usando webhooks em ambas as direções: **wa-modules envia mensagens recebidas** para o Financas e **Financas envia respostas** de volta pelo WhatsApp via API do wa-modules.

---

## Visão geral

```
[WhatsApp] ←→ [wa-modules] ←→ [Financas]
                    │
                    ├── Webhook (POST): mensagens recebidas → Financas
                    └── API de envio: Financas envia resposta → wa-modules → WhatsApp
```

- **wa-modules**: recebe mensagens do WhatsApp e envia para URLs de webhook configuradas (evento `message`).
- **Financas**: expõe `POST /api/webhooks/messages` para receber mensagens e adicionar contas no formato `conta [descrição] [valor]`; opcionalmente envia resposta ao usuário via variáveis de ambiente (`MESSAGING_SEND_*`).

---

## Parte 1: Cadastrar o webhook do Financas no wa-modules

Assim que uma mensagem chegar na sessão WhatsApp do wa-modules, ele fará um POST na URL que você configurar. Essa URL deve ser o endpoint de webhook do Financas.

### 1.1 URL do webhook do Financas

O Financas espera receber mensagens em:

- **URL:** `https://<DOMINIO_DO_FINANCAS>/api/webhooks/messages`
- **Método:** `POST`
- **Exemplo:** `https://meu-financas.vercel.app/api/webhooks/messages`

A URL precisa ser acessível pela internet (o wa-modules faz a requisição a partir do servidor onde está rodando). Em desenvolvimento local, use um túnel (ngrok, Cloudflare Tunnel, etc.) e configure essa URL no wa-modules.

### 1.2 Cadastro pela interface (Dashboard)

1. Acesse o dashboard do wa-modules: `http://localhost:3000/dashboard.html` (ou a URL do seu deploy).
2. Faça login (credenciais configuradas no wa-modules).
3. Vá em **API & Webhooks** (`/api-webhooks.html`).
4. Na seção **Webhooks**, localize a **sessão** do WhatsApp que você quer usar (ex.: `default` ou o `sessionId` que você criou).
5. Clique em **+ Add webhook**.
6. Preencha:
   - **URL:** `https://<DOMINIO_DO_FINANCAS>/api/webhooks/messages`
   - **Eventos:** marque pelo menos **message** (para receber mensagens).
7. Clique em **Add Webhook**.

A partir daí, toda mensagem recebida nessa sessão será enviada em POST para a URL do Financas.

### 1.3 Cadastro pela API (com JWT)

Se preferir registrar o webhook por código ou script:

```http
POST /session/{sessionId}/webhooks
Authorization: Bearer <SEU_JWT>
Content-Type: application/json

{
  "url": "https://<DOMINIO_DO_FINANCAS>/api/webhooks/messages",
  "events": ["message"]
}
```

- `sessionId`: ID da sessão WhatsApp no wa-modules (ex.: `default`).
- JWT: obtido pelo login na API do wa-modules (ex.: `POST /auth/login`).

---

## Parte 2: Formato do payload que o wa-modules envia

O wa-modules envia um único POST por evento. Para o evento **message**, o corpo é um JSON no formato:

```json
{
  "event": "message",
  "sessionId": "default",
  "timestamp": "2025-02-06T12:00:00.000Z",
  "data": {
    "messages": [
      {
        "key": {
          "remoteJid": "5511999999999@s.whatsapp.net",
          "fromMe": false,
          "id": "..."
        },
        "message": {
          "conversation": "conta Supermercado 150,50"
        }
      }
    ],
    "type": "notify"
  }
}
```

- **Remetente (telefone):** em cada item de `data.messages[]` use `key.remoteJid` (ex.: `5511999999999@s.whatsapp.net`). Para comparar com o cadastro do usuário, normalize removendo o sufixo `@s.whatsapp.net` e use apenas o número (ex.: `5511999999999`).
- **Texto da mensagem:** em `message.conversation` (mensagem de texto simples) ou em `message.extendedTextMessage.text` (texto com formatação).

O projeto **Financas** já pode aceitar esse formato (a partir da atualização que inclui o payload do wa-modules no `extractPayload`). Não é necessário alterar nada no wa-modules para isso.

---

## Parte 3: Configurar o Financas para receber do wa-modules

### 3.1 Variáveis de ambiente no Financas

No projeto Financas (ex.: Vercel → Environment Variables), configure:

| Variável | Descrição |
|----------|-----------|
| `WEBHOOK_MESSAGES_SECRET` | (Opcional) Se definido, o webhook exige o header `X-Webhook-Secret` com esse valor. No wa-modules não há como enviar esse header hoje; deixe vazio ou implemente envio do header no wa-modules se precisar de segredo. |
| `MESSAGING_SEND_ENDPOINT` | URL da API do wa-modules para **enviar** mensagem (ver seção 4). |
| `MESSAGING_SEND_TOKEN` | JWT do wa-modules (Bearer) para autenticar o envio. |

Para **apenas receber** mensagens e não responder pelo WhatsApp, `MESSAGING_SEND_*` podem ficar vazios; o Financas só não enviará a resposta “Compra adicionada com sucesso!” etc.

### 3.2 Aceitar o payload do wa-modules no Financas

O endpoint `POST /api/webhooks/messages` do Financas deve reconhecer o payload do wa-modules. O código em `src/app/api/webhooks/messages/route.ts` foi ajustado para:

- Detectar quando o body tem `event`, `sessionId` e `data.messages` (formato wa-modules).
- Extrair do **primeiro** item de `data.messages`:
  - **from:** `key.remoteJid` (normalizado sem `@s.whatsapp.net`).
  - **text:** `message.conversation` ou `message.extendedTextMessage?.text`.

Assim, o mesmo endpoint continua compatível com formatos genéricos (`from`/`body` ou `sender`/`message.text`) e com o formato do wa-modules.

---

## Parte 4: Fazer o Financas responder pelo WhatsApp (wa-modules)

Para o Financas enviar mensagens de volta ao usuário (ex.: “Compra adicionada com sucesso!”), ele precisa chamar a **API de envio** do wa-modules.

### 4.1 API de envio do wa-modules

- **Endpoint:** `POST /session/{sessionId}/message/text`
- **Autenticação:** `Authorization: Bearer <JWT>`
- **Body:**
  ```json
  {
    "to": "5511999999999",
    "message": "Compra adicionada com sucesso!"
  }
  ```
- `to`: número no formato internacional sem `@s.whatsapp.net` (ex.: `5511999999999`).
- `sessionId`: mesma sessão em que o webhook está configurado (ex.: `default`).

O JWT é o mesmo usado para outras rotas protegidas do wa-modules (obtido no login).

### 4.2 Configuração no Financas

Defina no Financas:

- **MESSAGING_SEND_ENDPOINT:** URL completa do envio no wa-modules, por exemplo:
  - `https://wa-modules.seudominio.com/session/default/message/text`
- **MESSAGING_SEND_TOKEN:** token JWT do wa-modules (Bearer).

O código atual do Financas envia no body `{ number, body, saveOnTicket, linkPreview }` (formato LetsZap). Para usar o wa-modules é necessário que o Financas envie no formato da API do wa-modules: `{ to: number, message: body }` e `Authorization: Bearer <token>`.

**Exemplo de adaptação no Financas** (em `sendMessage`): defina por exemplo `MESSAGING_PROVIDER=wa-modules` e use:

- Se `MESSAGING_PROVIDER === "wa-modules"`:  
  - Body: `{ to: number, message }` (em vez de `{ number, body, ... }`).  
  - Header: `Authorization: Bearer ${MESSAGING_SEND_TOKEN}` (já é assim no código atual).
- Caso contrário: manter o body atual `{ number, body: message, saveOnTicket, linkPreview }`.

Assim o mesmo endpoint e token servem para LetsZap e para wa-modules, trocando só o provider e o corpo da requisição.

---

## Resumo do fluxo

1. **Usuário** envia no WhatsApp: `conta Supermercado 150,50`.
2. **wa-modules** recebe a mensagem na sessão e dispara o webhook (POST) para `https://<FINANCAS>/api/webhooks/messages` com o payload descrito na Parte 2.
3. **Financas** recebe o POST, extrai `from` e texto (incluindo formato wa-modules), valida usuário por telefone, interpreta “conta …” com `parseContaMessage`, grava a transação e, se `MESSAGING_SEND_*` estiver configurado para o wa-modules, chama `POST .../session/<sessionId>/message/text` com `to` e `message`.
4. **wa-modules** envia a resposta pelo WhatsApp para o usuário.

---

## Checklist rápido

- [ ] wa-modules rodando e sessão WhatsApp conectada.
- [ ] Financas em deploy (ou URL acessível via túnel) com `POST /api/webhooks/messages` funcionando.
- [ ] Webhook cadastrado no wa-modules com URL do Financas e evento **message**.
- [ ] Financas atualizado para aceitar payload do wa-modules em `extractPayload` (já feito nesta integração).
- [ ] (Opcional) No Financas: `MESSAGING_SEND_ENDPOINT` e `MESSAGING_SEND_TOKEN` apontando para a API de envio do wa-modules; `sendMessage` adaptado para enviar `{ to, message }` e Bearer quando usar wa-modules.

Com isso, a integração Financas ↔ wa-modules via webhook fica completa nas duas direções.
