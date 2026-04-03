const { Events } = require('discord.js');
const Logger = require('../utils/Logger');

module.exports = {
  name: Events.InviteCreate,
  async execute(invite, client){
    if(!invite.guild) return;
    await Logger.inviteCreated(invite.guild, invite);
  },
};
