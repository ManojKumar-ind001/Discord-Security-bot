const { ActivityType, Events, PermissionFlagsBits, ChannelType } = require('discord.js');
const chalk = require('chalk');
const GuildModel = require('../models/Guild');
const BotConfig = require('../models/BotConfig');
const msgCache = require('../utils/messageCache');

module.exports = {
  name: Events.ClientReady, once: true,
  async execute(client){
    console.log(chalk.green('[BOT] Logged in as '+client.user.tag));

    // Set presence/activity
    const cfg = BotConfig.get();
    const typeMap = {
      playing:   ActivityType.Playing,
      watching:  ActivityType.Watching,
      listening: ActivityType.Listening,
      streaming: ActivityType.Streaming,
      custom:    ActivityType.Custom,
    };
    const activityOptions = {
      name: cfg.activity.message,
      type: typeMap[cfg.activity.type] || ActivityType.Watching,
    };
    if(cfg.activity.type === 'streaming') activityOptions.url = 'https://www.twitch.tv/gamerz_workshop';
    client.user.setPresence({ activities: [activityOptions], status: cfg.activity.status });
    console.log(chalk.blue(`[BOT] Activity: ${cfg.activity.type} "${cfg.activity.message}" (${cfg.activity.status})`));

    // ─── Startup Message Cache ─────────────────────────────────────────────
    // Fetch last 100 messages from every text + voice-text channel so
    // deletes that happen shortly after startup still show full content.
    const warmupCache = async () => {
      console.log(chalk.blue('[CACHE] Warming up message cache...'));
      let total = 0;
      for(const guild of client.guilds.cache.values()){
        const textChannels = guild.channels.cache.filter(c =>
          c.isTextBased() && 
          c.type !== ChannelType.GuildCategory &&
          c.viewable
        );
        for(const [, channel] of textChannels){
          try{
            const msgs = await channel.messages.fetch({ limit: 100 });
            for(const [, msg] of msgs){
              if(!msg.author?.bot) {
                msgCache.set(msg);
                total++;
              }
            }
          }catch{
            // No permission to read this channel — skip silently
          }
        }
      }
      console.log(chalk.green(`[CACHE] Warmed up with ${total} messages.`));
    };
    warmupCache().catch(e => console.error('[CACHE] Warmup failed:', e.message));

    // ─── Hourly Role Sync ──────────────────────────────────────────────────
    const syncRoles = async () => {
      console.log(chalk.blue('[SYNC] Starting hourly Admin/Mod role scan...'));
      for(const guild of client.guilds.cache.values()){
        try {
          const data = await GuildModel.get(guild.id);
          const roles = await guild.roles.fetch();
          
          let changed = false;
          const currentAdmin = data.adminRoles || [];
          const currentMod = data.modRoles || [];

          const adminRoles = Array.from(roles.filter(r =>
            r.permissions.has(PermissionFlagsBits.Administrator) ||
            r.permissions.has(PermissionFlagsBits.ManageGuild)
          ).keys());

          const modRoles = Array.from(roles.filter(r =>
            !adminRoles.includes(r.id) &&
            (r.permissions.has(PermissionFlagsBits.ModerateMembers) ||
             r.permissions.has(PermissionFlagsBits.ManageMessages))
          ).keys());

          if(JSON.stringify([...currentAdmin].sort()) !== JSON.stringify([...adminRoles].sort())){
            data.adminRoles = adminRoles; changed = true;
          }
          if(JSON.stringify([...currentMod].sort()) !== JSON.stringify([...modRoles].sort())){
            data.modRoles = modRoles; changed = true;
          }
          if(changed) await GuildModel.save(guild.id, data);
        } catch(e) {
          console.error(`[SYNC] Failed for guild ${guild.id}:`, e.message);
        }
      }
      console.log(chalk.green('[SYNC] Role scan complete.'));
    };

    syncRoles();
    setInterval(syncRoles, 3600000);
  },
};
