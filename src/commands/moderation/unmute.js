const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const Embed = require('../../utils/Embed');
const Logger = require('../../utils/Logger');
const Perm = require('../../utils/Permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unmute')
    .setDescription('Remove timeout from a member')
    .addUserOption(o => o.setName('user').setDescription('User to remove timeout from').setRequired(true))
    .addStringOption(o => o.setName('reason').setDescription('Reason'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  cooldown: 3,
  async execute(interaction, client){
    await interaction.deferReply();
    if(!(await Perm.check(interaction, 'mod'))) return;

    const user   = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);

    if(!member) return interaction.editReply({ embeds: [Embed.error('Not Found', 'Member not found in this server.', client)] });
    if(!member.isCommunicationDisabled()) return interaction.editReply({ embeds: [Embed.error('Not Timed Out', `**${user.tag}** is not currently timed out.`, client)] });

    try{
      await member.timeout(null, `${interaction.user.tag}: ${reason}`);
      await interaction.editReply({ embeds: [Embed.success('Timeout Removed', `**${user.tag}**'s timeout has been removed.\n**Reason:** ${reason}`, client)] });
      await Logger.modAction(interaction.guild, 'untimeout', member, interaction.user, reason);
    }catch(e){
      await interaction.editReply({ embeds: [Embed.error('Failed', e.message, client)] });
    }
  },
};
