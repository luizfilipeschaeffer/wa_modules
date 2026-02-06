# 🐳 Docker Deployment Guide

Este guia explica como executar a aplicação WhatsApp API usando Docker.

## 📋 Pré-requisitos

- Docker instalado (versão 20.10+)
- Docker Compose instalado (versão 2.0+)

## 🚀 Início Rápido

### 1. Build e Start dos Containers

```bash
# Build e inicia todos os serviços
docker-compose up -d --build
```

### 2. Verificar Status

```bash
# Ver logs
docker-compose logs -f

# Ver apenas logs da API
docker-compose logs -f api

# Verificar status dos containers
docker-compose ps
```

### 3. Acessar a Aplicação

- **Web Interface**: http://localhost:3000
- **Swagger API Docs**: http://localhost:3000/docs
- **Health Check**: http://localhost:3000/health

**Credenciais padrão:**
- Email: `admin@admin.com`
- Senha: `admin`

## 🗂️ Estrutura dos Serviços

### PostgreSQL (`postgres`)
- **Porta no host**: 5433 (evita conflito com Postgres na 5432)
- **Database**: whatsapp_db
- **User**: postgres
- **Password**: postgres
- **Volume**: `postgres_data` (persiste dados do banco)

### API (`api`)
- **Porta**: 3000
- **Volumes**:
  - `wa_sessions`: Dados de sessão do WhatsApp
  - `wa_uploads`: Arquivos enviados

## ⚙️ Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto para customizar:

```env
# JWT Secret (altere em produção!)
JWT_SECRET=seu_secret_super_seguro_aqui

# Session ID padrão
DEFAULT_SESSION_ID=main-session

# Database (já configurado no docker-compose)
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/whatsapp_db
```

## 🔧 Comandos Úteis

### Parar os containers
```bash
docker-compose down
```

### Parar e remover volumes (⚠️ apaga dados!)
```bash
docker-compose down -v
```

### Rebuild da API (após mudanças no código)
```bash
docker-compose up -d --build api
```

### Acessar shell do container da API
```bash
docker exec -it wa_api sh
```

### Executar migrations manualmente
```bash
docker exec -it wa_api npx prisma migrate deploy
```

### Ver logs em tempo real
```bash
docker-compose logs -f api
```

## 📊 Volumes Persistentes

Os seguintes dados são persistidos em volumes Docker:

1. **postgres_data**: Banco de dados PostgreSQL
2. **wa_sessions**: Sessões autenticadas do WhatsApp
3. **wa_uploads**: Arquivos enviados via API

Para backup, você pode usar:
```bash
# Backup do banco de dados
docker exec wa_postgres pg_dump -U postgres whatsapp_db > backup.sql

# Restaurar backup
docker exec -i wa_postgres psql -U postgres whatsapp_db < backup.sql
```

## 🔍 Troubleshooting

### Não consigo conectar ao PostgreSQL (cliente SQL ou aplicação no host)

O compose expõe o Postgres na porta **5433** no host (para não conflitar com Postgres instalado na 5432).

**Use sempre estes dados para conectar do seu PC (cliente SQL ou projeto):**

| Campo     | Valor        |
|----------|--------------|
| Host     | `127.0.0.1`  |
| Porta    | `5433`       |
| Usuário  | `postgres`   |
| Senha    | `postgres`   |
| Database | `whatsapp_db`|

**Se ainda falhar:**

1. **Recrear o container** (para aplicar o binding em 127.0.0.1):
   ```bash
   cd docker
   docker compose down
   docker compose up -d
   ```

2. **Verificar se a porta está em uso** por outro programa (ex.: PostgreSQL instalado no Windows):
   ```powershell
   Get-NetTCPConnection -LocalPort 5433
   ```
   Se outro processo usar a 5433, altere no `docker-compose.yml` para outra porta (ex.: `5434:5432`).

3. **Testar conexão dentro do container:**
   ```bash
   docker exec -it wa_postgres psql -U postgres -d whatsapp_db -c "SELECT 1;"
   ```

### Container não inicia
```bash
# Ver logs detalhados
docker-compose logs api

# Verificar se o PostgreSQL está pronto
docker-compose logs postgres
```

### Resetar tudo
```bash
# Para e remove containers, redes e volumes
docker-compose down -v

# Rebuild do zero
docker-compose up -d --build
```

### Porta 3000 já em uso
Edite `docker-compose.yml` e altere a porta:
```yaml
ports:
  - "3001:3000"  # Usa porta 3001 no host
```

## 🌐 Produção

Para produção, considere:

1. **Alterar senhas padrão** no `.env`
2. **Usar HTTPS** com reverse proxy (nginx/traefik)
3. **Configurar backups automáticos** dos volumes
4. **Monitorar logs** com ferramentas como Grafana/Loki
5. **Limitar recursos** dos containers:

```yaml
api:
  deploy:
    resources:
      limits:
        cpus: '1'
        memory: 1G
```

## 📝 Notas

- O primeiro start pode demorar alguns minutos para build da imagem
- As migrations são executadas automaticamente no start
- O usuário admin é criado automaticamente no primeiro start
- Os dados do WhatsApp são persistidos mesmo após restart dos containers
