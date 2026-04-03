const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const Embed = require('../../utils/Embed');
const Logger = require('../../utils/Logger');
const Perm = require('../../utils/Permissions');
const GuildModel = require('../../models/Guild');
const { COLORS } = require('../../config/config');

const RULES = {
  'r1': 'Rule 1: No Spamming or Flooding chat.',
  'r2': 'Rule 2: No Harassment, Hate Speech or Toxicity.',
  'r3': 'Rule 3: No NSFW or suggestive content.',
  'r4': 'Rule 4: No self-promotion or unauthorized links.',
  'r5': 'Rule 5: Use the correct channels.'
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warning')
    .setDescription('Advanced warning system')
    .addSubcommand(s => s.setName('rule').setDescription('Warn a user based on a specific rule')
      .addUserOption(o => o.setName('user').setDescription('User').setRequired(true))
      .addStringOption(o => o.setName('rule').setDescription('Rule (e.g., r1, r2)').setRequired(true)
        .addChoices(
          {name: 'Rule 1 (Spam)', value: 'r1'},
          {name: 'Rule 2 (Toxicity)', value: 'r2'},
          {name: 'Rule 3 (NSFW)', value: 'r3'},
          {name: 'Rule 4 (Promotion)', value: 'r4'},
          {name: 'Rule 5 (Channels)', value: 'r5'}
        )))
    .addSubcommand(s => s.setName('custom').setDescription('Warn using a custom reason')
      .addUserOption(o => o.setName('user').setDescription('User').setRequired(true))
      .addStringOption(o => o.setName('reason').setDescription('Custom reason').setRequired(true)))
    .addSubcommand(s => s.setName('status').setDescription('View a users warnings')
      .addUserOption(o => o.setName('user').setDescription('User').setRequired(true)))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  cooldown: 3,
  async execute(interaction, client){
    if(!(await Perm.check(interaction,'mod'))) return;
    const sub = interaction.options.getSubcommand();
    const user = interaction.options.getUser('user');
    if(!user) return interaction.reply({content:'❌ Please mention a valid user!', ephemeral:true});
    const data = await GuildModel.get(interaction.guild.id);
    
    if(sub === 'status'){
      const warns = data.warns.filter(w => w.userId === user.id);
      if(warns.length === 0){
        return interaction.reply({embeds:[Embed.info('Warnings', `**${user.tag}** has 0 warnings.`, client)]});
      }
      const e = new EmbedBuilder().setColor(COLORS.WARNING).setTitle(`⚠️ Warnings for ${user.tag}`)
        .setThumbnail(user.displayAvatarURL())
        .setDescription(warns.slice(-10).map((w, i) => `**${i+1}.** \`${w.warnId}\` — ${w.reason} (<@${w.moderatorId}>)`).join('\n'))
        .setFooter({text:`Total: ${warns.length} Warnings | 🎮 GAMERZ WORKSHOP`});
      return interaction.reply({embeds: [e]});
    }

    let reason;
    if(sub === 'rule'){
      const r = interaction.options.getString('rule');
      reason = RULES[r] || 'Unknown Rule';
    } else {
      reason = interaction.options.getString('reason');
    }

    const warnId = Math.random().toString(36).substring(2,8).toUpperCase();
    data.warns.push({userId: user.id, moderatorId: interaction.user.id, reason, warnId, timestamp: new Date()});
    await GuildModel.save(interaction.guild.id, data);
    
    // Attempt DM
    try {
      const dmEmbed = new EmbedBuilder().setColor(COLORS.WARNING)
        .setTitle(`You were warned in ${interaction.guild.name}`)
        .setDescription(`**Reason:** ${reason}\nPlease ensure to follow the server rules to avoid further actions.`);
      await user.send({embeds: [dmEmbed]});
    } catch(e) {}

    const total = data.warns.filter(w => w.userId === user.id).length;
    await interaction.reply({embeds:[Embed.warning('Member Warned', `**${user.tag}** has been warned.\n**Reason:** ${reason}\n**Warn ID:** \`${warnId}\`\n**Total:** ${total}`, client)]});
    await Logger.modAction(interaction.guild, 'warn', user, interaction.user, reason, {'Warn ID': warnId, 'Total Warns': total});
  },
};
