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
const client = new Client({
    authStrategy: new LocalAuth({ dataPath: './whatsapp_auth' }),
    puppeteer: {
        headless: true,
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/google-chrome',
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
            // Removido --single-process pois causa crash em algumas versões do Docker
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
    // Tenta reconectar após 5s
    setTimeout(() => {
        initializeWhatsApp();
    }, 5000);
});

// Função de inicialização segura
async function initializeWhatsApp() {
    try {
        console.log('[WhatsApp] Inicializando cliente...');
        await client.initialize();
    } catch (e) {
        console.error("[WhatsApp] Erro fatal ao iniciar (tentando novamente em 10s):", e.message);
        setTimeout(initializeWhatsApp, 10000);
    }
}

// Inicia o WhatsApp
initializeWhatsApp();

// API WhatsApp para o Frontend
app.get('/api/whatsapp/status', (req, res) => {
    res.json({ status: whatsappStatus, qr: qrCodeData });
});

// --- Proxy para o Backend Python (Scraping) ---
const pythonProxy = createProxyMiddleware({
    target: 'http://127.0.0.1:5000',
    changeOrigin: true,
    ws: true, 
    logLevel: 'error', 
    onError: (err, req, res) => {
        console.error('[Proxy Error] Falha ao conectar com Python:', err.message);
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
