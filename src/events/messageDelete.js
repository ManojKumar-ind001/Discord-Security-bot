const { Events, AuditLogEvent } = require('discord.js');
const Logger  = require('../utils/Logger');
const msgCache = require('../utils/messageCache');

module.exports = {
  name: Events.MessageDelete,
  async execute(message, client){
    if(!message.guild) return;
    if(message.author?.bot) return;

    // Step 1: Try our manual cache first (has pre-fetched + live messages)
    const cached = msgCache.get(message.id);
    if(cached){
      // Restore everything from cache
      if(!message.author || !message.author.id){
        message.author = {
          id:       cached.authorId,
          tag:      cached.authorTag,
          username: cached.authorTag?.split('#')[0] || cached.authorTag,
          bot:      false,
        };
      }
      if(cached.content !== null && cached.content !== undefined){
        message.content = cached.content;
      }
      if(!message.channel?.name && cached.channelName){
        if(message.channel) message.channel.name = cached.channelName;
      }
      if((!message.attachments || message.attachments.size === 0) && cached.attachments?.length > 0){
        const attMap = new Map();
        for(const a of cached.attachments) attMap.set(a.url, a);
        message.attachments = attMap;
      }
      message.createdTimestamp = message.createdTimestamp || cached.createdTimestamp;
      msgCache.delete(message.id);
    }

    // Step 2: If still partial, try Discord fetch
    if(message.partial){
      try{ await message.fetch(); }catch{}
    }

    // Step 3: If still no author, try audit log
    if(!message.author || !message.author.id){
      try{
        await new Promise(r => setTimeout(r, 800));
        const audit = await message.guild.fetchAuditLogs({ limit: 5, type: AuditLogEvent.MessageDelete });
        for(const entry of audit.entries.values()){
          if(Date.now() - entry.createdTimestamp < 12000 && entry.target){
            message.author = {
              id:       entry.target.id,
              tag:      entry.target.tag || entry.target.username || 'Unknown',
              username: entry.target.username || 'Unknown',
              bot:      entry.target.bot || false,
            };
            break;
          }
        }
      }catch(e){
        console.error('[MSG DELETE] Audit log error:', e.message);
      }
    }

    if(!message.author || !message.author.id) return;

    await Logger.messageDeleted(message.guild, message);
  },
};
