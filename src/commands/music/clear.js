const { SlashCommandBuilder,
  MessageFlags,
} = require('discord.js');
const V2 = require('../../utils/Embed');

module.exports = {
  data: new SlashCommandBuilder().setName('clear').setDescription('Clear all upcoming tracks in the music queue'),
  cooldown: 3,
  async execute(interaction, client) {
    const player = client.musicManager?.kazagumo?.players?.get(interaction.guildId);
    if (!player || player.queue.length === 0) {
      return interaction.reply({
        ...V2.reply(V2.error('Queue Empty', 'The upcoming queue is already empty.', client)),
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

    const count = player.queue.length;
    player.queue.clear();

    return interaction.reply(
      V2.reply(V2.success('Queue Cleared', `Cleared **${count}** upcoming track${count !== 1 ? 's' : ''} from the queue.`, client))
    );
  },
};
