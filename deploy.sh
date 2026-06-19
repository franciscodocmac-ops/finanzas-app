#!/bin/bash
# Script de despliegue para Ubuntu 167.233.132.47
# Uso: ./deploy.sh
# Requisito: tener clave SSH configurada para francisco@167.233.132.47

set -e

SERVER="root@167.233.132.47"
REMOTE_DIR="/root/finanzas-app"
APP_NAME="finanzas"

echo "🚀 Iniciando despliegue de Finanzas Personales..."

# 1. Sync archivos al servidor (el build se hace en el servidor)
echo "📤 Enviando archivos al servidor..."
rsync -avz --delete \
  --exclude='.next' \
  --exclude='node_modules' \
  --exclude='.env' \
  --exclude='.env.local' \
  ./ "$SERVER:$REMOTE_DIR/"

# 2. Setup y build en el servidor
echo "⚙️  Configurando y construyendo en el servidor..."
ssh "$SERVER" << 'REMOTE'
  set -e
  cd ~/finanzas-app

  # Instalar Node.js 20 si no está instalado
  if ! command -v node &> /dev/null; then
    echo "Instalando Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
  fi

  # Instalar PM2 si no está
  if ! command -v pm2 &> /dev/null; then
    echo "Instalando PM2..."
    sudo npm install -g pm2
  fi

  # Crear .env si no existe
  if [ ! -f .env ]; then
    cp .env.example .env
    SECRET=$(openssl rand -base64 32)
    sed -i "s/CAMBIA_ESTO_POR_UN_SECRETO_SEGURO/$SECRET/" .env
    echo "✅ .env creado con secreto aleatorio"
    echo "⚠️  Verifica el archivo .env: nano .env"
  fi

  # Migrar DATABASE_URL a SQLite si todavía apunta a PostgreSQL
  if grep -q "postgresql://" .env; then
    sed -i 's|DATABASE_URL=.*|DATABASE_URL="file:./dev.db"|' .env
    echo "✅ DATABASE_URL migrado a SQLite"
  fi

  # Instalar TODAS las dependencias (necesario para el build)
  npm install

  # Generar Prisma Client
  npx prisma generate

  # Aplicar migraciones/schema
  npx prisma db push

  # Build de la app
  echo "📦 Construyendo app..."
  npm run build

  # Seed (solo la primera vez)
  if [ ! -f .seeded ]; then
    npm run db:seed && touch .seeded
  fi

  # Reiniciar/iniciar con PM2 cargando variables del .env
  export $(cat /root/finanzas-app/.env | xargs)
  pm2 delete finanzas 2>/dev/null || true
  pm2 start npm --name "finanzas" -- start
  pm2 save
  pm2 startup systemd -u root --hp /root 2>/dev/null || true

  echo ""
  echo "✅ Despliegue completado"
  echo "🌐 App disponible en: http://167.233.132.47:3001"
REMOTE

echo ""
echo "✅ Despliegue exitoso"
echo "🌐 http://167.233.132.47:3001"
