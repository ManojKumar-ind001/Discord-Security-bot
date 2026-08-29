const { SlashCommandBuilder } = require('discord.js');
const V2 = require('../../utils/Embed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('remove')
    .setDescription('Remove a track from the queue by its position number')
    .addIntegerOption(o =>
      o.setName('position')
        .setDescription('Queue position number to remove (1-indexed)')
        .setRequired(true)
        .setMinValue(1)
    ),
  cooldown: 3,

  async execute(interaction, client) {
    const player = client.musicManager?.kazagumo?.players?.get(interaction.guildId);
    if (!player || player.queue.length === 0) {
      return interaction.reply({
        ...V2.reply(V2.error('Queue Empty', 'The upcoming queue is currently empty.', client)),
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

    const pos = interaction.options.getInteger('position');
    if (pos > player.queue.length) {
      return interaction.reply({
        ...V2.reply(
          V2.error('Invalid Position', `Position must be between \`1\` and \`${player.queue.length}\`.`, client)
        ),
        ephemeral: true,
      });
    }

    const removed = player.queue.remove(pos - 1);

    return interaction.reply(
      V2.reply(
        V2.success(
          'Track Removed',
          `Removed **${(removed?.title || 'Track').substring(0, 60)}** from position \`#${pos}\`.`,
          client
        )
      )
    );
  },
};
