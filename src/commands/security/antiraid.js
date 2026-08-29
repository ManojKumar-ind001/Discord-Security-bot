const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const V2 = require('../../utils/Embed');
const Perm = require('../../utils/Permissions');
const GuildModel = require('../../models/Guild');

module.exports = {
  data: new SlashCommandBuilder().setName('antiraid').setDescription('Anti-raid controls')
    .addSubcommand(s => s.setName('on').setDescription('Enable anti-raid mode'))
    .addSubcommand(s => s.setName('off').setDescription('Disable anti-raid mode'))
    .addSubcommand(s => s.setName('unlock').setDescription('Unlock all channels after a raid'))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  cooldown: 5,
  async execute(interaction, client) {
    if (!(await Perm.check(interaction, 'admin'))) return;
    const sub  = interaction.options.getSubcommand();
    const data = await GuildModel.get(interaction.guild.id);
    if (!data.security) data.security = {};

    if (sub === 'on') {
      data.security.antiRaid = true;
      await GuildModel.save(interaction.guild.id, data);
      return interaction.reply(V2.reply(V2.success('Anti-Raid Enabled',
        '> Anti-raid protection is now **Active**.\n> New accounts and mass joins will be flagged automatically.', client)));
    }

    if (sub === 'off') {
      data.security.antiRaid = false;
      await GuildModel.save(interaction.guild.id, data);
      return interaction.reply(V2.reply(V2.warning('Anti-Raid Disabled',
        '> Anti-raid protection is now **Inactive**.\n> The server is no longer protected against raid events.', client)));
    }

    if (sub === 'unlock') {
      await interaction.deferReply();
      let n = 0;
      for (const [, ch] of interaction.guild.channels.cache.filter(c => c.isTextBased())) {
        try {
          await ch.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: null });
          n++;
        } catch {}
      }
      await interaction.editReply(V2.reply(V2.success('Channels Unlocked',
        `> **${n} channels** have been unlocked after the raid.\n> Members can now send messages again.`, client)));
    }
  },
};
