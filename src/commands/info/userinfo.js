const {
  SlashCommandBuilder,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  SectionBuilder,
  ThumbnailBuilder,
  MessageFlags,
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder().setName('userinfo').setDescription('View info about a user')
    .addUserOption(o => o.setName('user').setDescription('User (default: yourself)')),
  cooldown: 5,
  async execute(interaction, client) {
    const user = interaction.options.getUser('user') || interaction.user;
    const member = interaction.guild.members.cache.get(user.id);
    const roles = member?.roles.cache.filter(r => r.id !== interaction.guild.id).map(r => r.toString()).join(', ') || 'None';

    const container = new ContainerBuilder();

    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`## User Information — ${user.tag}`));
    container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));

    const section = new SectionBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`**User ID:** \`${user.id}\``),
        new TextDisplayBuilder().setContent(`**Bot:** \`${user.bot ? 'Yes' : 'No'}\``),
        new TextDisplayBuilder().setContent(`**Color:** \`${member?.displayHexColor || 'N/A'}\``),
        new TextDisplayBuilder().setContent(`**Highest Role:** ${member?.roles?.highest || 'None'}`),
      )
      .setThumbnailAccessory(new ThumbnailBuilder({ media: { url: user.displayAvatarURL({ size: 256 }) } }));
    container.addSectionComponents(section);

    container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `**Account Created:** <t:${Math.floor(user.createdTimestamp / 1000)}:F>\n` +
        `**Joined Server:** ${member ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:F>` : 'Not in server'}\n\n` +
        `**Roles [${(member?.roles.cache.size || 1) - 1}]:**\n${roles.length > 800 ? roles.substring(0, 797) + '...' : roles || 'None'}`
      )
    );

    container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent('-# GAMERZ WORKSHOP'));

    await interaction.reply({ flags: MessageFlags.IsComponentsV2, components: [container] });
  },
};
