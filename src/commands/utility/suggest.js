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
  data: new SlashCommandBuilder().setName('suggest').setDescription('Submit a suggestion')
    .addStringOption(o => o.setName('suggestion').setDescription('Your suggestion').setRequired(true)),
  cooldown: 30,
  async execute(interaction, client) {
    const sug = interaction.options.getString('suggestion');

    const container = new ContainerBuilder();
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent('## Suggestion'));
    container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));

    const section = new SectionBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`>>> ${sug}`),
        new TextDisplayBuilder().setContent(`\n**Submitted by:** <@${interaction.user.id}> (${interaction.user.tag})\n**Status:** Pending Review`),
      )
      .setThumbnailAccessory(new ThumbnailBuilder({ media: { url: interaction.user.displayAvatarURL({ size: 256 }) } }));
    container.addSectionComponents(section);

    container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent('-# GAMERZ WORKSHOP'));

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('sug_up').setLabel('Upvote (0)').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('sug_down').setLabel('Downvote (0)').setStyle(ButtonStyle.Danger),
    );

    await interaction.reply({
      flags: MessageFlags.IsComponentsV2,
      components: [container, row],
    });
  },
};
