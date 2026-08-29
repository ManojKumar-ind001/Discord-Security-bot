const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const V2 = require('../../utils/Embed');
const Logger = require('../../utils/Logger');
const Perm = require('../../utils/Permissions');

module.exports = {
  data: new SlashCommandBuilder().setName('unban').setDescription('Unban a user by ID')
    .addStringOption(o => o.setName('userid').setDescription('User ID to unban').setRequired(true))
    .addStringOption(o => o.setName('reason').setDescription('Reason'))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
  cooldown: 5,
  async execute(interaction, client) {
    // Check permission BEFORE deferring so we don't expose the interaction
    if (!(await Perm.check(interaction, 'mod'))) return;

    await interaction.deferReply();

    const uid    = interaction.options.getString('userid').trim();
    const reason = interaction.options.getString('reason') || 'No reason provided';

    try {
      const ban = await interaction.guild.bans.fetch(uid);
      await interaction.guild.bans.remove(uid, `${interaction.user.tag}: ${reason}`);
      const tag = ban.user.tag || ban.user.username || uid;
      await interaction.editReply(V2.reply(V2.success('User Unbanned',
        `**User:** ${tag}\n**Reason:** ${reason}`, client)));
      await Logger.modAction(interaction.guild, 'unban', ban.user, interaction.user, reason);
    } catch (e) {
      await interaction.editReply(V2.reply(V2.error('Unban Failed',
        `Could not unban. Make sure the ID is correct and the user is banned.\n\`${e.message}\``, client)));
    }
  },
};
