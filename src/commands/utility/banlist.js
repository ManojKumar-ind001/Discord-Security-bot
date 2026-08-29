const {
  SlashCommandBuilder,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  PermissionFlagsBits,
  MessageFlags,
} = require('discord.js');
const Perm = require('../../utils/Permissions');

module.exports = {
  data: new SlashCommandBuilder().setName('banlist').setDescription('View banned users')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
  cooldown: 10,
  async execute(interaction, client) {
    if (!(await Perm.check(interaction, 'mod'))) return;
    await interaction.deferReply({ ephemeral: true });

    const bans = await interaction.guild.bans.fetch();
    if (!bans.size) return interaction.editReply({ content: 'No banned users found in this server.' });

    const list = [...bans.values()].slice(0, 20).map((b, i) =>
      `**${i + 1}.** \`${b.user.tag}\` (\`${b.user.id}\`)\n-# Reason: ${b.reason || 'No reason specified'}`
    );

    const container = new ContainerBuilder();
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`## Ban List — ${bans.size} Total Banned`));
    container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));

    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(list.join('\n\n')));

    container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent('-# GAMERZ WORKSHOP | Showing up to 20'));

    await interaction.editReply({
      flags: MessageFlags.IsComponentsV2,
      components: [container],
    });
  },
};
