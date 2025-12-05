import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import { createProxyMiddleware } from 'http-proxy-middleware';
import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import QRCode from 'qrcode';
import fs from 'fs';
import { GoogleGenerativeAI } from "@google/generative-ai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// --- IA Logic (Gemini) ---
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
let genAI = null;
let model = null;

if (GOOGLE_API_KEY) {
    console.log('[AI] Configurando Google Gemini...');
    genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
    model = genAI.getGenerativeModel({ model: "gemini-pro"});
} else {
    console.warn('[AI] AVISO: GOOGLE_API_KEY não encontrada. O bot não responderá com IA.');
}

// Store para saber quem está com IA desativada (em memória para simplificar, idealmente seria DB)
const disabledAI = new Set(); // Guarda IDs de chats (ex: 557199998888@c.us)

// --- WhatsApp Logic ---
let qrCodeData = null;
let whatsappStatus = 'disconnected';

if (!fs.existsSync('./whatsapp_auth')) {
    fs.mkdirSync('./whatsapp_auth');
}

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
        ]
    }
});

// Eventos do Cliente
client.on('qr', async (qr) => {
    try {
        qrCodeData = await QRCode.toDataURL(qr);
        whatsappStatus = 'qr_ready';
    } catch (err) { console.error(err); }
});

client.on('ready', () => {
    console.log('[WhatsApp] Conectado!');
    whatsappStatus = 'connected';
    qrCodeData = null;
});

client.on('disconnected', () => {
    whatsappStatus = 'disconnected';
    setTimeout(initializeWhatsApp, 5000);
});

// Lógica de Mensagem com IA
client.on('message', async msg => {
    if (!model) return; // IA não configurada
    if (msg.fromMe) return; // Não responder a si mesmo

    const chat = await msg.getChat();
    
    // Verifica se IA está ativa para este chat e globalmente
    // (Você pode adicionar um toggle global também se quiser)
    if (disabledAI.has(chat.id._serialized)) {
        console.log(`[AI] Ignorando chat ${chat.name} (IA desativada manualmente)`);
        return;
    }

    // Delay natural para parecer humano
    await new Promise(r => setTimeout(r, 2000 + Math.random() * 3000));
    await chat.sendStateTyping();

    try {
        // Prompt simples - idealmente você carregaria o contexto da empresa aqui
        // buscando no banco Python via API interna
        const prompt = `Você é um assistente comercial da CRM VIRGULA.
        O cliente disse: "${msg.body}".
        Responda de forma curta, prestativa e profissional. Tente agendar uma reunião.`;

        const result = await model.generateContent(prompt);
        const response = result.response.text();

        await chat.sendMessage(response);
    } catch (e) {
        console.error('[AI] Erro ao gerar resposta:', e);
    }
});

async function initializeWhatsApp() {
    try {
        await client.initialize();
    } catch (e) {
        console.error("[WhatsApp] Erro:", e.message);
        setTimeout(initializeWhatsApp, 10000);
    }
}

initializeWhatsApp();

// --- Endpoints para a Interface de Chat ---

// Listar conversas ativas
app.get('/api/whatsapp/chats', async (req, res) => {
    if (whatsappStatus !== 'connected') return res.json([]);
    try {
        const chats = await client.getChats();
        const formatted = chats.map(c => ({
            id: c.id._serialized,
            name: c.name || c.id.user,
            unread: c.unreadCount,
            lastMessage: c.lastMessage ? c.lastMessage.body : '',
            timestamp: c.timestamp,
            isAiDisabled: disabledAI.has(c.id._serialized)
        }));
        res.json(formatted);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Pegar mensagens de um chat
app.get('/api/whatsapp/messages/:chatId', async (req, res) => {
    try {
        const chat = await client.getChatById(req.params.chatId);
        const messages = await chat.fetchMessages({ limit: 50 });
        res.json(messages.map(m => ({
            id: m.id.id,
            fromMe: m.fromMe,
            body: m.body,
            timestamp: m.timestamp
        })));
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Enviar mensagem manual
app.post('/api/whatsapp/send', async (req, res) => {
    try {
        const { chatId, message } = req.body;
        await client.sendMessage(chatId, message);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Toggle IA para um chat
app.post('/api/whatsapp/toggle-ai', (req, res) => {
    const { chatId, active } = req.body;
    if (active) {
        disabledAI.delete(chatId);
    } else {
        disabledAI.add(chatId);
    }
    res.json({ success: true, aiActive: !disabledAI.has(chatId) });
});

app.get('/api/whatsapp/status', (req, res) => {
    res.json({ status: whatsappStatus, qr: qrCodeData });
});

// --- Proxy Python ---
const pythonProxy = createProxyMiddleware({
    target: 'http://127.0.0.1:5000',
    changeOrigin: true,
    ws: true, 
    logLevel: 'error', 
    onError: (err, req, res) => {
        if (!res.headersSent) res.status(502).json({ error: 'Backend Python indisponível.' });
    }
});

app.use('/start-processing', pythonProxy);
app.use('/progress', pythonProxy);
app.use('/get-all-results', pythonProxy);
app.use('/get-results', pythonProxy);

app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Node] Rodando na porta ${PORT}`);
});
