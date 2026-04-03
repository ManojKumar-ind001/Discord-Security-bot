const { Events, AuditLogEvent } = require('discord.js');
const Logger = require('../utils/Logger');

module.exports = {
  name: Events.GuildMemberUpdate,
  async execute(oldMember, newMember, client){
    const guild = newMember.guild;
    const now = Date.now();

    // ── Timeout added/removed detection ───────────────────────────────────────
    const oldTimeout = oldMember.communicationDisabledUntilTimestamp;
    const newTimeout = newMember.communicationDisabledUntilTimestamp;

    const wasTimedOut = oldTimeout && oldTimeout > now;
    const isTimedOut  = newTimeout && newTimeout > now;

    // Timeout ADDED
    if(!wasTimedOut && isTimedOut){
      try{
        await new Promise(r => setTimeout(r, 1500));
        const logs = await guild.fetchAuditLogs({ type: AuditLogEvent.MemberUpdate, limit: 5 });
        let exec = null;
        for(const entry of logs.entries.values()){
          if(entry.target?.id === newMember.id && Date.now() - entry.createdTimestamp < 10000){
            exec = entry.executor;
            break;
          }
        }
        const ms = newTimeout - now;
        const durationStr = ms >= 86400000 ? `${Math.round(ms/86400000)}d` :
                            ms >= 3600000  ? `${Math.round(ms/3600000)}h`  :
                            `${Math.round(ms/60000)}m`;

        await Logger.modAction(guild, 'timeout', newMember, exec,
          exec?.id === client.user.id ? 'AutoMod action' : 'Manual timeout by moderator',
          { 'Duration': durationStr, 'Expires': `<t:${Math.floor(newTimeout/1000)}:F>` }
        );
      }catch(e){ console.error('[TIMEOUT LOG]', e.message); }
    }

    // Timeout REMOVED
    if(wasTimedOut && !isTimedOut){
      try{
        await new Promise(r => setTimeout(r, 1500));
        const logs = await guild.fetchAuditLogs({ type: AuditLogEvent.MemberUpdate, limit: 5 });
        let exec = null;
        for(const entry of logs.entries.values()){
          if(entry.target?.id === newMember.id && Date.now() - entry.createdTimestamp < 10000){
            exec = entry.executor;
            break;
          }
        }
        await Logger.modAction(guild, 'untimeout', newMember, exec, 'Timeout removed', {});
      }catch(e){ console.error('[UNTIMEOUT LOG]', e.message); }
    }

    // ── Avatar change ──────────────────────────────────────────────────────────
    const oldAvatar = oldMember.user.avatar;
    const newAvatar = newMember.user.avatar;
    if(oldAvatar !== newAvatar){
      const oldURL = oldAvatar
        ? `https://cdn.discordapp.com/avatars/${oldMember.user.id}/${oldAvatar}.${oldAvatar.startsWith('a_') ? 'gif' : 'png'}?size=512`
        : oldMember.user.defaultAvatarURL;
      const newURL = newMember.user.displayAvatarURL({ dynamic: true, size: 512 });
      await Logger.avatarChanged(guild, newMember.user, oldURL, newURL);
    }

    // ── Role changes ───────────────────────────────────────────────────────────
    const added   = newMember.roles.cache.filter(r => !oldMember.roles.cache.has(r.id));
    const removed = oldMember.roles.cache.filter(r => !newMember.roles.cache.has(r.id));
    if(added.size > 0 || removed.size > 0){
      let exec = null;
      try{
        await new Promise(r => setTimeout(r, 1200));
        const logs = await guild.fetchAuditLogs({ type: AuditLogEvent.MemberRoleUpdate, limit: 1 });
        const log  = logs.entries.first();
        if(log && log.target.id === newMember.id && Date.now() - log.createdTimestamp < 6000)
          exec = log.executor;
      }catch{}
      for(const [, role] of added)   await Logger.roleAdded(guild, newMember, role, exec);
      for(const [, role] of removed) await Logger.roleRemoved(guild, newMember, role, exec);
    }
  },
};
