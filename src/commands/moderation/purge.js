
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const Embed = require('../../utils/Embed');
const Perm = require('../../utils/Permissions');
module.exports = {
  data: new SlashCommandBuilder().setName('purge').setDescription('Bulk delete messages')
    .addIntegerOption(o=>o.setName('amount').setDescription('1-100 messages').setRequired(true).setMinValue(1).setMaxValue(100))
    .addUserOption(o=>o.setName('user').setDescription('Filter by user'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
  cooldown: 5,
  async execute(interaction, client){
    if(!(await Perm.check(interaction,'mod'))) return;
    const amt=interaction.options.getInteger('amount');
    const user=interaction.options.getUser('user');
    await interaction.deferReply({ephemeral:true});
    try{
      let msgs=await interaction.channel.messages.fetch({limit:100});
      if(user) msgs=msgs.filter(m=>m.author.id===user.id);
      const toDelete=[...msgs.values()].slice(0,amt);
      const del=await interaction.channel.bulkDelete(toDelete,true);
      await interaction.editReply({embeds:[Embed.success('Purged','Deleted **'+del.size+'** messages'+(user?' from **'+user.tag+'**':'')+'.', client)]});
    }catch(e){ await interaction.editReply({embeds:[Embed.error('Purge Failed','Cannot delete messages older than 14 days.',client)]}); }
  },
};
