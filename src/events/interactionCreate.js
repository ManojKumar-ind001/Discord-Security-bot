const { Events } = require('discord.js');
const V2 = require('../utils/Embed');
const chalk = require('chalk');
const cool = new Map();

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction, client) {
    // Handle Slash Commands
    if (interaction.isChatInputCommand()) {
      const cmd = client.slashCommands.get(interaction.commandName);
      if (!cmd) return;

      const key = interaction.user.id + '-' + cmd.data.name;
      const cd = (cmd.cooldown || 3) * 1000;

      if (cool.has(key)) {
        const left = (cool.get(key) + cd - Date.now()) / 1000;
        if (left > 0) {
          return interaction.reply({
            ...V2.reply(V2.warning('Cooldown', `Wait **${left.toFixed(1)}s** before using this again.`, client)),
            ephemeral: true,
          });
        }
      }

      cool.set(key, Date.now());
      setTimeout(() => cool.delete(key), cd);

      try {
        await cmd.execute(interaction, client);
      } catch (e) {
        console.error(chalk.red('[ERR]', cmd.data.name, e.message));
        const r = {
          ...V2.reply(V2.error('Error', 'Something went wrong executing this command.', client)),
          ephemeral: true,
        };
        if (interaction.replied || interaction.deferred) await interaction.followUp(r);
        else await interaction.reply(r);
      }
      return;
    }

    // Handle Slash Command Autocomplete (Native Discord Autocomplete)
    if (interaction.isAutocomplete()) {
      const cmd = client.slashCommands.get(interaction.commandName);
      if (!cmd || !cmd.autocomplete) return;

      try {
        await cmd.autocomplete(interaction, client);
      } catch (err) {
        console.error('[AUTOCOMPLETE ERROR]', err.message);
      }
      return;
    }

    // Handle Button Interactions
    if (interaction.isButton()) {
      const id = interaction.customId;

      // Music Player Global Button Controls
      if (id.startsWith('music_')) {
        const player = client.musicManager?.kazagumo?.players?.get(interaction.guildId);
        if (!player) {
          return interaction.reply({
            content: 'No active music player found for this server.',
            ephemeral: true,
          });
        }

        const voiceChannel = interaction.member.voice?.channel;
        if (!voiceChannel || voiceChannel.id !== player.voiceId) {
          return interaction.reply({
            content: 'You must be in the same voice channel as the bot to use player controls.',
            ephemeral: true,
          });
        }

        const MusicUI = require('../music/MusicUI');

        if (id === 'music_pause_resume') {
          player.pause(!player.paused);
          await interaction.deferUpdate();
          const curTrack = player.queue.current;
          if (curTrack) {
            const container = MusicUI.nowPlaying(player, curTrack);
            const buttons = MusicUI.controlButtons(player);
            await interaction.editReply({
              flags: MessageFlags.IsComponentsV2,
              components: [container, buttons],
            }).catch(() => {});
          }
          return;
        }

        if (id === 'music_skip') {
          await interaction.deferUpdate();
          await player.skip();
          return;
        }

        if (id === 'music_prev') {
          if (player.previous) {
            player.queue.unshift(player.previous);
            await player.skip();
            await interaction.deferUpdate();
          } else {
            await interaction.reply({
              content: 'No previous track available.',
              ephemeral: true,
            });
          }
          return;
        }

        if (id === 'music_loop') {
          const currentLoop = player.loop || 'off';
          const nextLoop = currentLoop === 'off' ? 'track' : currentLoop === 'track' ? 'queue' : 'off';
          player.setLoop(nextLoop);
          await interaction.deferUpdate();
          const curTrack = player.queue.current;
          if (curTrack) {
            const container = MusicUI.nowPlaying(player, curTrack);
            const buttons = MusicUI.controlButtons(player);
            await interaction.editReply({
              flags: MessageFlags.IsComponentsV2,
              components: [container, buttons],
            }).catch(() => {});
          }
          return;
        }

        if (id === 'music_stop') {
          player.queue.clear();
          player.destroy();
          await interaction.reply({
            content: 'Playback stopped and player disconnected.',
            ephemeral: true,
          });
          return;
        }
      }

      // Collectors handle component interactions locally; fallback if expired
      if (!interaction.replied && !interaction.deferred) {
        // Safe no-op or handled by collectors
      }
    }
  },
};
