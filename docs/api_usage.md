# Exemplos de Uso da API

Abaixo estão exemplos de comandos `curl` para interagir com a API do Módulo WhatsApp.

**Base URL**: `http://localhost:3000`
**Session ID Padrão**: `main-session`

---

## 1. Verificar Status da Sessão

Verifique se a sessão está conectada.

```bash
curl -X GET http://localhost:3000/session/main-session/status
```

## 2. Iniciar Conexão (Gerar QR Code)

Se não estiver conectado, inicie o processo. O QR Code estará disponível no log ou na rota dedicada.

```bash
curl -X POST http://localhost:3000/session/main-session/connect
```

## 3. Enviar Mensagem de Texto

Substitua `5511999999999` pelo número de destino (com código do país e DDD).

```bash
curl -X POST http://localhost:3000/session/main-session/message/text \
  -H "Content-Type: application/json" \
  -d '{
    "to": "5511999999999",
    "message": "👋 Olá! Esta é uma mensagem de teste enviada via API."
  }'
```

## 4. Registrar Webhook

Cadastre um webhook para receber eventos (mensagens, conexão) em tempo real.

```bash
curl -X POST http://localhost:3000/session/main-session/webhooks \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://webhook.site/sua-url-aqui",
    "events": ["message", "connection"]
  }'
```

## 5. Listar Webhooks

Veja quais webhooks estão cadastrados.

```bash
curl -X GET http://localhost:3000/session/main-session/webhooks
```
