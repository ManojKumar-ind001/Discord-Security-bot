
const { Events } = require('discord.js');
const Logger = require('../utils/Logger');
module.exports = {
  name: Events.VoiceStateUpdate,
  async execute(old, nw, client){
    const g=nw.guild, m=nw.member;
    if(!old.channel&&nw.channel)                          await Logger.vcJoined(g,m,nw.channel);
    else if(old.channel&&!nw.channel)                     await Logger.vcLeft(g,m,old.channel);
    else if(old.channel&&nw.channel&&old.channel.id!==nw.channel.id) await Logger.vcMoved(g,m,old.channel,nw.channel);
  },
};
