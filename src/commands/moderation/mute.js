
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const ms = require('ms');
const Embed = require('../../utils/Embed');
const Logger = require('../../utils/Logger');
const Perm = require('../../utils/Permissions');
module.exports = {
  data: new SlashCommandBuilder().setName('mute').setDescription('Timeout/mute a member')
    .addUserOption(o=>o.setName('user').setDescription('User to mute').setRequired(true))
    .addStringOption(o=>o.setName('duration').setDescription('Duration e.g. 10m 1h 1d').setRequired(true))
    .addStringOption(o=>o.setName('reason').setDescription('Reason'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  cooldown: 5,
  async execute(interaction, client){
    if(!(await Perm.check(interaction,'mod'))) return;
    const user=interaction.options.getUser('user');
    const durStr=interaction.options.getString('duration');
    const reason=interaction.options.getString('reason')||'No reason provided';
    const dur=ms(durStr);
    if(!dur||dur>ms('28d')) return interaction.reply({embeds:[Embed.error('Invalid Duration','Use 10m, 1h, 1d. Max 28 days.',client)],ephemeral:true});
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);
    if(!member) return interaction.reply({embeds:[Embed.error('Not Found','Member not found in this server.',client)],ephemeral:true});
    if(!member.moderatable) return interaction.reply({embeds:[Embed.error('Permission Denied','I cannot mute this user. They might have a higher role than me.',client)],ephemeral:true});
    if(member.roles.highest.position >= interaction.member.roles.highest.position && interaction.guild.ownerId !== interaction.user.id) return interaction.reply({embeds:[Embed.error('Permission Denied','You cannot mute someone with a higher or equal role.',client)],ephemeral:true});

    try{
      await member.timeout(dur, `Muted by ${interaction.user.tag}: ${reason}`);
      await interaction.reply({embeds:[Embed.success('Member Muted','**'+user.tag+'** has been timed out for **'+durStr+'**.\n**Reason:** '+reason,client)]});
      await Logger.modAction(interaction.guild,'mute',member,interaction.user,reason,{Duration:durStr});
    }catch(e){ 
      console.error(e);
      await interaction.reply({embeds:[Embed.error('Mute Failed','Something went wrong while trying to timeout the user.',client)],ephemeral:true}); 
    }
  },
};
