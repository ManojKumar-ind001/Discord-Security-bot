
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const Embed = require('../../utils/Embed');
const Perm = require('../../utils/Permissions');
module.exports = {
  data: new SlashCommandBuilder().setName('nick').setDescription('Change a member nickname')
    .addUserOption(o=>o.setName('user').setDescription('User').setRequired(true))
    .addStringOption(o=>o.setName('nickname').setDescription('New nickname (leave blank to reset)'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageNicknames),
  cooldown: 3,
  async execute(interaction, client){
    if(!(await Perm.check(interaction,'mod'))) return;
    const user=interaction.options.getUser('user');
    const nick=interaction.options.getString('nickname')||null;
    const member=interaction.guild.members.cache.get(user.id);
    if(!member) return interaction.reply({embeds:[Embed.error('Not Found','Member not found.',client)],ephemeral:true});
    try{
      await member.setNickname(nick,'By '+interaction.user.tag);
      await interaction.reply({embeds:[Embed.success('Nickname Changed',nick?'Set nickname of '+user.tag+' to **'+nick+'**.':'Reset nickname of '+user.tag+'.',client)]});
    }catch(e){ await interaction.reply({embeds:[Embed.error('Failed',e.message,client)],ephemeral:true}); }
  },
};
