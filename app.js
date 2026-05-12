const express = require('express');
const { Telegraf } = require('telegraf');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(express.json());

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
app.use(bot.webhookCallback('/telegram-webhook'));

// 1. Telegram: Start Command
bot.start((ctx) => ctx.reply(`Welcome to ${process.env.BUSINESS_NAME}. Global automation active.`));

// 2. Telegram: Generate USD Payment Link
bot.command('pay', async (ctx) => {
    try {
        const response = await axios.post('https://api.flutterwave.com/v3/payments', {
            tx_ref: `hacyber-${Date.now()}`,
            amount: "100", // Default amount
            currency: "USD",
            redirect_url: "https://hacyberglobaltech.vercel.app/success",
            customer: { email: process.env.SUPPORT_EMAIL, name: "Global Client" },
            customizations: { title: "HACYBERGLOBALTECH Service" }
        }, {
            headers: { Authorization: `Bearer ${process.env.FLW_SECRET_KEY}` }
        });
        ctx.reply(`Secure USD Payment Link: ${response.data.data.link}`);
    } catch (e) {
        ctx.reply("System busy. Contact support at +14702830342.");
    }
});

// 3. Flutterwave: Success Notification Webhook
app.post('/flw-webhook', (req, res) => {
    const signature = req.headers['verif-hash'];
    if (signature === process.env.FLW_SECRET_HASH && req.body.status === 'successful') {
        bot.telegram.sendMessage(process.env.MY_TELEGRAM_ID, `💰 Payment Received: ${req.body.amount} ${req.body.currency} from ${req.body.customer.email}`);
    }
    res.sendStatus(200);
});

// 4. WhatsApp: Webhook Verification
app.get('/webhook', (req, res) => {
    if (req.query['hub.verify_token'] === process.env.VERIFY_TOKEN) {
        res.send(req.query['hub.challenge']);
    } else { res.sendStatus(403); }
});

module.exports = app;
