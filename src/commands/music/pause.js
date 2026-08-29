const { SlashCommandBuilder } = require('discord.js');
const V2 = require('../../utils/Embed');

module.exports = {
  data: new SlashCommandBuilder().setName('pause').setDescription('Pause the current track'),
  cooldown: 3,
  async execute(interaction, client) {
    const player = client.musicManager?.kazagumo?.players?.get(interaction.guildId);
    if (!player || !player.playing) {
      return interaction.reply({
        ...V2.reply(V2.error('Not Playing', 'There is nothing currently playing in this server.', client)),
        ephemeral: true,
      });
    }

    const voiceChannel = interaction.member.voice?.channel;
    if (!voiceChannel || voiceChannel.id !== player.voiceId) {
      return interaction.reply({
        ...V2.reply(V2.error('Voice Mismatch', 'You must be in the same voice channel as the bot.', client)),
        ephemeral: true,
      });
    }

    if (player.paused) {
      return interaction.reply({
        ...V2.reply(V2.info('Already Paused', 'Playback is already paused. Use `/resume` to continue.', client)),
        ephemeral: true,
      });
    }

    player.pause(true);
    return interaction.reply(V2.reply(V2.success('Playback Paused', 'Paused the current track. Use `/resume` to continue.', client)));
  },
};
