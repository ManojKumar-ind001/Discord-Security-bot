const { Events, AuditLogEvent } = require('discord.js');
const Logger  = require('../utils/Logger');
const msgCache = require('../utils/messageCache');

module.exports = {
  name: Events.MessageDelete,
  async execute(message, client) {
    if (!message.guild) return;

    // Step 1: Enrich from manual memory cache
    const cached = msgCache.get(message.id);
    if (cached) {
      if (!message.author || !message.author.id) {
        message.author = {
          id:       cached.authorId,
          tag:      cached.authorTag,
          username: cached.authorTag?.split('#')[0] || cached.authorTag,
          bot:      false,
        };
      }
      if (cached.content !== null && cached.content !== undefined && !message.content) {
        message.content = cached.content;
      }
      if (!message.channel?.name && cached.channelName) {
        if (message.channel) message.channel.name = cached.channelName;
      }
      if ((!message.attachments || message.attachments.size === 0) && cached.attachments?.length > 0) {
        const attMap = new Map();
        for (const a of cached.attachments) attMap.set(a.url, a);
        message.attachments = attMap;
      }
      message.createdTimestamp = message.createdTimestamp || cached.createdTimestamp;
      msgCache.delete(message.id);
    }

    // Step 2: Skip if author is a bot (only after cache restore)
    if (message.author?.bot) return;

    // Step 3: Fetch channel if partial
    if (message.channel?.partial) {
      try { await message.channel.fetch(); } catch {}
    }

    // Step 4: Try to fetch partial message (may fail if message was in admin channel)
    if (message.partial) {
      try { await message.fetch(); } catch {}
    }

    // Step 5: If still no author, try audit log lookup (admin channels / uncached)
    if (!message.author || !message.author.id) {
      try {
        await new Promise(r => setTimeout(r, 800));
        const audit = await message.guild.fetchAuditLogs({ limit: 5, type: AuditLogEvent.MessageDelete });
        for (const entry of audit.entries.values()) {
          if (Date.now() - entry.createdTimestamp < 15000) {
            if (entry.target) {
              message.author = {
                id:       entry.target.id,
                tag:      entry.target.tag || entry.target.username || 'Unknown',
                username: entry.target.username || 'Unknown',
                bot:      entry.target.bot || false,
              };
            }
            break;
          }
        }
      } catch (e) {
        console.error('[MSG DELETE] Audit log lookup failed:', e.message);
      }
    }

    // Skip if author is bot (discovered via audit log)
    if (message.author?.bot) return;

    // Always log the deleted message (even if author remained uncached)
    await Logger.messageDeleted(message.guild, message);
  },
};
