const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const { COLORS } = require('../../config/config');

module.exports = {
  data: new SlashCommandBuilder().setName('help').setDescription('Show all commands with descriptions'),
  cooldown: 5,
  async execute(interaction, client){
    const commands = {
      moderation: {
        emoji: '🔨',
        label: 'Moderation Commands',
        cmds: [
          { cmd: '/ban', desc: 'Ban a member from the server (with optional message delete)' },
          { cmd: '/kick', desc: 'Kick a member from the server' },
          { cmd: '/mute', desc: 'Timeout a member (e.g. 10m, 1h, max 28d)' },
          { cmd: '/unmute', desc: 'Remove timeout from a member' },
          { cmd: '/warning rule', desc: 'Warn a member based on predefined rules (r1-r5)' },
          { cmd: '/warning custom', desc: 'Warn a member with a custom reason' },
          { cmd: '/warning status', desc: 'View all warnings for a member' },
          { cmd: '/clearwarn', desc: 'Clear a specific warning or all warnings' },
          { cmd: '/purge', desc: 'Bulk delete 1-100 messages (filter by user)' },
          { cmd: '/unban', desc: 'Unban a user by their ID' },
          { cmd: '/slowmode', desc: 'Set channel slowmode (0 to disable, max 6h)' },
          { cmd: '/lock', desc: 'Lock a channel (prevent @everyone from sending)' },
          { cmd: '/unlock', desc: 'Unlock a channel' },
          { cmd: '/lockdown start', desc: 'Lock ALL text channels at once' },
          { cmd: '/lockdown end', desc: 'Unlock ALL text channels at once' },
          { cmd: '/role add', desc: 'Add a role to a member' },
          { cmd: '/role remove', desc: 'Remove a role from a member' },
        ]
      },
      security: {
        emoji: '🛡️',
        label: 'Security Commands',
        cmds: [
          { cmd: '/setup logs', desc: 'Set a log channel (Audit, Join/Leave, Voice, Message)' },
          { cmd: '/setup view', desc: 'View all current log channel settings' },
          { cmd: '/security status', desc: 'View all security feature states and bot health' },
          { cmd: '/security toggle', desc: 'Toggle any security feature on/off' },
          { cmd: '/security joinrole', desc: 'Set or disable the auto-join role' },
          { cmd: '/security trappedchannel', desc: 'Set honeypot channel (typing = instant ban)' },
          { cmd: '/security joinmsg', desc: 'Set custom DM message for new members' },
          { cmd: '/antiraid on', desc: 'Enable anti-raid protection' },
          { cmd: '/antiraid off', desc: 'Disable anti-raid protection' },
          { cmd: '/antiraid unlock', desc: 'Unlock all channels after a raid' },
          { cmd: '/modconfig addmod', desc: 'Add a moderator role' },
          { cmd: '/modconfig removemod', desc: 'Remove a moderator role' },
          { cmd: '/modconfig addadmin', desc: 'Add an admin role' },
          { cmd: '/modconfig removeadmin', desc: 'Remove an admin role' },
          { cmd: '/modconfig view', desc: 'View current mod and admin roles' },
        ]
      },
      info: {
        emoji: 'ℹ️',
        label: 'Info Commands',
        cmds: [
          { cmd: '/help', desc: 'Show this command list with descriptions' },
          { cmd: '/userinfo', desc: 'View detailed info about a user (ID, roles, join date)' },
          { cmd: '/serverinfo', desc: 'View server stats (members, channels, boosts)' },
          { cmd: '/botinfo', desc: 'View bot stats (uptime, memory, latency, servers)' },
          { cmd: '/avatar', desc: 'View a user\'s avatar in full size with download links' },
        ]
      },
      utility: {
        emoji: '🔧',
        label: 'Utility Commands',
        cmds: [
          { cmd: '/ping', desc: 'Check bot latency (RTT + WebSocket ping)' },
          { cmd: '/uptime', desc: 'View bot uptime with start timestamp' },
          { cmd: '/suggest', desc: 'Submit a suggestion with upvote/downvote buttons' },
          { cmd: '/poll', desc: 'Create a poll with 2-4 options and vote buttons' },
          { cmd: '/say', desc: 'Make the bot send a message to a channel' },
          { cmd: '/embed', desc: 'Send a custom embed (title, description, color)' },
          { cmd: '/nick', desc: 'Change or reset a member\'s nickname' },
          { cmd: '/banlist', desc: 'View banned users (shows up to 20 with reasons)' },
          { cmd: '/activity', desc: 'Set bot activity and status (Playing, Watching, etc.)' },
        ]
      },
    };

    function getHomeEmbed(){
      const totalCmds = Object.values(commands).reduce((sum, cat) => sum + cat.cmds.length, 0);
      return new EmbedBuilder()
        .setColor(COLORS.PRIMARY)
        .setTitle('🎮 GAMERZ WORKSHOP — Command Help')
        .setDescription(
          '**Advanced Discord Security Bot**\n\n' +
          'Select a category from the dropdown menu below to view commands.\n\n' +
          `**📊 Total Commands:** ${totalCmds}\n` +
          `**🔨 Moderation:** ${commands.moderation.cmds.length} commands\n` +
          `**🛡️ Security:** ${commands.security.cmds.length} commands\n` +
          `**ℹ️ Info:** ${commands.info.cmds.length} commands\n` +
          `**🔧 Utility:** ${commands.utility.cmds.length} commands\n\n` +
          '**Prefix Commands:** `!ping` `!uptime` `!help`'
        )
        .setThumbnail(client.user.displayAvatarURL())
        .setFooter({text:'🎮 GAMERZ WORKSHOP | v1.0.0',iconURL:client.user.displayAvatarURL()})
        .setTimestamp();
    }

    function getCategoryEmbed(categoryKey){
      const cat = commands[categoryKey];
      return new EmbedBuilder()
        .setColor(COLORS.PRIMARY)
        .setTitle(`${cat.emoji} ${cat.label}`)
        .setDescription(cat.cmds.map(c => `**${c.cmd}**\n${c.desc}`).join('\n\n'))
        .setFooter({text:'🎮 GAMERZ WORKSHOP | Use dropdown to switch categories'})
        .setTimestamp();
    }

    function getSelectMenu(){
      return new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('help_menu')
          .setPlaceholder('📂 Select a command category')
          .addOptions([
            {
              label: 'Home',
              description: 'Return to main help page',
              value: 'home',
              emoji: '🏠',
            },
            {
              label: commands.moderation.label,
              description: `${commands.moderation.cmds.length} moderation commands`,
              value: 'moderation',
              emoji: commands.moderation.emoji,
            },
            {
              label: commands.security.label,
              description: `${commands.security.cmds.length} security commands`,
              value: 'security',
              emoji: commands.security.emoji,
            },
            {
              label: commands.info.label,
              description: `${commands.info.cmds.length} info commands`,
              value: 'info',
              emoji: commands.info.emoji,
            },
            {
              label: commands.utility.label,
              description: `${commands.utility.cmds.length} utility commands`,
              value: 'utility',
              emoji: commands.utility.emoji,
            },
          ])
      );
    }

    await interaction.reply({
      embeds: [getHomeEmbed()],
      components: [getSelectMenu()],
    });

    const collector = interaction.channel.createMessageComponentCollector({
      filter: i => i.customId === 'help_menu' && i.user.id === interaction.user.id,
      time: 300000,
    });

    collector.on('collect', async i => {
      const selected = i.values[0];
      if(selected === 'home'){
        await i.update({
          embeds: [getHomeEmbed()],
          components: [getSelectMenu()],
        });
      } else {
        await i.update({
          embeds: [getCategoryEmbed(selected)],
          components: [getSelectMenu()],
        });
      }
    });

    collector.on('end', () => {
      interaction.editReply({ components: [] }).catch(() => {});
    });
  },
};
