await fetch(`https://discord.com/api/channels/${DISCORD_CHANNEL_ID}/messages`, {
  method: 'POST',
  headers: { Authorization: `Bot ${DISCORD_BOT_TOKEN}` },
  body: JSON.stringify({ content: `💰 $${amount} payment received` })
})
