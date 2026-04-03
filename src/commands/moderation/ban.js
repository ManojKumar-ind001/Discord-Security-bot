
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const Embed = require('../../utils/Embed');
const Logger = require('../../utils/Logger');
const Perm = require('../../utils/Permissions');
module.exports = {
  data: new SlashCommandBuilder().setName('ban').setDescription('Ban a member from the server')
    .addUserOption(o=>o.setName('user').setDescription('User to ban').setRequired(true))
    .addStringOption(o=>o.setName('reason').setDescription('Reason'))
    .addIntegerOption(o=>o.setName('days').setDescription('Delete messages (0-7 days)').setMinValue(0).setMaxValue(7))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
  cooldown: 5,
  async execute(interaction, client){
    if(!(await Perm.check(interaction,'mod'))) return;
    const user=interaction.options.getUser('user');
    const reason=interaction.options.getString('reason')||'No reason provided';
    const days=interaction.options.getInteger('days')||0;
    const member=interaction.guild.members.cache.get(user.id);
    if(member&&!member.bannable) return interaction.reply({embeds:[Embed.error('Cannot Ban','I cannot ban this member — they may have a higher role.',client)],ephemeral:true});
    if(user.id===interaction.user.id) return interaction.reply({embeds:[Embed.error('Cannot Ban','You cannot ban yourself.',client)],ephemeral:true});
    try{
      await interaction.guild.bans.create(user,{reason:interaction.user.tag+': '+reason,deleteMessageDays:days});
      await interaction.reply({embeds:[Embed.success('Member Banned','**'+user.tag+'** has been banned.\n**Reason:** '+reason,client)]});
      await Logger.modAction(interaction.guild,'ban',user,interaction.user,reason,{'Messages Deleted':days+' days'});
    }catch(e){ await interaction.reply({embeds:[Embed.error('Ban Failed',e.message,client)],ephemeral:true}); }
  },
};
