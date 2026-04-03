
const { Events, AuditLogEvent } = require('discord.js');
const Logger = require('../utils/Logger');
const GuildModel = require('../models/Guild');
const joinMap = new Map();
module.exports = {
  name: Events.GuildMemberAdd,
  async execute(member, client){
    const guild = member.guild;
    const data = await GuildModel.get(guild.id);
    if(data.security.antiRaid){
      const list = joinMap.get(guild.id)||[];
      list.push(Date.now());
      const recent = list.filter(t=>t>Date.now()-10000);
      joinMap.set(guild.id,recent);
      if(recent.length>=10){
        joinMap.delete(guild.id);
        const action = data.security.raidAction || 'kick_lock';
        if (action === 'kick_lock') {
          try{ await member.kick('Anti-Raid: mass join'); }catch{}
        } else if (action === 'timeout_lock') {
          try{ await member.timeout(86400000, 'Anti-Raid: mass join'); }catch{}
        }
        if(data.security.lockOnRaid){
          for(const [,ch] of guild.channels.cache.filter(c=>c.isTextBased())){
            try{ await ch.permissionOverwrites.edit(guild.roles.everyone,{SendMessages:false}); }catch{}
          }
          await Logger.securityAlert(guild,'RAID DETECTED','🚨 Mass joins detected. Channels locked!',{Joins:recent.length,Action:'Channels Locked'});
        }
        return;
      }
    }
    if(data.security.verificationRole){
      const role = guild.roles.cache.get(data.security.verificationRole);
      if(role) try{ await member.roles.add(role,'Auto join role'); }catch{}
    }
    if(data.joinMessage){
      try{ await member.send(data.joinMessage.replace(/{user}/g, `<@${member.id}>`).replace(/{server}/g, guild.name)); }catch{}
    }
    await Logger.memberJoin(guild,member);
  },
};
