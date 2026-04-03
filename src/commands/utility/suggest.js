
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { COLORS } = require('../../config/config');
module.exports = {
  data: new SlashCommandBuilder().setName('suggest').setDescription('Submit a suggestion')
    .addStringOption(o=>o.setName('suggestion').setDescription('Your suggestion').setRequired(true)),
  cooldown: 30,
  async execute(interaction, client){
    const sug=interaction.options.getString('suggestion');
    const e=new EmbedBuilder().setColor(COLORS.WARNING).setTitle('💡 New Suggestion')
      .setDescription(sug)
      .addFields({name:'Submitted by',value:interaction.user+' ('+interaction.user.tag+')',inline:true},{name:'Status',value:'⏳ Pending',inline:true})
      .setThumbnail(interaction.user.displayAvatarURL({dynamic:true})).setFooter({text:'🎮 GAMERZ WORKSHOP'}).setTimestamp();
    const row=new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('sug_up').setLabel('👍 Upvote').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('sug_down').setLabel('👎 Downvote').setStyle(ButtonStyle.Danger),
    );
    await interaction.reply({embeds:[e],components:[row]});
  },
};
