
const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const Embed = require('../../utils/Embed');
const Perm = require('../../utils/Permissions');
module.exports = {
  data: new SlashCommandBuilder().setName('embed').setDescription('Send a custom embed')
    .addStringOption(o=>o.setName('title').setDescription('Embed title').setRequired(true))
    .addStringOption(o=>o.setName('description').setDescription('Embed description').setRequired(true))
    .addStringOption(o=>o.setName('color').setDescription('Hex color e.g. #FF6B35'))
    .addChannelOption(o=>o.setName('channel').setDescription('Channel'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
  cooldown: 5,
  async execute(interaction, client){
    if(!(await Perm.check(interaction,'mod'))) return;
    const title=interaction.options.getString('title');
    const desc=interaction.options.getString('description');
    const colorStr=interaction.options.getString('color')||'#5865F2';
    const ch=interaction.options.getChannel('channel')||interaction.channel;
    const color=parseInt(colorStr.replace('#',''),16)||0x5865F2;
    try{
      const e=new EmbedBuilder().setColor(color).setTitle(title).setDescription(desc).setFooter({text:'🎮 GAMERZ WORKSHOP'}).setTimestamp();
      await ch.send({embeds:[e]});
      await interaction.reply({embeds:[Embed.success('Embed Sent','Embed sent to '+ch+'.',client)],ephemeral:true});
    }catch(err){ await interaction.reply({embeds:[Embed.error('Failed',err.message,client)],ephemeral:true}); }
  },
};
