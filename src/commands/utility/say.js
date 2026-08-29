const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} = require('discord.js');
const Perm = require('../../utils/Permissions');
const V2 = require('../../utils/Embed');

module.exports = {
  data: new SlashCommandBuilder().setName('say').setDescription('Make the bot say something in a channel')
    .addStringOption(o => o.setName('message').setDescription('Message to send').setRequired(true))
    .addChannelOption(o => o.setName('channel').setDescription('Channel (default: current)'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
  cooldown: 5,
  async execute(interaction, client) {
    if (!(await Perm.check(interaction, 'mod'))) return;

    const msg = interaction.options.getString('message');
    const ch  = interaction.options.getChannel('channel') || interaction.channel;

    try {
      // Send the message as a clean V2 container (no title, just the message)
      const container = new ContainerBuilder();
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent(msg));

      await ch.send({
        flags: MessageFlags.IsComponentsV2,
        components: [container],
      });

      await interaction.reply({
        ...V2.reply(V2.success('Message Sent', `Message sent to ${ch}.`, client)),
        ephemeral: true,
      });
    } catch (e) {
      await interaction.reply({
        ...V2.reply(V2.error('Failed to Send', e.message, client)),
        ephemeral: true,
      });
    }
  },
};
