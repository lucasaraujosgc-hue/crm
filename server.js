import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import { createProxyMiddleware } from 'http-proxy-middleware';
import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import QRCode from 'qrcode';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// --- WhatsApp Logic ---
let qrCodeData = null;
let whatsappStatus = 'disconnected';

// Cria pasta de sessão se não existir
if (!fs.existsSync('./whatsapp_auth')) {
    fs.mkdirSync('./whatsapp_auth');
}

// Configuração ROBUSTA do Puppeteer para Docker
// Isso corrige o erro "Protocol error ... Session closed"
const client = new Client({
    authStrategy: new LocalAuth({ dataPath: './whatsapp_auth' }),
    puppeteer: {
        headless: true,
        // Importante: Usar o Chrome instalado via apt-get no Dockerfile
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/google-chrome',
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage', // CRÍTICO para Docker (evita crash de memória)
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process', 
            '--disable-gpu'
        ]
    }
});

client.on('qr', async (qr) => {
    console.log('[WhatsApp] QR Code gerado');
    try {
        qrCodeData = await QRCode.toDataURL(qr);
        whatsappStatus = 'qr_ready';
    } catch (err) {
        console.error('[WhatsApp] Erro ao gerar imagem QR', err);
    }
});

client.on('ready', () => {
    console.log('[WhatsApp] Conectado com Sucesso!');
    whatsappStatus = 'connected';
    qrCodeData = null;
});

client.on('authenticated', () => {
    console.log('[WhatsApp] Autenticado');
    whatsappStatus = 'connecting';
});

client.on('auth_failure', () => {
    console.error('[WhatsApp] Falha na autenticação');
    whatsappStatus = 'disconnected';
});

client.on('disconnected', (reason) => {
    console.log('[WhatsApp] Desconectado:', reason);
    whatsappStatus = 'disconnected';
    qrCodeData = null;
    // Reinicia o cliente após desconexão
    setTimeout(() => {
        try {
            client.initialize();
        } catch (e) {
            console.error("Erro ao reiniciar cliente:", e);
        }
    }, 5000);
});

// Inicializa o cliente com proteção
try {
    console.log('[WhatsApp] Inicializando cliente...');
    client.initialize();
} catch (e) {
    console.error("[WhatsApp] Erro fatal ao iniciar:", e);
}

// API WhatsApp para o Frontend
app.get('/api/whatsapp/status', (req, res) => {
    res.json({ status: whatsappStatus, qr: qrCodeData });
});

// --- Proxy para o Backend Python (Scraping) ---
// Configuração com tratamento de erro para evitar crash de JSON no frontend
const pythonProxy = createProxyMiddleware({
    target: 'http://127.0.0.1:5000',
    changeOrigin: true,
    ws: true, 
    logLevel: 'error', // Reduz logs para evitar poluição
    onError: (err, req, res) => {
        console.error('[Proxy Error] Falha ao conectar com Python:', err.message);
        // Retorna JSON válido para não quebrar o frontend
        if (!res.headersSent) {
            res.status(502).json({ error: 'Backend Python indisponível ou iniciando...' });
        }
    }
});

app.use('/start-processing', pythonProxy);
app.use('/progress', pythonProxy);
app.use('/get-all-results', pythonProxy);
app.use('/get-results', pythonProxy);

// --- Servir Arquivos Estáticos (React) ---
app.use(express.static(path.join(__dirname, 'dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Bind no 0.0.0.0 para Docker
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Node] Servidor Principal rodando na porta ${PORT}`);
});
