const { Events } = require('discord.js');
const Logger   = require('../utils/Logger');
const msgCache = require('../utils/messageCache');

module.exports = {
  name: Events.MessageUpdate,
  async execute(oldMsg, newMsg, client){
    if(!newMsg.guild || newMsg.author?.bot) return;

    // Enrich oldMsg with cached content before updating cache
    const cached = msgCache.get(oldMsg.id);
    if(cached && !oldMsg.content && cached.content !== undefined){
      oldMsg.content = cached.content;
    }

    // Update cache with new content for future deletes
    msgCache.set(newMsg);

    // Don't log if content didn't change (e.g. embed unfurl)
    if(oldMsg.content === newMsg.content) return;

    await Logger.messageEdited(newMsg.guild, oldMsg, newMsg);
  },
};
