# Getting Started with WA-Module

This guide will help you get started with WA-Module quickly.

## Installation

```bash
npm install wa-module
```

## Basic Setup

### 1. Import the Module

```typescript
import { WhatsAppClient, MemoryStorage } from 'wa-module';
```

### 2. Create a Client

```typescript
const client = new WhatsAppClient({
  sessionId: 'my-session',
  storage: new MemoryStorage(),
  qrcode: {
    terminal: true  // Display QR code in terminal
  }
});
```

### 3. Listen for Events

```typescript
// QR Code event
client.on('qr', (qr) => {
  console.log('Scan this QR code:', qr);
});

// Connected event
client.on('connected', (session) => {
  console.log('Connected!', session);
});

// Message event
client.on('message', async (message) => {
  console.log('New message:', message.body);
});
```

### 4. Connect

```typescript
await client.connect();
```

## Complete Example

```typescript
import { WhatsAppClient, MemoryStorage } from 'wa-module';

async function main() {
  const client = new WhatsAppClient({
    sessionId: 'my-bot',
    storage: new MemoryStorage(),
    qrcode: { terminal: true }
  });

  client.on('qr', (qr) => {
    console.log('Scan QR:', qr);
  });

  client.on('connected', (session) => {
    console.log('Connected as:', session.phoneNumber);
  });

  client.on('message', async (message) => {
    if (message.body === '!ping') {
      await client.sendText({
        to: message.chatId,
        text: 'Pong!'
      });
    }
  });

  await client.connect();
}

main();
```

## Storage Options

### Memory Storage (Development)

Data is stored in memory and lost when the process ends.

```typescript
import { MemoryStorage } from 'wa-module';

const storage = new MemoryStorage();
```

### File Storage (Simple Persistence)

Data is stored in JSON files.

```typescript
import { FileStorage } from 'wa-module';

const storage = new FileStorage('./sessions');
```

### Database Storage (Production)

For production, use a database adapter:

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

## Sending Messages

### Text Message

```typescript
await client.sendText({
  to: '5511999999999',
  text: 'Hello, World!'
});
```

### Media Message

```typescript
await client.sendMedia({
  to: '5511999999999',
  media: './image.jpg',
  type: 'image',
  caption: 'Check this out!'
});
```

### Location

```typescript
await client.sendLocation({
  to: '5511999999999',
  latitude: -23.5505,
  longitude: -46.6333,
  name: 'São Paulo',
  address: 'São Paulo, Brazil'
});
```

## Next Steps

- [API Reference](api-reference.md) - Complete API documentation
- [Events](events.md) - All available events
- [Examples](../examples/) - More examples
- [Storage](storage.md) - Storage adapter details
- [Plugins](plugins.md) - Extending functionality

## Common Issues

### QR Code Not Showing

Make sure you have `qrcode.terminal` set to `true` in your config.

### Connection Timeout

Increase the timeout in connection config:

```typescript
const client = new WhatsAppClient({
  sessionId: 'my-session',
  storage: new MemoryStorage(),
  connection: {
    timeout: 120000  // 2 minutes
  }
});
```

### Session Not Persisting

Use FileStorage or a database adapter instead of MemoryStorage.

## Need Help?

- Check the [FAQ](faq.md)
- Open an [issue](https://github.com/luizfilipeschaeffer/wa-module/issues)
- Join our [discussions](https://github.com/luizfilipeschaeffer/wa-module/discussions)
