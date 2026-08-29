const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  SectionBuilder,
  ThumbnailBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} = require('discord.js');

const { BOT_NAME } = require('../config/config');

class MusicUI {
  static formatTime(ms) {
    if (!ms || isNaN(ms) || ms < 0) return '00:00';
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const hours = Math.floor(minutes / 60);
    const remMin = minutes % 60;
    if (hours > 0) {
      return `${hours}:${remMin < 10 ? '0' : ''}${remMin}:${seconds < 10 ? '0' : ''}${seconds}`;
    }
    return `${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  }

  static createProgressBar(currentMs, totalMs, size = 12) {
    if (!totalMs || totalMs <= 0) return '`🔴 LIVE`';
    const progress = Math.min(Math.max(currentMs / totalMs, 0), 1);
    const progressIndex = Math.round(size * progress);
    const emptyChar = '▬';
    const progressChar = '▬';
    const cursorChar = '🔘';

    let bar = '';
    for (let i = 0; i < size; i++) {
      if (i === progressIndex) {
        bar += cursorChar;
      } else if (i < progressIndex) {
        bar += progressChar;
      } else {
        bar += emptyChar;
      }
    }
    return `\`${bar}\` \`${this.formatTime(currentMs)} / ${this.formatTime(totalMs)}\``;
  }

  /**
   * Aesthetic Now Playing Container
   */
  static nowPlaying(player, track) {
    const container = new ContainerBuilder();
    const isPaused = player.paused;
    const loopMode = player.loop || 'off';
    const statusText = isPaused ? 'Paused' : 'Playing';

    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`## Now ${statusText}`));
    container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));

    const requesterTag = track.requester?.tag || track.requester?.username || 'Member';
    const requesterId = track.requester?.id;
    const requesterMention = requesterId ? `<@${requesterId}>` : `**${requesterTag}**`;

    const trackTitle = (track.title || 'Unknown Title').substring(0, 70);
    const trackAuthor = (track.author || 'Unknown Artist').substring(0, 50);

    const section = new SectionBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`> **${trackTitle}**`),
        new TextDisplayBuilder().setContent(`> *${trackAuthor}*`),
        new TextDisplayBuilder().setContent(`> Requested by ${requesterMention}`),
      );

    if (track.thumbnail) {
      section.setThumbnailAccessory(new ThumbnailBuilder({ media: { url: track.thumbnail } }));
    }
    container.addSectionComponents(section);

    container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));

    // Progress bar & volume & loop status
    const currentPosition = player.position || 0;
    const progressBar = this.createProgressBar(currentPosition, track.length || 0);

    let infoLine = `> ${progressBar}\n`;
    infoLine += `> **Volume:** \`${player.volume}%\` · **Loop:** \`${loopMode.toUpperCase()}\` · **Queue:** \`${player.queue.length} track${player.queue.length !== 1 ? 's' : ''}\``;

    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(infoLine));

    container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ${BOT_NAME} Music Engine`));

    return container;
  }

  /**
   * Compact Controls ActionRow
   */
  static controlButtons(player) {
    const isPaused = player.paused;
    const loopMode = player.loop || 'off';

    return new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('music_prev')
        .setLabel('Previous')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('music_pause_resume')
        .setLabel(isPaused ? 'Resume' : 'Pause')
        .setStyle(isPaused ? ButtonStyle.Success : ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('music_skip')
        .setLabel('Skip')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('music_loop')
        .setLabel(`Loop: ${loopMode.toUpperCase()}`)
        .setStyle(loopMode !== 'off' ? ButtonStyle.Primary : ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('music_stop')
        .setLabel('Stop')
        .setStyle(ButtonStyle.Danger)
    );
  }

  /**
   * Added to Queue Compact Notification
   */
  static addedToQueue(track, position) {
    const container = new ContainerBuilder();
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent('## Added to Queue'));
    container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));

    const requesterId = track.requester?.id;
    const requesterMention = requesterId ? `<@${requesterId}>` : 'Member';

    const section = new SectionBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`> **${(track.title || 'Track').substring(0, 70)}**`),
        new TextDisplayBuilder().setContent(`> *${(track.author || 'Artist').substring(0, 50)}*`),
        new TextDisplayBuilder().setContent(`> Position: \`#${position}\` · Duration: \`${this.formatTime(track.length)}\``),
        new TextDisplayBuilder().setContent(`> Requested by ${requesterMention}`),
      );

    if (track.thumbnail) {
      section.setThumbnailAccessory(new ThumbnailBuilder({ media: { url: track.thumbnail } }));
    }
    container.addSectionComponents(section);

    container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ${BOT_NAME}`));

    return container;
  }

  /**
   * Added Playlist Notification
   */
  static addedPlaylist(playlistName, trackCount, durationMs) {
    const container = new ContainerBuilder();
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent('## Playlist Added'));
    container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `> **Playlist:** ${playlistName || 'Custom Playlist'}\n` +
        `> **Tracks Added:** \`${trackCount} tracks\`\n` +
        `> **Total Duration:** \`${this.formatTime(durationMs)}\``
      )
    );

    container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ${BOT_NAME}`));
    return container;
  }

  /**
   * Compact Aesthetic Queue View
   */
  static queue(player, page = 1) {
    const container = new ContainerBuilder();
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent('## Music Queue'));
    container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));

    const current = player.queue.current;
    if (current) {
      const currentReq = current.requester?.id ? `<@${current.requester.id}>` : 'Member';
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### Now Playing\n` +
          `> **${(current.title || 'Track').substring(0, 60)}**\n` +
          `> *${current.author || 'Artist'}* · \`${this.formatTime(current.length)}\` · ${currentReq}`
        )
      );
      container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
    }

    const totalTracks = player.queue.length;
    const itemsPerPage = 8;
    const totalPages = Math.ceil(totalTracks / itemsPerPage) || 1;
    const currentPage = Math.min(Math.max(page, 1), totalPages);

    if (totalTracks === 0) {
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent('> *The queue is currently empty. Use `/play` to add tracks.*')
      );
    } else {
      const start = (currentPage - 1) * itemsPerPage;
      const end = start + itemsPerPage;
      const slice = player.queue.slice(start, end);

      const lines = slice.map((t, idx) => {
        const num = String(start + idx + 1).padStart(2, '0');
        const req = t.requester?.id ? `<@${t.requester.id}>` : 'Member';
        return `> **\`${num}\`** **${(t.title || 'Track').substring(0, 45)}**\n> &nbsp;&nbsp;&nbsp;&nbsp;*${t.author || 'Artist'}* · \`${this.formatTime(t.length)}\` · ${req}`;
      });

      container.addTextDisplayComponents(new TextDisplayBuilder().setContent(lines.join('\n\n')));
    }

    container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));

    const totalQueueDuration = (player.queue.duration || 0) + (current?.length || 0);
    const loopStatus = (player.loop || 'off').toUpperCase();
    const autoplayStatus = player.data.get('autoplay') ? 'ON' : 'OFF';

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `-# Page ${currentPage}/${totalPages} · ${totalTracks} upcoming tracks · Duration: ${this.formatTime(totalQueueDuration)} · Loop: ${loopStatus} · Autoplay: ${autoplayStatus}`
      )
    );

    return {
      container,
      totalPages,
      currentPage,
    };
  }

  /**
   * Queue Navigation Buttons
   */
  static queueButtons(currentPage, totalPages) {
    return new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('queue_prev')
        .setLabel('Previous')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(currentPage <= 1),
      new ButtonBuilder()
        .setCustomId('queue_page')
        .setLabel(`${currentPage}/${totalPages}`)
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true),
      new ButtonBuilder()
        .setCustomId('queue_next')
        .setLabel('Next')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(currentPage >= totalPages),
      new ButtonBuilder()
        .setCustomId('queue_clear')
        .setLabel('Clear Queue')
        .setStyle(ButtonStyle.Danger)
        .setDisabled(totalPages === 0)
    );
  }
}

module.exports = MusicUI;
