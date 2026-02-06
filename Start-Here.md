# 🚀 Start Here - WA-Module Setup Guide

> **Quick start guide for setting up WA-Module in development and production environments**

---

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Development Setup](#development-setup)
- [Production Setup](#production-setup)
- [First Steps After Setup](#first-steps-after-setup)
- [Troubleshooting](#troubleshooting)

---

## ✅ Prerequisites

### Required

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **PostgreSQL** 14+ (or Docker)
- **Git** ([Download](https://git-scm.com/))

### Optional

- **Docker** & **Docker Compose** (recommended for production)

---

## 💻 Development Setup

### Option 1: Local Development (Recommended)

#### 1. Clone & Install

```powershell
# Clone repository
git clone https://github.com/luizfilipeschaeffer/wa-module.git
cd wa-module

# Install dependencies
npm install
```

#### 2. Setup PostgreSQL with Docker

```powershell
# Start PostgreSQL only
.\docker-compose.ps1 up -d postgres

# Wait for PostgreSQL to be ready (~10 seconds)
```

#### 3. Configure Environment

```powershell
# Copy environment template
Copy-Item .env.example .env

# Edit .env with your settings (optional, defaults work)
```

**Default `.env` for local development:**
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/whatsapp_db"
JWT_SECRET="supersecret"
DEFAULT_SESSION_ID="main-session"
LOG_LEVEL="info"
```

#### 4. Setup Database

```powershell
# Generate Prisma Client
npx prisma generate

# Sync database schema
npx prisma db push

# Seed initial data (creates admin user)
npx prisma db seed
```

#### 5. Start Development Server

```powershell
# Start API in development mode
npm run start:api
```

**Server will start at:**
- 🌐 API: http://localhost:3000
- 📚 Swagger: http://localhost:3000/docs
- 🖥️ Dashboard: http://localhost:3000/dashboard.html

#### 6. Login to Dashboard

**Default credentials:**
- Email: `admin@admin.com`
- Password: `admin`

---

### Option 2: Full Docker Development

```powershell
# Start everything (PostgreSQL + API)
.\docker-compose.ps1 up -d

# View logs
.\docker-compose.ps1 logs -f

# Access at http://localhost:3000
```

---

## 🏭 Production Setup

### Option 1: Docker Compose (Recommended)

#### 1. Clone Repository

```bash
git clone https://github.com/luizfilipeschaeffer/wa-module.git
cd wa-module
```

#### 2. Configure Environment

```bash
# Copy and edit environment file
cp .env.example .env
nano .env  # or vim, vi, etc.
```

**Production `.env` example:**
```env
DATABASE_URL="postgresql://postgres:STRONG_PASSWORD@postgres:5432/whatsapp_db"
JWT_SECRET="CHANGE_THIS_TO_RANDOM_STRING"
DEFAULT_SESSION_ID="main-session"
LOG_LEVEL="info"
NODE_ENV="production"
```

> ⚠️ **IMPORTANT**: Change `JWT_SECRET` and database password!

#### 3. Start Services

```bash
# Build and start
cd docker
docker-compose up -d

# Check logs
docker-compose logs -f

# Check status
docker-compose ps
```

#### 4. Initialize Database

```bash
# Enter API container
docker-compose exec api sh

# Run migrations and seed
npx prisma db push
npx prisma db seed

# Exit container
exit
```

#### 5. Access Application

- API: `http://your-server:3000`
- Dashboard: `http://your-server:3000/dashboard.html`

---

### Option 2: Manual Production Setup

#### 1. Install Dependencies

```bash
# Install Node.js dependencies
npm ci --only=production

# Build TypeScript
npm run build
```

#### 2. Setup PostgreSQL

```bash
# Install PostgreSQL (Ubuntu/Debian)
sudo apt update
sudo apt install postgresql postgresql-contrib

# Create database
sudo -u postgres psql
CREATE DATABASE whatsapp_db;
CREATE USER whatsapp WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE whatsapp_db TO whatsapp;
\q
```

#### 3. Configure Environment

```bash
cp .env.example .env
nano .env
```

Update `DATABASE_URL` with your PostgreSQL credentials.

#### 4. Setup Database Schema

```bash
npx prisma generate
npx prisma db push
npx prisma db seed
```

#### 5. Start with PM2

```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start dist/api/server.js --name wa-module

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

---

## 🎯 First Steps After Setup

### 1. Login to Dashboard

Navigate to `http://localhost:3000/dashboard.html`

**Credentials:**
- Email: `admin@admin.com`
- Password: `admin`

### 2. Connect WhatsApp Session

1. Click **"Connect"** on the `main-session`
2. Scan the QR code with WhatsApp:
   - Open WhatsApp on your phone
   - Go to **Settings** → **Linked Devices**
   - Tap **"Link a Device"**
   - Scan the QR code displayed

3. Wait for connection (status will change to **"active"**)

### 3. Send Test Message

1. Click **"Send"** button
2. Enter phone number (with country code): `5548996846044`
3. Type message: `Hello from WA-Module!`
4. Click **"Send"**

### 4. View Messages

Click **"Show"** to see received messages for the session.

---

## 🔧 Troubleshooting

### Database Connection Issues

**Error:** `Can't reach database server`

**Solution:**
```powershell
# Check if PostgreSQL is running
.\docker-compose.ps1 ps

# Restart PostgreSQL
.\docker-compose.ps1 restart postgres

# Check logs
.\docker-compose.ps1 logs postgres
```

---

### Port Already in Use

**Error:** `Port 3000 is already allocated`

**Solution:**
```powershell
# Find process using port 3000
netstat -ano | findstr :3000

# Kill process (replace PID)
taskkill /PID <PID> /F

# Or change port in .env
# Add: PORT=3001
```

---

### WhatsApp Connection Failed

**Error:** `Session not active. Connect first.`

**Solution:**
1. Go to dashboard: http://localhost:3000/dashboard.html
2. Click **"Connect"** on session
3. Scan QR code within 60 seconds
4. Wait for status to show **"active"**

---

### Authentication Required Error

**Error:** `401 Unauthorized`

**Solution:**
All API endpoints require authentication. Use the dashboard or:

```powershell
# Login via API
$response = Invoke-RestMethod -Uri "http://localhost:3000/auth/login" `
    -Method Post `
    -ContentType "application/json" `
    -Body '{"email":"admin@admin.com","password":"admin"}'

$token = $response.token

# Use token in requests
$headers = @{ "Authorization" = "Bearer $token" }
Invoke-RestMethod -Uri "http://localhost:3000/sessions" -Headers $headers
```

---

### Prisma Client Not Generated

**Error:** `Cannot find module '@prisma/client'`

**Solution:**
```powershell
# Generate Prisma Client
npx prisma generate

# Restart application
```

---

## 📚 Next Steps

### Development

- 📖 Read [API Documentation](docs/api_usage.md)
- 🔌 Check [Examples](examples/)
- 🧪 Run tests: `npm test`
- 📝 View [Contributing Guide](docs/CONTRIBUTING.md)

### Production

- 🔒 Change default admin password
- 🔐 Update `JWT_SECRET` in `.env`
- 🐳 Read [Docker Guide](docs/DOCKER.md)
- 📊 Setup monitoring and logs
- 🔄 Configure backups for PostgreSQL

---

## 🆘 Getting Help

- 📖 [Full Documentation](docs/)
- 🐛 [Report Issues](https://github.com/luizfilipeschaeffer/wa-module/issues)
- 💬 [Discussions](https://github.com/luizfilipeschaeffer/wa-module/discussions)
- 📧 Email: luizfilipeschaeffer@example.com

---

## 🎉 You're Ready!

Your WA-Module is now running! 

**Quick Links:**
- Dashboard: http://localhost:3000/dashboard.html
- API Docs: http://localhost:3000/docs
- Health Check: http://localhost:3000/health

Happy coding! 🚀
