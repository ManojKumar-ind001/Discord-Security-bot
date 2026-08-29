const { SlashCommandBuilder } = require('discord.js');
const V2 = require('../../utils/Embed');

module.exports = {
  data: new SlashCommandBuilder().setName('stop').setDescription('Stop music playback, clear queue, and leave voice'),
  cooldown: 3,
  async execute(interaction, client) {
    const player = client.musicManager?.kazagumo?.players?.get(interaction.guildId);
    if (!player) {
      return interaction.reply({
        ...V2.reply(V2.error('Not Playing', 'There is no active music player in this server.', client)),
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

    player.queue.clear();
    player.destroy();

    return interaction.reply(
      V2.reply(V2.success('Playback Stopped', 'Cleared the queue and disconnected from the voice channel.', client))
    );
  },
};
