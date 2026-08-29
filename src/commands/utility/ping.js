const {
  SlashCommandBuilder,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder().setName('ping').setDescription('Check bot latency'),
  cooldown: 5,
  async execute(interaction, client) {
    const { resource } = await interaction.reply({ content: 'Pinging...', withResponse: true });
    const sent = resource?.message;
    const rtt = sent ? (sent.createdTimestamp - interaction.createdTimestamp) : 0;
    const wsp = client.ws.ping;

    const container = new ContainerBuilder();
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent('## Pong!'));
    container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `> **Bot Latency:** \`${rtt}ms\`\n` +
        `> **WebSocket:** \`${wsp}ms\`\n` +
        `> **Status:** **${rtt < 200 ? 'Excellent' : 'Good'}**`
      )
    );

    container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent('-# GAMERZ WORKSHOP'));

    await interaction.editReply({
      content: null,
      flags: MessageFlags.IsComponentsV2,
      components: [container],
    });
  },
};
