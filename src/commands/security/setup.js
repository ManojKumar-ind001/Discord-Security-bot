const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
  ChannelType,
} = require('discord.js');
const V2 = require('../../utils/Embed');
const Perm = require('../../utils/Permissions');
const GuildModel = require('../../models/Guild');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Setup bot log channels')
    .addSubcommand(s => s.setName('logs').setDescription('Set a log channel')
      .addStringOption(o => o.setName('type').setDescription('Log type').setRequired(true)
        .addChoices(
          { name: 'Audit Log (Mod + Role + Avatar + Server)', value: 'audit' },
          { name: 'Join/Leave Log', value: 'join' },
          { name: 'Voice Log', value: 'vc' },
          { name: 'Message Log', value: 'message' }
        ))
      .addChannelOption(o => o.setName('channel').setDescription('Channel to use').setRequired(true)))
    .addSubcommand(s => s.setName('view').setDescription('View current log channel settings'))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  cooldown: 3,

  async execute(interaction, client) {
    await interaction.deferReply({ ephemeral: false });

    if (!(await Perm.check(interaction, 'admin'))) {
      return interaction.editReply(V2.reply(V2.error('Permission Denied', 'You need **Administrator** permission to use this command.', client)));
    }

    const sub  = interaction.options.getSubcommand();
    const data = await GuildModel.get(interaction.guild.id);

    if (sub === 'view') {
      const lc  = data.logChannels || {};
      const fmt = t => lc[t] ? `<#${lc[t]}>` : 'Not set';

      const container = new ContainerBuilder();
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent('## Log Channel Configuration'));
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent('> Current log channel settings for this server.\n> Use `/setup logs` to configure channels.'));
      container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));

      container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `> **Audit Log:** ${fmt('audit')}\n` +
        `> -# *Logs: Mod actions, Role changes, Avatar changes, Channel/Role events, Invite tracking, Security alerts*`
      ));
      container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `> **Join/Leave Log:** ${fmt('join')}\n` +
        `> -# *Logs: Member joins (with account age warning), Member leaves (with roles)*`
      ));
      container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `> **Voice Log:** ${fmt('vc')}\n` +
        `> -# *Logs: VC join, VC leave, VC switch*`
      ));
      container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `> **Message Log:** ${fmt('message')}\n` +
        `> -# *Logs: Message delete (with content), Message edit (before/after)*`
      ));
      container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent('-# GAMERZ WORKSHOP'));

      return interaction.editReply({ flags: MessageFlags.IsComponentsV2, components: [container] });
    }

    if (sub === 'logs') {
      const type    = interaction.options.getString('type');
      const channel = interaction.options.getChannel('channel');

      if (channel.type !== ChannelType.GuildText) {
        return interaction.editReply(V2.reply(V2.error('Invalid Channel', 'Please select a **text channel**.', client)));
      }

      if (!data.logChannels) data.logChannels = {};
      data.logChannels[type] = channel.id;

      await GuildModel.save(interaction.guild.id, data);

      const typeNames = {
        audit: 'Audit Log',
        join: 'Join/Leave Log',
        vc: 'Voice Log',
        message: 'Message Log',
      };

      return interaction.editReply(V2.reply(V2.success('Log Channel Set',
        `**${typeNames[type]}** has been set to ${channel}\n\nUse \`/setup view\` to see all settings.`, client)));
    }
  },
};
