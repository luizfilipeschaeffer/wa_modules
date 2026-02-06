# Release Notes - v0.1.0-alpha (Foundation & Storage)

## Funcionalidades Implementadas
- Estrutura completa do projeto TypeScript.
- Configuração de Linting e Formatting.
- Sistema de Storage plugável (`IStorage`).
- Implementações de Storage:
  - `MemoryStorage` (Dev/Testes)
  - `FileStorage` (Simples)
  - `PrismaStorageAdapter` (Produção com SQL)
- Configuração do Docker Compose para PostgreSQL.
- Schema do Prisma inicial (`Session`, `Message`, `Contact`).
- `WhatsAppClient` base com conexão via Baileys.
- `SessionManager` para autenticação persistente.

## Como Rodar o Ambiente de Desenvolvimento
1.  **Instalar dependências**: `npm install`
2.  **Subir o banco de dados**: `docker compose up -d`
3.  **Sincronizar o Schema**: `npx prisma db push`
4.  **Buildar o projeto**: `npm run build`

## Uso do Prisma Adapter
Para integrar com uma aplicação existente que já usa Prisma:

```typescript
import { PrismaClient } from '@prisma/client';
import { WhatsAppClient, PrismaStorageAdapter } from 'wa-module';

// Use o client da sua aplicação
const prisma = new PrismaClient();

const client = new WhatsAppClient({
  sessionId: 'my-session',
  storage: new PrismaStorageAdapter(prisma), // Injete aqui
  // ...
});
```

Se a aplicação não tiver os modelos `Session` no schema, adicione o conteúdo de `prisma/schema.prisma` ao `schema.prisma` da aplicação principal.
