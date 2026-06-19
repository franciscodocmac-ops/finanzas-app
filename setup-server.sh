#!/bin/bash
# Ejecuta esto UNA VEZ directamente en el servidor Ubuntu
# ssh francisco@167.233.132.47 y luego bash setup-server.sh

set -e

echo "🔧 Configurando servidor para Finanzas App..."

# PostgreSQL: crear tabla en base de datos misapps
echo "📊 Configurando base de datos..."
sudo -u postgres psql << 'SQL'
-- Verificar que el usuario francisco existe
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'francisco') THEN
    CREATE ROLE francisco WITH LOGIN PASSWORD 'lungo2024secure';
  END IF;
END
$$;

-- Dar permisos en la base de datos misapps
GRANT ALL PRIVILEGES ON DATABASE misapps TO francisco;
GRANT ALL ON SCHEMA public TO francisco;
SQL

echo "✅ PostgreSQL configurado"

# Instalar Node.js 20
if ! command -v node &> /dev/null || [[ $(node -v | cut -d'v' -f2 | cut -d'.' -f1) -lt 20 ]]; then
  echo "📦 Instalando Node.js 20..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi
echo "✅ Node.js $(node -v)"

# Instalar PM2 globalmente
if ! command -v pm2 &> /dev/null; then
  sudo npm install -g pm2
fi
echo "✅ PM2 instalado"

# Abrir puerto 3001 en firewall
if command -v ufw &> /dev/null; then
  sudo ufw allow 3001/tcp
  echo "✅ Puerto 3001 abierto en UFW"
fi

echo ""
echo "✅ Servidor listo. Ahora desde tu Mac ejecuta: ./deploy.sh"
