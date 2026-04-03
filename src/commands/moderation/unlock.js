
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const Embed = require('../../utils/Embed');
const Perm = require('../../utils/Permissions');
module.exports = {
  data: new SlashCommandBuilder().setName('unlock').setDescription('Unlock a channel')
    .addChannelOption(o=>o.setName('channel').setDescription('Channel (default: current)'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
  cooldown: 5,
  async execute(interaction, client){
    if(!(await Perm.check(interaction,'mod'))) return;
    const ch=interaction.options.getChannel('channel')||interaction.channel;
    try{
      await ch.permissionOverwrites.edit(interaction.guild.roles.everyone,{SendMessages:null});
      await interaction.reply({embeds:[Embed.success('Channel Unlocked','🔓 '+ch+' is now unlocked.',client)]});
    }catch(e){ await interaction.reply({embeds:[Embed.error('Failed',e.message,client)],ephemeral:true}); }
  },
};
