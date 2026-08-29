const {
  SlashCommandBuilder,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  PermissionFlagsBits,
  MessageFlags,
} = require('discord.js');
const V2 = require('../../utils/Embed');
const Perm = require('../../utils/Permissions');

module.exports = {
  data: new SlashCommandBuilder().setName('embed').setDescription('Send a custom container panel')
    .addStringOption(o => o.setName('title').setDescription('Panel title').setRequired(true))
    .addStringOption(o => o.setName('description').setDescription('Panel description / body').setRequired(true))
    .addChannelOption(o => o.setName('channel').setDescription('Channel (default: current)'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
  cooldown: 5,
  async execute(interaction, client) {
    if (!(await Perm.check(interaction, 'mod'))) return;
    const title = interaction.options.getString('title');
    const desc = interaction.options.getString('description');
    const ch = interaction.options.getChannel('channel') || interaction.channel;

    try {
      const container = new ContainerBuilder();
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${title}`));
      container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`> ${desc}`));
      container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent('-# GAMERZ WORKSHOP'));

      await ch.send({
        flags: MessageFlags.IsComponentsV2,
        components: [container],
      });

      await interaction.reply({
        ...V2.reply(V2.success('Panel Sent', `Message panel sent to ${ch}.`, client)),
        flags: MessageFlags.Ephemeral,
      });
    } catch (err) {
      await interaction.reply({
        ...V2.reply(V2.error('Failed', err.message, client)),
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
