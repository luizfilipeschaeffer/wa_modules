# WA-Module

Universal WhatsApp client for Node.js — framework-agnostic, TypeScript-first.

[![npm version](https://img.shields.io/npm/v/wa-module.svg)](https://www.npmjs.com/package/wa-module)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- **Framework-agnostic** — Express, NestJS, Fastify or plain Node
- **TypeScript** — Full types and IntelliSense
- **Multi-session** — Multiple WhatsApp connections
- **Storage** — Memory, File, PostgreSQL (Prisma), MySQL, MongoDB, Redis
- **Events** — Messages, connection, groups, status
- **API** — Text, media, buttons, lists, groups, auto-reconnect

## Install

```bash
npm install wa-module
```

## Quick start

**First time?** Use **[Start-Here.md](Start-Here.md)** for full setup (API, Docker, DB).

Minimal example:

```typescript
import { WhatsAppClient, MemoryStorage } from 'wa-module';

const client = new WhatsAppClient({
  sessionId: 'my-session',
  storage: new MemoryStorage(),
  qrcode: { terminal: true }
});

client.on('qr', (qr) => console.log('Scan QR:', qr));
client.on('connected', () => console.log('Connected'));
client.on('message', async (msg) => {
  if (msg.body === '!ping') await client.sendText({ to: msg.chatId, text: 'Pong!' });
});

await client.connect();
```

## Docs

| Link | Description |
|------|-------------|
| [Start-Here.md](Start-Here.md) | Setup (dev + production) |
| [docs/getting-started.md](docs/getting-started.md) | Getting started |
| [docs/api_usage.md](docs/api_usage.md) | API usage |
| [docs/DOCKER.md](docs/DOCKER.md) | Docker & PostgreSQL |
| [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) | Contributing |

## Status

**Alpha** — Core stable; API may change before 1.0.

## License

MIT — see [LICENSE](LICENSE).  
Unofficial WhatsApp client; use at your own risk.

---

Based on [Ticketz](https://github.com/ticketz-oss/ticketz) and [libzapitu-rf](https://github.com/ookamiiixd/baileys).  
By [Luiz Filipe Schaeffer](https://github.com/luizfilipeschaeffer).
