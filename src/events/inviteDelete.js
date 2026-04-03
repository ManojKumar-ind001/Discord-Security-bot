const { Events } = require('discord.js');
const Logger = require('../utils/Logger');

module.exports = {
  name: Events.InviteDelete,
  async execute(invite, client){
    if(!invite.guild) return;
    await Logger.inviteDeleted(invite.guild, invite);
  },
};
