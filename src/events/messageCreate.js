const { Events } = require('discord.js');
const GuildModel = require('../models/Guild');
const msgCache = require('../utils/messageCache');
const Logger = require('../utils/Logger');
const spamMap = new Map();

module.exports = {
  name: Events.MessageCreate,
  async execute(message, client){
    if(message.author.bot || !message.guild) return;

    msgCache.set(message);

    const data = await GuildModel.get(message.guild.id);

    // Trapped Channel — 1 day timeout on FIRST message + delete last 12h messages
    if(data.security?.trappedChannel && message.channel.id === data.security.trappedChannel && !message.member.permissions.has('Administrator')){
      try{
        // 1 day timeout immediately
        await message.member.timeout(86400000, 'Security: Typed in honeypot channel');

        // Delete last 12 hours of messages from this user across all channels
        const twelveHoursAgo = Date.now() - (12 * 60 * 60 * 1000);
        for(const [, ch] of message.guild.channels.cache){
          if(!ch.isTextBased()) continue;
          try{
            const msgs = await ch.messages.fetch({ limit: 100 });
            const toDelete = msgs.filter(m =>
              m.author.id === message.author.id &&
              m.createdTimestamp > twelveHoursAgo
            );
            for(const [, m] of toDelete) await m.delete().catch(() => {});
          }catch{}
        }

        // Log to audit
        await Logger.modAction(
          message.guild, 'timeout', message.member, client.user,
          'Security: Typed in honeypot/trapped channel',
          { 'Duration': '24 hours', 'Channel': `<#${message.channel.id}>`, 'Messages Deleted': 'Last 12 hours' }
        );
      }catch(e){
        console.error('[HONEYTRAP]', e.message);
      }
      return;
    }

    const automod = data.automod || {};
    const isExempt = message.member.permissions.has('ManageGuild');

    if(!isExempt){

      // ── Anti-Spam ──────────────────────────────────────────────────────────
      if(automod.antiSpam?.enabled){
        const key = message.guild.id + '-' + message.author.id;
        if(!spamMap.has(key)) spamMap.set(key, []);
        const ts = spamMap.get(key);
        const now = Date.now();
        const interval  = (automod.antiSpam.interval  || 5) * 1000;
        const threshold =  automod.antiSpam.threshold || 5;

        ts.push(now);
        // Keep only timestamps within the interval window
        const recent = ts.filter(t => now - t < interval);
        spamMap.set(key, recent);

        // Auto-clear after interval so normal chatting doesn't accumulate
        setTimeout(() => {
          const cur = spamMap.get(key);
          if(cur) spamMap.set(key, cur.filter(t => Date.now() - t < interval));
        }, interval);

        if(recent.length >= threshold){
          spamMap.delete(key);
          try{
            const fetched = await message.channel.messages.fetch({ limit: 100 });
            const toDelete = fetched.filter(m =>
              m.author.id === message.author.id &&
              now - m.createdTimestamp < interval + 3000
            );
            for(const [, m] of toDelete) await m.delete().catch(() => {});

            if(automod.antiSpam.action === 'timeout'){
              await message.member.timeout(60000, 'AutoMod: Spam');
            }
            await Logger.modAction(
              message.guild, 'timeout', message.member, client.user,
              `AutoMod: Spam (${recent.length} msgs / ${automod.antiSpam.interval}s)`,
              { 'Duration': '1 minute', 'Deleted': `${toDelete.size} messages` }
            );
          }catch(e){ console.error('[SPAM]', e.message); }
          return;
        }
      }

      // ── Anti-Links ─────────────────────────────────────────────────────────
      if(automod.antiLinks?.enabled){
        const links = message.content.match(/https?:\/\/[^\s]+/gi) || [];
        if(links.length > 0){
          const blocked = automod.antiLinks.allowedDomains || [];
          let blockedCount = 0;
          for(const link of links){
            const linkLower = link.toLowerCase();
            // Remove protocol and www
            const linkClean = linkLower.replace(/^https?:\/\//i, '').replace(/^www\./i, '');
            // Extract just the domain part (before first /)
            const domain = linkClean.split('/')[0];
            
            // Check if link matches any blocked domain/pattern
            const isBlocked = blocked.some(pattern => {
              const patternClean = pattern.toLowerCase().trim().replace(/^https?:\/\//i, '').replace(/^www\./i, '');
              
              // If pattern starts with dot (like .gg), match any domain ending with that extension
              if(patternClean.startsWith('.')){
                // Match domains ending with .gg (like hello.gg, test.gg)
                return domain.endsWith(patternClean) || domain.endsWith(patternClean.substring(1));
              }
              
              // Otherwise exact domain match or subdomain match
              // This matches discord.gg, www.discord.gg, etc.
              return domain === patternClean || domain.endsWith('.' + patternClean);
            });
            
            if(isBlocked) blockedCount++;
          }
          
          if(blockedCount >= (automod.antiLinks.threshold || 1)){
            try{
              await message.delete();
              if(automod.antiLinks.action === 'timeout'){
                await message.member.timeout(120000, 'AutoMod: Blocked links');
              }
              await Logger.modAction(
                message.guild, 'timeout', message.member, client.user,
                `AutoMod: Blocked links (${blockedCount} links)`,
                { 'Action': automod.antiLinks.action, 'Links': `${blockedCount}` }
              );
            }catch(e){ console.error('[LINKS]', e.message); }
            return;
          }
        }
      }

      // ── Anti-Mention ───────────────────────────────────────────────────────
      if(automod.antiMention?.enabled){
        const protectedRoles = automod.antiMention.protectedRoles || [];
        const mentionedProtected = protectedRoles.length > 0 &&
          message.mentions.roles.some(r => protectedRoles.includes(r.id));
        const total = message.mentions.users.size + message.mentions.roles.size;
        const threshold = automod.antiMention.threshold || 5;

        if(total >= threshold || mentionedProtected){
          try{
            await message.delete();
            if(automod.antiMention.action === 'timeout'){
              await message.member.timeout(120000, 'AutoMod: Mass mention');
            }
            await Logger.modAction(
              message.guild, 'timeout', message.member, client.user,
              `AutoMod: Mass mention (${total} mentions)`,
              { 'Duration': '2 minutes', 'Mentions': `${total}` }
            );
          }catch(e){ console.error('[MENTION]', e.message); }
          return;
        }
      }

    }

    // Prefix fallback
    const prefix = data.prefix || '!';
    if(!message.content.startsWith(prefix)) return;
    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const name = args.shift().toLowerCase();
    const cmd = client.slashCommands.get(name) || client.prefixCommands?.get(name);
    if(cmd){
      if(cmd.execute_prefix){
        try{ await cmd.execute_prefix(message, args, client); }catch{}
      } else {
        const fake = {
          isCommand: () => true,
          reply: o => message.reply(o),
          deferReply: () => message.channel.sendTyping(),
          editReply: o => message.reply(o),
          guild: message.guild, channel: message.channel,
          user: message.author, member: message.member,
          options: {
            getSubcommand: () => args[0] || null,
            getString: () => args[1] || args[0] || null,
            getUser: () => message.mentions.users.first() || null,
            getRole: () => message.mentions.roles.first() || null,
            getChannel: () => message.mentions.channels.first() || null,
          }
        };
        try{ await cmd.execute(fake, client); }catch(e){ console.error('Prefix error:', e); }
      }
    }
  },
};
