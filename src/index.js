require('dotenv').config();
const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');
const chalk = require('chalk');
const CommandHandler = require('./handlers/CommandHandler');
const EventHandler = require('./handlers/EventHandler');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildModeration, GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent, GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildPresences, GatewayIntentBits.GuildEmojisAndStickers,
    GatewayIntentBits.GuildInvites,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.GuildMember, Partials.User],
  makeCache: require('discord.js').Options.cacheWithLimits({
    MessageManager: 1000, // Cache last 1000 messages per channel for better delete logging
  }),
});

client.slashCommands = new Collection();
client.prefixCommands = new Collection();
client.cooldowns = new Collection();

new CommandHandler(client).load();
new EventHandler(client).load();

client.login(process.env.TOKEN).then(()=>{
  console.log(chalk.bold.cyan('\n╔══════════════════════════════════╗'));
  console.log(chalk.bold.cyan('║   GAMERZ WORKSHOP BOT v1.0.0     ║'));
  console.log(chalk.bold.cyan('╚══════════════════════════════════╝\n'));
}).catch(e=>{ console.error(chalk.red('[ERROR]',e.message)); process.exit(1); });

module.exports = client;
