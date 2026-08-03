#!/bin/bash
# Run this once on the EC2 instance after cloning the repo.
# Usage: bash deploy/setup.sh

set -e

echo "=== PostWeek EC2 Setup ==="

# 1. System packages
sudo apt-get update -y
sudo apt-get install -y nginx curl git python3.11 python3.11-venv nodejs npm

# 2. Install uv
curl -LsSf https://astral.sh/uv/install.sh | sh
export PATH="$HOME/.cargo/bin:$PATH"

# 3. Backend deps
cd /home/ubuntu/postweek/backend
uv sync --no-dev

# 4. Copy .env (must be done manually before running this)
if [ ! -f .env ]; then
    echo "ERROR: backend/.env not found. Copy your .env file before continuing."
    exit 1
fi

# 5. Run migrations
uv run alembic upgrade head

# 6. Frontend build
cd /home/ubuntu/postweek/frontend
npm ci
npm run build

# 7. Install systemd service
sudo cp /home/ubuntu/postweek/deploy/postweek-api.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable postweek-api
sudo systemctl start postweek-api

# 8. Nginx
sudo cp /home/ubuntu/postweek/deploy/nginx.conf /etc/nginx/sites-available/postweek
sudo ln -sf /etc/nginx/sites-available/postweek /etc/nginx/sites-enabled/postweek
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx

# 9. DuckDNS cron
chmod +x /home/ubuntu/postweek/deploy/duckdns-renew.sh
(crontab -l 2>/dev/null; echo "*/5 * * * * /home/ubuntu/postweek/deploy/duckdns-renew.sh >> /var/log/duckdns.log 2>&1") | crontab -
# Run once now to register IP
bash /home/ubuntu/postweek/deploy/duckdns-renew.sh

echo ""
echo "=== Setup complete ==="
echo "API: http://postweek.duckdns.org/api/health"
echo "App: http://postweek.duckdns.org"
