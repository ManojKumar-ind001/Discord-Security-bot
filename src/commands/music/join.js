const { SlashCommandBuilder } = require('discord.js');
const V2 = require('../../utils/Embed');

module.exports = {
  data: new SlashCommandBuilder().setName('join').setDescription('Summon the bot to your voice channel'),
  cooldown: 3,
  async execute(interaction, client) {
    const voiceChannel = interaction.member.voice?.channel;
    if (!voiceChannel) {
      return interaction.reply({
        ...V2.reply(V2.error('Voice Required', 'You must be in a voice channel to use this command.', client)),
        ephemeral: true,
      });
    }

    try {
      await client.musicManager.getOrCreatePlayer(interaction);
      return interaction.reply(
        V2.reply(V2.success('Connected', `Connected to <#${voiceChannel.id}>.`, client))
      );
    } catch (err) {
      return interaction.reply({
        ...V2.reply(V2.error('Join Error', err.message, client)),
        ephemeral: true,
      });
    }
  },
};
