const { SlashCommandBuilder } = require('discord.js');
const V2 = require('../../utils/Embed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('loop')
    .setDescription('Configure music looping mode')
    .addStringOption(o =>
      o.setName('mode')
        .setDescription('Looping mode')
        .setRequired(true)
        .addChoices(
          { name: 'Off (Disabled)', value: 'off' },
          { name: 'Track (Repeat Current Song)', value: 'track' },
          { name: 'Queue (Repeat Entire Queue)', value: 'queue' }
        )
    ),
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

    const mode = interaction.options.getString('mode');
    player.setLoop(mode);

    const labels = {
      off: 'Disabled',
      track: 'Single Track Repeat',
      queue: 'Entire Queue Repeat',
    };

    return interaction.reply(
      V2.reply(V2.success('Loop Mode Updated', `Loop mode is now set to **${labels[mode]}**.`, client))
    );
  },
};
