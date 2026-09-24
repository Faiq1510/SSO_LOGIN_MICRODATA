const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const qrcode = require('qrcode-terminal');
const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());

let sock;
let isConnected = false;

const authPath = process.env.AUTH_DIR || path.join(__dirname, 'auth_info');

// Pastikan direktori auth ada
if (!fs.existsSync(authPath)) {
    fs.mkdirSync(authPath, { recursive: true });
}

async function startSock() {
    const { state, saveCreds } = await useMultiFileAuthState(authPath);

    sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            console.log('\n--- SCAN QR CODE WHATSAPP DI BAWAH INI ---');
            qrcode.generate(qr, { small: true });
            console.log('-------------------------------------------\n');
        }

        if (connection === 'close') {
            isConnected = false;
            const shouldReconnect = new Boom(lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Koneksi terputus, reconnect:', shouldReconnect);
            if (shouldReconnect) startSock();
        } else if (connection === 'open') {
            isConnected = true;
            console.log('WhatsApp berhasil terhubung dan siap digunakan!');
        }
    });

    sock.ev.on('creds.update', saveCreds);
}

startSock();

// Healthcheck endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        whatsapp_connected: isConnected,
        message: 'WhatsApp Baileys Service is running'
    });
});

app.post('/send-file', async (req, res) => {
    const { nomor, pesan, filePath, fileName } = req.body;

    try {
        if (!nomor || !filePath) {
            return res.status(400).json({ success: false, error: 'Parameter nomor dan filePath wajib diisi.' });
        }

        if (!fs.existsSync(filePath)) {
            console.error(`File tidak ditemukan: ${filePath}`);
            return res.status(404).json({ success: false, error: `File tidak ditemukan di path: ${filePath}` });
        }

        if (!sock) {
            return res.status(503).json({ success: false, error: 'Koneksi WhatsApp belum siap.' });
        }

        const fileBuffer = fs.readFileSync(filePath);

        // Format nomor WhatsApp (pastikan tanpa @s.whatsapp.net di input awal)
        const cleanNomor = String(nomor).replace(/\D/g, '');
        const jid = `${cleanNomor}@s.whatsapp.net`;

        await sock.sendMessage(jid, {
            document: fileBuffer,
            fileName: fileName || 'surat.pdf',
            mimetype: 'application/pdf',
            caption: pesan || '',
        });

        console.log(`Berhasil mengirim file ke ${cleanNomor}`);
        res.json({ success: true, message: 'Pesan berhasil dikirim' });
    } catch (err) {
        console.error('Error saat kirim file:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server API WhatsApp jalan di http://0.0.0.0:${PORT}`);
});