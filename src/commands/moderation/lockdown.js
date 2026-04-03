
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const Embed = require('../../utils/Embed');
const Perm = require('../../utils/Permissions');
module.exports = {
  data: new SlashCommandBuilder().setName('lockdown').setDescription('Lock/unlock ALL text channels')
    .addSubcommand(s=>s.setName('start').setDescription('Start server lockdown').addStringOption(o=>o.setName('reason').setDescription('Reason')))
    .addSubcommand(s=>s.setName('end').setDescription('End server lockdown'))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  cooldown: 10,
  async execute(interaction, client){
    if(!(await Perm.check(interaction,'admin'))) return;
    await interaction.deferReply();
    const sub=interaction.options.getSubcommand();
    const reason=interaction.options.getString('reason')||'No reason';
    const channels=interaction.guild.channels.cache.filter(c=>c.isTextBased()&&c.permissionsFor(interaction.guild.roles.everyone));
    let n=0;
    for(const [,ch] of channels){
      try{
        if(sub==='start') await ch.permissionOverwrites.edit(interaction.guild.roles.everyone,{SendMessages:false},{reason});
        else              await ch.permissionOverwrites.edit(interaction.guild.roles.everyone,{SendMessages:null});
        n++;
      }catch{}
    }
    const msg=sub==='start'?'🔒 Server locked down ('+n+' channels).\n**Reason:** '+reason:'🔓 Lockdown lifted ('+n+' channels unlocked).';
    await interaction.editReply({embeds:[sub==='start'?Embed.security('Server Lockdown',msg,client):Embed.success('Lockdown Ended',msg,client)]});
  },
};
