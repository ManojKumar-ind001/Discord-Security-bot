const { SlashCommandBuilder, PermissionFlagsBits, ActivityType } = require('discord.js');
const Embed = require('../../utils/Embed');
const Perm = require('../../utils/Permissions');
const BotConfig = require('../../models/BotConfig');

const TYPE_MAP = {
  playing:   { type: ActivityType.Playing,   label: 'Playing',   emoji: '🎮' },
  watching:  { type: ActivityType.Watching,  label: 'Watching',  emoji: '📺' },
  listening: { type: ActivityType.Listening, label: 'Listening', emoji: '🎵' },
  streaming: { type: ActivityType.Streaming, label: 'Streaming', emoji: '📡' },
  custom:    { type: ActivityType.Custom,    label: 'Custom',    emoji: '✨' },
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('activity')
    .setDescription('Set the bot activity/status')
    .addStringOption(o => o.setName('type').setDescription('Activity type').setRequired(true)
      .addChoices(
        { name: '🎮 Playing',   value: 'playing'   },
        { name: '📺 Watching',  value: 'watching'  },
        { name: '🎵 Listening', value: 'listening' },
        { name: '📡 Streaming', value: 'streaming' },
        { name: '✨ Custom',    value: 'custom'    },
      ))
    .addStringOption(o => o.setName('message').setDescription('Activity message').setRequired(true))
    .addStringOption(o => o.setName('status').setDescription('Bot status').setRequired(false)
      .addChoices(
        { name: '🔴 Do Not Disturb', value: 'dnd'    },
        { name: '🟢 Online',         value: 'online' },
        { name: '🟡 Idle',           value: 'idle'   },
      ))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  cooldown: 5,
  async execute(interaction, client) {
    if (!(await Perm.check(interaction, 'admin'))) return;

    const type    = interaction.options.getString('type');
    const msg     = interaction.options.getString('message');
    const status  = interaction.options.getString('status') || 'dnd';
    const act     = TYPE_MAP[type];

    const activityOptions = { name: msg, type: act.type };
    // Streaming requires a url
    if (type === 'streaming') activityOptions.url = 'https://www.twitch.tv/gamerz_workshop';

    client.user.setPresence({ activities: [activityOptions], status });

    // Save to config so it persists on restart
    BotConfig.setActivity(type, msg, status);

    const statusLabel = { dnd: '🔴 Do Not Disturb', online: '🟢 Online', idle: '🟡 Idle' }[status];

    await interaction.reply({
      embeds: [Embed.success(
        'Activity Updated',
        `**Type:** ${act.emoji} ${act.label}\n**Message:** ${msg}\n**Status:** ${statusLabel}`,
        client
      )],
      ephemeral: true
    });
  },
};
