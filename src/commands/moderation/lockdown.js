const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const V2 = require('../../utils/Embed');
const Perm = require('../../utils/Permissions');

module.exports = {
  data: new SlashCommandBuilder().setName('lockdown').setDescription('Lock or unlock ALL text channels')
    .addSubcommand(s => s.setName('start').setDescription('Start server lockdown')
      .addStringOption(o => o.setName('reason').setDescription('Reason for lockdown')))
    .addSubcommand(s => s.setName('end').setDescription('End server lockdown'))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  cooldown: 10,
  async execute(interaction, client) {
    if (!(await Perm.check(interaction, 'admin'))) return;
    await interaction.deferReply();
    const sub    = interaction.options.getSubcommand();
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const channels = interaction.guild.channels.cache.filter(c => c.isTextBased() && c.permissionsFor(interaction.guild.roles.everyone));
    let n = 0;
    for (const [, ch] of channels) {
      try {
        if (sub === 'start') await ch.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: false }, { reason });
        else                 await ch.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: null });
        n++;
      } catch {}
    }
    if (sub === 'start') {
      await interaction.editReply(V2.reply(V2.security('Server Lockdown',
        `> Server is now **locked** — members cannot send messages.\n> **Channels Locked:** ${n}\n> **Reason:** ${reason}`, client)));
    } else {
      await interaction.editReply(V2.reply(V2.success('Lockdown Ended',
        `> Lockdown has been lifted — members can chat again.\n> **Channels Unlocked:** ${n}`, client)));
    }
  },
};
