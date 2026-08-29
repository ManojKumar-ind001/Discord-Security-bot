const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} = require('discord.js');

module.exports = {
  prefixName: 'help',
  async execute(message, args, client) {
    const container = new ContainerBuilder();
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent('## GAMERZ WORKSHOP — Command Help'));
    container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));

    const content = [
      '### Moderation',
      '> `/ban` — Ban a member',
      '> `/kick` — Kick a member',
      '> `/mute` — Timeout a member',
      '> `/unmute` — Remove timeout',
      '> `/warning rule` — Warn by rule',
      '> `/warning custom` — Warn with custom reason',
      '> `/warning status` — View member warnings',
      '> `/clearwarn` — Clear warnings',
      '> `/purge` — Bulk delete messages',
      '> `/unban` — Unban user by ID',
      '> `/slowmode` — Set channel slowmode',
      '> `/lock` — Lock a channel',
      '> `/unlock` — Unlock a channel',
      '> `/lockdown start` — Lock all channels',
      '> `/lockdown end` — Unlock all channels',
      '> `/role add/remove` — Manage member roles',
      '',
      '### Security',
      '> `/setup logs` — Set a log channel',
      '> `/setup view` — View log settings',
      '> `/security status` — View security settings',
      '> `/security joinrole` — Set auto-join role',
      '> `/security trappedchannel` — Set honeypot channel',
      '> `/security joinmsg` — Set welcome DM message',
      '> `/antiraid on/off` — Toggle anti-raid',
      '> `/antiraid unlock` — Unlock channels after raid',
      '> `/modconfig addmod/removemod` — Manage mod roles',
      '> `/modconfig addadmin/removeadmin` — Manage admin roles',
      '> `/modconfig view` — View mod/admin roles',
      '',
      '### Info',
      '> `/help` — Command list',
      '> `/userinfo` — User details',
      '> `/serverinfo` — Server stats',
      '> `/botinfo` — Bot stats',
      '> `/avatar` — View user avatar',
      '',
      '### Utility',
      '> `/ping` — Bot latency',
      '> `/uptime` — Bot uptime',
      '> `/suggest` — Submit a suggestion',
      '> `/poll` — Create a poll',
      '> `/say` — Send a message',
      '> `/embed` — Send a custom panel',
      '> `/nick` — Change member nickname',
      '> `/banlist` — View banned users',
      '> `/activity` — Set bot activity & status',
      '',
      '### Prefix Commands',
      '> `!help` — This help message',
      '> `!ping` — Bot latency',
      '> `!uptime` — Bot uptime',
    ].join('\n');

    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(content));
    container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent('-# GAMERZ WORKSHOP | Use /slash commands for full functionality'));

    await message.reply({
      flags: MessageFlags.IsComponentsV2,
      components: [container],
    });
  },
};
