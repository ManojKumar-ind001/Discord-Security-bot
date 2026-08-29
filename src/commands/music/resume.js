const { SlashCommandBuilder,
  MessageFlags,
} = require('discord.js');
const V2 = require('../../utils/Embed');

module.exports = {
  data: new SlashCommandBuilder().setName('resume').setDescription('Resume the paused track'),
  cooldown: 3,
  async execute(interaction, client) {
    const player = client.musicManager?.kazagumo?.players?.get(interaction.guildId);
    if (!player) {
      return interaction.reply({
        ...V2.reply(V2.error('Not Playing', 'There is no active music player in this server.', client)),
        flags: MessageFlags.Ephemeral,
      });
    }

    const voiceChannel = interaction.member.voice?.channel;
    if (!voiceChannel || voiceChannel.id !== player.voiceId) {
      return interaction.reply({
        ...V2.reply(V2.error('Voice Mismatch', 'You must be in the same voice channel as the bot.', client)),
        flags: MessageFlags.Ephemeral,
      });
    }

    if (!player.paused) {
      return interaction.reply({
        ...V2.reply(V2.info('Already Playing', 'Playback is not paused.', client)),
        flags: MessageFlags.Ephemeral,
      });
    }

    player.pause(false);
    return interaction.reply(V2.reply(V2.success('Playback Resumed', 'Resumed track playback.', client)));
  },
};
