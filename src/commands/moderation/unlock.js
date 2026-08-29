
const { SlashCommandBuilder, PermissionFlagsBits,
  MessageFlags,
} = require('discord.js');
const V2 = require('../../utils/Embed');
const Perm = require('../../utils/Permissions');

module.exports = {
  data: new SlashCommandBuilder().setName('unlock').setDescription('Unlock a channel')
    .addChannelOption(o => o.setName('channel').setDescription('Channel (default: current)'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
  cooldown: 5,
  async execute(interaction, client) {
    if (!(await Perm.check(interaction, 'mod'))) return;
    const ch = interaction.options.getChannel('channel') || interaction.channel;
    try {
      await ch.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: null });
      await interaction.reply(V2.reply(V2.success('Channel Unlocked', `🔓 ${ch} is now **unlocked**.`, client)));
    } catch (e) {
      await interaction.reply({ ...V2.reply(V2.error('Failed', e.message, client)), flags: MessageFlags.Ephemeral });
    }
  },
};
