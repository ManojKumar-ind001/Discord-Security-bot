const { SlashCommandBuilder,
  MessageFlags,
} = require('discord.js');
const V2 = require('../../utils/Embed');

module.exports = {
  data: new SlashCommandBuilder().setName('skip').setDescription('Skip to the next track'),
  cooldown: 3,
  async execute(interaction, client) {
    const player = client.musicManager?.kazagumo?.players?.get(interaction.guildId);
    if (!player || !player.queue.current) {
      return interaction.reply({
        ...V2.reply(V2.error('Not Playing', 'There is no track currently playing.', client)),
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

    const skippedTitle = player.queue.current.title;
    await player.skip();

    return interaction.reply(
      V2.reply(V2.success('Track Skipped', `Skipped **${skippedTitle}**.`, client))
    );
  },
};
