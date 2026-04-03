
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { COLORS } = require('../../config/config');
module.exports = {
  data: new SlashCommandBuilder().setName('avatar').setDescription('View a user avatar')
    .addUserOption(o=>o.setName('user').setDescription('User (default: yourself)')),
  cooldown: 3,
  async execute(interaction, client){
    const user=interaction.options.getUser('user')||interaction.user;
    const url=user.displayAvatarURL({dynamic:true,size:1024});
    const e=new EmbedBuilder().setColor(COLORS.PRIMARY).setTitle('🖼️ Avatar — '+user.tag).setImage(url).setFooter({text:'🎮 GAMERZ WORKSHOP'}).setTimestamp();
    const row=new ActionRowBuilder().addComponents(
      new ButtonBuilder().setLabel('Open PNG').setStyle(ButtonStyle.Link).setURL(user.displayAvatarURL({format:'png',size:1024})).setEmoji('🖼️'),
      new ButtonBuilder().setLabel('Open GIF').setStyle(ButtonStyle.Link).setURL(url).setEmoji('🎞️'),
    );
    await interaction.reply({embeds:[e],components:[row]});
  },
};
