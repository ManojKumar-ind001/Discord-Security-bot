const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const MusicUI = require('../../music/MusicUI');
const V2 = require('../../utils/Embed');

module.exports = {
  data: new SlashCommandBuilder().setName('nowplaying').setDescription('Show details of the currently playing track'),
  cooldown: 3,
  async execute(interaction, client) {
    const player = client.musicManager?.kazagumo?.players?.get(interaction.guildId);
    if (!player || !player.queue.current) {
      return interaction.reply({
        ...V2.reply(V2.error('Not Playing', 'There is no track currently playing in this server.', client)),
        flags: MessageFlags.Ephemeral,
      });
    }

    const container = MusicUI.nowPlaying(player, player.queue.current);
    const buttons = MusicUI.controlButtons(player);

    return interaction.reply({
      flags: MessageFlags.IsComponentsV2,
      components: [container, buttons],
    });
  },
};
