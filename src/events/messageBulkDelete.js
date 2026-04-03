const { Events, ChannelType, EmbedBuilder } = require('discord.js');
const Logger  = require('../utils/Logger');
const { COLORS } = require('../config/config');

// Separate handler for bulk deletes (e.g. /purge command)
// Instead of spamming the log with one entry per message, send ONE summary
module.exports = {
  name: Events.MessageBulkDelete,
  async execute(messages, channel, client){
    if(!channel.guild) return;
    if(channel.type === ChannelType.GuildVoice) return;

    try {
      const ch = await (async () => {
        const GuildModel = require('../models/Guild');
        const data = await GuildModel.get(channel.guild.id);
        const id = data.logChannels?.message;
        if(!id) return null;
        return channel.guild.channels.cache.get(id) || await channel.guild.channels.fetch(id).catch(() => null);
      })();
      if(!ch) return;

      const count = messages.size;
      const sample = messages.filter(m => m.content?.trim()).first(5);

      const e = new EmbedBuilder()
        .setColor(COLORS.ERROR)
        .setTitle('🗑️ Bulk Delete (Purge)')
        .addFields(
          { name: 'Channel', value: `<#${channel.id}>`, inline: true },
          { name: 'Messages Deleted', value: `${count}`, inline: true },
          { name: 'Time', value: `<t:${Math.floor(Date.now()/1000)}:F>`, inline: true },
        )
        .setFooter({ text: '🎮 GAMERZ WORKSHOP Security' })
        .setTimestamp();

      if(sample.length > 0){
        const preview = sample.map(m => `**${m.author?.tag || 'Unknown'}:** ${m.content?.substring(0,80) || '[No text]'}`).join('\n');
        e.addFields({ name: 'Sample Messages (first 5)', value: preview.substring(0, 1000) });
      }

      await ch.send({ embeds: [e] });
    } catch(err) {
      console.error('[BulkDelete] Logging failed:', err.message);
    }
  },
};
