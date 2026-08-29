const {
  SlashCommandBuilder,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  SectionBuilder,
  ThumbnailBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder().setName('avatar').setDescription('View a user avatar')
    .addUserOption(o => o.setName('user').setDescription('User (default: yourself)')),
  cooldown: 3,
  async execute(interaction, client) {
    const user = interaction.options.getUser('user') || interaction.user;
    const url = user.displayAvatarURL({ size: 1024 });

    const container = new ContainerBuilder();
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`## Avatar — ${user.tag}`));
    container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));

    const section = new SectionBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`> **User:** <@${user.id}> (\`${user.tag}\`)`),
        new TextDisplayBuilder().setContent(`> **ID:** \`${user.id}\``),
        new TextDisplayBuilder().setContent(`> [Direct Image Link](${url})`),
      )
      .setThumbnailAccessory(new ThumbnailBuilder({ media: { url } }));
    container.addSectionComponents(section);

    container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent('-# GAMERZ WORKSHOP'));

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setLabel('Open PNG').setStyle(ButtonStyle.Link).setURL(user.displayAvatarURL({ extension: 'png', size: 1024 })),
      new ButtonBuilder().setLabel('Open WebP').setStyle(ButtonStyle.Link).setURL(url),
    );

    await interaction.reply({
      flags: MessageFlags.IsComponentsV2,
      components: [container, row],
    });
  },
};
