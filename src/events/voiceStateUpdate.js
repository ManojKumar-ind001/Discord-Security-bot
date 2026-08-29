const { Events } = require('discord.js');
const Logger = require('../utils/Logger');

module.exports = {
  name: Events.VoiceStateUpdate,
  async execute(oldState, newState, client) {
    const guild = newState.guild || oldState.guild;
    if (!guild) return;

    let member = newState.member || oldState.member;
    if (!member) {
      member = await guild.members.fetch(newState.id || oldState.id).catch(() => null);
    }
    if (!member) return;

    const oldChannel = oldState.channel;
    const newChannel = newState.channel;

    if (!oldChannel && newChannel) {
      await Logger.vcJoined(guild, member, newChannel);
    } else if (oldChannel && !newChannel) {
      await Logger.vcLeft(guild, member, oldChannel);
    } else if (oldChannel && newChannel && oldChannel.id !== newChannel.id) {
      await Logger.vcMoved(guild, member, oldChannel, newChannel);
    }
  },
};
