// Manual message cache — stores last 2000 messages across all channels
// Discord doesn't cache all messages by default, so we maintain our own
const cache = new Map();
const MAX = 2000;

module.exports = {
  set(message){
    if(!message || message.author?.bot) return;
    if(!message.id) return;

    const attachmentsList = message.attachments
      ? [...message.attachments.values()].map(a => ({
          name:        a.name        || 'file',
          url:         a.url,
          contentType: a.contentType || null,
          size:        a.size        || 0,
          width:       a.width       || null,
          height:      a.height      || null,
        }))
      : [];

    cache.set(message.id, {
      id:               message.id,
      // Store content exactly — empty string '' is valid (image-only message)
      content:          message.content !== undefined ? message.content : null,
      authorId:         message.author?.id       || null,
      authorTag:        message.author?.tag       || message.author?.username || 'Unknown',
      channelId:        message.channelId,
      channelName:      message.channel?.name    || null,
      channelType:      message.channel?.type    ?? null,
      guildId:          message.guildId,
      createdTimestamp: message.createdTimestamp,
      attachments:      attachmentsList,
    });

    // Trim oldest entries if over limit
    if(cache.size > MAX){
      cache.delete(cache.keys().next().value);
    }
  },

  get(messageId){
    return cache.get(messageId) || null;
  },

  delete(messageId){
    cache.delete(messageId);
  },

  size(){
    return cache.size;
  },
};
