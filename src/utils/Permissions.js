module.exports = {
  async isMod(member){
    if(!member) return false;
    if(member.permissions.has('Administrator') || member.permissions.has('ManageGuild') || member.permissions.has('ModerateMembers')) return true;
    const GuildModel = require('../models/Guild');
    const d = await GuildModel.get(member.guild.id);
    return (d.modRoles || []).some(r => member.roles.cache.has(r)) || (d.adminRoles || []).some(r => member.roles.cache.has(r));
  },
  async isAdmin(member){
    if(!member) return false;
    if(member.permissions.has('Administrator') || member.permissions.has('ManageGuild')) return true;
    const GuildModel = require('../models/Guild');
    const d = await GuildModel.get(member.guild.id);
    return (d.adminRoles || []).some(r => member.roles.cache.has(r));
  },
  isOwner(member){ return member?.guild?.ownerId === member?.id; },
  async check(interaction, level='mod'){
    const m = interaction.member;
    if(level==='owner'&&!this.isOwner(m)){ await interaction.reply({content:'❌ Only the server owner can use this.',ephemeral:true}); return false; }
    if(level==='admin'&&!(await this.isAdmin(m))){ await interaction.reply({content:'❌ You need **Administrator** or **Manage Server** permissions to use this.',ephemeral:true}); return false; }
    if(level==='mod'&&!(await this.isMod(m))){ await interaction.reply({content:'❌ You need **Moderator** permissions to use this.',ephemeral:true}); return false; }
    return true;
  },
};
