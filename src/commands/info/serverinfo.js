
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { COLORS } = require('../../config/config');
module.exports = {
  data: new SlashCommandBuilder().setName('serverinfo').setDescription('View server information'),
  cooldown: 5,
  async execute(interaction, client){
    const g=interaction.guild;
    await g.fetch();
    const e=new EmbedBuilder().setColor(COLORS.PRIMARY)
      .setTitle('🏰 Server Info — '+g.name)
      .setThumbnail(g.iconURL({dynamic:true,size:256}))
      .addFields(
        {name:'🆔 Server ID',value:g.id,inline:true},
        {name:'👑 Owner',value:'<@'+g.ownerId+'>',inline:true},
        {name:'📅 Created',value:'<t:'+Math.floor(g.createdTimestamp/1000)+':F>',inline:false},
        {name:'👥 Members',value:''+g.memberCount,inline:true},
        {name:'💬 Channels',value:''+g.channels.cache.size,inline:true},
        {name:'🏷️ Roles',value:''+g.roles.cache.size,inline:true},
        {name:'😀 Emojis',value:''+g.emojis.cache.size,inline:true},
        {name:'🔒 Verification',value:''+g.verificationLevel,inline:true},
        {name:'🚀 Boost Level',value:''+g.premiumTier,inline:true},
        {name:'🚀 Boosts',value:''+g.premiumSubscriptionCount,inline:true},
      ).setFooter({text:'🎮 GAMERZ WORKSHOP'}).setTimestamp();
    if(g.bannerURL()) e.setImage(g.bannerURL({size:1024}));
    await interaction.reply({embeds:[e]});
  },
};
