
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { COLORS } = require('../../config/config');
module.exports = {
  data: new SlashCommandBuilder().setName('userinfo').setDescription('View info about a user')
    .addUserOption(o=>o.setName('user').setDescription('User (default: yourself)')),
  cooldown: 5,
  async execute(interaction, client){
    const user=interaction.options.getUser('user')||interaction.user;
    const member=interaction.guild.members.cache.get(user.id);
    const roles=member?.roles.cache.filter(r=>r.id!==interaction.guild.id).map(r=>r.toString()).join(', ')||'None';
    const e=new EmbedBuilder().setColor(member?.displayHexColor||COLORS.PRIMARY)
      .setTitle('👤 User Info — '+user.tag)
      .setThumbnail(user.displayAvatarURL({dynamic:true,size:256}))
      .addFields(
        {name:'🆔 User ID',value:user.id,inline:true},
        {name:'🤖 Bot',value:user.bot?'Yes':'No',inline:true},
        {name:'📅 Account Created',value:'<t:'+Math.floor(user.createdTimestamp/1000)+':F>',inline:false},
        {name:'📥 Joined Server',value:member?'<t:'+Math.floor(member.joinedTimestamp/1000)+':F>':'Not in server',inline:false},
        {name:'🎨 Display Color',value:member?.displayHexColor||'N/A',inline:true},
        {name:'🏷️ Roles ['+((member?.roles.cache.size||1)-1)+']',value:roles.length>1000?roles.substring(0,997)+'...':roles||'None',inline:false},
      ).setFooter({text:'🎮 GAMERZ WORKSHOP'}).setTimestamp();
    await interaction.reply({embeds:[e]});
  },
};
