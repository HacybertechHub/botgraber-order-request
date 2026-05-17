require('dotenv').config();
const express = require('express');
const crypto = require('crypto');
const app = express();

// Only parse JSON for non-webhook routes. Webhooks need raw body
app.use('/api/webhook/wise', express.raw({type: 'application/json'}));
app.use('/api/webhook/crypto', express.raw({type: 'application/json'}));
app.use(express.json());

const BOT_TOKEN = process.env.BOT_TOKEN;
const ADMIN_ID = process.env.ADMIN_ID || '5642832782';
const FEE_USD = Number(process.env.PROTOCOL_FEE || 130);
const DISCORD_TOKEN = process.env.DISCORD_BOT_TOKEN;
const DISCORD_CHANNEL = process.env.DISCORD_CHANNEL_ID;

// Payment configs
const WISE_PROFILE_ID = process.env.WISE_PROFILE_ID;
const WISE_API_TOKEN = process.env.WISE_API_TOKEN;
const BTC_ADDRESS = process.env.BTC_ADDRESS;
const ETH_ADDRESS = process.env.ETH_ADDRESS;
const USDT_TRC20 = process.env.USDT_TRC20_ADDRESS;

let orders = []; // Replace with DB in prod

async function notifyTelegram(text){
  if(!BOT_TOKEN) return;
  try{
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({chat_id: ADMIN_ID, text, parse_mode:'HTML'})
    });
  }catch(e){ console.error('TG notify failed:', e.message); }
}

async function notifyDiscord(text){
  if(!DISCORD_TOKEN || !DISCORD_CHANNEL) return;
  try{
    await fetch(`https://discord.com/api/v10/channels/${DISCORD_CHANNEL}/messages`,{
      method:'POST',
      headers:{'Authorization':`Bot ${DISCORD_TOKEN}`,'Content-Type':'application/json'},
      body: JSON.stringify({content: text})
    });
  }catch(e){ console.error('Discord notify failed:', e.message); }
}

app.get('/api/status',(req,res)=>res.json({
  app:'HACYBER GLOBALTECH',
  status:'online',
  fee_usd: FEE_USD,
  time: new Date().toISOString()
}));

app.get('/api/orders',(req,res)=>res.json(orders.slice(-50).reverse()));

// Generate payment links
app.get('/api/pay/wise',(req,res)=>{
  const ref = `HACYBER-${Date.now()}`;
  // Wise payment link format: https://wise.com/pay/me/businessname?amount=130&currency=USD
  const url = `https://wise.com/pay/me/${process.env.WISE_USERNAME}?amount=${FEE_USD}&currency=USD&reference=${ref}`;
  res.json({ method: 'wise', url, ref, amount: FEE_USD, currency: 'USD' });
});

app.get('/api/pay/crypto',(req,res)=>{
  const ref = `HACYBER-${Date.now()}`;
  res.json({
    method: 'crypto',
    ref,
    amount_usd: FEE_USD,
    addresses: {
      BTC: BTC_ADDRESS,
      ETH: ETH_ADDRESS,
      USDT_TRC20: USDT_TRC20
    },
    note: `Send exact USD equivalent and include ${ref} in memo/tag`
  });
});

// Wise webhook - https://docs.wise.com/api-docs/api-reference/webhook
app.post('/api/webhook/wise', async (req,res)=>{
  const signature = req.headers['x-wise-signature'];
  const body = req.body.toString();
  
  // Verify signature - Wise uses HMAC SHA256
  const expectedSig = crypto
    .createHmac('sha256', process.env.WISE_WEBHOOK_SECRET)
    .update(body)
    .digest('hex');
    
  if(signature !== expectedSig) return res.status(401).send('Invalid signature');
  
  const event = JSON.parse(body);
  
  if(event.event_type === 'transfer.state_changed' && event.data?.current_state === 'incoming_payment_waiting'){
    const amount = event.data.amount;
    const ref = event.data.reference;
    
    if(Number(amount) >= FEE_USD){
      const order = {id: event.data.id, method: 'wise', amount, ref, time: Date.now()};
      orders.push(order);
      const msg = `💰 WISE PAYMENT\n$${amount} USD\nRef: ${ref}`;
      await notifyTelegram(msg);
      await notifyDiscord(`💰 HACYBER WISE: $${amount} - ${ref}`);
    }
  }
  res.json({ok:true});
});

// Crypto webhook - example for NOWPayments/CoinGate/Blockonomics
app.post('/api/webhook/crypto', async (req,res)=>{
  const signature = req.headers['x-signature'] || req.headers['x-nowpayments-sig'];
  const body = req.body.toString();
  
  // Verify based on your crypto provider. Example for NOWPayments:
  const expectedSig = crypto
    .createHmac('sha512', process.env.CRYPTO_IPN_SECRET)
    .update(body)
    .digest('hex');
    
  if(signature !== expectedSig) return res.status(401).send('Invalid');
  
  const data = JSON.parse(body);
  
  if(data.payment_status === 'finished' || data.status === 'confirmed'){
    const usdAmount = Number(data.price_amount);
    const ref = data.order_id;
    
    if(usdAmount >= FEE_USD){
      const order = {
        id: data.payment_id, 
        method: 'crypto', 
        amount: usdAmount, 
        coin: data.pay_currency,
        ref, 
        txid: data.payin_hash,
        time: Date.now()
      };
      orders.push(order);
      const msg = `💰 CRYPTO PAYMENT\n$${usdAmount} via ${data.pay_currency}\nTX: <code>${data.payin_hash}</code>\nRef: ${ref}`;
      await notifyTelegram(msg);
      await notifyDiscord(`💰 HACYBER CRYPTO: $${usdAmount} ${data.pay_currency} - ${ref}`);
    }
  }
  res.json({ok:true});
});

// Telegram webhook placeholder
app.post(`/api/tg/:token`, (req,res)=>{
  res.sendStatus(200);
});

const PORT = process.env.PORT || 3000;
if(!process.env.VERCEL) app.listen(PORT,()=>console.log('HACYBER running on '+PORT));
module.exports = app;
