
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const Embed = require('../../utils/Embed');
const Perm = require('../../utils/Permissions');
module.exports = {
  data: new SlashCommandBuilder().setName('slowmode').setDescription('Set slowmode in a channel')
    .addIntegerOption(o=>o.setName('seconds').setDescription('Seconds (0=disable)').setRequired(true).setMinValue(0).setMaxValue(21600))
    .addChannelOption(o=>o.setName('channel').setDescription('Channel (default: current)'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
  cooldown: 5,
  async execute(interaction, client){
    if(!(await Perm.check(interaction,'mod'))) return;
    const sec=interaction.options.getInteger('seconds');
    const ch=interaction.options.getChannel('channel')||interaction.channel;
    try{
      await ch.setRateLimitPerUser(sec,'Set by '+interaction.user.tag);
      await interaction.reply({embeds:[Embed.success('Slowmode',sec===0?'Slowmode disabled in '+ch+'.':'Slowmode set to **'+sec+'s** in '+ch+'.',client)]});
    }catch(e){ await interaction.reply({embeds:[Embed.error('Failed',e.message,client)],ephemeral:true}); }
  },
};
