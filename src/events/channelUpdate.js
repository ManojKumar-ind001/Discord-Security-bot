
const { Events, AuditLogEvent } = require('discord.js');
const Logger = require('../utils/Logger');
module.exports = {
  name: Events.ChannelUpdate,
  async execute(old, nw, client){
    if(!nw.guild) return;
    let exec=null;
    try{ await new Promise(r=>setTimeout(r,1000)); const l=(await nw.guild.fetchAuditLogs({type:AuditLogEvent.ChannelUpdate,limit:1})).entries.first(); if(l&&l.target.id===nw.id&&Date.now()-l.createdTimestamp<5000) exec=l.executor; }catch{}
    await Logger.channelUpdated(nw.guild,old,nw,exec);
  },
};
