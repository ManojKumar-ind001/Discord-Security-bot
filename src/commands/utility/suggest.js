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
const V2 = require('../../utils/Embed');

module.exports = {
  data: new SlashCommandBuilder().setName('suggest').setDescription('Submit a suggestion')
    .addStringOption(o => o.setName('suggestion').setDescription('Your suggestion').setRequired(true)),
  cooldown: 30,
  async execute(interaction, client) {
    const sug = interaction.options.getString('suggestion');

    // Track votes: { up: Set<userId>, down: Set<userId> }
    const upVoters   = new Set();
    const downVoters = new Set();

    function buildSugContainer() {
      const container = new ContainerBuilder();
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent('## Suggestion'));
      container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));

      const section = new SectionBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`> ${sug}`),
          new TextDisplayBuilder().setContent(`> **Submitted by:** <@${interaction.user.id}> (\`${interaction.user.tag}\`)`),
          new TextDisplayBuilder().setContent('> **Status:** Pending Review'),
        )
        .setThumbnailAccessory(new ThumbnailBuilder({ media: { url: interaction.user.displayAvatarURL({ size: 256 }) } }));
      container.addSectionComponents(section);

      container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`-# ${upVoters.size} upvotes · ${downVoters.size} downvotes | GAMERZ WORKSHOP`)
      );
      return container;
    }

    function buildRow() {
      return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('sug_up')
          .setLabel(`Upvote (${upVoters.size})`)
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('sug_down')
          .setLabel(`Downvote (${downVoters.size})`)
          .setStyle(ButtonStyle.Danger),
      );
    }

    const { resource } = await interaction.reply({
      flags: MessageFlags.IsComponentsV2,
      components: [buildSugContainer(), buildRow()],
      withResponse: true,
    });

    const msg = resource?.message;
    if (!msg) return;

    const collector = msg.createMessageComponentCollector({ time: 86400000 }); // 24h

    collector.on('collect', async i => {
      const uid = i.user.id;

      if (i.customId === 'sug_up') {
        if (upVoters.has(uid)) {
          // Toggle off
          upVoters.delete(uid);
        } else {
          upVoters.add(uid);
          downVoters.delete(uid); // Remove opposite vote
        }
      } else if (i.customId === 'sug_down') {
        if (downVoters.has(uid)) {
          downVoters.delete(uid);
        } else {
          downVoters.add(uid);
          upVoters.delete(uid);
        }
      }

      await i.deferUpdate();
      await interaction.editReply({
        flags: MessageFlags.IsComponentsV2,
        components: [buildSugContainer(), buildRow()],
      });
    });
  },
};
