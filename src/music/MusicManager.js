const { Kazagumo, Plugins } = require('kazagumo');
const { Connectors } = require('shoukaku');
const KazagumoSpotify = require('kazagumo-spotify');
const chalk = require('chalk');
const { MessageFlags } = require('discord.js');

const config = require('../config/config');
const SearchManager = require('./SearchManager');
const MusicUI = require('./MusicUI');
const GuildModel = require('../models/Guild');

class MusicManager {
  constructor(client) {
    this.client = client;
    this.searchManager = null;
    this.aloneTimeouts = new Map();

    const plugins = [];

    // Spotify Plugin integration if credentials exist
    const spotifyId = config.SPOTIFY.CLIENT_ID || process.env.SPOTIFY_CLIENT_ID;
    const spotifySecret = config.SPOTIFY.CLIENT_SECRET || process.env.SPOTIFY_CLIENT_SECRET;

    if (spotifyId && spotifySecret) {
      try {
        plugins.push(
          new KazagumoSpotify({
            clientId: spotifyId,
            clientSecret: spotifySecret,
            playlistPageLimit: 4,
            albumPageLimit: 4,
            searchLimit: 25,
            searchMarket: 'US',
          })
        );
        console.log(chalk.green('[MUSIC] Spotify plugin enabled with configured credentials'));
      } catch (e) {
        console.error('[MUSIC] Failed to init Spotify plugin:', e.message);
      }
    } else {
      console.log(chalk.yellow('[MUSIC] Spotify credentials not set (falling back to direct resolver)'));
    }

    this.kazagumo = new Kazagumo(
      {
        defaultSearchEngine: 'youtube',
        send: (guildId, payload) => {
          const guild = this.client.guilds.cache.get(guildId);
          if (guild) guild.shard.send(payload);
        },
        plugins,
      },
      new Connectors.DiscordJS(client),
      config.LAVALINK.NODES,
      {
        moveOnDisconnect: true,
        resume: true,
        reconnectTries: 20,
        reconnectInterval: 5000,
        restTimeout: 10000,
      }
    );

    this.searchManager = new SearchManager(this.kazagumo);
    this.bindEvents();
  }

  bindEvents() {
    const shoukaku = this.kazagumo.shoukaku;

    // Shoukaku Node events
    shoukaku.on('ready', (name) => {
      console.log(chalk.bold.green(`[LAVALINK] Node "${name}" connected and ready.`));
    });

    shoukaku.on('error', (name, error) => {
      console.error(chalk.red(`[LAVALINK] Node "${name}" error:`), error?.message || error);
    });

    shoukaku.on('close', (name, code, reason) => {
      console.log(chalk.yellow(`[LAVALINK] Node "${name}" closed connection (${code}): ${reason}`));
    });

    shoukaku.on('disconnect', (name, count) => {
      console.log(chalk.yellow(`[LAVALINK] Node "${name}" disconnected. Reconnect attempt ${count}...`));
    });

    // Kazagumo Player events
    this.kazagumo.on('playerStart', async (player, track) => {
      try {
        const channel = this.client.channels.cache.get(player.textId);
        if (!channel) return;

        // Cleanup old now playing message if exists
        const oldMsgId = player.data.get('nowPlayingMsgId');
        if (oldMsgId) {
          channel.messages.fetch(oldMsgId).then(m => m.delete().catch(() => {})).catch(() => {});
        }

        const container = MusicUI.nowPlaying(player, track);
        const buttons = MusicUI.controlButtons(player);

        const msg = await channel.send({
          flags: MessageFlags.IsComponentsV2,
          components: [container, buttons],
        }).catch(() => null);

        if (msg) {
          player.data.set('nowPlayingMsgId', msg.id);
        }
      } catch (err) {
        console.error('[MUSIC] Error on playerStart:', err.message);
      }
    });

    this.kazagumo.on('playerEnd', async (player) => {
      const channel = this.client.channels.cache.get(player.textId);
      const oldMsgId = player.data.get('nowPlayingMsgId');
      if (channel && oldMsgId) {
        channel.messages.fetch(oldMsgId).then(m => m.delete().catch(() => {})).catch(() => {});
        player.data.delete('nowPlayingMsgId');
      }
    });

    this.kazagumo.on('playerEmpty', async (player) => {
      const channel = this.client.channels.cache.get(player.textId);
      const isAutoplay = player.data.get('autoplay');

      // Autoplay handler
      if (isAutoplay && player.previous) {
        try {
          const query = `${player.previous.author} ${player.previous.title} mix`;
          const res = await this.kazagumo.search(query, { requester: player.previous.requester });
          if (res && res.tracks.length > 0) {
            const nextTrack = res.tracks.find(t => t.identifier !== player.previous.identifier) || res.tracks[0];
            if (nextTrack) {
              player.queue.add(nextTrack);
              player.play();
              return;
            }
          }
        } catch (e) {
          console.error('[AUTOPLAY] Failed to resolve next track:', e.message);
        }
      }

      const is247 = player.data.get('247');
      if (!is247) {
        if (channel) {
          const endContainer = MusicUI.queue(player).container;
          channel.send({
            flags: MessageFlags.IsComponentsV2,
            components: [endContainer],
          }).catch(() => null);
        }
        // Destroy player after 3 minutes if empty
        setTimeout(() => {
          if (player && player.queue.length === 0 && !player.playing && !player.data.get('247')) {
            player.destroy();
          }
        }, 180000);
      }
    });

    this.kazagumo.on('playerError', (player, error) => {
      console.error(`[MUSIC] Player error in guild ${player.guildId}:`, error);
      const channel = this.client.channels.cache.get(player.textId);
      if (channel) {
        channel.send(`⚠️ Error playing track: \`${error.message || 'Playback failed'}\`. Skipping...`).catch(() => {});
      }
    });

    this.kazagumo.on('playerDestroy', (player) => {
      const timer = this.aloneTimeouts.get(player.guildId);
      if (timer) {
        clearTimeout(timer);
        this.aloneTimeouts.delete(player.guildId);
      }
    });
  }

  /**
   * Helper to get or create a player for a guild with user preferences
   */
  async getOrCreatePlayer(interaction) {
    const guildId = interaction.guild.id;
    const voiceChannel = interaction.member.voice?.channel;

    if (!voiceChannel) {
      throw new Error('You must be in a voice channel to use music commands.');
    }

    const botVoice = interaction.guild.members.me?.voice?.channel;
    if (botVoice && botVoice.id !== voiceChannel.id) {
      throw new Error(`You must be in the same voice channel as the bot (<#${botVoice.id}>).`);
    }

    const guildData = await GuildModel.get(guildId);
    const musicSettings = guildData.music || {};

    let player = this.kazagumo.players.get(guildId);
    if (!player) {
      player = await this.kazagumo.createPlayer({
        guildId: interaction.guild.id,
        textId: interaction.channel.id,
        voiceId: voiceChannel.id,
        deaf: true,
        volume: musicSettings.defaultVolume || 80,
      });

      player.data.set('autoplay', musicSettings.autoplay || false);
      player.data.set('247', musicSettings.twentyFourSeven || false);
      if (musicSettings.defaultLoop && musicSettings.defaultLoop !== 'off') {
        player.setLoop(musicSettings.defaultLoop);
      }
    } else {
      player.setTextChannel(interaction.channel.id);
    }

    return player;
  }

  /**
   * Handle empty voice channel auto-leave check
   */
  handleVoiceState(oldState, newState) {
    const guildId = oldState.guild.id || newState.guild.id;
    const player = this.kazagumo.players.get(guildId);
    if (!player) return;

    if (player.data.get('247')) return; // 24/7 mode enabled

    const botVoiceChannelId = player.voiceId;
    if (!botVoiceChannelId) return;

    const channel = oldState.guild.channels.cache.get(botVoiceChannelId);
    if (!channel) return;

    const nonBotMembers = channel.members.filter(m => !m.user.bot);

    if (nonBotMembers.size === 0) {
      if (!this.aloneTimeouts.has(guildId)) {
        const timeout = setTimeout(async () => {
          const curPlayer = this.kazagumo.players.get(guildId);
          if (curPlayer && !curPlayer.data.get('247')) {
            const ch = this.client.channels.cache.get(curPlayer.textId);
            if (ch) {
              ch.send('Left the voice channel due to inactivity.').catch(() => {});
            }
            curPlayer.destroy();
          }
          this.aloneTimeouts.delete(guildId);
        }, config.LAVALINK.AUTO_LEAVE_TIMEOUT || 60000);

        this.aloneTimeouts.set(guildId, timeout);
      }
    } else {
      const timeout = this.aloneTimeouts.get(guildId);
      if (timeout) {
        clearTimeout(timeout);
        this.aloneTimeouts.delete(guildId);
      }
    }
  }
}

module.exports = MusicManager;
