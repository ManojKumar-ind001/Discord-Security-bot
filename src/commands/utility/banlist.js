
const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const Perm = require('../../utils/Permissions');
const { COLORS } = require('../../config/config');
module.exports = {
  data: new SlashCommandBuilder().setName('banlist').setDescription('View banned users')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
  cooldown: 10,
  async execute(interaction, client){
    if(!(await Perm.check(interaction,'mod'))) return;
    await interaction.deferReply({ephemeral:true});
    const bans=await interaction.guild.bans.fetch();
    if(!bans.size) return interaction.editReply({content:'No banned users.'});
    const list=[...bans.values()].slice(0,20).map((b,i)=>(i+1)+'. **'+b.user.tag+'** (`'+b.user.id+'`) — '+( b.reason||'No reason'));
    const e=new EmbedBuilder().setColor(COLORS.ERROR).setTitle('🔨 Ban List — '+bans.size+' total')
      .setDescription(list.join('\n')).setFooter({text:'🎮 GAMERZ WORKSHOP | Showing up to 20'}).setTimestamp();
    await interaction.editReply({embeds:[e]});
  },
};
