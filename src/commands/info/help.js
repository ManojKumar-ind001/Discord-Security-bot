const {
  SlashCommandBuilder,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  SectionBuilder,
  ThumbnailBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  MessageFlags,
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder().setName('help').setDescription('Show all commands with descriptions'),
  cooldown: 5,
  async execute(interaction, client) {
    const commands = {
      music: {
        label: 'Music Commands',
        cmds: [
          { cmd: '/play', desc: 'Play a track/playlist with instant live autocomplete' },
          { cmd: '/pause', desc: 'Pause the current track' },
          { cmd: '/resume', desc: 'Resume the paused track' },
          { cmd: '/skip', desc: 'Skip to the next track' },
          { cmd: '/stop', desc: 'Stop playback, clear queue, and leave voice' },
          { cmd: '/nowplaying', desc: 'Show currently playing track with interactive controls' },
          { cmd: '/queue', desc: 'View upcoming tracks with interactive pagination' },
          { cmd: '/volume', desc: 'Adjust or view playback volume (1-100%)' },
          { cmd: '/seek', desc: 'Seek to a specific timestamp (e.g. 1:30, 90s)' },
          { cmd: '/loop', desc: 'Set loop mode (off, track, queue)' },
          { cmd: '/shuffle', desc: 'Shuffle upcoming queue tracks' },
          { cmd: '/remove', desc: 'Remove a track by position number' },
          { cmd: '/clear', desc: 'Clear all upcoming tracks from queue' },
          { cmd: '/move', desc: 'Move a track to a different position' },
          { cmd: '/join', desc: 'Summon the bot to your voice channel' },
          { cmd: '/leave', desc: 'Disconnect the bot from voice' },
          { cmd: '/autoplay', desc: 'Toggle automatic recommendation playback' },
          { cmd: '/247', desc: 'Toggle 24/7 voice channel persistence' },
          { cmd: '/filter', desc: 'Apply DSP audio filters (bassboost, nightcore, 8d, etc.)' },
        ],
      },
      moderation: {
        label: 'Moderation Commands',
        cmds: [
          { cmd: '/ban', desc: 'Ban a member from the server' },
          { cmd: '/kick', desc: 'Kick a member from the server' },
          { cmd: '/mute', desc: 'Timeout a member' },
          { cmd: '/unmute', desc: 'Remove timeout from a member' },
          { cmd: '/warning rule', desc: 'Warn a member based on rules' },
          { cmd: '/warning custom', desc: 'Warn a member with custom reason' },
          { cmd: '/warning status', desc: 'View warnings for a member' },
          { cmd: '/clearwarn', desc: 'Clear warnings for a member' },
          { cmd: '/purge', desc: 'Bulk delete messages' },
          { cmd: '/unban', desc: 'Unban a user by ID' },
          { cmd: '/slowmode', desc: 'Set channel slowmode' },
          { cmd: '/lock', desc: 'Lock a channel' },
          { cmd: '/unlock', desc: 'Unlock a channel' },
          { cmd: '/lockdown start', desc: 'Lock all text channels' },
          { cmd: '/lockdown end', desc: 'Unlock all text channels' },
          { cmd: '/role add', desc: 'Add a role to a member' },
          { cmd: '/role remove', desc: 'Remove a role from a member' },
        ],
      },
      security: {
        label: 'Security Commands',
        cmds: [
          { cmd: '/setup logs', desc: 'Set log channels' },
          { cmd: '/setup view', desc: 'View log channel settings' },
          { cmd: '/security status', desc: 'View security status' },
          { cmd: '/security joinrole', desc: 'Set auto-join role' },
          { cmd: '/security trappedchannel', desc: 'Set honeypot channel' },
          { cmd: '/security joinmsg', desc: 'Set welcome DM message' },
          { cmd: '/antiraid on', desc: 'Enable anti-raid protection' },
          { cmd: '/antiraid off', desc: 'Disable anti-raid protection' },
          { cmd: '/antiraid unlock', desc: 'Unlock channels after raid' },
          { cmd: '/modconfig addmod', desc: 'Add a moderator role' },
          { cmd: '/modconfig removemod', desc: 'Remove a moderator role' },
          { cmd: '/modconfig addadmin', desc: 'Add an admin role' },
          { cmd: '/modconfig removeadmin', desc: 'Remove an admin role' },
          { cmd: '/modconfig view', desc: 'View mod and admin roles' },
          { cmd: '/modconfig sync', desc: 'Sync native admin & mod permissions' },
        ],
      },
      info: {
        label: 'Info Commands',
        cmds: [
          { cmd: '/help', desc: 'Show command list with descriptions' },
          { cmd: '/userinfo', desc: 'View detailed user info' },
          { cmd: '/serverinfo', desc: 'View server statistics' },
          { cmd: '/botinfo', desc: 'View bot statistics' },
          { cmd: '/avatar', desc: "View a user's avatar" },
        ],
      },
      utility: {
        label: 'Utility Commands',
        cmds: [
          { cmd: '/ping', desc: 'Check bot latency' },
          { cmd: '/uptime', desc: 'View bot uptime' },
          { cmd: '/suggest', desc: 'Submit a suggestion' },
          { cmd: '/poll', desc: 'Create an interactive poll' },
          { cmd: '/react', desc: 'React to a message with emojis' },
          { cmd: '/say', desc: 'Send a message through the bot' },
          { cmd: '/embed', desc: 'Send a custom message panel' },
          { cmd: '/nick', desc: "Change or reset a member's nickname" },
          { cmd: '/banlist', desc: 'View banned users' },
          { cmd: '/activity', desc: 'Set bot activity and status' },
        ],
      },
    };

    function getHomeContainer() {
      const totalCmds = Object.values(commands).reduce((sum, cat) => sum + cat.cmds.length, 0);
      const container = new ContainerBuilder();

      container.addTextDisplayComponents(new TextDisplayBuilder().setContent('## GAMERZ WORKSHOP — Command Help'));
      container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));

      const section = new SectionBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent('> **Advanced Discord Security & Premium Music Bot**'),
          new TextDisplayBuilder().setContent('> Select a category from the dropdown below to view commands.'),
          new TextDisplayBuilder().setContent(
            `\n> **Total Commands:** \`${totalCmds}\`\n` +
            `> **Music:** \`${commands.music.cmds.length}\` commands\n` +
            `> **Moderation:** \`${commands.moderation.cmds.length}\` commands\n` +
            `> **Security:** \`${commands.security.cmds.length}\` commands\n` +
            `> **Info:** \`${commands.info.cmds.length}\` commands\n` +
            `> **Utility:** \`${commands.utility.cmds.length}\` commands`
          ),
        )
        .setThumbnailAccessory(new ThumbnailBuilder({ media: { url: client.user.displayAvatarURL({ size: 256 }) } }));
      container.addSectionComponents(section);

      container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent('-# GAMERZ WORKSHOP | v1.0.0'));
      return container;
    }

    function getCategoryContainer(categoryKey) {
      const cat = commands[categoryKey];
      const container = new ContainerBuilder();

      container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${cat.label}`));
      container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));

      const cmdLines = cat.cmds.map(c => `> **\`${c.cmd}\`** — ${c.desc}`).join('\n');
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent(cmdLines));

      container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent('-# GAMERZ WORKSHOP | Use dropdown to switch categories'));
      return container;
    }

    function getSelectMenu() {
      return new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('help_menu')
          .setPlaceholder('Select a command category...')
          .addOptions([
            {
              label: 'Home',
              description: 'Return to main help page',
              value: 'home',
            },
            {
              label: commands.music.label,
              description: `${commands.music.cmds.length} music commands`,
              value: 'music',
            },
            {
              label: commands.moderation.label,
              description: `${commands.moderation.cmds.length} moderation commands`,
              value: 'moderation',
            },
            {
              label: commands.security.label,
              description: `${commands.security.cmds.length} security commands`,
              value: 'security',
            },
            {
              label: commands.info.label,
              description: `${commands.info.cmds.length} info commands`,
              value: 'info',
            },
            {
              label: commands.utility.label,
              description: `${commands.utility.cmds.length} utility commands`,
              value: 'utility',
            },
          ])
      );
    }

    await interaction.reply({
      flags: MessageFlags.IsComponentsV2,
      components: [getHomeContainer(), getSelectMenu()],
    });

    const collector = interaction.channel.createMessageComponentCollector({
      filter: i => i.customId === 'help_menu' && i.user.id === interaction.user.id,
      time: 600000, // 10 minutes
    });

    collector.on('collect', async i => {
      const selected = i.values[0];
      const targetContainer = selected === 'home' ? getHomeContainer() : getCategoryContainer(selected);
      await i.update({
        flags: MessageFlags.IsComponentsV2,
        components: [targetContainer, getSelectMenu()],
      });
    });

    // On timeout, just silently expire — do NOT strip the dropdown
    collector.on('end', () => {});
  },
};
