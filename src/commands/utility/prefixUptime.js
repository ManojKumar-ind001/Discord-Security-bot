module.exports = {
  prefixName: 'uptime',
  async execute(message, args, client){
    const u = process.uptime();
    const d = Math.floor(u/86400), h = Math.floor((u%86400)/3600), m = Math.floor((u%3600)/60), s = Math.floor(u%60);
    await message.reply(`⏱️ Uptime: **${d}d ${h}h ${m}m ${s}s**`);
  },
};
