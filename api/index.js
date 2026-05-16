require('dotenv').config();
const express = require('express');
const path = require('path');
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

const BOT_TOKEN = process.env.BOT_TOKEN;
const ADMIN_ID = process.env.ADMIN_ID || '5642832782';
const FEE = Number(process.env.PROTOCOL_FEE || 130);
const DISCORD_TOKEN = process.env.DISCORD_BOT_TOKEN;
const DISCORD_CHANNEL = process.env.DISCORD_CHANNEL_ID;

let orders = [];

async function notifyTelegram(text){
  if(!BOT_TOKEN) return;
  try{
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({chat_id: ADMIN_ID, text, parse_mode:'HTML'})
    });
  }catch(e){}
}

async function notifyDiscord(text){
  if(!DISCORD_TOKEN || !DISCORD_CHANNEL) return;
  try{
    await fetch(`https://discord.com/api/v10/channels/${DISCORD_CHANNEL}/messages`,{
      method:'POST',
      headers:{'Authorization':`Bot ${DISCORD_TOKEN}`,'Content-Type':'application/json'},
      body: JSON.stringify({content: text})
    });
  }catch(e){}
}

app.get('/api/status',(req,res)=>res.json({app:'HACYBER GLOBALTECH',status:'online',admin:ADMIN_ID,time:new Date().toISOString()}));

app.get('/api/orders',(req,res)=>res.json(orders.slice(-50).reverse()));

app.get('/api/pay',(req,res)=>{
  const ref = 'HACYBER-'+Date.now();
  const url = `https://checkout.flutterwave.com/v3/hosted/pay`;
  // Simple redirect to Flutterwave with amount
  res.redirect(`https://flutterwave.com/pay/${process.env.FLW_MERCHANT_ID || 'hacyber'}?amount=${FEE}`);
});

// Flutterwave webhook
app.post('/api/webhook', async (req,res)=>{
  const hash = req.headers['verif-hash'];
  if(hash !== process.env.FLW_SECRET_HASH) return res.status(401).send('Invalid');
  
  const data = req.body?.data;
  if(data?.status === 'successful' && Number(data.amount) >= FEE){
    const order = {id: data.id, amount: data.amount, email: data.customer?.email, time: Date.now(), ref: data.tx_ref};
    orders.push(order);
    const msg = `ðŸ’° NEW PAYMENT\n$${data.amount} from ${data.customer?.email}\nRef: ${data.tx_ref}`;
    await notifyTelegram(msg);
    await notifyDiscord(`ðŸ’° HACYBER PAYMENT: $${data.amount} - ${data.customer?.email}`);
  }
  res.json({ok:true});
});

// Telegram webhook
app.post(`/api/tg/:token`, (req,res)=>{
  res.sendStatus(200);
});

const PORT = process.env.PORT || 3000;
if(!process.env.VERCEL) app.listen(PORT,()=>console.log('HACYBER running on '+PORT));
module.exports = app;
