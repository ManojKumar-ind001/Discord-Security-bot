const { Events, AuditLogEvent } = require('discord.js');
const Logger = require('../utils/Logger');

module.exports = {
  name: Events.GuildBanAdd,
  async execute(ban, client) {
    const guild = ban.guild;
    const user  = ban.user;
    let exec = null;
    try {
      await new Promise(r => setTimeout(r, 1000));
      const logs = await guild.fetchAuditLogs({ type: AuditLogEvent.MemberBan, limit: 5 });
      for (const entry of logs.entries.values()) {
        if (entry.target?.id === user.id && Date.now() - entry.createdTimestamp < 10000) {
          exec = entry.executor;
          break;
        }
      }
    } catch {}
    const reason = ban.reason || (exec ? 'No reason provided' : 'Unknown');
    await Logger.modAction(guild, 'ban', user, exec, reason);
  },
};
