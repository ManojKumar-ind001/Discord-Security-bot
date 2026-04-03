
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { COLORS } = require('../../config/config');
module.exports = {
  data: new SlashCommandBuilder().setName('uptime').setDescription('Check bot uptime'),
  cooldown: 5,
  async execute(interaction, client){
    const u=process.uptime();
    const d=Math.floor(u/86400),h=Math.floor((u%86400)/3600),m=Math.floor((u%3600)/60),s=Math.floor(u%60);
    const e=new EmbedBuilder().setColor(COLORS.SUCCESS).setTitle('⏱️ Bot Uptime')
      .setDescription('Bot has been online for:\n**'+d+'d '+h+'h '+m+'m '+s+'s**')
      .addFields({name:'🚀 Started',value:'<t:'+Math.floor((Date.now()-u*1000)/1000)+':F>',inline:true})
      .setFooter({text:'🎮 GAMERZ WORKSHOP'}).setTimestamp();
    await interaction.reply({embeds:[e]});
  },
};
