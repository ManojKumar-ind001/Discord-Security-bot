const { EmbedBuilder, AuditLogEvent } = require('discord.js');
const { COLORS } = require('../config/config');
const GuildModel = require('../models/Guild');

async function getChannel(guild, type){
  try{
    const d = await GuildModel.get(guild.id);
    const id = d.logChannels?.[type];
    if(!id) return null;
    const ch = guild.channels.cache.get(id) || await guild.channels.fetch(id).catch(()=>null);
    return ch;
  }catch(e){
    console.error(`[LOG] Error getting ${type} channel:`, e.message);
    return null;
  }
}

function foot(){ return { text: '🎮 GAMERZ WORKSHOP Security' }; }

async function send(ch, embed){
  try{ if(ch) await ch.send({embeds:[embed]}); }catch{}
}

async function getExecutor(guild, type, targetId, maxAge = 5000){
  try{
    await new Promise(r => setTimeout(r, 1000));
    const logs = await guild.fetchAuditLogs({ type, limit: 1 });
    const entry = logs.entries.first();
    if(!entry) return null;
    if(targetId && entry.target?.id !== targetId) return null;
    if(Date.now() - entry.createdTimestamp > maxAge) return null;
    return entry.executor;
  }catch{ return null; }
}

const L = {

  async roleAdded(guild, member, role, exec){
    const ch = await getChannel(guild,'audit'); if(!ch) return;
    await send(ch, new EmbedBuilder().setColor(COLORS.ROLE).setTitle('🏷️ Role Added')
      .setDescription(`<@${member.id}> **(${member.user.tag})**`)
      .addFields(
        {name:'Role',value:`${role} \`${role.name}\``,inline:true},
        {name:'Role ID',value:role.id,inline:true},
        {name:'Executor',value:exec ? `<@${exec.id}> (${exec.tag})` : 'Unknown',inline:true},
        {name:'Member ID',value:member.id,inline:true},
        {name:'Time',value:`<t:${Math.floor(Date.now()/1000)}:F>`,inline:true},
      )
      .setThumbnail(member.user.displayAvatarURL({dynamic:true,size:256}))
      .setFooter(foot()).setTimestamp());
  },

  async roleRemoved(guild, member, role, exec){
    const ch = await getChannel(guild,'audit'); if(!ch) return;
    await send(ch, new EmbedBuilder().setColor(COLORS.WARNING).setTitle('🏷️ Role Removed')
      .setDescription(`<@${member.id}> **(${member.user.tag})**`)
      .addFields(
        {name:'Role',value:`${role} \`${role.name}\``,inline:true},
        {name:'Role ID',value:role.id,inline:true},
        {name:'Executor',value:exec ? `<@${exec.id}> (${exec.tag})` : 'Unknown',inline:true},
        {name:'Member ID',value:member.id,inline:true},
        {name:'Time',value:`<t:${Math.floor(Date.now()/1000)}:F>`,inline:true},
      )
      .setThumbnail(member.user.displayAvatarURL({dynamic:true,size:256}))
      .setFooter(foot()).setTimestamp());
  },

  async memberJoin(guild, member){
    const ch = await getChannel(guild,'join'); if(!ch) return;
    const age = Math.floor((Date.now() - member.user.createdTimestamp) / 86400000);
    const e = new EmbedBuilder().setColor(COLORS.JOIN).setTitle('📥 Member Joined')
      .setDescription(`<@${member.id}> **(${member.user.tag})** joined the server!`)
      .addFields(
        {name:'User ID',value:member.id,inline:true},
        {name:'Account Age',value:`${age} days`,inline:true},
        {name:'Member Count',value:`${guild.memberCount}`,inline:true},
        {name:'Account Created',value:`<t:${Math.floor(member.user.createdTimestamp/1000)}:F>`,inline:false},
        {name:'Joined At',value:`<t:${Math.floor(Date.now()/1000)}:F>`,inline:false},
      )
      .setThumbnail(member.user.displayAvatarURL({dynamic:true,size:256}))
      .setFooter(foot()).setTimestamp();
    if(age < 7) e.addFields({name:'⚠️ NEW ACCOUNT WARNING',value:`Account is only **${age} days** old!`});
    await send(ch, e);
  },

  async memberLeave(guild, member){
    const ch = await getChannel(guild,'join'); if(!ch) return;
    const roles = member.roles?.cache?.filter(r=>r.id!==guild.id).map(r=>r.toString()).join(', ') || 'None';
    await send(ch, new EmbedBuilder().setColor(COLORS.LEAVE).setTitle('📤 Member Left')
      .setDescription(`**${member.user.tag}** left the server.`)
      .addFields(
        {name:'User ID',value:member.id,inline:true},
        {name:'Member Count',value:`${guild.memberCount}`,inline:true},
        {name:'Left At',value:`<t:${Math.floor(Date.now()/1000)}:F>`,inline:false},
        {name:`Roles [${(member.roles?.cache?.size||1)-1}]`,value:roles.substring(0,1000)||'None'},
      )
      .setThumbnail(member.user.displayAvatarURL({dynamic:true,size:256}))
      .setFooter(foot()).setTimestamp());
  },

  async messageDeleted(guild, message){
    if(message.author?.bot) return;
    const ch = await getChannel(guild,'message'); if(!ch) return;

    // Determine channel display
    const channelId = message.channelId || message.channel?.id;
    const channelDisplay = channelId ? `<#${channelId}>` : (message.channel?.name || 'Unknown Channel');

    // Find who deleted via audit log
    let executor = '🙋 Self-deleted';
    try{
      await new Promise(r => setTimeout(r, 600));
      const audit = await guild.fetchAuditLogs({ limit: 3, type: AuditLogEvent.MessageDelete });
      for(const entry of audit.entries.values()){
        if(Date.now() - entry.createdTimestamp < 8000){
          executor = `<@${entry.executor.id}> **(${entry.executor.tag})**`;
          break;
        }
      }
    }catch{}

    const author = message.author
      ? `<@${message.author.id}> **(${message.author.tag || message.author.username})**`
      : '❓ Unknown (uncached)';

    // Determine content display:
    // '' = image/file only message, actual text = show it, null = uncached
    let content;
    if(message.content === null || message.content === undefined){
      content = '_[Message uncached — bot was offline when sent]_';
    } else if(message.content.trim() === ''){
      content = '_[No text — image or file only message]_';
    } else {
      content = message.content.substring(0, 1000);
    }

    const e = new EmbedBuilder().setColor(COLORS.ERROR).setTitle('🗑️ Message Deleted')
      .addFields(
        { name: 'Author',      value: author,           inline: true },
        { name: 'Channel',     value: channelDisplay,   inline: true },
        { name: 'Deleted By',  value: executor,         inline: true },
        { name: 'Content',     value: content },
        { name: 'Message ID',  value: message.id,                    inline: true },
        { name: 'User ID',     value: message.author?.id || 'Unknown', inline: true },
        { name: 'Sent At',     value: message.createdTimestamp ? `<t:${Math.floor(message.createdTimestamp/1000)}:F>` : 'Unknown', inline: true },
      )
      .setFooter(foot()).setTimestamp();

    // Attachments — works with both discord.js Map and our plain array from cache
    let attList = [];
    if(message.attachments instanceof Map) attList = Array.from(message.attachments.values());
    else if(Array.isArray(message.attachments)) attList = message.attachments;

    if(attList.length > 0){
      e.addFields({ name: `📎 Attachments (${attList.length})`, value: attList.map(a => `[${a.name || 'file'}](${a.url})`).join('\n').substring(0, 1000) });
      const img = attList.find(a =>
        a.contentType?.startsWith('image/') ||
        /\.(png|jpg|jpeg|gif|webp|bmp)$/i.test(a.url || '')
      );
      if(img) e.setImage(img.url);
    }

    await send(ch, e);
  },


  async messageEdited(guild, oldMsg, newMsg){
    if(oldMsg.author?.bot || oldMsg.content === newMsg.content) return;
    const ch = await getChannel(guild,'message'); if(!ch) return;
    const author = oldMsg.author ? `<@${oldMsg.author.id}> **(${oldMsg.author.tag})**` : '❓ Unknown';
    await send(ch, new EmbedBuilder().setColor(COLORS.WARNING).setTitle('✏️ Message Edited')
      .addFields(
        {name:'Author',value:author,inline:true},
        {name:'Channel',value:`<#${newMsg.channelId}>`,inline:true},
        {name:'Jump to Message',value:`[Click Here](${newMsg.url})`,inline:true},
        {name:'Before',value:oldMsg.content?.substring(0,500)||'_[Empty / Uncached]_'},
        {name:'After',value:newMsg.content?.substring(0,500)||'_[Empty]_'},
        {name:'Message ID',value:newMsg.id,inline:true},
        {name:'Edited At',value:`<t:${Math.floor(Date.now()/1000)}:F>`,inline:true},
      )
      .setFooter(foot()).setTimestamp());
  },

  async vcJoined(guild, member, channel){
    const ch = await getChannel(guild,'vc'); if(!ch) return;
    await send(ch, new EmbedBuilder().setColor(COLORS.VC).setTitle('🔊 Joined Voice Channel')
      .setDescription(`<@${member.id}> **(${member.user.tag})** joined a voice channel`)
      .addFields(
        {name:'Channel',value:`**${channel.name}** (ID: ${channel.id})`,inline:true},
        {name:'User ID',value:member.id,inline:true},
        {name:'Time',value:`<t:${Math.floor(Date.now()/1000)}:F>`,inline:true},
      )
      .setThumbnail(member.user.displayAvatarURL({dynamic:true,size:256}))
      .setFooter(foot()).setTimestamp());
  },

  async vcLeft(guild, member, channel){
    const ch = await getChannel(guild,'vc'); if(!ch) return;
    await send(ch, new EmbedBuilder().setColor(COLORS.LEAVE).setTitle('🔇 Left Voice Channel')
      .setDescription(`<@${member.id}> **(${member.user.tag})** left a voice channel`)
      .addFields(
        {name:'Channel',value:`**${channel.name}** (ID: ${channel.id})`,inline:true},
        {name:'User ID',value:member.id,inline:true},
        {name:'Time',value:`<t:${Math.floor(Date.now()/1000)}:F>`,inline:true},
      )
      .setThumbnail(member.user.displayAvatarURL({dynamic:true,size:256}))
      .setFooter(foot()).setTimestamp());
  },

  async vcMoved(guild, member, oldCh, newCh){
    const ch = await getChannel(guild,'vc'); if(!ch) return;
    await send(ch, new EmbedBuilder().setColor(0x5865F2).setTitle('🔀 Switched Voice Channel')
      .setDescription(`<@${member.id}> **(${member.user.tag})** moved between voice channels`)
      .addFields(
        {name:'From',value:`**${oldCh.name}** (ID: ${oldCh.id})`,inline:true},
        {name:'To',value:`**${newCh.name}** (ID: ${newCh.id})`,inline:true},
        {name:'User ID',value:member.id,inline:true},
        {name:'Time',value:`<t:${Math.floor(Date.now()/1000)}:F>`,inline:true},
      )
      .setThumbnail(member.user.displayAvatarURL({dynamic:true,size:256}))
      .setFooter(foot()).setTimestamp());
  },

  async channelCreated(guild, channel, exec){
    const ch = await getChannel(guild,'audit'); if(!ch) return;
    await send(ch, new EmbedBuilder().setColor(COLORS.SUCCESS).setTitle('📁 Channel Created')
      .addFields(
        {name:'Channel',value:`${channel} \`${channel.name}\``,inline:true},
        {name:'Type',value:`${channel.type}`,inline:true},
        {name:'Channel ID',value:channel.id,inline:true},
        {name:'Executor',value:exec ? `<@${exec.id}> (${exec.tag})` : 'Unknown',inline:true},
        {name:'Time',value:`<t:${Math.floor(Date.now()/1000)}:F>`,inline:true},
      )
      .setFooter(foot()).setTimestamp());
  },

  async channelDeleted(guild, channel, exec){
    const ch = await getChannel(guild,'audit'); if(!ch) return;
    await send(ch, new EmbedBuilder().setColor(COLORS.ERROR).setTitle('📁 Channel Deleted')
      .addFields(
        {name:'Channel Name',value:`\`${channel.name}\``,inline:true},
        {name:'Channel ID',value:channel.id,inline:true},
        {name:'Type',value:`${channel.type}`,inline:true},
        {name:'Executor',value:exec ? `<@${exec.id}> (${exec.tag})` : 'Unknown',inline:true},
        {name:'Time',value:`<t:${Math.floor(Date.now()/1000)}:F>`,inline:true},
      )
      .setFooter(foot()).setTimestamp());
  },

  async channelUpdated(guild, oldC, newC, exec){
    const ch = await getChannel(guild,'audit'); if(!ch) return;
    const changes = [];
    if(oldC.name !== newC.name)   changes.push(`**Name:** \`${oldC.name}\` → \`${newC.name}\``);
    if(oldC.topic !== newC.topic) changes.push(`**Topic:** \`${oldC.topic||'None'}\` → \`${newC.topic||'None'}\``);
    if(oldC.nsfw !== newC.nsfw)   changes.push(`**NSFW:** ${oldC.nsfw} → ${newC.nsfw}`);
    if(!changes.length) return;
    await send(ch, new EmbedBuilder().setColor(COLORS.WARNING).setTitle('📁 Channel Updated')
      .addFields(
        {name:'Channel',value:`${newC} \`${newC.name}\``,inline:true},
        {name:'Channel ID',value:newC.id,inline:true},
        {name:'Executor',value:exec ? `<@${exec.id}> (${exec.tag})` : 'Unknown',inline:true},
        {name:'Changes',value:changes.join('\n')},
        {name:'Time',value:`<t:${Math.floor(Date.now()/1000)}:F>`,inline:true},
      )
      .setFooter(foot()).setTimestamp());
  },

  async roleCreated(guild, role, exec){
    const ch = await getChannel(guild,'audit'); if(!ch) return;
    await send(ch, new EmbedBuilder().setColor(COLORS.SUCCESS).setTitle('🏷️ Role Created')
      .addFields(
        {name:'Role',value:`${role} \`${role.name}\``,inline:true},
        {name:'Role ID',value:role.id,inline:true},
        {name:'Color',value:role.hexColor,inline:true},
        {name:'Executor',value:exec ? `<@${exec.id}> (${exec.tag})` : 'Unknown',inline:true},
        {name:'Time',value:`<t:${Math.floor(Date.now()/1000)}:F>`,inline:true},
      )
      .setFooter(foot()).setTimestamp());
  },

  async roleDeleted(guild, role, exec){
    const ch = await getChannel(guild,'audit'); if(!ch) return;
    await send(ch, new EmbedBuilder().setColor(COLORS.ERROR).setTitle('🏷️ Role Deleted')
      .addFields(
        {name:'Role Name',value:`\`${role.name}\``,inline:true},
        {name:'Role ID',value:role.id,inline:true},
        {name:'Color',value:role.hexColor,inline:true},
        {name:'Executor',value:exec ? `<@${exec.id}> (${exec.tag})` : 'Unknown',inline:true},
        {name:'Time',value:`<t:${Math.floor(Date.now()/1000)}:F>`,inline:true},
      )
      .setFooter(foot()).setTimestamp());
  },

  // Avatar changed — shows old pfp as thumbnail, new pfp as main image
  async avatarChanged(guild, user, oldURL, newURL){
    const ch = await getChannel(guild,'audit'); if(!ch) return;
    const e = new EmbedBuilder().setColor(0x5865F2).setTitle('🖼️ Avatar Changed')
      .setDescription(`<@${user.id}> **(${user.tag})** changed their profile picture`)
      .addFields(
        {name:'User',value:`${user.tag}`,inline:true},
        {name:'User ID',value:user.id,inline:true},
        {name:'Time',value:`<t:${Math.floor(Date.now()/1000)}:F>`,inline:true},
        {name:'Old Avatar',value:oldURL ? `[Click to view](${oldURL})` : 'No previous avatar',inline:true},
        {name:'New Avatar',value:`[Click to view](${newURL})`,inline:true},
      )
      .setThumbnail(oldURL || newURL)   // old pfp on the side
      .setImage(newURL)                  // new pfp as big image
      .setFooter(foot()).setTimestamp();
    await send(ch, e);
  },

  // Username/Tag changed
  async usernameChanged(guild, oldUser, newUser){
    const ch = await getChannel(guild,'audit'); if(!ch) return;
    const changes = [];
    if(oldUser.username !== newUser.username){
      changes.push(`**Username:** \`${oldUser.username}\` → \`${newUser.username}\``);
    }
    if(oldUser.discriminator !== newUser.discriminator){
      changes.push(`**Tag:** \`#${oldUser.discriminator}\` → \`#${newUser.discriminator}\``);
    }
    if(!changes.length) return;
    
    const e = new EmbedBuilder().setColor(0x5865F2).setTitle('👤 Username Changed')
      .setDescription(`<@${newUser.id}> changed their username`)
      .addFields(
        {name:'Old',value:`${oldUser.tag}`,inline:true},
        {name:'New',value:`${newUser.tag}`,inline:true},
        {name:'User ID',value:newUser.id,inline:true},
        {name:'Changes',value:changes.join('\n')},
        {name:'Time',value:`<t:${Math.floor(Date.now()/1000)}:F>`,inline:true},
      )
      .setThumbnail(newUser.displayAvatarURL({dynamic:true,size:256}))
      .setFooter(foot()).setTimestamp();
    await send(ch, e);
  },

  async modAction(guild, type, target, exec, reason, extra={}){
    const ch = await getChannel(guild,'audit'); if(!ch) return;
    const colorMap = {
      ban:     COLORS.ERROR,
      kick:    COLORS.WARNING,
      timeout: COLORS.WARNING,
      mute:    COLORS.WARNING,
      unmute:  COLORS.SUCCESS,
      untimeout: COLORS.SUCCESS,
      warn:    COLORS.WARNING,
      unban:   COLORS.SUCCESS,
    };
    const emojiMap = {
      ban:      '🔨',
      kick:     '👢',
      timeout:  '⏱️',
      mute:     '🔇',
      unmute:   '🔓',
      untimeout:'🔓',
      warn:     '⚠️',
      unban:    '✅',
    };
    const titleMap = {
      ban:      'Member Banned',
      kick:     'Member Kicked',
      timeout:  'Member Timed Out',
      mute:     'Member Muted',
      unmute:   'Member Unmuted',
      untimeout:'Timeout Removed',
      warn:     'Member Warned',
      unban:    'Member Unbanned',
    };

    const targetTag  = target?.tag || target?.user?.tag || target?.username || 'Unknown';
    const targetId   = target?.id  || 'Unknown';
    const execTag    = exec  ? `<@${exec.id}> **(${exec.tag || exec.username})**` : '🤖 AutoMod';

    const e = new EmbedBuilder()
      .setColor(colorMap[type] || COLORS.MOD)
      .setTitle(`${emojiMap[type] || '🔧'} ${titleMap[type] || type.toUpperCase()}`)
      .addFields(
        { name: 'Target',     value: `<@${targetId}> **(${targetTag})**`, inline: true },
        { name: 'Moderator',  value: execTag,                             inline: true },
        { name: 'Reason',     value: reason || 'No reason provided',      inline: false },
        { name: 'Time',       value: `<t:${Math.floor(Date.now()/1000)}:F>`, inline: true },
      );
    if(target?.displayAvatarURL) e.setThumbnail(target.displayAvatarURL({dynamic:true,size:256}));
    else if(target?.user?.displayAvatarURL) e.setThumbnail(target.user.displayAvatarURL({dynamic:true,size:256}));
    for(const [k,v] of Object.entries(extra)) e.addFields({name:k, value:''+v, inline:true});
    e.setFooter(foot()).setTimestamp();
    await send(ch, e);
  },

  async securityAlert(guild, type, description, extra={}){
    const ch = await getChannel(guild,'audit'); if(!ch) return;
    const e = new EmbedBuilder().setColor(COLORS.SECURITY).setTitle('🚨 SECURITY — '+type)
      .setDescription(description)
      .addFields({name:'Time',value:`<t:${Math.floor(Date.now()/1000)}:F>`,inline:true});
    for(const [k,v] of Object.entries(extra)) e.addFields({name:k,value:''+v,inline:true});
    e.setFooter(foot()).setTimestamp();
    await send(ch, e);
  },

  async inviteCreated(guild, invite){
    const ch = await getChannel(guild,'audit'); if(!ch) return;
    const inviter = invite.inviter ? `<@${invite.inviter.id}> **(${invite.inviter.tag})**` : 'Unknown';
    const channel = invite.channel ? `<#${invite.channel.id}> (\`${invite.channel.name}\`)` : 'Unknown';
    const maxAge  = invite.maxAge === 0 ? '♾️ Never' : `${Math.floor(invite.maxAge/3600)}h ${Math.floor((invite.maxAge%3600)/60)}m`;
    const maxUses = invite.maxUses === 0 ? '♾️ Unlimited' : `${invite.maxUses}`;
    
    const e = new EmbedBuilder().setColor(COLORS.SUCCESS).setTitle('🔗 Invite Created')
      .setDescription(`**Invite Code:** \`${invite.code}\`\n**URL:** https://discord.gg/${invite.code}`)
      .addFields(
        {name:'Created By',value:inviter,inline:true},
        {name:'Channel',value:channel,inline:true},
        {name:'Expires In',value:maxAge,inline:true},
        {name:'Max Uses',value:maxUses,inline:true},
        {name:'Temporary',value:invite.temporary ? 'Yes' : 'No',inline:true},
        {name:'Time',value:`<t:${Math.floor(Date.now()/1000)}:F>`,inline:true},
      )
      .setFooter(foot()).setTimestamp();
    if(invite.inviter) e.setThumbnail(invite.inviter.displayAvatarURL({dynamic:true,size:256}));
    await send(ch, e);
  },

  async inviteDeleted(guild, invite){
    const ch = await getChannel(guild,'audit'); if(!ch) return;
    const channel = invite.channel ? `<#${invite.channel.id}> (\`${invite.channel.name}\`)` : 'Unknown';
    
    const e = new EmbedBuilder().setColor(COLORS.ERROR).setTitle('🔗 Invite Deleted')
      .setDescription(`**Invite Code:** \`${invite.code}\`\n**URL:** ~~https://discord.gg/${invite.code}~~`)
      .addFields(
        {name:'Channel',value:channel,inline:true},
        {name:'Uses',value:`${invite.uses || 0}`,inline:true},
        {name:'Time',value:`<t:${Math.floor(Date.now()/1000)}:F>`,inline:true},
      )
      .setFooter(foot()).setTimestamp();
    await send(ch, e);
  },
};

module.exports = L;
