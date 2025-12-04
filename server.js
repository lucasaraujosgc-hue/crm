import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import { createProxyMiddleware } from 'http-proxy-middleware';
import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import QRCode from 'qrcode';

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
import fs from 'fs';
if (!fs.existsSync('./whatsapp_auth')) {
    fs.mkdirSync('./whatsapp_auth');
}

const client = new Client({
    authStrategy: new LocalAuth({ dataPath: './whatsapp_auth' }),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

client.on('qr', async (qr) => {
    console.log('QR Code recebido do WhatsApp');
    try {
        qrCodeData = await QRCode.toDataURL(qr);
        whatsappStatus = 'qr_ready';
    } catch (err) {
        console.error('Erro ao gerar QR', err);
    }
});

client.on('ready', () => {
    console.log('WhatsApp Conectado com Sucesso!');
    whatsappStatus = 'connected';
    qrCodeData = null;
});

client.on('authenticated', () => {
    console.log('WhatsApp Autenticado');
    whatsappStatus = 'connecting';
});

client.on('auth_failure', () => {
    console.error('Falha na autenticação do WhatsApp');
    whatsappStatus = 'disconnected';
});

client.on('disconnected', (reason) => {
    console.log('WhatsApp desconectado:', reason);
    whatsappStatus = 'disconnected';
    qrCodeData = null;
    // Tenta reconectar
    client.initialize();
});

// Inicializa o cliente
try {
    console.log('Inicializando cliente WhatsApp...');
    client.initialize();
} catch (e) {
    console.error("Erro fatal ao iniciar WhatsApp:", e);
}

// API WhatsApp para o Frontend
app.get('/api/whatsapp/status', (req, res) => {
    res.json({ status: whatsappStatus, qr: qrCodeData });
});

// --- Proxy para o Backend Python (Scraping) ---
// Qualquer rota de scraping é enviada para o Flask na porta 5000
const pythonProxy = createProxyMiddleware({
    target: 'http://127.0.0.1:5000',
    changeOrigin: true,
    ws: true, // Importante para o SSE (barra de progresso)
    logLevel: 'debug'
});

app.use('/start-processing', pythonProxy);
app.use('/progress', pythonProxy);
app.use('/get-all-results', pythonProxy);
app.use('/get-results', pythonProxy);

// --- Servir Arquivos Estáticos (React) ---
app.use(express.static(path.join(__dirname, 'dist')));

// Qualquer outra rota retorna o index.html (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Servidor Principal (Node) rodando na porta ${PORT}`);
});