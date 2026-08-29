const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  MessageFlags,
} = require('discord.js');
const V2 = require('../../utils/Embed');
const Perm = require('../../utils/Permissions');
const GuildModel = require('../../models/Guild');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('automod')
    .setDescription('Configure AutoMod protection modules')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  cooldown: 3,

  async execute(interaction, client) {
    if (!(await Perm.check(interaction, 'admin'))) return;

    const data = await GuildModel.get(interaction.guild.id);
    if (!data.automod) {
      data.automod = {
        antiSpam: { enabled: true, threshold: 7, interval: 5, action: 'timeout' },
        antiLinks: { enabled: false, threshold: 1, action: 'delete', allowedDomains: [] },
        antiMention: { enabled: true, threshold: 5, action: 'timeout', protectedRoles: [] },
      };
    }
    delete data.automod.antiRaid;
    delete data.automod.lockOnRaid;

    function getHomeContainer() {
      const am = data.automod;
      const status = enabled => (enabled ? '**Enabled**' : '**Disabled**');

      const container = new ContainerBuilder();
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent('## AutoMod Dashboard'));
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent('Select a protection module from the dropdown below to configure.'));
      container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));

      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `**Anti-Spam:** ${status(am.antiSpam?.enabled)}\n` +
          `**Anti-Links:** ${status(am.antiLinks?.enabled)}\n` +
          `**Anti-Mention:** ${status(am.antiMention?.enabled)}`
        )
      );

      container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent('-# GAMERZ WORKSHOP | Use select menu to navigate'));
      return container;
    }

    function getModuleContainer(module) {
      const am = data.automod;

      if (module === 'antispam') {
        const container = new ContainerBuilder();
        container.addTextDisplayComponents(new TextDisplayBuilder().setContent('## Anti-Spam'));
        container.addTextDisplayComponents(new TextDisplayBuilder().setContent('Detects rapid message flooding and triggers protective moderation actions.'));
        container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));

        container.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `**Status:** ${am.antiSpam.enabled ? '**Active**' : '**Inactive**'}\n` +
            `**Threshold:** \`${am.antiSpam.threshold} messages\` in \`${am.antiSpam.interval}s\`\n` +
            `**Action:** ${am.antiSpam.action === 'timeout' ? '**Timeout (1 min)**' : '**Delete messages**'}`
          )
        );

        container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
        container.addTextDisplayComponents(new TextDisplayBuilder().setContent('-# GAMERZ WORKSHOP | Use buttons below to toggle or configure'));
        return container;
      }

      if (module === 'antilinks') {
        const allowed = am.antiLinks.allowedDomains.length > 0
          ? am.antiLinks.allowedDomains.map(d => `\`${d}\``).join(', ')
          : 'None (all links allowed)';

        const container = new ContainerBuilder();
        container.addTextDisplayComponents(new TextDisplayBuilder().setContent('## Anti-Links'));
        container.addTextDisplayComponents(new TextDisplayBuilder().setContent('Blocks links to specific domains. All other domains remain allowed.'));
        container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));

        container.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `**Status:** ${am.antiLinks.enabled ? '**Active**' : '**Inactive**'}\n` +
            `**Threshold:** \`${am.antiLinks.threshold} blocked links\`\n` +
            `**Action:** ${am.antiLinks.action === 'timeout' ? '**Timeout (2 min)**' : '**Delete message**'}\n` +
            `**Blocked Domains:** ${allowed}`
          )
        );

        container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
        container.addTextDisplayComponents(new TextDisplayBuilder().setContent('-# GAMERZ WORKSHOP | Use buttons below to toggle or configure'));
        return container;
      }

      if (module === 'antimention') {
        const roles = am.antiMention.protectedRoles.length > 0
          ? am.antiMention.protectedRoles.map(r => `<@&${r}>`).join(', ')
          : 'None (all roles protected)';

        const container = new ContainerBuilder();
        container.addTextDisplayComponents(new TextDisplayBuilder().setContent('## Anti-Mention'));
        container.addTextDisplayComponents(new TextDisplayBuilder().setContent('Prevents mass mention spam and excessive role pings.'));
        container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));

        container.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `**Status:** ${am.antiMention.enabled ? '**Active**' : '**Inactive**'}\n` +
            `**Threshold:** \`${am.antiMention.threshold} mentions\`\n` +
            `**Action:** ${am.antiMention.action === 'timeout' ? '**Timeout (2 min)**' : '**Delete message**'}\n` +
            `**Protected Roles:** ${roles}`
          )
        );

        container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
        container.addTextDisplayComponents(new TextDisplayBuilder().setContent('-# GAMERZ WORKSHOP | Use buttons below to toggle or configure'));
        return container;
      }
    }

    function getSelectMenu() {
      return new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('automod_select')
          .setPlaceholder('Choose a module to configure...')
          .addOptions([
            { label: 'Home', description: 'Return to main dashboard', value: 'home' },
            { label: 'Anti-Spam', description: 'Message spam protection', value: 'antispam' },
            { label: 'Anti-Links', description: 'Blocked domain protection', value: 'antilinks' },
            { label: 'Anti-Mention', description: 'Mass mention protection', value: 'antimention' },
          ])
      );
    }

    function getModuleButtons(module) {
      const am = data.automod;
      const moduleMap = { antispam: 'antiSpam', antilinks: 'antiLinks', antimention: 'antiMention' };
      const dataKey = moduleMap[module] || module;
      const enabled = am[dataKey]?.enabled;

      return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`automod_toggle_${module}`)
          .setLabel(enabled ? 'Disable Module' : 'Enable Module')
          .setStyle(enabled ? ButtonStyle.Danger : ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId(`automod_config_${module}`)
          .setLabel('Configure Settings')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(!enabled),
        new ButtonBuilder()
          .setCustomId('automod_home')
          .setLabel('Back to Home')
          .setStyle(ButtonStyle.Secondary)
      );
    }

    await interaction.reply({
      flags: MessageFlags.IsComponentsV2,
      components: [getHomeContainer(), getSelectMenu()],
    });

    const collector = interaction.channel.createMessageComponentCollector({
      filter: i => i.user.id === interaction.user.id && i.customId.startsWith('automod_'),
      time: 300000,
    });

    collector.on('collect', async i => {
      try {
        if (i.customId === 'automod_select') {
          await i.deferUpdate();
          const selected = i.values[0];
          if (selected === 'home') {
            await interaction.editReply({
              flags: MessageFlags.IsComponentsV2,
              components: [getHomeContainer(), getSelectMenu()],
            });
          } else {
            await interaction.editReply({
              flags: MessageFlags.IsComponentsV2,
              components: [getModuleContainer(selected), getModuleButtons(selected), getSelectMenu()],
            });
          }
          return;
        }

        if (i.customId.startsWith('automod_toggle_')) {
          await i.deferUpdate();
          const module = i.customId.replace('automod_toggle_', '');
          const moduleMap = { antispam: 'antiSpam', antilinks: 'antiLinks', antimention: 'antiMention' };
          const dataKey = moduleMap[module] || module;
          data.automod[dataKey].enabled = !data.automod[dataKey].enabled;
          await GuildModel.save(interaction.guild.id, data);

          const freshData = await GuildModel.get(interaction.guild.id);
          data.automod = freshData.automod;

          await interaction.editReply({
            flags: MessageFlags.IsComponentsV2,
            components: [getModuleContainer(module), getModuleButtons(module), getSelectMenu()],
          });
          return;
        }

        if (i.customId === 'automod_home') {
          await i.deferUpdate();
          await interaction.editReply({
            flags: MessageFlags.IsComponentsV2,
            components: [getHomeContainer(), getSelectMenu()],
          });
          return;
        }

        if (i.customId.startsWith('automod_config_')) {
          const module = i.customId.replace('automod_config_', '');

          if (module === 'antispam') {
            const modal = new ModalBuilder()
              .setCustomId('automod_modal_antispam')
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

            try {
              const modalSubmit = await i.awaitModalSubmit({
                time: 120000,
                filter: m => m.customId === 'automod_modal_antispam' && m.user.id === interaction.user.id,
              });

              const threshold = parseInt(modalSubmit.fields.getTextInputValue('threshold'));
              const interval = parseInt(modalSubmit.fields.getTextInputValue('interval'));
              const action = modalSubmit.fields.getTextInputValue('action').toLowerCase();

              if (threshold < 1 || threshold > 20 || interval < 1 || interval > 60 || !['timeout', 'delete'].includes(action)) {
                return modalSubmit.reply({
                  ...V2.reply(V2.error('Invalid Input', 'Threshold: 1-20, Interval: 1-60s, Action: timeout/delete', client)),
                  ephemeral: true,
                });
              }

              data.automod.antiSpam.threshold = threshold;
              data.automod.antiSpam.interval = interval;
              data.automod.antiSpam.action = action;
              await GuildModel.save(interaction.guild.id, data);

              await modalSubmit.reply({
                ...V2.reply(V2.success('Settings Saved', `Anti-Spam: ${threshold} messages in ${interval}s → ${action}`, client)),
                ephemeral: true,
              });

              const freshData = await GuildModel.get(interaction.guild.id);
              data.automod = freshData.automod;
              await interaction.editReply({
                flags: MessageFlags.IsComponentsV2,
                components: [getModuleContainer('antispam'), getModuleButtons('antispam'), getSelectMenu()],
              });
            } catch (err) {
              console.log('[AUTOMOD] Modal timeout or error:', err.message);
            }
            return;
          } else if (module === 'antilinks') {
            const modal = new ModalBuilder()
              .setCustomId('automod_modal_antilinks')
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

            try {
              const modalSubmit = await i.awaitModalSubmit({
                time: 120000,
                filter: m => m.customId === 'automod_modal_antilinks' && m.user.id === interaction.user.id,
              });

              const threshold = parseInt(modalSubmit.fields.getTextInputValue('threshold'));
              const action = modalSubmit.fields.getTextInputValue('action').toLowerCase();
              const domainsRaw = modalSubmit.fields.getTextInputValue('domains');
              const domains = domainsRaw ? domainsRaw.split(',').map(d => d.trim()).filter(Boolean) : [];

              if (threshold < 1 || threshold > 10 || !['timeout', 'delete'].includes(action)) {
                return modalSubmit.reply({
                  ...V2.reply(V2.error('Invalid Input', 'Threshold: 1-10, Action: timeout/delete', client)),
                  ephemeral: true,
                });
              }

              data.automod.antiLinks.threshold = threshold;
              data.automod.antiLinks.action = action;
              data.automod.antiLinks.allowedDomains = domains;
              await GuildModel.save(interaction.guild.id, data);

              await modalSubmit.reply({
                ...V2.reply(V2.success('Settings Saved', `Anti-Links: ${threshold} blocked links → ${action}\nBlocked: ${domains.length} domains`, client)),
                ephemeral: true,
              });

              const freshData = await GuildModel.get(interaction.guild.id);
              data.automod = freshData.automod;
              await interaction.editReply({
                flags: MessageFlags.IsComponentsV2,
                components: [getModuleContainer('antilinks'), getModuleButtons('antilinks'), getSelectMenu()],
              });
            } catch (err) {
              console.log('[AUTOMOD] Modal timeout or error:', err.message);
            }
            return;
          } else if (module === 'antimention') {
            const modal = new ModalBuilder()
              .setCustomId('automod_modal_antimention')
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

            try {
              const modalSubmit = await i.awaitModalSubmit({
                time: 120000,
                filter: m => m.customId === 'automod_modal_antimention' && m.user.id === interaction.user.id,
              });

              const threshold = parseInt(modalSubmit.fields.getTextInputValue('threshold'));
              const action = modalSubmit.fields.getTextInputValue('action').toLowerCase();
              const rolesRaw = modalSubmit.fields.getTextInputValue('roles');
              const roles = rolesRaw ? rolesRaw.split(',').map(r => r.trim()).filter(Boolean) : [];

              if (threshold < 1 || threshold > 20 || !['timeout', 'delete'].includes(action)) {
                return modalSubmit.reply({
                  ...V2.reply(V2.error('Invalid Input', 'Threshold: 1-20, Action: timeout/delete', client)),
                  ephemeral: true,
                });
              }

              data.automod.antiMention.threshold = threshold;
              data.automod.antiMention.action = action;
              data.automod.antiMention.protectedRoles = roles;
              await GuildModel.save(interaction.guild.id, data);

              await modalSubmit.reply({
                ...V2.reply(V2.success('Settings Saved', `Anti-Mention: ${threshold} mentions → ${action}\nProtected: ${roles.length || 'All'} roles`, client)),
                ephemeral: true,
              });

              const freshData = await GuildModel.get(interaction.guild.id);
              data.automod = freshData.automod;
              await interaction.editReply({
                flags: MessageFlags.IsComponentsV2,
                components: [getModuleContainer('antimention'), getModuleButtons('antimention'), getSelectMenu()],
              });
            } catch (err) {
              console.log('[AUTOMOD] Modal timeout or error:', err.message);
            }
            return;
          } else {
            await i.reply({
              ...V2.reply(V2.info('Configuration', `${module} has no additional settings to configure.`, client)),
              ephemeral: true,
            });
            return;
          }
        }
      } catch (e) {
        console.error('[AUTOMOD] Error:', e.message);
      }
    });

    collector.on('end', () => {
      interaction.editReply({ components: [] }).catch(() => {});
    });
  },
};
