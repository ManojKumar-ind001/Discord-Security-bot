const { SlashCommandBuilder } = require('discord.js');
const V2 = require('../../utils/Embed');
const GuildModel = require('../../models/Guild');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('autoplay')
    .setDescription('Toggle automatic playback of recommended tracks when queue finishes')
    .addBooleanOption(o =>
      o.setName('enabled')
        .setDescription('Enable or disable autoplay')
        .setRequired(false)
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

    const explicitEnabled = interaction.options.getBoolean('enabled');
    const newState = explicitEnabled !== null ? explicitEnabled : !player.data.get('autoplay');

    player.data.set('autoplay', newState);

    const guildData = await GuildModel.get(interaction.guild.id);
    if (!guildData.music) guildData.music = {};
    guildData.music.autoplay = newState;
    await GuildModel.save(interaction.guild.id, guildData);

    return interaction.reply(
      V2.reply(
        V2.success(
          'Autoplay Updated',
          `Autoplay is now **${newState ? 'Enabled' : 'Disabled'}**.\n${newState ? '> *The bot will automatically discover and play similar tracks when the queue ends.*' : ''}`,
          client
        )
      )
    );
  },
};
