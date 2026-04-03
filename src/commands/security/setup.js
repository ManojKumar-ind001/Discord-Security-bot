const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ChannelType } = require('discord.js');
const Embed = require('../../utils/Embed');
const Perm = require('../../utils/Permissions');
const GuildModel = require('../../models/Guild');
const { COLORS } = require('../../config/config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Setup bot log channels')
    .addSubcommand(s => s.setName('logs').setDescription('Set a log channel')
      .addStringOption(o => o.setName('type').setDescription('Log type').setRequired(true)
        .addChoices(
          {name: '📊 Audit Log (Mod + Role + Avatar + Server)', value: 'audit'},
          {name: '📥 Join/Leave Log', value: 'join'},
          {name: '🔊 Voice Log', value: 'vc'},
          {name: '💬 Message Log', value: 'message'}
        ))
      .addChannelOption(o => o.setName('channel').setDescription('Channel to use').setRequired(true)))
    .addSubcommand(s => s.setName('view').setDescription('View current log channel settings'))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  cooldown: 3,

  async execute(interaction, client){
    // Defer reply immediately to prevent timeout
    await interaction.deferReply({ ephemeral: false });
    
    if(!(await Perm.check(interaction, 'admin'))) {
      return interaction.editReply({
        embeds: [Embed.error('Permission Denied', 'You need Administrator permission to use this command.', client)]
      });
    }
    
    const sub = interaction.options.getSubcommand();
    const data = await GuildModel.get(interaction.guild.id);

    if(sub === 'view'){
      const lc = data.logChannels || {};
      const fmt = t => lc[t] ? `<#${lc[t]}>` : '❌ Not set';
      
      const e = new EmbedBuilder()
        .setColor(COLORS.PRIMARY)
        .setTitle('📋 Log Channel Configuration')
        .setDescription('Current log channel settings for this server.\n\nUse `/setup logs` to configure channels.')
        .addFields(
          {
            name: '📊 Audit Log',
            value: fmt('audit') + '\n*Logs: Mod actions, Role changes, Avatar changes, Channel/Role create/delete/update, Invite tracking, Security alerts*',
            inline: false
          },
          {
            name: '� Join/Leave Log',
            value: fmt('join') + '\n*Logs: Member joins (with account age warning), Member leaves (with roles)*',
            inline: false
          },
          {
            name: '� Voice Log',
            value: fmt('vc') + '\n*Logs: VC join, VC leave, VC switch*',
            inline: false
          },
          {
            name: '💬 Message Log',
            value: fmt('message') + '\n*Logs: Message delete (with content), Message edit (before/after)*',
            inline: false
          },
        )
        .setFooter({text: '🎮 GAMERZ WORKSHOP'})
        .setTimestamp();
      
      return interaction.editReply({embeds: [e]});
    }

    // Set log channel
    if(sub === 'logs'){
      const type = interaction.options.getString('type');
      const channel = interaction.options.getChannel('channel');

      if(channel.type !== ChannelType.GuildText){
        return interaction.editReply({
          embeds: [Embed.error('Invalid Channel', 'Please select a text channel.', client)]
        });
      }

      // Save
      if(!data.logChannels) data.logChannels = {};
      data.logChannels[type] = channel.id;
      
      console.log('[SETUP] Before save:', JSON.stringify(data.logChannels));
      await GuildModel.save(interaction.guild.id, data);
      console.log('[SETUP] After save');

      const typeNames = {
        audit: '📊 Audit Log',
        join: '📥 Join/Leave Log',
        vc: '🔊 Voice Log',
        message: '💬 Message Log'
      };

      return interaction.editReply({
        embeds: [Embed.success(
          'Log Channel Set',
          `**${typeNames[type]}** has been set to ${channel}\n\nUse \`/setup view\` to see all settings.`,
          client
        )]
      });
    }
  },
};
