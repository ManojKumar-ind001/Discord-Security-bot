
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { COLORS } = require('../../config/config');
const { version: djsVer } = require('discord.js');
module.exports = {
  data: new SlashCommandBuilder().setName('botinfo').setDescription('View bot information'),
  cooldown: 5,
  async execute(interaction, client){
    const uptime=process.uptime();
    const days=Math.floor(uptime/86400), hrs=Math.floor((uptime%86400)/3600), mins=Math.floor((uptime%3600)/60), secs=Math.floor(uptime%60);
    const mem=process.memoryUsage();
    const e=new EmbedBuilder().setColor(COLORS.PRIMARY)
      .setTitle('🤖 GAMERZ WORKSHOP — Bot Info')
      .setThumbnail(client.user.displayAvatarURL({size:256}))
      .addFields(
        {name:'🏷️ Bot Name',value:client.user.tag,inline:true},
        {name:'🆔 Bot ID',value:client.user.id,inline:true},
        {name:'📡 Servers',value:''+client.guilds.cache.size,inline:true},
        {name:'👥 Users',value:''+client.users.cache.size,inline:true},
        {name:'📝 Commands',value:''+client.slashCommands.size,inline:true},
        {name:'⏱️ Uptime',value:days+'d '+hrs+'h '+mins+'m '+secs+'s',inline:true},
        {name:'🏓 Latency',value:client.ws.ping+'ms',inline:true},
        {name:'💾 Memory',value:(mem.heapUsed/1024/1024).toFixed(2)+' MB',inline:true},
        {name:'📦 discord.js',value:'v'+djsVer,inline:true},
        {name:'🟢 Node.js',value:process.version,inline:true},
      ).setFooter({text:'🎮 GAMERZ WORKSHOP | v1.0.0'}).setTimestamp();
    await interaction.reply({embeds:[e]});
  },
};
