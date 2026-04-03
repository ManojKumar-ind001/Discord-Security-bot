
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const Embed = require('../../utils/Embed');
const Perm = require('../../utils/Permissions');
const GuildModel = require('../../models/Guild');
module.exports = {
  data: new SlashCommandBuilder().setName('antiraid').setDescription('Anti-raid controls')
    .addSubcommand(s=>s.setName('on').setDescription('Enable anti-raid'))
    .addSubcommand(s=>s.setName('off').setDescription('Disable anti-raid'))
    .addSubcommand(s=>s.setName('unlock').setDescription('Unlock all channels after a raid'))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  cooldown: 5,
  async execute(interaction, client){
    if(!(await Perm.check(interaction,'admin'))) return;
    const sub=interaction.options.getSubcommand();
    const data=await GuildModel.get(interaction.guild.id);
    if(!data.security) data.security={};
    if(sub==='on'){ data.security.antiRaid=true; await GuildModel.save(interaction.guild.id,data); return interaction.reply({embeds:[Embed.success('Anti-Raid Enabled','Anti-raid protection is now ON.',client)]}); }
    if(sub==='off'){ data.security.antiRaid=false; await GuildModel.save(interaction.guild.id,data); return interaction.reply({embeds:[Embed.warning('Anti-Raid Disabled','Anti-raid protection is now OFF.',client)]}); }
    if(sub==='unlock'){
      await interaction.deferReply();
      let n=0;
      for(const [,ch] of interaction.guild.channels.cache.filter(c=>c.isTextBased())){
        try{ await ch.permissionOverwrites.edit(interaction.guild.roles.everyone,{SendMessages:null}); n++; }catch{}
      }
      await interaction.editReply({embeds:[Embed.success('Channels Unlocked','Unlocked '+n+' channels after raid.',client)]});
    }
  },
};
