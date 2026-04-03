const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const Embed = require('../../utils/Embed');
const Perm = require('../../utils/Permissions');
const GuildModel = require('../../models/Guild');
const { COLORS } = require('../../config/config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('automod')
    .setDescription('Configure AutoMod protection modules')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  cooldown: 3,

  async execute(interaction, client){
    if(!(await Perm.check(interaction, 'admin'))) return;
    
    const data = await GuildModel.get(interaction.guild.id);
    if(!data.automod) data.automod = {
      antiSpam: { enabled: true, threshold: 7, interval: 5, action: 'timeout' },
      antiLinks: { enabled: false, threshold: 1, action: 'delete', allowedDomains: [] },
      antiMention: { enabled: true, threshold: 5, action: 'timeout', protectedRoles: [] },
    };
    // Remove old keys if present
    delete data.automod.antiRaid;
    delete data.automod.lockOnRaid;

    function getHomeEmbed(){
      const am = data.automod;
      const status = (enabled) => enabled ? '🟢 Enabled' : '🔴 Disabled';
      
      return new EmbedBuilder()
        .setColor(COLORS.SECURITY)
        .setTitle('🛡️ GAMERZ WORKSHOP | AutoMod Dashboard')
        .setDescription('**Welcome to AutoMod**\n\nSelect a protection module from the dropdown below to configure.')
        .addFields(
          {name: '💬 Anti-Spam',    value: status(am.antiSpam?.enabled),    inline: true},
          {name: '🔗 Anti-Links',   value: status(am.antiLinks?.enabled),   inline: true},
          {name: '📢 Anti-Mention', value: status(am.antiMention?.enabled), inline: true},
        )
        .setFooter({text: 'Use the select menu below to navigate'})
        .setTimestamp();
    }

    function getModuleEmbed(module){
      const am = data.automod;
      
      if(module === 'antispam'){
        return new EmbedBuilder()
          .setColor(am.antiSpam.enabled ? COLORS.SUCCESS : COLORS.ERROR)
          .setTitle('💬 GAMERZ WORKSHOP | ANTI-SPAM')
          .setDescription('**Anti-Spam Configuration**\n\nDetects rapid message spam and takes action.')
          .addFields(
            {name: 'Status', value: am.antiSpam.enabled ? '🟢 Active' : '🔴 Inactive', inline: true},
            {name: 'Threshold', value: `${am.antiSpam.threshold} messages in ${am.antiSpam.interval}s`, inline: true},
            {name: 'Action', value: am.antiSpam.action === 'timeout' ? '⏱️ Timeout (1 min)' : '🗑️ Delete messages', inline: true},
          )
          .setFooter({text: '🎮 GAMERZ WORKSHOP | Use buttons to configure'})
          .setTimestamp();
      }

      if(module === 'antilinks'){
        const allowed = am.antiLinks.allowedDomains.length > 0 
          ? am.antiLinks.allowedDomains.map(d => `\`${d}\``).join(', ')
          : 'None (all links allowed)';
        return new EmbedBuilder()
          .setColor(am.antiLinks.enabled ? COLORS.SUCCESS : COLORS.ERROR)
          .setTitle('🔗 GAMERZ WORKSHOP | ANTI-LINKS')
          .setDescription('**Anti-Link Configuration**\n\nBlocks specific domains. All other links are allowed.')
          .addFields(
            {name: 'Status', value: am.antiLinks.enabled ? '🟢 Active' : '🔴 Inactive', inline: true},
            {name: 'Threshold', value: `${am.antiLinks.threshold} blocked links`, inline: true},
            {name: 'Action', value: am.antiLinks.action === 'timeout' ? '⏱️ Timeout (2 min)' : '🗑️ Delete message', inline: true},
            {name: 'Blocked Domains', value: allowed, inline: false},
          )
          .setFooter({text: '🎮 GAMERZ WORKSHOP | Use buttons to configure'})
          .setTimestamp();
      }

      if(module === 'antimention'){
        const roles = am.antiMention.protectedRoles.length > 0
          ? am.antiMention.protectedRoles.map(r => `<@&${r}>`).join(', ')
          : 'None (all roles protected)';
        return new EmbedBuilder()
          .setColor(am.antiMention.enabled ? COLORS.SUCCESS : COLORS.ERROR)
          .setTitle('📢 GAMERZ WORKSHOP | ANTI-MENTION')
          .setDescription('**Anti-Mention Configuration**\n\nPrevents mass mention spam.')
          .addFields(
            {name: 'Status', value: am.antiMention.enabled ? '🟢 Active' : '🔴 Inactive', inline: true},
            {name: 'Threshold', value: `${am.antiMention.threshold} mentions`, inline: true},
            {name: 'Action', value: am.antiMention.action === 'timeout' ? '⏱️ Timeout (2 min)' : '🗑️ Delete message', inline: true},
            {name: 'Protected Roles', value: roles, inline: false},
          )
          .setFooter({text: '🎮 GAMERZ WORKSHOP | Use buttons to configure'})
          .setTimestamp();
      }
    }

    function getSelectMenu(){
      return new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('automod_select')
          .setPlaceholder('Choose a module to configure...')
          .addOptions([
            {label: 'Home',         description: 'Return to main dashboard',   value: 'home',        emoji: '🏠'},
            {label: 'Anti-Spam',    description: 'Message spam protection',    value: 'antispam',    emoji: '💬'},
            {label: 'Anti-Links',   description: 'Blocked domain protection',  value: 'antilinks',   emoji: '🔗'},
            {label: 'Anti-Mention', description: 'Mass mention protection',    value: 'antimention', emoji: '📢'},
          ])
      );
    }

    function getModuleButtons(module){
      const am = data.automod;
      
      const moduleMap = {
        'antispam':    'antiSpam',
        'antilinks':   'antiLinks',
        'antimention': 'antiMention',
      };
      
      const dataKey = moduleMap[module] || module;
      const enabled = am[dataKey]?.enabled;
      
      return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`automod_toggle_${module}`)
          .setLabel(enabled ? 'Disable Module' : 'Enable Module')
          .setStyle(enabled ? ButtonStyle.Danger : ButtonStyle.Success)
          .setEmoji(enabled ? '🔴' : '🟢'),
        new ButtonBuilder()
          .setCustomId(`automod_config_${module}`)
          .setLabel('Configure Settings')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('⚙️')
          .setDisabled(!enabled),
        new ButtonBuilder()
          .setCustomId('automod_home')
          .setLabel('Back to Home')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('🏠'),
      );
    }

    await interaction.reply({
      embeds: [getHomeEmbed()],
      components: [getSelectMenu()],
    });

    const collector = interaction.channel.createMessageComponentCollector({
      filter: i => i.user.id === interaction.user.id && i.customId.startsWith('automod_'),
      time: 300000,
    });

    collector.on('collect', async i => {
      try {
        // Handle select menu
        if(i.customId === 'automod_select'){
          await i.deferUpdate();
          const selected = i.values[0];
          if(selected === 'home'){
            await interaction.editReply({
              embeds: [getHomeEmbed()],
              components: [getSelectMenu()],
            });
          } else {
            await interaction.editReply({
              embeds: [getModuleEmbed(selected)],
              components: [getModuleButtons(selected), getSelectMenu()],
            });
          }
          return;
        }

        // Handle toggle button
        if(i.customId.startsWith('automod_toggle_')){
          await i.deferUpdate();
          const module = i.customId.replace('automod_toggle_', '');
          
          // Map display names to data keys
      const moduleMap = {
        'antispam':    'antiSpam',
        'antilinks':   'antiLinks',
        'antimention': 'antiMention',
      };
          
          const dataKey = moduleMap[module] || module;
          data.automod[dataKey].enabled = !data.automod[dataKey].enabled;
          await GuildModel.save(interaction.guild.id, data);
          
          // Reload data to get fresh state
          const freshData = await GuildModel.get(interaction.guild.id);
          data.automod = freshData.automod;
          
          await interaction.editReply({
            embeds: [getModuleEmbed(module)],
            components: [getModuleButtons(module), getSelectMenu()],
          });
          return;
        }

        // Handle home button
        if(i.customId === 'automod_home'){
          await i.deferUpdate();
          await interaction.editReply({
            embeds: [getHomeEmbed()],
            components: [getSelectMenu()],
          });
          return;
        }

        // Handle config button - show modal (no deferUpdate for modals)
        if(i.customId.startsWith('automod_config_')){
          const module = i.customId.replace('automod_config_', '');
          
          if(module === 'antispam'){
            const { ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
            const modal = new ModalBuilder()
              .setCustomId(`automod_modal_antispam`)
              .setTitle('Anti-Spam Configuration');
            
            const thresholdInput = new TextInputBuilder()
              .setCustomId('threshold')
              .setLabel('Message Threshold (1-20)')
              .setStyle(TextInputStyle.Short)
              .setPlaceholder('7')
              .setValue(String(data.automod.antiSpam.threshold))
              .setRequired(true);
            
            const intervalInput = new TextInputBuilder()
              .setCustomId('interval')
              .setLabel('Time Interval (seconds, 1-60)')
              .setStyle(TextInputStyle.Short)
              .setPlaceholder('5')
              .setValue(String(data.automod.antiSpam.interval))
              .setRequired(true);
            
            const actionInput = new TextInputBuilder()
              .setCustomId('action')
              .setLabel('Action (timeout or delete)')
              .setStyle(TextInputStyle.Short)
              .setPlaceholder('timeout')
              .setValue(data.automod.antiSpam.action)
              .setRequired(true);
            
            modal.addComponents(
              new ActionRowBuilder().addComponents(thresholdInput),
              new ActionRowBuilder().addComponents(intervalInput),
              new ActionRowBuilder().addComponents(actionInput)
            );
            
            await i.showModal(modal);
            
            // Wait for modal submit
            try {
              const modalSubmit = await i.awaitModalSubmit({ time: 120000, filter: m => m.customId === 'automod_modal_antispam' && m.user.id === interaction.user.id });
              
              const threshold = parseInt(modalSubmit.fields.getTextInputValue('threshold'));
              const interval = parseInt(modalSubmit.fields.getTextInputValue('interval'));
              const action = modalSubmit.fields.getTextInputValue('action').toLowerCase();

              if(threshold < 1 || threshold > 20 || interval < 1 || interval > 60 || !['timeout', 'delete'].includes(action)){
                return modalSubmit.reply({embeds: [Embed.error('Invalid Input', 'Threshold: 1-20, Interval: 1-60s, Action: timeout/delete', client)], ephemeral: true});
              }

              data.automod.antiSpam.threshold = threshold;
              data.automod.antiSpam.interval = interval;
              data.automod.antiSpam.action = action;
              await GuildModel.save(interaction.guild.id, data);

              await modalSubmit.reply({embeds: [Embed.success('Settings Saved', `Anti-Spam: ${threshold} messages in ${interval}s → ${action}`, client)], ephemeral: true});
              
              const freshData = await GuildModel.get(interaction.guild.id);
              data.automod = freshData.automod;
              await interaction.editReply({
                embeds: [getModuleEmbed('antispam')],
                components: [getModuleButtons('antispam'), getSelectMenu()],
              });
            } catch(err) {
              console.log('[AUTOMOD] Modal timeout or error:', err.message);
            }
            return;
          } else if(module === 'antilinks'){
            const { ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
            const modal = new ModalBuilder()
              .setCustomId(`automod_modal_antilinks`)
              .setTitle('Anti-Links Configuration');
            
            const thresholdInput = new TextInputBuilder()
              .setCustomId('threshold')
              .setLabel('Link Threshold (1-10)')
              .setStyle(TextInputStyle.Short)
              .setPlaceholder('3')
              .setValue(String(data.automod.antiLinks.threshold))
              .setRequired(true);
            
            const actionInput = new TextInputBuilder()
              .setCustomId('action')
              .setLabel('Action (timeout or delete)')
              .setStyle(TextInputStyle.Short)
              .setPlaceholder('delete')
              .setValue(data.automod.antiLinks.action)
              .setRequired(true);
            
            const domainsInput = new TextInputBuilder()
              .setCustomId('domains')
              .setLabel('Blocked Domains (comma separated)')
              .setStyle(TextInputStyle.Paragraph)
              .setPlaceholder('youtube.com, discord.gg, tiktok.com')
              .setValue(data.automod.antiLinks.allowedDomains.join(', '))
              .setRequired(false);
            
            modal.addComponents(
              new ActionRowBuilder().addComponents(thresholdInput),
              new ActionRowBuilder().addComponents(actionInput),
              new ActionRowBuilder().addComponents(domainsInput)
            );
            
            await i.showModal(modal);
            
            // Wait for modal submit
            try {
              const modalSubmit = await i.awaitModalSubmit({ time: 120000, filter: m => m.customId === 'automod_modal_antilinks' && m.user.id === interaction.user.id });
              
              const threshold = parseInt(modalSubmit.fields.getTextInputValue('threshold'));
              const action = modalSubmit.fields.getTextInputValue('action').toLowerCase();
              const domainsRaw = modalSubmit.fields.getTextInputValue('domains');
              const domains = domainsRaw ? domainsRaw.split(',').map(d => d.trim()).filter(Boolean) : [];

              if(threshold < 1 || threshold > 10 || !['timeout', 'delete'].includes(action)){
                return modalSubmit.reply({embeds: [Embed.error('Invalid Input', 'Threshold: 1-10, Action: timeout/delete', client)], ephemeral: true});
              }

              data.automod.antiLinks.threshold = threshold;
              data.automod.antiLinks.action = action;
              data.automod.antiLinks.allowedDomains = domains;
              await GuildModel.save(interaction.guild.id, data);

              await modalSubmit.reply({embeds: [Embed.success('Settings Saved', `Anti-Links: ${threshold} blocked links → ${action}\nBlocked: ${domains.length} domains`, client)], ephemeral: true});
              
              const freshData = await GuildModel.get(interaction.guild.id);
              data.automod = freshData.automod;
              await interaction.editReply({
                embeds: [getModuleEmbed('antilinks')],
                components: [getModuleButtons('antilinks'), getSelectMenu()],
              });
            } catch(err) {
              console.log('[AUTOMOD] Modal timeout or error:', err.message);
            }
            return;
          } else if(module === 'antimention'){
            const { ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
            const modal = new ModalBuilder()
              .setCustomId(`automod_modal_antimention`)
              .setTitle('Anti-Mention Configuration');
            
            const thresholdInput = new TextInputBuilder()
              .setCustomId('threshold')
              .setLabel('Mention Threshold (1-20)')
              .setStyle(TextInputStyle.Short)
              .setPlaceholder('5')
              .setValue(String(data.automod.antiMention.threshold))
              .setRequired(true);
            
            const actionInput = new TextInputBuilder()
              .setCustomId('action')
              .setLabel('Action (timeout or delete)')
              .setStyle(TextInputStyle.Short)
              .setPlaceholder('timeout')
              .setValue(data.automod.antiMention.action)
              .setRequired(true);
            
            const rolesInput = new TextInputBuilder()
              .setCustomId('roles')
              .setLabel('Protected Role IDs (comma separated)')
              .setStyle(TextInputStyle.Paragraph)
              .setPlaceholder('Leave empty to protect all roles')
              .setValue(data.automod.antiMention.protectedRoles.join(', '))
              .setRequired(false);
            
            modal.addComponents(
              new ActionRowBuilder().addComponents(thresholdInput),
              new ActionRowBuilder().addComponents(actionInput),
              new ActionRowBuilder().addComponents(rolesInput)
            );
            
            await i.showModal(modal);
            
            // Wait for modal submit
            try {
              const modalSubmit = await i.awaitModalSubmit({ time: 120000, filter: m => m.customId === 'automod_modal_antimention' && m.user.id === interaction.user.id });
              
              const threshold = parseInt(modalSubmit.fields.getTextInputValue('threshold'));
              const action = modalSubmit.fields.getTextInputValue('action').toLowerCase();
              const rolesRaw = modalSubmit.fields.getTextInputValue('roles');
              const roles = rolesRaw ? rolesRaw.split(',').map(r => r.trim()).filter(Boolean) : [];

              if(threshold < 1 || threshold > 20 || !['timeout', 'delete'].includes(action)){
                return modalSubmit.reply({embeds: [Embed.error('Invalid Input', 'Threshold: 1-20, Action: timeout/delete', client)], ephemeral: true});
              }

              data.automod.antiMention.threshold = threshold;
              data.automod.antiMention.action = action;
              data.automod.antiMention.protectedRoles = roles;
              await GuildModel.save(interaction.guild.id, data);

              await modalSubmit.reply({embeds: [Embed.success('Settings Saved', `Anti-Mention: ${threshold} mentions → ${action}\nProtected: ${roles.length || 'All'} roles`, client)], ephemeral: true});
              
              const freshData = await GuildModel.get(interaction.guild.id);
              data.automod = freshData.automod;
              await interaction.editReply({
                embeds: [getModuleEmbed('antimention')],
                components: [getModuleButtons('antimention'), getSelectMenu()],
              });
            } catch(err) {
              console.log('[AUTOMOD] Modal timeout or error:', err.message);
            }
            return;
          } else {
            await i.reply({
              embeds: [Embed.info('Configuration', `${module} has no additional settings to configure.`, client)],
              ephemeral: true,
            });
            return;
          }
        }

      } catch(e){
        console.error('[AUTOMOD] Error:', e.message);
      }
    });

    collector.on('end', () => {
      interaction.editReply({ components: [] }).catch(() => {});
    });
  },
};
