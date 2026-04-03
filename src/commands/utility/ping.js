
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { COLORS } = require('../../config/config');
module.exports = {
  data: new SlashCommandBuilder().setName('ping').setDescription('Check bot latency'),
  cooldown: 5,
  async execute(interaction, client){
    const sent=await interaction.reply({content:'🏓 Pinging...',fetchReply:true});
    const rtt=sent.createdTimestamp-interaction.createdTimestamp;
    const wsp=client.ws.ping;
    const e=new EmbedBuilder().setColor(rtt<100?COLORS.SUCCESS:rtt<300?COLORS.WARNING:COLORS.ERROR)
      .setTitle('🏓 Pong!')
      .addFields(
        {name:'📡 Bot Latency',value:rtt+'ms',inline:true},
        {name:'💓 WebSocket',value:wsp+'ms',inline:true},
        {name:'🟢 Status',value:rtt<200?'Excellent':'Good',inline:true},
      ).setFooter({text:'🎮 GAMERZ WORKSHOP'}).setTimestamp();
    await interaction.editReply({content:null,embeds:[e]});
  },
};
