const { SlashCommandBuilder,
  MessageFlags,
} = require('discord.js');
const V2 = require('../../utils/Embed');
const GuildModel = require('../../models/Guild');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('volume')
    .setDescription('Adjust or view the music playback volume')
    .addIntegerOption(o =>
      o.setName('level')
        .setDescription('Volume level between 1 and 100')
        .setMinValue(1)
        .setMaxValue(100)
    ),
  cooldown: 3,

  async execute(interaction, client) {
    const player = client.musicManager?.kazagumo?.players?.get(interaction.guildId);
    if (!player) {
      return interaction.reply({
        ...V2.reply(V2.error('Not Playing', 'There is no active music player in this server.', client)),
        flags: MessageFlags.Ephemeral,
      });
    }

    const level = interaction.options.getInteger('level');

    if (level === null) {
      return interaction.reply(
        V2.reply(V2.info('Current Volume', `Playback volume is currently set to **${player.volume}%**.`, client))
      );
    }

    const voiceChannel = interaction.member.voice?.channel;
    if (!voiceChannel || voiceChannel.id !== player.voiceId) {
      return interaction.reply({
        ...V2.reply(V2.error('Voice Mismatch', 'You must be in the same voice channel as the bot.', client)),
        flags: MessageFlags.Ephemeral,
      });
    }

    player.setVolume(level);

    // Save as persistent default volume for this guild
    const guildData = await GuildModel.get(interaction.guild.id);
    if (!guildData.music) guildData.music = {};
    guildData.music.defaultVolume = level;
    await GuildModel.save(interaction.guild.id, guildData);

    return interaction.reply(
      V2.reply(V2.success('Volume Adjusted', `Set playback volume to **${level}%**.`, client))
    );
  },
};
