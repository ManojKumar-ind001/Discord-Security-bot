const { SlashCommandBuilder } = require('discord.js');
const V2 = require('../../utils/Embed');

module.exports = {
  data: new SlashCommandBuilder().setName('shuffle').setDescription('Randomly shuffle the upcoming queue'),
  cooldown: 3,
  async execute(interaction, client) {
    const player = client.musicManager?.kazagumo?.players?.get(interaction.guildId);
    if (!player || player.queue.length <= 1) {
      return interaction.reply({
        ...V2.reply(V2.error('Cannot Shuffle', 'There must be at least 2 upcoming tracks in the queue to shuffle.', client)),
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

    player.queue.shuffle();

    return interaction.reply(
      V2.reply(V2.success('Queue Shuffled', `Shuffled **${player.queue.length}** upcoming tracks.`, client))
    );
  },
};
