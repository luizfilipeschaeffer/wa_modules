# 📱 WA-Module

> **Universal WhatsApp Client for Node.js** - Framework-agnostic module for complete WhatsApp integration

[![npm version](https://img.shields.io/npm/v/wa-module.svg)](https://www.npmjs.com/package/wa-module)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue.svg)](https://www.typescriptlang.org/)

---

## 🚀 Quick Start

**New to WA-Module?** Start here: **[Start-Here.md](Start-Here.md)** - Complete setup guide for development and production.

---

## 🚀 Features

- ✅ **Framework-Agnostic** - Works with Express, NestJS, Fastify, or any Node.js framework
- ✅ **TypeScript First** - Full type safety and IntelliSense support
- ✅ **Multi-Session** - Manage multiple WhatsApp connections simultaneously
- ✅ **Flexible Storage** - Built-in support for Memory, File, PostgreSQL, MySQL, MongoDB, and Redis
- ✅ **Event-Driven** - Comprehensive event system for real-time updates
- ✅ **Plugin System** - Extend functionality with custom plugins
- ✅ **Complete API** - Send text, media, locations, contacts, buttons, lists, and more
- ✅ **Group Management** - Create and manage WhatsApp groups
- ✅ **Status/Stories** - Post and view WhatsApp statuses
- ✅ **Auto-Reconnect** - Automatic reconnection with exponential backoff
- ✅ **Rate Limiting** - Built-in protection against spam and bans

## 📦 Installation

```bash
npm install wa-module
```

Or with yarn:

```bash
yarn add wa-module
```

## 🎯 Quick Start

```typescript
import { WhatsAppClient, MemoryStorage } from 'wa-module';

const client = new WhatsAppClient({
  sessionId: 'my-session',
  storage: new MemoryStorage(),
  qrcode: {
    terminal: true
  }
});

// Listen for QR Code
client.on('qr', (qr) => {
  console.log('Scan this QR code:', qr);
});

// Listen for connection
client.on('connected', (session) => {
  console.log('Connected!', session);
});

// Listen for messages
client.on('message', async (message) => {
  console.log('New message:', message.body);

  if (message.body === '!ping') {
    await client.sendText({
      to: message.chatId,
      text: 'Pong! 🏓'
    });
  }
});

// Connect
await client.connect();
```

## 📚 Documentation

- [Getting Started](docs/getting-started.md)
- [API Reference](docs/api-reference.md)
- [Events](docs/events.md)
- [Storage Adapters](docs/storage.md)
- [Plugins](docs/plugins.md)
- [Examples](examples/)

## 🔌 Storage Options

### Memory Storage (Development)

```typescript
import { MemoryStorage } from 'wa-module';

const storage = new MemoryStorage();
```

### File Storage (Simple Persistence)

```typescript
import { FileStorage } from 'wa-module';

const storage = new FileStorage('./sessions');
```

### PostgreSQL (Production)

```typescript
import { PostgresStorageAdapter } from 'wa-module/adapters';

const storage = new PostgresStorageAdapter({
  host: 'localhost',
  port: 5432,
  database: 'whatsapp',
  user: 'postgres',
  password: 'postgres'
});
```

## 💬 Sending Messages

### Text Messages

```typescript
await client.sendText({
  to: '5511999999999',
  text: 'Hello, World!'
});
```

### Media Messages

```typescript
await client.sendMedia({
  to: '5511999999999',
  media: './image.jpg', // or Buffer
  type: 'image',
  caption: 'Check this out!'
});
```

### Buttons

```typescript
await client.sendButtons({
  to: '5511999999999',
  text: 'Choose an option:',
  buttons: [
    { id: '1', text: 'Option 1' },
    { id: '2', text: 'Option 2' },
    { id: '3', text: 'Option 3' }
  ]
});
```

### Lists

```typescript
await client.sendList({
  to: '5511999999999',
  title: 'Menu',
  buttonText: 'View Options',
  sections: [
    {
      title: 'Main Menu',
      rows: [
        { id: '1', title: 'Option 1', description: 'Description 1' },
        { id: '2', title: 'Option 2', description: 'Description 2' }
      ]
    }
  ]
});
```

## 👥 Group Management

```typescript
// Create group
const group = await client.createGroup({
  name: 'My Group',
  participants: ['5511999999999', '5511888888888']
});

// Add participants
await client.addGroupParticipants(group.id, ['5511777777777']);

// Send message to group
await client.sendText({
  to: group.id,
  text: 'Hello, everyone!'
});
```

## 🎭 Events

```typescript
// Connection events
client.on('qr', (qr) => console.log('QR:', qr));
client.on('connected', (session) => console.log('Connected:', session));
client.on('disconnected', (reason) => console.log('Disconnected:', reason));

// Message events
client.on('message', (message) => console.log('Message:', message));
client.on('message:sent', (message) => console.log('Sent:', message));
client.on('message:received', (message) => console.log('Received:', message));

// Group events
client.on('group:created', (group) => console.log('Group created:', group));
client.on('group:participant:added', (data) => console.log('Participant added:', data));
```

## 🔌 Framework Integration

### Express

```typescript
import express from 'express';
import { WhatsAppClient, FileStorage } from 'wa-module';

const app = express();
const client = new WhatsAppClient({
  sessionId: 'express-session',
  storage: new FileStorage()
});

app.post('/send', async (req, res) => {
  const { to, text } = req.body;
  const result = await client.sendText({ to, text });
  res.json(result);
});

await client.connect();
app.listen(3000);
```

### NestJS

```typescript
import { Injectable } from '@nestjs/common';
import { WhatsAppClient, FileStorage } from 'wa-module';

@Injectable()
export class WhatsAppService {
  private client: WhatsAppClient;

  constructor() {
    this.client = new WhatsAppClient({
      sessionId: 'nestjs-session',
      storage: new FileStorage()
    });
    this.client.connect();
  }

  async sendMessage(to: string, text: string) {
    return this.client.sendText({ to, text });
  }
}
```

## 🧩 Plugins

```typescript
import { AutoReplyPlugin } from 'wa-module/plugins';

const autoReply = new AutoReplyPlugin([
  {
    type: 'exact',
    trigger: 'hello',
    reply: 'Hi there! How can I help you?'
  }
]);

client.use(autoReply);
```

## 🛠️ Development Status

This module is currently in **alpha** stage. The API is stable but may change before 1.0.0 release.

- ✅ Core functionality
- ✅ Message sending/receiving
- ✅ Media support
- ✅ Group management
- ✅ Storage system
- 🚧 Database adapters (PostgreSQL, MySQL, MongoDB)
- 🚧 Plugin system
- 🚧 Comprehensive documentation
- 🚧 Test coverage

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details

## 🙏 Credits

This module is based on the excellent work from:
- [Ticketz](https://github.com/ticketz-oss/ticketz) - Original implementation
- [libzapitu-rf](https://github.com/ookamiiixd/baileys) - Baileys fork for WhatsApp Web protocol

## ⚠️ Disclaimer

This is an unofficial WhatsApp client. Use at your own risk. WhatsApp may ban accounts that use unofficial clients.

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](docs/CONTRIBUTING.md) for details.

## 📞 Support

- 📖 [Documentation](docs/)
- 📋 [Product Requirements Document](docs/PRD.md)
- 🐳 [Docker Guide](docs/DOCKER.md)
- 📝 [Changelog](docs/CHANGELOG.md)
- 🐛 [Issue Tracker](https://github.com/luizfilipeschaeffer/wa-module/issues)
- 💬 [Discussions](https://github.com/luizfilipeschaeffer/wa-module/discussions)

---

Made with ❤️ by [Luiz Filipe Schaeffer](https://github.com/luizfilipeschaeffer)
