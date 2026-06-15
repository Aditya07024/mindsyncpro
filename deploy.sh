#!/bin/bash

# ============================================================
# mymindtherapyfriend — Production Deploy Script
# Run this on your VPS/server after SSH-ing in:
#   bash deploy.sh
# ============================================================

set -e  # Exit immediately on error
cd /var/www/MindGod

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"


echo ""
echo "========================================"
echo "  mymindtherapyfriend Deploy Script"
echo "========================================"
echo ""

# Step 1: Pull latest code
echo "[1/5] Pulling latest code from GitHub..."
cd "$APP_DIR"
git fetch origin main
git reset --hard origin/main
echo "✓ Code updated"

# Step 2: Install backend dependencies & build
echo ""
echo "[2/5] Building backend..."
cd "$APP_DIR/backend"
npm install          # include devDeps (tsc is a devDep)
npm run build
echo "✓ Backend built"

# Step 3: Build frontend
echo ""
echo "[3/5] Building frontend..."
cd "$APP_DIR/frontend"
npm install          # include devDeps (@vitejs/plugin-react, vite, etc. are devDeps)
npm run build
echo "✓ Frontend built (new chunk hashes generated)"

# Step 4: Restart PM2 processes
echo ""
echo "[4/5] Restarting PM2 processes..."
cd "$APP_DIR"
pm2 restart all
pm2 save
echo "✓ PM2 processes restarted"

# Step 5: Reload Nginx (clears any reverse-proxy cache)
echo ""
echo "[5/5] Reloading Nginx..."
sudo nginx -t && sudo systemctl reload nginx
echo "✓ Nginx reloaded"

echo ""
echo "========================================"
echo "  ✅ Deploy complete!"
echo "  Site: https://mymindtherapyfriend.com"
echo "  API:  https://api.mymindtherapyfriend.com"
echo "========================================"
echo ""
