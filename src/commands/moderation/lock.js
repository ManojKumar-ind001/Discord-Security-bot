
const { SlashCommandBuilder, PermissionFlagsBits,
  MessageFlags,
} = require('discord.js');
const V2 = require('../../utils/Embed');
const Perm = require('../../utils/Permissions');

module.exports = {
  data: new SlashCommandBuilder().setName('lock').setDescription('Lock a channel')
    .addChannelOption(o => o.setName('channel').setDescription('Channel (default: current)'))
    .addStringOption(o => o.setName('reason').setDescription('Reason'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
  cooldown: 5,
  async execute(interaction, client) {
    if (!(await Perm.check(interaction, 'mod'))) return;
    const ch     = interaction.options.getChannel('channel') || interaction.channel;
    const reason = interaction.options.getString('reason') || 'No reason provided';
    try {
      await ch.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: false }, { reason: `${interaction.user.tag}: ${reason}` });
      await interaction.reply(V2.reply(V2.success('Channel Locked',
        `🔒 ${ch} is now **locked**.\n**Reason:** ${reason}`, client)));
    } catch (e) {
      await interaction.reply({ ...V2.reply(V2.error('Failed', e.message, client)), flags: MessageFlags.Ephemeral });
    }
  },
};
