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
  data: new SlashCommandBuilder().setName('serverinfo').setDescription('View server information'),
  cooldown: 5,
  async execute(interaction, client) {
    const g = interaction.guild;
    await g.fetch();

    const container = new ContainerBuilder();
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`## Server Information — ${g.name}`));
    container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));

    const iconUrl = g.iconURL({ size: 256 }) || client.user.displayAvatarURL({ size: 256 });
    const section = new SectionBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`> **Server ID:** \`${g.id}\``),
        new TextDisplayBuilder().setContent(`> **Owner:** <@${g.ownerId}>`),
        new TextDisplayBuilder().setContent(`> **Members:** \`${g.memberCount}\``),
        new TextDisplayBuilder().setContent(`> **Channels:** \`${g.channels.cache.size}\``),
      )
      .setThumbnailAccessory(new ThumbnailBuilder({ media: { url: iconUrl } }));
    container.addSectionComponents(section);

    container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `> **Created:** <t:${Math.floor(g.createdTimestamp / 1000)}:F>\n` +
        `> **Roles:** \`${g.roles.cache.size}\`\n` +
        `> **Emojis:** \`${g.emojis.cache.size}\`\n` +
        `> **Verification:** \`${g.verificationLevel}\`\n` +
        `> **Boost Tier:** \`Tier ${g.premiumTier}\` (${g.premiumSubscriptionCount || 0} boosts)`
      )
    );

    container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent('-# GAMERZ WORKSHOP'));

    await interaction.reply({ flags: MessageFlags.IsComponentsV2, components: [container] });
  },
};
