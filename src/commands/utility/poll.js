const {
  SlashCommandBuilder,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} = require('discord.js');
const ms = require('ms');

module.exports = {
  data: new SlashCommandBuilder().setName('poll').setDescription('Create a timed interactive poll')
    .addStringOption(o => o.setName('question').setDescription('Poll question').setRequired(true))
    .addStringOption(o => o.setName('option1').setDescription('Option 1').setRequired(true))
    .addStringOption(o => o.setName('option2').setDescription('Option 2').setRequired(true))
    .addStringOption(o => o.setName('duration').setDescription('Duration (e.g. 60s, 1m, 1h) - default 1m'))
    .addStringOption(o => o.setName('option3').setDescription('Option 3'))
    .addStringOption(o => o.setName('option4').setDescription('Option 4')),
  cooldown: 10,
  async execute(interaction, client) {
    const q = interaction.options.getString('question');
    const durRaw = interaction.options.getString('duration') || '1m';
    const dur = ms(durRaw);

    if (!dur || dur < 5000 || dur > 604800000) {
      return interaction.reply({ content: 'Invalid duration (Min 5s, Max 7 days). Use formats like 60s, 1m, 1h.', flags: MessageFlags.Ephemeral });
    }

    const opts = [
      interaction.options.getString('option1'),
      interaction.options.getString('option2'),
      interaction.options.getString('option3'),
      interaction.options.getString('option4'),
    ].filter(Boolean);

    const labels = ['1', '2', '3', '4'];
    const votes = Array(opts.length).fill(0);
    const voters = new Set();

    function generateContainer(ended = false) {
      const container = new ContainerBuilder();
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(ended ? `## Poll Results — ${q}` : `## Active Poll — ${q}`)
      );
      container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));

      opts.forEach((o, i) => {
        const total = votes.reduce((a, b) => a + b, 0);
        const pct = total > 0 ? Math.round((votes[i] / total) * 100) : 0;
        const bar = '█'.repeat(Math.round(pct / 10)) + '░'.repeat(10 - Math.round(pct / 10));
        container.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `> **[${labels[i]}] ${o}**\n> \`${bar}\` **${votes[i]}** vote${votes[i] !== 1 ? 's' : ''} (${pct}%)`
          )
        );
        if (i < opts.length - 1) {
          container.addSeparatorComponents(new SeparatorBuilder().setDivider(false).setSpacing(SeparatorSpacingSize.Small));
        }
      });

      container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          ended
            ? `-# Poll has ended | ${votes.reduce((a, b) => a + b, 0)} total votes | GAMERZ WORKSHOP`
            : `-# Duration: ${durRaw} | ${voters.size} vote${voters.size !== 1 ? 's' : ''} cast | GAMERZ WORKSHOP`
        )
      );
      return container;
    }

    const row = new ActionRowBuilder().addComponents(
      opts.map((o, i) => new ButtonBuilder().setCustomId('poll_btn_' + i).setLabel(`Option ${labels[i]}: ${o.substring(0, 20)}`).setStyle(ButtonStyle.Primary))
    );
    const endRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('poll_end').setLabel('End Poll').setStyle(ButtonStyle.Danger)
    );

    const { resource } = await interaction.reply({
      flags: MessageFlags.IsComponentsV2,
      components: [generateContainer(), row, endRow],
      withResponse: true,
    });

    const msg = resource?.message;
    if (!msg) return;

    const collector = msg.createMessageComponentCollector({ time: dur });

    collector.on('collect', async i => {
      if (i.customId === 'poll_end') {
        if (i.user.id !== interaction.user.id)
          return i.reply({ content: 'Only the poll creator can end it early.', flags: MessageFlags.Ephemeral });
        return collector.stop('manual');
      }

      if (voters.has(i.user.id))
        return i.reply({ content: 'You have already voted in this poll.', flags: MessageFlags.Ephemeral });

      const idx = parseInt(i.customId.replace('poll_btn_', ''));
      votes[idx]++;
      voters.add(i.user.id);

      await i.deferUpdate();
      await interaction.editReply({
        flags: MessageFlags.IsComponentsV2,
        components: [generateContainer(), row, endRow],
      });
    });

    collector.on('end', async () => {
      // Update original message to show results (no buttons)
      await interaction.editReply({
        flags: MessageFlags.IsComponentsV2,
        components: [generateContainer(true)],
      }).catch(() => {});

      // Send poll ended announcement as a V2 message
      const max = Math.max(...votes);
      const winners = opts.filter((_, i) => votes[i] === max);
      const totalVotes = votes.reduce((a, b) => a + b, 0);

      const resultContainer = new ContainerBuilder();
      resultContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent('## Poll Ended'));
      resultContainer.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
      resultContainer.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `> **Question:** ${q}\n` +
          `> **Winner${winners.length > 1 ? 's' : ''}:** ${winners.join(', ')} with **${max}** vote${max !== 1 ? 's' : ''}\n` +
          `> **Total Votes:** ${totalVotes}`
        )
      );
      resultContainer.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
      resultContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent('-# GAMERZ WORKSHOP'));

      interaction.channel.send({
        flags: MessageFlags.IsComponentsV2,
        components: [resultContainer],
      }).catch(() => {});
    });
  },
};
