#!/bin/bash
set -e

echo "System update..."
sudo apt-get update -y
sudo apt-get upgrade -y

echo "Installing Node.js 24 ..."
curl -fsSl https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version
npm --version

echo "Installing PM2 ..."
sudo npm install -g pm2

echo "Creating app directory..."
mkdir -p ~/app/backend

echo "Installing Caddy to accept https request and redirect it."
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update && sudo apt install -y caddy

echo "Configuring Caddy..."
VM_IP=$(curl -s ifconfig.me)
sudo bash -c "cat > /etc/caddy/Caddyfile << EOF
\${VM_IP}.nip.io {
    reverse_proxy localhost:3000
}
EOF"
sudo systemctl reload caddy
echo "Caddy configured."


echo "Loading all secrets from secret Manager..."
export DATABASE_URL=$(gcloud secrets versions access latest --secret=DATABASE_URL)
export BETTER_AUTH_SECRET=$(gcloud secrets versions access latest --secret=BETTER_AUTH_SECRET)
export BETTER_AUTH_URL=$(gcloud secrets versions access latest --secret=BETTER_AUTH_URL)
export FRONTEND_URL=$(gcloud secrets versions access latest --secret=FRONTEND_URL)
export DATABASE_URL=3000
echo "Loaded everything"

echo "All done"