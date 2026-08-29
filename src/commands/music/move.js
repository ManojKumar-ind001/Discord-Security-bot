const { SlashCommandBuilder,
  MessageFlags,
} = require('discord.js');
const V2 = require('../../utils/Embed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('move')
    .setDescription('Move a track to a different position in the queue')
    .addIntegerOption(o =>
      o.setName('from')
        .setDescription('Current position of the track')
        .setRequired(true)
        .setMinValue(1)
    )
    .addIntegerOption(o =>
      o.setName('to')
        .setDescription('Target position in the queue')
        .setRequired(true)
        .setMinValue(1)
    ),
  cooldown: 3,

  async execute(interaction, client) {
    const player = client.musicManager?.kazagumo?.players?.get(interaction.guildId);
    if (!player || player.queue.length <= 1) {
      return interaction.reply({
        ...V2.reply(V2.error('Cannot Move', 'There must be at least 2 tracks in the queue to move items.', client)),
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

    const fromPos = interaction.options.getInteger('from');
    const toPos = interaction.options.getInteger('to');

    if (fromPos > player.queue.length || toPos > player.queue.length || fromPos === toPos) {
      return interaction.reply({
        ...V2.reply(
          V2.error('Invalid Positions', `Both positions must be valid numbers between \`1\` and \`${player.queue.length}\`.`, client)
        ),
        flags: MessageFlags.Ephemeral,
      });
    }

    const targetTrack = player.queue[fromPos - 1];
    player.queue.splice(fromPos - 1, 1);
    player.queue.splice(toPos - 1, 0, targetTrack);

    return interaction.reply(
      V2.reply(
        V2.success(
          'Track Moved',
          `Moved **${(targetTrack.title || 'Track').substring(0, 50)}** from \`#${fromPos}\` to \`#${toPos}\`.`,
          client
        )
      )
    );
  },
};
