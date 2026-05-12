const express = require('express');
const path = require('path');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(express.json());

// Main Handshake API
app.post('/api/transmit', async (req, res) => {
    const { userId, botId, platform, key, note } = req.body;
    
    const message = `
⚡ *HGT NEXUS: ACTIVATION VERIFIED*
────────────────
👤 USER ID: \`${userId}\`
🤖 BOT ID: \`${botId}\`
📡 VECTOR: \`${platform}\`
🔑 ACCESS: \`${key}\`
────────────────
💰 FEE: $130.00 (PAID)
📝 NOTE: ${note || 'N/A'}
────────────────
*SYSTEM INTEGRITY: 100% SECURE*`;

    try {
        await axios.post(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`, {
            chat_id: process.env.ADMIN_ID,
            text: message,
            parse_mode: 'Markdown'
        });
        res.status(200).json({ success: true, status: 'Handshake_Complete' });
    } catch (err) {
        console.error("Transmission Error:", err.message);
        res.status(500).json({ success: false, status: 'Handshake_Failed' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Hacyber Nexus Core Online`));
