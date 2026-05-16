require('dotenv').config();
const express = require('express');
const app = express();
app.use(express.json());

const BOT_TOKEN = process.env.BOT_TOKEN;
const ADMIN_ID = process.env.ADMIN_ID;
const BUSINESS = process.env.BUSINESS_NAME;
const FEE = process.env.PROTOCOL_FEE;

async function sendTelegram(chatId, text) {
  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' })
    });
  } catch(e){ console.error('Telegram error', e); }
}

// Auto-capture admin ID when they /start the bot
app.post(`/webhook/${BOT_TOKEN}`, async (req, res) => {
  const msg = req.body.message;
  if (msg && msg.text === '/start') {
    const id = msg.chat.id;
    await sendTelegram(id, `âœ… ${BUSINESS} Bot Active\n\nYour Telegram ID: <code>${id}</code>\n\nCopy this ID into your .env as ADMIN_ID`);
  }
  res.sendStatus(200);
});

// Flutterwave payment webhook
app.post('/webhook', async (req, res) => {
  const sig = req.headers['verif-hash'];
  if (sig !== process.env.FLW_SECRET_HASH) return res.status(401).send('Invalid');
  
  const data = req.body.data;
  if (data && data.status === 'successful' && Number(data.amount) >= Number(FEE)) {
    const alert = `ðŸ’° NEW PAYMENT\n${BUSINESS}\nAmount: $${data.amount}\nEmail: ${data.customer?.email}\nRef: ${data.tx_ref}\n\nâ±ï¸ Send bot link within 35 min`;
    await sendTelegram(ADMIN_ID, alert);
  }
  res.json({status:'ok'});
});

app.get('/', (req,res)=> res.json({status:'online', bot:'@hacyberglobal_automation_bot'}));

module.exports = app;
