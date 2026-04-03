const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const { COLORS } = require('../../config/config');
const ms = require('ms');

module.exports = {
  data: new SlashCommandBuilder().setName('poll').setDescription('Create a timed interactive poll')
    .addStringOption(o => o.setName('question').setDescription('Poll question').setRequired(true))
    .addStringOption(o => o.setName('option1').setDescription('Option 1').setRequired(true))
    .addStringOption(o => o.setName('option2').setDescription('Option 2').setRequired(true))
    .addStringOption(o => o.setName('duration').setDescription('Duration (e.g. 60s, 1m, 1h) - default 1m'))
    .addStringOption(o => o.setName('option3').setDescription('Option 3'))
    .addStringOption(o => o.setName('option4').setDescription('Option 4')),
  cooldown: 10,
  async execute(interaction, client) {
    const q = interaction.options.getString('question');
    const durRaw = interaction.options.getString('duration') || '1m';
    const dur = ms(durRaw);

    if (!dur || dur < 5000 || dur > 604800000) {
      return interaction.reply({ content: '❌ Invalid duration (Min 5s, Max 7 days). Use formats like 60s, 1m, 1h.', ephemeral: true });
    }

    const opts = [interaction.options.getString('option1'), interaction.options.getString('option2'), interaction.options.getString('option3'), interaction.options.getString('option4')].filter(Boolean);
    const emojis = ['🇦', '🇧', '🇨', '🇩'];
    const votes = Array(opts.length).fill(0);
    const voters = new Set();

    const generateEmbed = (ended = false) => {
      const e = new EmbedBuilder()
        .setColor(ended ? COLORS.SUCCESS : COLORS.PRIMARY)
        .setAuthor({ name: ended ? '📊 Poll Result (Ended)' : '📊 Active Poll', iconURL: client.user.displayAvatarURL() })
        .setTitle(q)
        .setDescription(opts.map((o, i) => `${emojis[i]} **${o}**\nVotes: \`${votes[i]}\``).join('\n\n'))
        .setFooter({ text: ended ? 'This poll has ended.' : `React below to vote! | Duration: ${durRaw} | GAMERZ WORKSHOP` })
        .setTimestamp();
      return e;
    };

    const row = new ActionRowBuilder().addComponents(opts.map((o, i) => new ButtonBuilder().setCustomId('poll_btn_' + i).setLabel(emojis[i]).setStyle(ButtonStyle.Primary)));
    const endRow = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('poll_end').setLabel('End Poll Now').setStyle(ButtonStyle.Danger));

    const msg = await interaction.reply({ embeds: [generateEmbed()], components: [row, endRow], fetchReply: true });

    const collector = msg.createMessageComponentCollector({ time: dur });

    collector.on('collect', async (i) => {
      if (i.customId === 'poll_end') {
        if (i.user.id !== interaction.user.id) return i.reply({ content: '❌ Only the poll creator can end it early.', ephemeral: true });
        return collector.stop('manual');
      }

      if (voters.has(i.user.id)) return i.reply({ content: '❌ You have already voted in this poll.', ephemeral: true });

      const idx = parseInt(i.customId.replace('poll_btn_', ''));
      votes[idx]++;
      voters.add(i.user.id);

      await i.deferUpdate();
      await interaction.editReply({ embeds: [generateEmbed()] });
    });

    collector.on('end', () => {
      interaction.editReply({ embeds: [generateEmbed(true)], components: [] }).catch(() => { });
      
      // Announce results
      const max = Math.max(...votes);
      const winners = opts.filter((_, i) => votes[i] === max);
      interaction.channel.send({ content: `📢 **Poll Ended:** "${q}"\n🏆 **Winner(s):** ${winners.join(', ')} (**${max}** votes!)` });
    });
  },
};
