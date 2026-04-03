
module.exports = {
  prefixName: 'ping',
  async execute(message, args, client){
    const m = await message.reply('🏓 Pinging...');
    const rtt = m.createdTimestamp - message.createdTimestamp;
    await m.edit('🏓 Pong! Latency: **'+rtt+'ms** | WebSocket: **'+client.ws.ping+'ms**');
  },
};
