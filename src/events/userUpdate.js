const { Events } = require('discord.js');
const Logger = require('../utils/Logger');

module.exports = {
  name: Events.UserUpdate,
  async execute(oldUser, newUser, client) {
    // Avatar change detection
    const oldAvatar = oldUser.avatar;
    const newAvatar = newUser.avatar;

    if (oldAvatar !== newAvatar) {
      const oldURL = oldAvatar
        ? `https://cdn.discordapp.com/avatars/${oldUser.id}/${oldAvatar}.${oldAvatar.startsWith('a_') ? 'gif' : 'png'}?size=512`
        : oldUser.defaultAvatarURL;
      const newURL = newUser.displayAvatarURL({ forceStatic: false, size: 512 });

      for (const [, guild] of client.guilds.cache) {
        if (guild.members.cache.has(newUser.id)) {
          await Logger.avatarChanged(guild, newUser, oldURL, newURL);
        }
      }
    }

    // Username / discriminator change detection
    const usernameChanged = oldUser.username !== newUser.username;
    const discriminatorChanged = oldUser.discriminator !== newUser.discriminator;

    if (usernameChanged || discriminatorChanged) {
      for (const [, guild] of client.guilds.cache) {
        if (guild.members.cache.has(newUser.id)) {
          await Logger.usernameChanged(guild, oldUser, newUser);
        }
      }
    }
  },
};
