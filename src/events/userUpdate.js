const { Events } = require('discord.js');
const Logger = require('../utils/Logger');

module.exports = {
  name: Events.UserUpdate,
  async execute(oldUser, newUser, client){
    console.log('[USER UPDATE] Event triggered for:', newUser.tag);
    
    // Avatar change detection
    const oldAvatar = oldUser.avatar;
    const newAvatar = newUser.avatar;
    
    if(oldAvatar !== newAvatar){
      console.log('[AVATAR] Change detected:', {
        user: newUser.tag,
        oldAvatar: oldAvatar,
        newAvatar: newAvatar
      });
      
      const oldURL = oldAvatar
        ? `https://cdn.discordapp.com/avatars/${oldUser.id}/${oldAvatar}.${oldAvatar.startsWith('a_') ? 'gif' : 'png'}?size=512`
        : oldUser.defaultAvatarURL;
      const newURL = newUser.displayAvatarURL({ dynamic: true, size: 512 });
      
      // Log to all guilds where this user is a member
      for(const [guildId, guild] of client.guilds.cache){
        if(guild.members.cache.has(newUser.id)){
          await Logger.avatarChanged(guild, newUser, oldURL, newURL);
        }
      }
    }
    
    // Username change detection
    if(oldUser.username !== newUser.username){
      console.log('[USERNAME] Change detected:', {
        old: oldUser.username,
        new: newUser.username
      });
      
      // Log to all guilds where this user is a member
      for(const [guildId, guild] of client.guilds.cache){
        if(guild.members.cache.has(newUser.id)){
          await Logger.usernameChanged(guild, oldUser, newUser);
        }
      }
    }
    
    // Discriminator change (tag) - deprecated in new Discord but still check
    if(oldUser.discriminator !== newUser.discriminator){
      console.log('[DISCRIMINATOR] Change detected:', {
        old: oldUser.discriminator,
        new: newUser.discriminator
      });
      
      // Log to all guilds where this user is a member
      for(const [guildId, guild] of client.guilds.cache){
        if(guild.members.cache.has(newUser.id)){
          await Logger.usernameChanged(guild, oldUser, newUser);
        }
      }
    }
  },
};
