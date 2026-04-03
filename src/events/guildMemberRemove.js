
const { Events } = require('discord.js');
const Logger = require('../utils/Logger');
module.exports = {
  name: Events.GuildMemberRemove,
  async execute(member, client){ await Logger.memberLeave(member.guild,member); },
};
