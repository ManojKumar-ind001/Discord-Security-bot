const { SlashCommandBuilder,
  MessageFlags,
} = require('discord.js');
const ms = require('ms');
const V2 = require('../../utils/Embed');
const MusicUI = require('../../music/MusicUI');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('seek')
    .setDescription('Seek to a specific timestamp in the current track')
    .addStringOption(o =>
      o.setName('time')
        .setDescription('Timestamp (e.g. 1:30, 90s, 2m)')
        .setRequired(true)
    ),
  cooldown: 3,

  async execute(interaction, client) {
    const player = client.musicManager?.kazagumo?.players?.get(interaction.guildId);
    if (!player || !player.queue.current) {
      return interaction.reply({
        ...V2.reply(V2.error('Not Playing', 'There is no track currently playing in this server.', client)),
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

    const track = player.queue.current;
    if (!track.isSeekable) {
      return interaction.reply({
        ...V2.reply(V2.error('Not Seekable', 'This audio stream does not support seeking.', client)),
        flags: MessageFlags.Ephemeral,
      });
    }

    const timeStr = interaction.options.getString('time').trim();
    let targetMs = 0;

    // Support MM:SS or HH:MM:SS format
    if (timeStr.includes(':')) {
      const parts = timeStr.split(':').map(Number);
      if (parts.some(isNaN)) {
        return interaction.reply({
          ...V2.reply(V2.error('Invalid Timestamp', 'Please provide a valid time format like `1:30` or `90s`.', client)),
          flags: MessageFlags.Ephemeral,
        });
      }
      if (parts.length === 2) {
        targetMs = (parts[0] * 60 + parts[1]) * 1000;
      } else if (parts.length === 3) {
        targetMs = (parts[0] * 3600 + parts[1] * 60 + parts[2]) * 1000;
      }
    } else {
      targetMs = ms(timeStr);
    }

    if (!targetMs || isNaN(targetMs) || targetMs < 0 || targetMs > track.length) {
      return interaction.reply({
        ...V2.reply(
          V2.error('Out of Range', `Target time must be between \`00:00\` and \`${MusicUI.formatTime(track.length)}\`.`, client)
        ),
        flags: MessageFlags.Ephemeral,
      });
    }

    player.seek(targetMs);

    return interaction.reply(
      V2.reply(V2.success('Position Updated', `Seeked to \`${MusicUI.formatTime(targetMs)}\`.`, client))
    );
  },
};
