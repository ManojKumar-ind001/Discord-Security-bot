const { SlashCommandBuilder,
  MessageFlags,
} = require('discord.js');
const V2 = require('../../utils/Embed');

// Filter presets – each fully defines ALL filter fields so switching presets
// always produces a clean slate (no stale values from a previous preset).
const FILTER_PRESETS = {
  clear: {
    label: 'Clear (Reset)',
    emoji: '🔄',
    description: 'Reset all audio filters to default.',
    filters: {
      volume: 1,
      equalizer: [],
      karaoke: null,
      timescale: null,
      tremolo: null,
      vibrato: null,
      rotation: null,
      distortion: null,
      channelMix: null,
      lowPass: null,
    },
  },

  bassboost: {
    label: 'Bass Boost',
    emoji: '🔊',
    description: 'Boosted low-end frequencies for heavy bass.',
    filters: {
      equalizer: [
        { band: 0, gain: 0.35 },
        { band: 1, gain: 0.30 },
        { band: 2, gain: 0.25 },
        { band: 3, gain: 0.15 },
        { band: 4, gain: 0.05 },
        { band: 5, gain: 0.0 },
        { band: 6, gain: -0.05 },
        { band: 7, gain: -0.05 },
        { band: 8, gain: -0.05 },
        { band: 9, gain: -0.05 },
        { band: 10, gain: -0.05 },
        { band: 11, gain: -0.05 },
        { band: 12, gain: -0.05 },
        { band: 13, gain: -0.05 },
      ],
      karaoke: null,
      timescale: null,
      tremolo: null,
      vibrato: null,
      rotation: null,
      distortion: null,
      channelMix: null,
      lowPass: null,
    },
  },

  nightcore: {
    label: 'Nightcore',
    emoji: '🌙',
    description: 'Higher pitch and faster speed for that Nightcore feel.',
    filters: {
      equalizer: [],
      karaoke: null,
      timescale: { speed: 1.18, pitch: 1.22, rate: 1.0 },
      tremolo: null,
      vibrato: null,
      rotation: null,
      distortion: null,
      channelMix: null,
      lowPass: null,
    },
  },

  vaporwave: {
    label: 'Vaporwave',
    emoji: '🌊',
    description: 'Lower pitch and slower speed for aesthetic lo-fi vibes.',
    filters: {
      equalizer: [],
      karaoke: null,
      timescale: { speed: 0.88, pitch: 0.82, rate: 1.0 },
      tremolo: null,
      vibrato: null,
      rotation: null,
      distortion: null,
      channelMix: null,
      lowPass: null,
    },
  },

  '8d': {
    label: '8D Audio',
    emoji: '🎧',
    description: 'Rotating panning effect for an immersive 8D audio experience.',
    filters: {
      equalizer: [],
      karaoke: null,
      timescale: null,
      tremolo: null,
      vibrato: null,
      rotation: { rotationHz: 0.2 },
      distortion: null,
      channelMix: null,
      lowPass: null,
    },
  },

  karaoke: {
    label: 'Karaoke',
    emoji: '🎤',
    description: 'Suppresses the center channel to reduce vocals.',
    filters: {
      equalizer: [],
      karaoke: { level: 1.0, monoLevel: 1.0, filterBand: 220.0, filterWidth: 100.0 },
      timescale: null,
      tremolo: null,
      vibrato: null,
      rotation: null,
      distortion: null,
      channelMix: null,
      lowPass: null,
    },
  },

  tremolo: {
    label: 'Tremolo',
    emoji: '〰️',
    description: 'Rapid volume oscillation for a wavering effect.',
    filters: {
      equalizer: [],
      karaoke: null,
      timescale: null,
      tremolo: { frequency: 4.0, depth: 0.75 },
      vibrato: null,
      rotation: null,
      distortion: null,
      channelMix: null,
      lowPass: null,
    },
  },

  vibrato: {
    label: 'Vibrato',
    emoji: '🎵',
    description: 'Rapid pitch oscillation for a vibrato effect.',
    filters: {
      equalizer: [],
      karaoke: null,
      timescale: null,
      tremolo: null,
      vibrato: { frequency: 4.0, depth: 0.75 },
      rotation: null,
      distortion: null,
      channelMix: null,
      lowPass: null,
    },
  },

  soft: {
    label: 'Soft / Lo-Fi',
    emoji: '☁️',
    description: 'Low pass filter for a warm, mellow lo-fi sound.',
    filters: {
      equalizer: [
        { band: 0, gain: 0.0 },
        { band: 1, gain: 0.0 },
        { band: 2, gain: 0.0 },
        { band: 3, gain: 0.0 },
        { band: 4, gain: 0.0 },
        { band: 5, gain: -0.05 },
        { band: 6, gain: -0.1 },
        { band: 7, gain: -0.15 },
        { band: 8, gain: -0.2 },
        { band: 9, gain: -0.25 },
        { band: 10, gain: -0.3 },
      ],
      karaoke: null,
      timescale: null,
      tremolo: null,
      vibrato: null,
      rotation: null,
      distortion: null,
      channelMix: null,
      lowPass: { smoothing: 20.0 },
    },
  },

  earrape: {
    label: 'Ear Rape',
    emoji: '💀',
    description: 'Maximum bass and distortion. Listener discretion advised!',
    filters: {
      equalizer: [
        { band: 0, gain: 1.0 },
        { band: 1, gain: 0.9 },
        { band: 2, gain: 0.8 },
        { band: 3, gain: 0.5 },
        { band: 4, gain: 0.3 },
      ],
      karaoke: null,
      timescale: null,
      tremolo: { frequency: 2.0, depth: 0.5 },
      vibrato: null,
      rotation: null,
      distortion: {
        sinOffset: 0.0,
        sinScale: 1.0,
        cosOffset: 0.0,
        cosScale: 1.0,
        tanOffset: 0.0,
        tanScale: 1.0,
        offset: 0.0,
        scale: 1.2,
      },
      channelMix: null,
      lowPass: null,
    },
  },

  pop: {
    label: 'Pop Boost',
    emoji: '🎶',
    description: 'Enhanced mids and presence boost for pop music.',
    filters: {
      equalizer: [
        { band: 0, gain: -0.05 },
        { band: 1, gain: 0.05 },
        { band: 2, gain: 0.10 },
        { band: 3, gain: 0.15 },
        { band: 4, gain: 0.10 },
        { band: 5, gain: 0.05 },
        { band: 6, gain: 0.0 },
        { band: 7, gain: -0.05 },
        { band: 8, gain: -0.05 },
      ],
      karaoke: null,
      timescale: null,
      tremolo: null,
      vibrato: null,
      rotation: null,
      distortion: null,
      channelMix: null,
      lowPass: null,
    },
  },

  speed: {
    label: 'Speed Up',
    emoji: '⚡',
    description: 'Play the track at 1.3x speed without pitch shift.',
    filters: {
      equalizer: [],
      karaoke: null,
      timescale: { speed: 1.3, pitch: 1.0, rate: 1.0 },
      tremolo: null,
      vibrato: null,
      rotation: null,
      distortion: null,
      channelMix: null,
      lowPass: null,
    },
  },

  slowed: {
    label: 'Slowed + Reverb',
    emoji: '🌑',
    description: 'Slow the track down for a dreamy slowed-and-reverb feel.',
    filters: {
      equalizer: [],
      karaoke: null,
      timescale: { speed: 0.82, pitch: 0.92, rate: 1.0 },
      tremolo: { frequency: 2.5, depth: 0.25 },
      vibrato: null,
      rotation: null,
      distortion: null,
      channelMix: null,
      lowPass: { smoothing: 10.0 },
    },
  },
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('filter')
    .setDescription('Apply audio filters and equalizer presets to the music')
    .addStringOption(o =>
      o.setName('preset')
        .setDescription('Filter preset to apply')
        .setRequired(true)
        .addChoices(
          { name: '🔄 Clear – Reset All Filters', value: 'clear' },
          { name: '🔊 Bass Boost', value: 'bassboost' },
          { name: '🌙 Nightcore', value: 'nightcore' },
          { name: '🌊 Vaporwave', value: 'vaporwave' },
          { name: '🎧 8D Audio', value: '8d' },
          { name: '🎤 Karaoke', value: 'karaoke' },
          { name: '〰️ Tremolo', value: 'tremolo' },
          { name: '🎵 Vibrato', value: 'vibrato' },
          { name: '☁️ Soft / Lo-Fi', value: 'soft' },
          { name: '💀 Ear Rape', value: 'earrape' },
          { name: '🎶 Pop Boost', value: 'pop' },
          { name: '⚡ Speed Up', value: 'speed' },
          { name: '🌑 Slowed + Reverb', value: 'slowed' }
        )
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

    const voiceChannel = interaction.member.voice?.channel;
    if (!voiceChannel || voiceChannel.id !== player.voiceId) {
      return interaction.reply({
        ...V2.reply(V2.error('Voice Mismatch', 'You must be in the same voice channel as the bot.', client)),
        flags: MessageFlags.Ephemeral,
      });
    }

    const preset = interaction.options.getString('preset');
    const presetData = FILTER_PRESETS[preset];

    if (!presetData) {
      return interaction.reply({
        ...V2.reply(V2.error('Unknown Preset', `The preset \`${preset}\` does not exist.`, client)),
        flags: MessageFlags.Ephemeral,
      });
    }

    // Shoukaku's underlying player (accessed via player.shoukaku in kazagumo)
    const shoukakuPlayer = player.shoukaku;

    try {
      // Always send the full filter object so ALL fields are replaced (no merging artifacts)
      await shoukakuPlayer.setFilters(presetData.filters);

      // Store active filter name for nowplaying display
      player.data.set('activeFilter', preset === 'clear' ? null : presetData.label);

      if (preset === 'clear') {
        return interaction.reply(
          V2.reply(V2.success('Filters Cleared', '🔄 All audio filters have been reset to default.', client))
        );
      }

      return interaction.reply(
        V2.reply(
          V2.success(
            `${presetData.emoji} Filter Applied`,
            `**${presetData.label}** filter is now active.\n> ${presetData.description}`,
            client
          )
        )
      );
    } catch (err) {
      console.error('[FILTER] Error applying filter:', err);
      return interaction.reply({
        ...V2.reply(
          V2.error(
            'Filter Error',
            `Failed to apply filter: \`${err.message}\`\nMake sure the Lavalink node supports audio filters.`,
            client
          )
        ),
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
