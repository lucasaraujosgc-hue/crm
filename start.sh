#!/bin/bash

echo "[Start] Iniciando container..."

# Inicia o Backend Python (Flask) em segundo plano na porta 5000 (Localhost)
# O Node.js vai conversar com ele via Proxy
echo "[Start] Iniciando Gunicorn (Python)..."
gunicorn -b 127.0.0.1:5000 --timeout 120 --log-level debug app:app &

# Aguarda 5 segundos para o Python subir
echo "[Start] Aguardando Python iniciar..."
sleep 5

# Inicia o Servidor Principal Node.js
echo "[Start] Iniciando Node.js..."
node server.js
