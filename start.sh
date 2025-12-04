#!/bin/bash

# Inicia o Backend Python (Flask) em segundo plano na porta 5000
# Usamos Gunicorn para produção
echo "Iniciando servidor Python (Scraping/DB)..."
gunicorn -b 127.0.0.1:5000 --timeout 120 app:app &

# Aguarda alguns segundos para garantir que o Python subiu
sleep 5

# Inicia o Servidor Principal Node.js (WhatsApp + React + Proxy) na porta 3000
echo "Iniciando servidor Node.js (WhatsApp/Frontend)..."
node server.js
