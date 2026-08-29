const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const V2 = require('../../utils/Embed');
const Logger = require('../../utils/Logger');
const Perm = require('../../utils/Permissions');

module.exports = {
  data: new SlashCommandBuilder().setName('kick').setDescription('Kick a member from the server')
    .addUserOption(o => o.setName('user').setDescription('User to kick').setRequired(true))
    .addStringOption(o => o.setName('reason').setDescription('Reason'))
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
  cooldown: 5,
  async execute(interaction, client) {
    if (!(await Perm.check(interaction, 'mod'))) return;
    const user   = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const member = interaction.guild.members.cache.get(user.id);

    if (!member)
      return interaction.reply({ ...V2.reply(V2.error('Not Found', 'Member not in server.', client)), ephemeral: true });
    if (!member.kickable)
      return interaction.reply({ ...V2.reply(V2.error('Cannot Kick', 'I cannot kick this member — they may have a higher role.', client)), ephemeral: true });

    // DM the user before kicking
    try {
      await user.send({
        ...V2.reply(V2.warning(
          `You have been kicked from ${interaction.guild.name}`,
          `> **Reason:** ${reason}\n> **Server:** ${interaction.guild.name}\n> **Moderator:** ${interaction.user.tag}`,
          client
        )),
      });
    } catch {}

    try {
      await member.kick(`${interaction.user.tag}: ${reason}`);
      await interaction.reply(V2.reply(V2.success('Member Kicked',
        `**User:** ${user.tag}\n**Reason:** ${reason}`, client)));
      await Logger.modAction(interaction.guild, 'kick', user, interaction.user, reason);
    } catch (e) {
      await interaction.reply({ ...V2.reply(V2.error('Kick Failed', e.message, client)), ephemeral: true });
    }
  },
};
