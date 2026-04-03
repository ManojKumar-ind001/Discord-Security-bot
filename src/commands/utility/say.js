
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const Embed = require('../../utils/Embed');
const Perm = require('../../utils/Permissions');
module.exports = {
  data: new SlashCommandBuilder().setName('say').setDescription('Make the bot say something')
    .addStringOption(o=>o.setName('message').setDescription('Message').setRequired(true))
    .addChannelOption(o=>o.setName('channel').setDescription('Channel (default: current)'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
  cooldown: 5,
  async execute(interaction, client){
    if(!(await Perm.check(interaction,'mod'))) return;
    const msg=interaction.options.getString('message');
    const ch=interaction.options.getChannel('channel')||interaction.channel;
    try{
      await ch.send(msg);
      await interaction.reply({embeds:[Embed.success('Message Sent','Message sent to '+ch+'.',client)],ephemeral:true});
    }catch(e){ await interaction.reply({embeds:[Embed.error('Failed',e.message,client)],ephemeral:true}); }
  },
};
