
const { Events, AuditLogEvent } = require('discord.js');
const Logger = require('../utils/Logger');
module.exports = {
  name: Events.GuildRoleDelete,
  async execute(role, client){
    let exec=null;
    try{ await new Promise(r=>setTimeout(r,500)); const l=(await role.guild.fetchAuditLogs({type:AuditLogEvent.RoleDelete,limit:1})).entries.first(); if(l&&Date.now()-l.createdTimestamp<5000) exec=l.executor; }catch{}
    await Logger.roleDeleted(role.guild,role,exec);
  },
};
