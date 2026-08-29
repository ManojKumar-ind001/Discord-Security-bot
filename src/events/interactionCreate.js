const { Events } = require('discord.js');
const V2 = require('../utils/Embed');
const chalk = require('chalk');
const cool = new Map();

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction, client) {
    // Handle Slash Commands
    if (interaction.isChatInputCommand()) {
      const cmd = client.slashCommands.get(interaction.commandName);
      if (!cmd) return;

      const key = interaction.user.id + '-' + cmd.data.name;
      const cd = (cmd.cooldown || 3) * 1000;

      if (cool.has(key)) {
        const left = (cool.get(key) + cd - Date.now()) / 1000;
        if (left > 0) {
          return interaction.reply({
            ...V2.reply(V2.warning('Cooldown', `Wait **${left.toFixed(1)}s** before using this again.`, client)),
            ephemeral: true,
          });
        }
      }

      cool.set(key, Date.now());
      setTimeout(() => cool.delete(key), cd);

      try {
        await cmd.execute(interaction, client);
      } catch (e) {
        console.error(chalk.red('[ERR]', cmd.data.name, e.message));
        const r = {
          ...V2.reply(V2.error('Error', 'Something went wrong executing this command.', client)),
          ephemeral: true,
        };
        if (interaction.replied || interaction.deferred) await interaction.followUp(r);
        else await interaction.reply(r);
      }
      return;
    }

    // Handle Button Interactions
    if (interaction.isButton()) {
      // Collectors handle component interactions locally; fallback if expired
      if (!interaction.replied && !interaction.deferred) {
        // Safe no-op or handled by collectors
      }
    }
  },
};
