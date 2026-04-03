
const { Events, AuditLogEvent } = require('discord.js');
const Logger = require('../utils/Logger');
module.exports = {
  name: Events.ChannelCreate,
  async execute(channel, client){
    if(!channel.guild) return;
    let exec=null;
    try{ await new Promise(r=>setTimeout(r,1000)); const l=(await channel.guild.fetchAuditLogs({type:AuditLogEvent.ChannelCreate,limit:1})).entries.first(); if(l&&Date.now()-l.createdTimestamp<5000) exec=l.executor; }catch{}
    await Logger.channelCreated(channel.guild,channel,exec);
  },
};
