
const { SlashCommandBuilder, PermissionFlagsBits,
  MessageFlags,
} = require('discord.js');
const V2 = require('../../utils/Embed');
const Perm = require('../../utils/Permissions');

module.exports = {
  data: new SlashCommandBuilder().setName('role').setDescription('Add or remove a role from a member')
    .addSubcommand(s => s.setName('add').setDescription('Add role')
      .addUserOption(o => o.setName('user').setDescription('User').setRequired(true))
      .addRoleOption(o => o.setName('role').setDescription('Role').setRequired(true)))
    .addSubcommand(s => s.setName('remove').setDescription('Remove role')
      .addUserOption(o => o.setName('user').setDescription('User').setRequired(true))
      .addRoleOption(o => o.setName('role').setDescription('Role').setRequired(true)))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
  cooldown: 3,
  async execute(interaction, client) {
    if (!(await Perm.check(interaction, 'mod'))) return;
    const sub    = interaction.options.getSubcommand();
    const user   = interaction.options.getUser('user');
    const role   = interaction.options.getRole('role');
    const member = interaction.guild.members.cache.get(user.id);

    if (!member)
      return interaction.reply({ ...V2.reply(V2.error('Not Found', 'Member not found.', client)), flags: MessageFlags.Ephemeral });
    if (role.managed || role.id === interaction.guild.id)
      return interaction.reply({ ...V2.reply(V2.error('Cannot Manage', 'Cannot add/remove this role.', client)), flags: MessageFlags.Ephemeral });

    try {
      if (sub === 'add') {
        await member.roles.add(role, `By ${interaction.user.tag}`);
        await interaction.reply(V2.reply(V2.success('Role Added', `Added ${role} to ${member}.`, client)));
      } else {
        await member.roles.remove(role, `By ${interaction.user.tag}`);
        await interaction.reply(V2.reply(V2.success('Role Removed', `Removed ${role} from ${member}.`, client)));
      }
    } catch (e) {
      await interaction.reply({ ...V2.reply(V2.error('Failed', e.message, client)), flags: MessageFlags.Ephemeral });
    }
  },
};
