const { SlashCommandBuilder } = require('discord.js');
const V2 = require('../../utils/Embed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('filter')
    .setDescription('Apply audio filters and equalizer presets')
    .addStringOption(o =>
      o.setName('preset')
        .setDescription('Filter preset to apply')
        .setRequired(true)
        .addChoices(
          { name: 'Clear (Reset All Filters)', value: 'clear' },
          { name: 'Bass Boost', value: 'bassboost' },
          { name: 'Nightcore', value: 'nightcore' },
          { name: 'Vaporwave', value: 'vaporwave' },
          { name: '8D / Rotation', value: '8d' },
          { name: 'Karaoke', value: 'karaoke' },
          { name: 'Tremolo', value: 'tremolo' },
          { name: 'Vibrato', value: 'vibrato' }
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

    const preset = interaction.options.getString('preset');
    const shoukakuPlayer = player.player; // underlying Shoukaku player

    try {
      if (preset === 'clear') {
        await shoukakuPlayer.clearFilters();
        return interaction.reply(
          V2.reply(V2.success('Filters Cleared', 'Reset all audio filters back to default.', client))
        );
      }

      if (preset === 'bassboost') {
        await shoukakuPlayer.setFilters({
          equalizer: [
            { band: 0, gain: 0.3 },
            { band: 1, gain: 0.25 },
            { band: 2, gain: 0.2 },
            { band: 3, gain: 0.1 },
            { band: 4, gain: 0.05 },
          ],
        });
      } else if (preset === 'nightcore') {
        await shoukakuPlayer.setFilters({
          timescale: { speed: 1.2, pitch: 1.2, rate: 1.0 },
        });
      } else if (preset === 'vaporwave') {
        await shoukakuPlayer.setFilters({
          timescale: { speed: 0.85, pitch: 0.8, rate: 1.0 },
        });
      } else if (preset === '8d') {
        await shoukakuPlayer.setFilters({
          rotation: { rotationHz: 0.2 },
        });
      } else if (preset === 'karaoke') {
        await shoukakuPlayer.setFilters({
          karaoke: { level: 1.0, monoLevel: 1.0, filterBand: 220.0, filterWidth: 100.0 },
        });
      } else if (preset === 'tremolo') {
        await shoukakuPlayer.setFilters({
          tremolo: { frequency: 4.0, depth: 0.75 },
        });
      } else if (preset === 'vibrato') {
        await shoukakuPlayer.setFilters({
          vibrato: { frequency: 4.0, depth: 0.75 },
        });
      }

      const presetNames = {
        bassboost: 'Bass Boost',
        nightcore: 'Nightcore',
        vaporwave: 'Vaporwave',
        '8d': '8D / Rotation',
        karaoke: 'Karaoke',
        tremolo: 'Tremolo',
        vibrato: 'Vibrato',
      };

      return interaction.reply(
        V2.reply(V2.success('Filter Applied', `Applied audio filter: **${presetNames[preset] || preset}**.`, client))
      );
    } catch (err) {
      return interaction.reply({
        ...V2.reply(V2.error('Filter Error', `Failed to apply filter: \`${err.message}\``, client)),
        ephemeral: true,
      });
    }
  },
};
