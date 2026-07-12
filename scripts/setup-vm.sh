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

echo "Loading all secrets from secret Manager..."
export DATABASE_URL=$(gcloud secrets versions access latest --secret=DATABASE_URL)
export BETTER_AUTH_SECRET=$(gcloud secrets versions access latest --secret=BETTER_AUTH_SECRET)
export BETTER_AUTH_URL=$(gcloud secrets versions access latest --secret=BETTER_AUTH_URL)
export FRONTEND_URL=$(gcloud secrets versions access latest --secret=FRONTEND_URL)
export DATABASE_URL=2000
echo "Loaded everything"

echo "All done"