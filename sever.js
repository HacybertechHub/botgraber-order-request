const express = require('express');
const path = require('path');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Mission: Streamlined Access Management API
app.post('/api/transmit', async (req, res) => {
    const { userId, botId, platform, key } = req.body;
    
    const message = `
🛡️ *HGT NEXUS ACTIVATION*
────────────────
👤 ID: \`${userId}\`
🤖 BOT: \`${botId}\`
📡 PLATFORM: \`${platform}\`
🔑 KEY: \`${key}\`
────────────────
*SYSTEM INTEGRITY VERIFIED*`;

    try {
        await axios.post(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`, {
            chat_id: process.env.ADMIN_ID,
            text: message,
            parse_mode: 'Markdown'
        });
        res.status(200).json({ status: 'Success' });
    } catch (err) {
        console.error("[HGT-ERR]", err.message);
        res.status(500).json({ status: 'Handshake Failed' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`[HACYBER] Nexus Core Online on Port ${PORT}`));
