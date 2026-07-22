#!/bin/bash

# GENESIS ID - Automated Setup Script
# Este script configura todo automáticamente

set -e  # Exit on error

echo "🚀 GENESIS ID - Automated Setup"
echo "================================="
echo ""

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Node.js
echo -e "${BLUE}✓ Checking Node.js...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}❌ Node.js not found. Install from https://nodejs.org/${NC}"
    exit 1
fi
NODE_VERSION=$(node -v)
echo -e "${GREEN}✓ Node.js $NODE_VERSION found${NC}"
echo ""

# Check Docker
echo -e "${BLUE}✓ Checking Docker...${NC}"
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}⚠️  Docker not found. Install from https://www.docker.com/products/docker-desktop${NC}"
    echo "Continuing without Docker (you'll need to setup PostgreSQL manually)..."
    SKIP_DOCKER=true
else
    echo -e "${GREEN}✓ Docker found${NC}"
fi
echo ""

# Start PostgreSQL (Docker)
if [ "$SKIP_DOCKER" != "true" ]; then
    echo -e "${BLUE}📦 Starting PostgreSQL in Docker...${NC}"

    # Check if container already exists
    if docker ps --all --quiet --filter "name=genesis-id-postgres" | grep -q .; then
        echo "Container exists, starting..."
        docker start genesis-id-postgres || docker run --name genesis-id-postgres \
            -e POSTGRES_PASSWORD=localdevpassword \
            -e POSTGRES_DB=genesis_id_db \
            -p 5432:5432 \
            -d postgres:14-alpine
    else
        echo "Creating new container..."
        docker run --name genesis-id-postgres \
            -e POSTGRES_PASSWORD=localdevpassword \
            -e POSTGRES_DB=genesis_id_db \
            -p 5432:5432 \
            -d postgres:14-alpine
    fi

    echo "Waiting for PostgreSQL to be ready..."
    sleep 5
    echo -e "${GREEN}✓ PostgreSQL is running on localhost:5432${NC}"
fi
echo ""

# Backend Setup
echo -e "${BLUE}📦 Setting up Backend...${NC}"
npm install
echo -e "${GREEN}✓ Dependencies installed${NC}"

# Create .env if doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file..."
    cat > .env << 'EOF'
NODE_ENV=development
PORT=3000
API_URL=http://localhost:3000

DB_HOST=localhost
DB_PORT=5432
DB_NAME=genesis_id_db
DB_USER=postgres
DB_PASSWORD=localdevpassword

JWT_SECRET=tu_super_secret_key_12345
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=tu_refresh_secret_12345
JWT_REFRESH_EXPIRES_IN=7d

VERIFF_API_KEY=test_key
VERIFF_SECRET=test_secret
VERIFF_API_URL=https://stationapi.veriff.com
VERIFF_CALLBACK_URL=http://localhost:3000/api/auth/verify-callback

FRONTEND_URL=http://localhost:3001
CORS_ORIGIN=http://localhost:3001,http://localhost:3002,http://localhost:3003

EMAIL_SERVICE=gmail
EMAIL_USER=test@gmail.com
EMAIL_PASSWORD=test

LOG_LEVEL=debug
EOF
    echo -e "${GREEN}✓ .env created${NC}"
else
    echo -e "${GREEN}✓ .env already exists${NC}"
fi
echo ""

# Run migrations
echo -e "${BLUE}🗄️  Running database migrations...${NC}"
npm run migrate
echo -e "${GREEN}✓ Database ready${NC}"
echo ""

# Create admin user
echo -e "${BLUE}👤 Creating admin user...${NC}"
npm run seed
echo -e "${GREEN}✓ Admin user ready (see ADMIN_EMAIL/ADMIN_PASSWORD in .env)${NC}"
echo ""

# Frontend Setup
echo -e "${BLUE}📦 Setting up Frontend...${NC}"
cd apps/web
npm install
echo -e "${GREEN}✓ Frontend dependencies installed${NC}"

# Create .env.local if doesn't exist
if [ ! -f .env.local ]; then
    echo "Creating .env.local..."
    cat > .env.local << 'EOF'
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_VERIFF_URL=https://station.veriff.com
NODE_ENV=development
EOF
    echo -e "${GREEN}✓ .env.local created${NC}"
else
    echo -e "${GREEN}✓ .env.local already exists${NC}"
fi
cd - > /dev/null
echo ""

# Print next steps
echo -e "${GREEN}=================================${NC}"
echo -e "${GREEN}✅ Setup Complete!${NC}"
echo -e "${GREEN}=================================${NC}"
echo ""
echo "📝 Next Steps:"
echo ""
echo "1️⃣  Start Backend (Terminal 1):"
echo -e "   ${BLUE}npm run dev${NC}"
echo ""
echo "2️⃣  Start Frontend (Terminal 2):"
echo -e "   ${BLUE}cd apps/web && npm run dev${NC}"
echo ""
echo "3️⃣  Open Browser:"
echo -e "   ${BLUE}http://localhost:3001${NC}"
echo ""
echo "📚 Documentation:"
echo -e "   ${BLUE}QUICK_START.md${NC} - Quick guide"
echo -e "   ${BLUE}INTEGRATION.md${NC} - Complete guide"
echo -e "   ${BLUE}API.md${NC} - API reference"
echo ""
echo -e "${GREEN}🚀 GENESIS ID is ready to rock!${NC}"
