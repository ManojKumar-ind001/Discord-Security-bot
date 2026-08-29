const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const MusicUI = require('../../music/MusicUI');
const V2 = require('../../utils/Embed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('queue')
    .setDescription('Display the server music queue with interactive pagination')
    .addIntegerOption(o => o.setName('page').setDescription('Queue page number').setMinValue(1)),
  cooldown: 3,

  async execute(interaction, client) {
    const player = client.musicManager?.kazagumo?.players?.get(interaction.guildId);
    if (!player || (!player.queue.current && player.queue.length === 0)) {
      return interaction.reply({
        ...V2.reply(V2.info('Queue Empty', 'The music queue is currently empty.', client)),
        flags: MessageFlags.Ephemeral,
      });
    }

    let currentPage = interaction.options.getInteger('page') || 1;
    let queueData = MusicUI.queue(player, currentPage);
    let buttons = MusicUI.queueButtons(queueData.currentPage, queueData.totalPages);

    const { resource } = await interaction.reply({
      flags: MessageFlags.IsComponentsV2,
      components: [queueData.container, buttons],
      withResponse: true,
    });

    const msg = resource?.message;
    if (!msg || queueData.totalPages <= 1) return;

    const collector = msg.createMessageComponentCollector({
      filter: i => i.user.id === interaction.user.id && i.customId.startsWith('queue_'),
      time: 120000,
    });

    collector.on('collect', async i => {
      const curPlayer = client.musicManager?.kazagumo?.players?.get(interaction.guildId);
      if (!curPlayer) {
        return i.reply({ content: 'Queue is no longer active.', flags: MessageFlags.Ephemeral });
      }

      if (i.customId === 'queue_clear') {
        curPlayer.queue.clear();
        await i.reply({ content: 'Cleared upcoming queue.', flags: MessageFlags.Ephemeral });
        queueData = MusicUI.queue(curPlayer, 1);
        buttons = MusicUI.queueButtons(1, 1);
        return interaction.editReply({
          flags: MessageFlags.IsComponentsV2,
          components: [queueData.container, buttons],
        });
      }

      if (i.customId === 'queue_prev') {
        currentPage = Math.max(currentPage - 1, 1);
      } else if (i.customId === 'queue_next') {
        currentPage = Math.min(currentPage + 1, queueData.totalPages);
      }

      queueData = MusicUI.queue(curPlayer, currentPage);
      buttons = MusicUI.queueButtons(queueData.currentPage, queueData.totalPages);

      await i.deferUpdate();
      await interaction.editReply({
        flags: MessageFlags.IsComponentsV2,
        components: [queueData.container, buttons],
      });
    });

    collector.on('end', () => {
      interaction.editReply({
        components: [queueData.container],
      }).catch(() => {});
    });
  },
};
