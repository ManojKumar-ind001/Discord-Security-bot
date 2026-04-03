const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const Embed = require('../../utils/Embed');
const Perm = require('../../utils/Permissions');
const GuildModel = require('../../models/Guild');
const { COLORS } = require('../../config/config');

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

  async execute(interaction, client){
    await interaction.deferReply();
    if(!(await Perm.check(interaction, 'admin'))) return;

    const sub = interaction.options.getSubcommand();
    const data = await GuildModel.get(interaction.guild.id);

    if(sub === 'status'){
      const am = data.automod || {};
      const on  = '🟢 Enabled';
      const off = '🔴 Disabled';

      const e = new EmbedBuilder()
        .setColor(COLORS.SECURITY)
        .setTitle('🛡️ Security & AutoMod Status')
        .setDescription('Full overview of all protection modules and settings.')
        .addFields(
          // AutoMod section
          { name: '━━━━━━ AutoMod Modules ━━━━━━', value: '\u200b', inline: false },
          { name: '💬 Anti-Spam',    value: am.antiSpam?.enabled    ? `${on}\n${am.antiSpam.threshold} msgs / ${am.antiSpam.interval}s → ${am.antiSpam.action}`    : off, inline: true },
          { name: '🔗 Anti-Links',   value: am.antiLinks?.enabled   ? `${on}\nBlocked: ${am.antiLinks.allowedDomains?.length || 0} domains → ${am.antiLinks.action}` : off, inline: true },
          { name: '📢 Anti-Mention', value: am.antiMention?.enabled ? `${on}\n${am.antiMention.threshold} mentions → ${am.antiMention.action}`                        : off, inline: true },
          // Server settings section
          { name: '━━━━━━ Server Settings ━━━━━━', value: '\u200b', inline: false },
          { name: '🪤 Honeypot Channel', value: data.security?.trappedChannel ? `<#${data.security.trappedChannel}>` : 'Not set', inline: true },
          { name: '🎭 Auto Join Role',   value: data.security?.verificationRole ? `<@&${data.security.verificationRole}>` : 'Not set', inline: true },
          { name: '📩 Join DM Message',  value: data.joinMessage ? '✅ Set' : 'Not set', inline: true },
          // Log channels section
          { name: '━━━━━━ Log Channels ━━━━━━', value: '\u200b', inline: false },
          { name: '📊 Audit Log',    value: data.logChannels?.audit   ? `<#${data.logChannels.audit}>`   : '❌ Not set', inline: true },
          { name: '📥 Join/Leave',   value: data.logChannels?.join    ? `<#${data.logChannels.join}>`    : '❌ Not set', inline: true },
          { name: '🔊 Voice Log',    value: data.logChannels?.vc      ? `<#${data.logChannels.vc}>`      : '❌ Not set', inline: true },
          { name: '💬 Message Log',  value: data.logChannels?.message ? `<#${data.logChannels.message}>` : '❌ Not set', inline: true },
          // Bot health
          { name: '━━━━━━ Bot Health ━━━━━━', value: '\u200b', inline: false },
          { name: '🌐 Ping', value: `${client.ws.ping}ms`, inline: true },
          { name: '⏱️ Uptime', value: `${Math.floor(client.uptime / 3600000)}h ${Math.floor((client.uptime % 3600000) / 60000)}m`, inline: true },
        )
        .setFooter({ text: '🎮 GAMERZ WORKSHOP | Use /automod to configure modules' })
        .setTimestamp();

      return interaction.editReply({ embeds: [e] });
    }

    if(sub === 'trappedchannel'){
      const channel = interaction.options.getChannel('channel');
      if(!data.security) data.security = {};
      data.security.trappedChannel = channel ? channel.id : null;
      await GuildModel.save(interaction.guild.id, data);
      return interaction.editReply({ embeds: [Embed.success('Honeypot Channel', channel ? `Honeypot set to ${channel}.\nAnyone who types there gets banned.` : 'Honeypot channel disabled.', client)] });
    }

    if(sub === 'joinrole'){
      const role = interaction.options.getRole('role');
      if(!data.security) data.security = {};
      data.security.verificationRole = role ? role.id : null;
      await GuildModel.save(interaction.guild.id, data);
      return interaction.editReply({ embeds: [Embed.success('Join Role', role ? `Auto join role set to ${role}.` : 'Auto join role disabled.', client)] });
    }

    if(sub === 'joinmsg'){
      const msg = interaction.options.getString('message');
      data.joinMessage = msg || null;
      await GuildModel.save(interaction.guild.id, data);
      return interaction.editReply({ embeds: [Embed.success('Join Message', msg ? 'Join DM message updated.' : 'Join DM message disabled.', client)] });
    }
  },
};
