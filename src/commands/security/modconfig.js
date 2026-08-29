const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  SectionBuilder,
  ThumbnailBuilder,
  MessageFlags,
} = require('discord.js');
const V2 = require('../../utils/Embed');
const Perm = require('../../utils/Permissions');
const GuildModel = require('../../models/Guild');

module.exports = {
  data: new SlashCommandBuilder().setName('modconfig').setDescription('Full Admin & Moderator Role Management')
    .addSubcommand(s => s.setName('addmod').setDescription('Add a moderator role').addRoleOption(o => o.setName('role').setDescription('Role').setRequired(true)))
    .addSubcommand(s => s.setName('removemod').setDescription('Remove a moderator role').addRoleOption(o => o.setName('role').setDescription('Role').setRequired(true)))
    .addSubcommand(s => s.setName('addadmin').setDescription('Add an admin role').addRoleOption(o => o.setName('role').setDescription('Role').setRequired(true)))
    .addSubcommand(s => s.setName('removeadmin').setDescription('Remove an admin role').addRoleOption(o => o.setName('role').setDescription('Role').setRequired(true)))
    .addSubcommand(s => s.setName('view').setDescription('View currently authorized roles'))
    .addSubcommand(s => s.setName('sync').setDescription('Instantly scan and sync all admin-perm roles'))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  cooldown: 5,

  async execute(interaction, client) {
    if (!(await Perm.check(interaction, 'admin'))) return;
    const sub  = interaction.options.getSubcommand();
    const data = await GuildModel.get(interaction.guild.id);
    if (!data.modRoles)   data.modRoles = [];
    if (!data.adminRoles) data.adminRoles = [];

    if (sub === 'view') {
      const mods   = data.modRoles.length   > 0 ? data.modRoles.map(r => `<@&${r}>`).join('\n> ')   : 'None Configured';
      const admins = data.adminRoles.length > 0 ? data.adminRoles.map(r => `<@&${r}>`).join('\n> ') : 'None Configured';

      const container = new ContainerBuilder();
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent('## Role Authorization'));
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent('> Roles authorized to use the bot\'s Admin and Mod commands.'));
      container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));

      const section = new SectionBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`> **Admin Roles:**\n> ${admins}`),
          new TextDisplayBuilder().setContent(`> **Mod Roles:**\n> ${mods}`),
        )
        .setThumbnailAccessory(new ThumbnailBuilder({ media: { url: client.user.displayAvatarURL({ size: 256 }) } }));
      container.addSectionComponents(section);

      container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent('-# Note: Users with native Administrator perm are always Admins.'));

      return interaction.reply({ flags: MessageFlags.IsComponentsV2, components: [container] });
    }

    if (sub === 'sync') {
      await interaction.deferReply();
      const roles      = await interaction.guild.roles.fetch();
      const adminRoles = roles.filter(r => r.permissions.has(PermissionFlagsBits.Administrator) || r.permissions.has(PermissionFlagsBits.ManageGuild)).map(r => r.id);
      const modRoles   = roles.filter(r => !adminRoles.includes(r.id) && (r.permissions.has(PermissionFlagsBits.ModerateMembers) || r.permissions.has(PermissionFlagsBits.ManageMessages))).map(r => r.id);
      data.adminRoles  = Array.from(adminRoles);
      data.modRoles    = Array.from(modRoles);
      await GuildModel.save(interaction.guild.id, data);
      return interaction.editReply(V2.reply(V2.success('Sync Completed',
        'All roles with native permissions have been imported into the bot system.', client)));
    }

    const role = interaction.options.getRole('role');
    if (sub === 'addmod') {
      if (!data.modRoles.includes(role.id)) data.modRoles.push(role.id);
      await GuildModel.save(interaction.guild.id, data);
      return interaction.reply(V2.reply(V2.success('Role Authorized', `${role} is now a Moderator Role.`, client)));
    }
    if (sub === 'removemod') {
      data.modRoles = data.modRoles.filter(r => r !== role.id);
      await GuildModel.save(interaction.guild.id, data);
      return interaction.reply(V2.reply(V2.success('Authorization Revoked', `${role} removed from mod roles.`, client)));
    }
    if (sub === 'addadmin') {
      if (!data.adminRoles.includes(role.id)) data.adminRoles.push(role.id);
      await GuildModel.save(interaction.guild.id, data);
      return interaction.reply(V2.reply(V2.success('Role Authorized', `${role} is now an Admin Role.`, client)));
    }
    if (sub === 'removeadmin') {
      data.adminRoles = data.adminRoles.filter(r => r !== role.id);
      await GuildModel.save(interaction.guild.id, data);
      return interaction.reply(V2.reply(V2.success('Authorization Revoked', `${role} removed from admin roles.`, client)));
    }
  },
};
