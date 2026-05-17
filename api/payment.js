export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { method, coin, amount, tx_hash, product, email, screenshot } = req.body;

  if (!method || !amount || !product || !email) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
  
  let message = '';
  
  // WISE PAYMENT
  if (method === 'wise') {
    message = `
💵 NEW WISE PAYMENT 💵

Product: ${product}
Amount: $${amount}
Wise Tag: @hacyberglobaltech
Customer: ${email}
Screenshot: ${screenshot || 'Not provided'}

Check your Wise account then deliver.`;
  }

  // CRYPTO PAYMENT
  if (method === 'crypto') {
    const WALLETS = {
      BTC: '35e99VQwk2dYUiBJeKe2wnd73drgFFacPp',
      ETH: '0x575acfce162dc14fb2f6a7440c0da61c3d5f8a8f',
      USDT_ERC20: '0x575acfce162dc14fb2f6a7440c0da61c3d5f8a8f',
      USDT_TRC20: 'TBdEnSsWQwZAMKiRe54fPi3d45aJyoXqj6'
    };

    message = `
🚨 NEW CRYPTO PAYMENT 🚨

Product: ${product}
Amount: $${amount}
Coin: ${coin}
Wallet: ${WALLETS[coin]}
TX Hash: ${tx_hash}
Customer: ${email}

Verify on blockchain then deliver.`;
  }

  // Send Telegram alert
  await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: CHAT_ID,
      text: message,
      parse_mode: 'HTML'
    })
  });

  res.status(200).json({ 
    success: true, 
    message: 'Payment reported. We will verify and deliver in 10-30 mins.'
  });
}
