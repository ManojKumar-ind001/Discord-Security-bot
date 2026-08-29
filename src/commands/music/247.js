const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const V2 = require('../../utils/Embed');
const Perm = require('../../utils/Permissions');
const GuildModel = require('../../models/Guild');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('247')
    .setDescription('Toggle 24/7 voice channel mode (keeps the bot in the voice channel indefinitely)')
    .addBooleanOption(o =>
      o.setName('enabled')
        .setDescription('Enable or disable 24/7 mode')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  cooldown: 3,

  async execute(interaction, client) {
    if (!(await Perm.check(interaction, 'admin'))) return;

    const guildId = interaction.guild.id;
    const guildData = await GuildModel.get(guildId);
    if (!guildData.music) guildData.music = {};

    const explicitEnabled = interaction.options.getBoolean('enabled');
    const current247 = guildData.music.twentyFourSeven || false;
    const newState = explicitEnabled !== null ? explicitEnabled : !current247;

    guildData.music.twentyFourSeven = newState;
    await GuildModel.save(guildId, guildData);

    const player = client.musicManager?.kazagumo?.players?.get(guildId);
    if (player) {
      player.data.set('247', newState);
    }

    return interaction.reply(
      V2.reply(
        V2.success(
          '24/7 Mode Updated',
          `24/7 Mode is now **${newState ? 'Enabled' : 'Disabled'}**.\n${newState ? '> *The bot will remain connected in the voice channel even when idle or empty.*' : '> *The bot will leave voice automatically when idle.*'}`,
          client
        )
      )
    );
  },
};
