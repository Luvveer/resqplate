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

echo "All done"