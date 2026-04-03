
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const Embed = require('../../utils/Embed');
const Perm = require('../../utils/Permissions');
const GuildModel = require('../../models/Guild');
module.exports = {
  data: new SlashCommandBuilder().setName('clearwarn').setDescription('Clear warnings for a member')
    .addUserOption(o=>o.setName('user').setDescription('User').setRequired(true))
    .addStringOption(o=>o.setName('warnid').setDescription('Specific warn ID (leave blank = clear all)'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  cooldown: 3,
  async execute(interaction, client){
    if(!(await Perm.check(interaction,'mod'))) return;
    const user=interaction.options.getUser('user');
    const wid=interaction.options.getString('warnid');
    const data=await GuildModel.get(interaction.guild.id);
    if(wid){
      const before=data.warns.length;
      data.warns=data.warns.filter(w=>!(w.userId===user.id&&w.warnId===wid.toUpperCase()));
      if(data.warns.length===before) return interaction.reply({embeds:[Embed.error('Not Found','No warning `'+wid+'` found.',client)],ephemeral:true});
      await GuildModel.save(interaction.guild.id,data);
      await interaction.reply({embeds:[Embed.success('Warning Cleared','Removed `'+wid+'` from **'+user.tag+'**.',client)]});
    }else{
      data.warns=data.warns.filter(w=>w.userId!==user.id);
      await GuildModel.save(interaction.guild.id,data);
      await interaction.reply({embeds:[Embed.success('Warnings Cleared','All warnings removed from **'+user.tag+'**.',client)]});
    }
  },
};
