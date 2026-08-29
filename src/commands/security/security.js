const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} = require('discord.js');
const V2 = require('../../utils/Embed');
const Perm = require('../../utils/Permissions');
const GuildModel = require('../../models/Guild');

module.exports = {
  data: new SlashCommandBuilder().setName('security').setDescription('Manage security settings')
    .addSubcommand(s => s.setName('status').setDescription('View all security & automod settings'))
    .addSubcommand(s => s.setName('trappedchannel').setDescription('Set honeypot channel (typing bans user)')
      .addChannelOption(o => o.setName('channel').setDescription('Channel (leave empty to disable)')))
    .addSubcommand(s => s.setName('joinrole').setDescription('Set auto-join role')
      .addRoleOption(o => o.setName('role').setDescription('Role (leave empty to disable)')))
    .addSubcommand(s => s.setName('joinmsg').setDescription('Set DM join message')
      .addStringOption(o => o.setName('message').setDescription('Message ({user}, {server}). Leave empty to disable.')))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  cooldown: 3,

  async execute(interaction, client) {
    await interaction.deferReply();
    if (!(await Perm.check(interaction, 'admin'))) return;

    const sub  = interaction.options.getSubcommand();
    const data = await GuildModel.get(interaction.guild.id);

    if (sub === 'status') {
      const am  = data.automod || {};
      const on  = '**Enabled**';
      const off = '**Disabled**';

      const container = new ContainerBuilder();

      container.addTextDisplayComponents(new TextDisplayBuilder().setContent('## Security & AutoMod Status'));
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent('> Full overview of all protection modules and settings.'));
      container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));

      // AutoMod section
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent('### AutoMod Modules'));
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `> **Anti-Spam:** ${am.antiSpam?.enabled ? `${on} — ${am.antiSpam.threshold} msgs / ${am.antiSpam.interval}s → \`${am.antiSpam.action}\`` : off}\n` +
          `> **Anti-Links:** ${am.antiLinks?.enabled ? `${on} — Blocked: ${am.antiLinks.allowedDomains?.length || 0} domains → \`${am.antiLinks.action}\`` : off}\n` +
          `> **Anti-Mention:** ${am.antiMention?.enabled ? `${on} — ${am.antiMention.threshold} mentions → \`${am.antiMention.action}\`` : off}`
        )
      );

      container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));

      // Server settings
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent('### Server Settings'));
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `> **Honeypot Channel:** ${data.security?.trappedChannel ? `<#${data.security.trappedChannel}>` : 'Not set'}\n` +
          `> **Auto Join Role:** ${data.security?.verificationRole ? `<@&${data.security.verificationRole}>` : 'Not set'}\n` +
          `> **Join DM Message:** ${data.joinMessage ? 'Set' : 'Not set'}`
        )
      );

      container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));

      // Log channels
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent('### Log Channels'));
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `> **Audit Log:** ${data.logChannels?.audit ? `<#${data.logChannels.audit}>` : 'Not set'}\n` +
          `> **Join/Leave:** ${data.logChannels?.join ? `<#${data.logChannels.join}>` : 'Not set'}\n` +
          `> **Voice Log:** ${data.logChannels?.vc ? `<#${data.logChannels.vc}>` : 'Not set'}\n` +
          `> **Message Log:** ${data.logChannels?.message ? `<#${data.logChannels.message}>` : 'Not set'}`
        )
      );

      container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));

      // Bot health
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent('### Bot Health'));
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `> **Ping:** ${client.ws.ping}ms\n` +
          `> **Uptime:** ${Math.floor(client.uptime / 3600000)}h ${Math.floor((client.uptime % 3600000) / 60000)}m`
        )
      );

      container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent('-# GAMERZ WORKSHOP | Use /automod to configure modules'));

      return interaction.editReply({ flags: MessageFlags.IsComponentsV2, components: [container] });
    }

    if (sub === 'trappedchannel') {
      const channel = interaction.options.getChannel('channel');
      if (!data.security) data.security = {};
      data.security.trappedChannel = channel ? channel.id : null;
      await GuildModel.save(interaction.guild.id, data);
      return interaction.editReply(V2.reply(V2.success('Honeypot Channel',
        channel ? `Honeypot set to ${channel}.\nAnyone who types there gets banned.` : 'Honeypot channel disabled.', client)));
    }

    if (sub === 'joinrole') {
      const role = interaction.options.getRole('role');
      if (!data.security) data.security = {};
      data.security.verificationRole = role ? role.id : null;
      await GuildModel.save(interaction.guild.id, data);
      return interaction.editReply(V2.reply(V2.success('Join Role',
        role ? `Auto join role set to ${role}.` : 'Auto join role disabled.', client)));
    }

    if (sub === 'joinmsg') {
      const msg = interaction.options.getString('message');
      data.joinMessage = msg || null;
      await GuildModel.save(interaction.guild.id, data);
      return interaction.editReply(V2.reply(V2.success('Join Message',
        msg ? 'Join DM message updated.' : 'Join DM message disabled.', client)));
    }
  },
};
