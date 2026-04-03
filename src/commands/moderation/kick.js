
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const Embed = require('../../utils/Embed');
const Logger = require('../../utils/Logger');
const Perm = require('../../utils/Permissions');
module.exports = {
  data: new SlashCommandBuilder().setName('kick').setDescription('Kick a member')
    .addUserOption(o=>o.setName('user').setDescription('User to kick').setRequired(true))
    .addStringOption(o=>o.setName('reason').setDescription('Reason'))
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
  cooldown: 5,
  async execute(interaction, client){
    if(!(await Perm.check(interaction,'mod'))) return;
    const user=interaction.options.getUser('user');
    const reason=interaction.options.getString('reason')||'No reason provided';
    const member=interaction.guild.members.cache.get(user.id);
    if(!member) return interaction.reply({embeds:[Embed.error('Not Found','Member not in server.',client)],ephemeral:true});
    if(!member.kickable) return interaction.reply({embeds:[Embed.error('Cannot Kick','I cannot kick this member.',client)],ephemeral:true});
    try{
      await member.kick(interaction.user.tag+': '+reason);
      await interaction.reply({embeds:[Embed.success('Member Kicked','**'+user.tag+'** has been kicked.\n**Reason:** '+reason,client)]});
      await Logger.modAction(interaction.guild,'kick',user,interaction.user,reason);
    }catch(e){ await interaction.reply({embeds:[Embed.error('Kick Failed',e.message,client)],ephemeral:true}); }
  },
};
