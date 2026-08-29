const {
  Events,
  ChannelType,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} = require('discord.js');

module.exports = {
  name: Events.MessageBulkDelete,
  async execute(messages, channel, client) {
    if (!channel.guild) return;
    if (channel.type === ChannelType.GuildVoice) return;

    try {
      const ch = await (async () => {
        const GuildModel = require('../models/Guild');
        const data = await GuildModel.get(channel.guild.id);
        const id = data.logChannels?.message;
        if (!id) return null;
        return channel.guild.channels.cache.get(id) || await channel.guild.channels.fetch(id).catch(() => null);
      })();
      if (!ch) return;

      const count = messages.size;
      const sample = messages.filter(m => m.content?.trim()).first(5);

      const container = new ContainerBuilder();
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent('## Bulk Message Delete (Purge)'));
      container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));

      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `> **Channel:** <#${channel.id}>\n` +
          `> **Messages Deleted:** \`${count}\`\n` +
          `> **Time:** <t:${Math.floor(Date.now() / 1000)}:F>`
        )
      );

      if (sample.length > 0) {
        const preview = sample.map(m => `> **${m.author?.tag || 'Unknown'}:** ${m.content?.substring(0, 80) || '[No text]'}`).join('\n');
        container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
        container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`### Sample Messages\n${preview.substring(0, 900)}`));
      }

      container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent('-# GAMERZ WORKSHOP Security'));

      await ch.send({
        flags: MessageFlags.IsComponentsV2,
        components: [container],
      });
    } catch (err) {
      console.error('[BulkDelete] Logging failed:', err.message);
    }
  },
};
