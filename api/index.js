require('dotenv').config();
const express = require('express');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

const BOT_TOKEN = process.env.BOT_TOKEN;
const ADMIN_ID = process.env.ADMIN_ID || '5642832782';
const FEE = Number(process.env.PROTOCOL_FEE || 130);
let orders = [];

async function tg(text){
  if(!BOT_TOKEN) return;
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({chat_id:ADMIN_ID,text,parse_mode:'HTML'})
  }).catch(()=>{});
}

// App health
app.get('/api/status',(req,res)=>res.json({app:'HACYBER GLOBALTECH',status:'online',admin:ADMIN_ID}));

// Orders for admin panel
app.get('/api/orders',(req,res)=>res.json(orders.slice(-20).reverse()));

// Flutterwave webhook
app.post('/api/webhook', async (req,res)=>{
  if(req.headers['verif-hash'] !== process.env.FLW_SECRET_HASH) return res.sendStatus(401);
  const d = req.body.data;
  if(d?.status==='successful' && Number(d.amount)>=FEE){
    const order={id:Date.now(),amount:d.amount,email:d.customer?.email,time:Date.now()};
    orders.push(order);
    await tg(`ðŸ’° <b>NEW PAYMENT</b>\n$${d.amount} from ${d.customer?.email}\nRef: ${d.tx_ref}`);
  }
  res.json({ok:true});
});

// Telegram webhook
app.post(`/api/tg/${BOT_TOKEN}`, (req,res)=>{
  const msg=req.body.message;
  if(msg?.text==='/start'){
    tg(`Admin connected: ${msg.chat.id}`);
  }
  res.sendStatus(200);
});

// Flutterwave payment redirect
app.get('/api/pay',(req,res)=>{
  const link = `https://checkout.flutterwave.com/pay/${process.env.FLW_MERCHANT_ID}?amount=${FEE}`;
  res.redirect(link);
});

const PORT = process.env.PORT || 3000;
if(process.env.VERCEL!== '1'){
  app.listen(PORT,()=>console.log(`HACYBER App+Server on ${PORT}`));
}
module.exports = app;
