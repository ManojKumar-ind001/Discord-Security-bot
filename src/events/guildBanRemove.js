const { Events, AuditLogEvent } = require('discord.js');
const Logger = require('../utils/Logger');

module.exports = {
  name: Events.GuildBanRemove,
  async execute(ban, client) {
    const guild = ban.guild;
    const user  = ban.user;
    let exec = null;
    try {
      await new Promise(r => setTimeout(r, 1000));
      const logs = await guild.fetchAuditLogs({ type: AuditLogEvent.MemberBanRemove, limit: 5 });
      for (const entry of logs.entries.values()) {
        if (entry.target?.id === user.id && Date.now() - entry.createdTimestamp < 10000) {
          exec = entry.executor;
          break;
        }
      }
    } catch {}
    await Logger.modAction(guild, 'unban', user, exec, 'Member unbanned');
  },
};
