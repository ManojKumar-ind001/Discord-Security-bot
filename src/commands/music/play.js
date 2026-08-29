const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const MusicUI = require('../../music/MusicUI');
const V2 = require('../../utils/Embed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Play a song, artist, playlist, or URL with instant live search')
    .addStringOption(o =>
      o.setName('query')
        .setDescription('Song title, artist, Spotify/YouTube link')
        .setRequired(true)
        .setAutocomplete(true)
    ),
  cooldown: 3,

  /**
   * Native Discord Slash Command Autocomplete Handler
   * Returns up to 25 fast, relevant choices using SearchManager with in-memory caching
   */
  async autocomplete(interaction, client) {
    const focusedValue = interaction.options.getFocused();
    if (!focusedValue || focusedValue.trim().length < 2) {
      return interaction.respond([]);
    }

    try {
      const searchManager = client.musicManager?.searchManager;
      if (!searchManager) return interaction.respond([]);

      const choices = await searchManager.autocomplete(focusedValue);
      return interaction.respond(choices);
    } catch (err) {
      return interaction.respond([]);
    }
  },

  async execute(interaction, client) {
    const voiceChannel = interaction.member.voice?.channel;
    if (!voiceChannel) {
      return interaction.reply({
        ...V2.reply(V2.error('Voice Required', 'You must join a voice channel to play music.', client)),
        ephemeral: true,
      });
    }

    const botVoice = interaction.guild.members.me?.voice?.channel;
    if (botVoice && botVoice.id !== voiceChannel.id) {
      return interaction.reply({
        ...V2.reply(V2.error('Channel Mismatch', `You must be in the same voice channel as the bot (<#${botVoice.id}>).`, client)),
        ephemeral: true,
      });
    }

    await interaction.deferReply();

    const query = interaction.options.getString('query').trim();

    try {
      const player = await client.musicManager.getOrCreatePlayer(interaction);
      const res = await client.musicManager.kazagumo.search(query, {
        requester: interaction.user,
      });

      if (!res || !res.tracks || res.tracks.length === 0) {
        return interaction.editReply(
          V2.reply(V2.error('No Results', `Could not find any playable tracks for \`${query}\`.`, client))
        );
      }

      if (res.type === 'PLAYLIST') {
        for (const track of res.tracks) {
          track.requester = interaction.user;
          player.queue.add(track);
        }

        const totalMs = res.tracks.reduce((acc, t) => acc + (t.length || 0), 0);
        const playlistContainer = MusicUI.addedPlaylist(res.playlistName, res.tracks.length, totalMs);

        await interaction.editReply({
          flags: MessageFlags.IsComponentsV2,
          components: [playlistContainer],
        });

        if (!player.playing && !player.paused) player.play();
        return;
      }

      const track = res.tracks[0];
      track.requester = interaction.user;

      if (player.playing || player.queue.length > 0) {
        player.queue.add(track);
        const position = player.queue.length;
        const addedContainer = MusicUI.addedToQueue(track, position);

        await interaction.editReply({
          flags: MessageFlags.IsComponentsV2,
          components: [addedContainer],
        });
      } else {
        player.queue.add(track);
        await interaction.editReply({
          content: 'Starting playback...',
        });
        // Delete the starting playback message shortly after now playing is sent
        setTimeout(() => {
          interaction.deleteReply().catch(() => {});
        }, 2000);

        player.play();
      }
    } catch (err) {
      console.error('[PLAY ERROR]', err);
      return interaction.editReply(
        V2.reply(V2.error('Playback Error', err.message || 'Failed to start playback.', client))
      );
    }
  },
};
