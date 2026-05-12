const express = require('express');
const { Telegraf } = require('telegraf');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(express.json());

// --- TELEGRAM LOGIC ---
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
app.use(bot.webhookCallback('/telegram-webhook'));

bot.start((ctx) => ctx.reply(`Welcome to ${process.env.BUSINESS_NAME} Global Support.`));

// Command to generate a USD Flutterwave link
bot.command('pay', async (ctx) => {
    try {
        const response = await axios.post('https://api.flutterwave.com/v3/payments', {
            tx_ref: `Hacyber-${Date.now()}`,
            amount: "100", 
            currency: "USD",
            redirect_url: "https://hacyberglobaltech.vercel.app/success",
            customer: { email: process.env.SUPPORT_EMAIL, name: "Global Client" },
            customizations: { title: "HACYBERGLOBALTECH Service" }
        }, {
            headers: { Authorization: `Bearer ${process.env.FLW_SECRET_KEY}` }
        });
        ctx.reply(`Secure Payment Link (USD): ${response.data.data.link}`);
    } catch (e) {
        ctx.reply("Payment system busy. Contact +14702830342.");
    }
});

// --- WHATSAPP LOGIC ---
app.get('/webhook', (req, res) => {
    if (req.query['hub.verify_token'] === process.env.VERIFY_TOKEN) {
        res.send(req.query['hub.challenge']);
    } else {
        res.sendStatus(403);
    }
});

app.post('/webhook', (req, res) => {
    console.log("WhatsApp Message Received:", JSON.stringify(req.body));
    res.sendStatus(200);
});

module.exports = app;
