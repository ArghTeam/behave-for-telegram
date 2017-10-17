#!/usr/bin/env bash

export NODE_VERSION="6.9.1"

export PATH="/home/deployer/.nvm/versions/node/v6.9.1/bin:$PATH"

export NVM_DIR="/home/deployer/.nvm"
export NVM_BIN="/home/deployer/.nvm/versions/node/v6.9.1/bin"

echo "--> Installing libraries..."
npm install --production
cp /home/deployer/apps/envs/sentiment-bot.env .env
 
echo "--> Exporting Foreman files..."
rm -rf foreman
mkdir foreman
PORT=6000 nf export web=3 -o foreman -a sentiment-bot
sudo cp foreman/* /etc/init
 
echo "--> Restarting..."
sudo stop sentiment-bot
sudo start sentiment-bot