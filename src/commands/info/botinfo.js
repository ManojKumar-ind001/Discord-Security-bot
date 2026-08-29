const {
  SlashCommandBuilder,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  SectionBuilder,
  ThumbnailBuilder,
  MessageFlags,
  version: djsVer,
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder().setName('botinfo').setDescription('View bot information'),
  cooldown: 5,
  async execute(interaction, client) {
    const uptime = process.uptime();
    const days = Math.floor(uptime / 86400);
    const hrs = Math.floor((uptime % 86400) / 3600);
    const mins = Math.floor((uptime % 3600) / 60);
    const secs = Math.floor(uptime % 60);
    const mem = process.memoryUsage();

    const container = new ContainerBuilder();
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent('## Bot Information'));
    container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));

    const section = new SectionBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`**Bot Name:** \`${client.user.tag}\``),
        new TextDisplayBuilder().setContent(`**Bot ID:** \`${client.user.id}\``),
        new TextDisplayBuilder().setContent(`**Servers:** \`${client.guilds.cache.size}\``),
        new TextDisplayBuilder().setContent(`**Users:** \`${client.users.cache.size}\``),
      )
      .setThumbnailAccessory(new ThumbnailBuilder({ media: { url: client.user.displayAvatarURL({ size: 256 }) } }));
    container.addSectionComponents(section);

    container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `**Slash Commands:** \`${client.slashCommands.size}\`\n` +
        `**Uptime:** \`${days}d ${hrs}h ${mins}m ${secs}s\`\n` +
        `**Latency:** \`${client.ws.ping}ms\`\n` +
        `**Memory:** \`${(mem.heapUsed / 1024 / 1024).toFixed(2)} MB\`\n` +
        `**discord.js:** \`v${djsVer}\`\n` +
        `**Node.js:** \`${process.version}\``
      )
    );

    container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent('-# GAMERZ WORKSHOP | v1.0.0'));

    await interaction.reply({ flags: MessageFlags.IsComponentsV2, components: [container] });
  },
};
