const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  SectionBuilder,
  ThumbnailBuilder,
  MessageFlags,
  AuditLogEvent,
} = require('discord.js');
const GuildModel = require('../models/Guild');

// ─── Channel resolver ────────────────────────────────────────────────────
async function getChannel(guild, type) {
  try {
    const d = await GuildModel.get(guild.id);
    const id = d.logChannels?.[type] || d.logChannels?.audit;
    if (!id) return null;
    const ch = guild.channels.cache.get(id) || await guild.channels.fetch(id).catch(() => null);
    return ch;
  } catch (e) {
    console.error(`[LOG] Error getting ${type} channel:`, e.message);
    return null;
  }
}

// ─── V2 builder helpers ──────────────────────────────────────────────────
function sep() {
  return new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small);
}
function txt(content) {
  return new TextDisplayBuilder().setContent(content);
}

/**
 * Build a clean, modern log container.
 */
function logContainer(_color, titleLine, fields, thumbURL = null) {
  const c = new ContainerBuilder();

  // Title
  c.addTextDisplayComponents(txt(titleLine));
  c.addSeparatorComponents(sep());

  if (thumbURL) {
    const sectionFields = fields.slice(0, Math.min(4, fields.length));
    const restFields    = fields.slice(sectionFields.length);

    const section = new SectionBuilder()
      .addTextDisplayComponents(...sectionFields.map(f => txt(f)))
      .setThumbnailAccessory(new ThumbnailBuilder({ media: { url: thumbURL } }));
    c.addSectionComponents(section);

    if (restFields.length) {
      c.addSeparatorComponents(sep());
      restFields.forEach(f => c.addTextDisplayComponents(txt(f)));
    }
  } else {
    fields.forEach(f => c.addTextDisplayComponents(txt(f)));
  }

  // Divider above footer
  c.addSeparatorComponents(sep());
  c.addTextDisplayComponents(txt('-# GAMERZ WORKSHOP Security'));
  return c;
}

/** Send a V2 container to a log channel */
async function send(ch, container) {
  try {
    if (ch) await ch.send({ flags: MessageFlags.IsComponentsV2, components: [container] });
  } catch (e) {
    console.error('[LOG SEND ERROR]', e.message);
  }
}

// ─── Timestamp helper ────────────────────────────────────────────────────
function ts(ms = Date.now()) { return `<t:${Math.floor(ms / 1000)}:F>`; }

// ════════════════════════════════════════════════════════════════════════
const L = {

  async roleAdded(guild, member, role, exec) {
    const ch = await getChannel(guild, 'audit'); if (!ch) return;
    const mTag = member?.user?.tag || member?.displayName || member?.id || 'Unknown';
    const thumb = member?.user?.displayAvatarURL?.({ size: 256 }) || null;
    await send(ch, logContainer(null, '## Role Added', [
      `**Member:** <@${member?.id}> (${mTag})`,
      `**Role:** ${role} \`${role.name}\``,
      `**Role ID:** \`${role.id}\``,
      `**Executor:** ${exec ? `<@${exec.id}> (${exec.tag})` : 'Unknown'}`,
      `**Member ID:** \`${member?.id}\``,
      `**Time:** ${ts()}`,
    ], thumb));
  },

  async roleRemoved(guild, member, role, exec) {
    const ch = await getChannel(guild, 'audit'); if (!ch) return;
    const mTag = member?.user?.tag || member?.displayName || member?.id || 'Unknown';
    const thumb = member?.user?.displayAvatarURL?.({ size: 256 }) || null;
    await send(ch, logContainer(null, '## Role Removed', [
      `**Member:** <@${member?.id}> (${mTag})`,
      `**Role:** ${role} \`${role.name}\``,
      `**Role ID:** \`${role.id}\``,
      `**Executor:** ${exec ? `<@${exec.id}> (${exec.tag})` : 'Unknown'}`,
      `**Member ID:** \`${member?.id}\``,
      `**Time:** ${ts()}`,
    ], thumb));
  },

  async memberJoin(guild, member) {
    const ch = await getChannel(guild, 'join'); if (!ch) return;
    const user = member?.user || member;
    const age = user?.createdTimestamp ? Math.floor((Date.now() - user.createdTimestamp) / 86400000) : 'Unknown';
    const fields = [
      `**User:** <@${user?.id}> (${user?.tag || user?.username || 'Unknown'}) joined the server.`,
      `**User ID:** \`${user?.id}\``,
      `**Account Age:** ${age} days`,
      `**Member Count:** ${guild.memberCount}`,
      `**Account Created:** ${user?.createdTimestamp ? ts(user.createdTimestamp) : 'Unknown'}`,
      `**Joined At:** ${ts()}`,
    ];
    if (typeof age === 'number' && age < 7) fields.push(`**Notice:** New Account — Only ${age} days old.`);
    const thumb = user?.displayAvatarURL?.({ size: 256 }) || null;
    await send(ch, logContainer(null, '## Member Joined', fields, thumb));
  },

  async memberLeave(guild, member) {
    const ch = await getChannel(guild, 'join'); if (!ch) return;
    const user = member?.user || member;
    const roles = member?.roles?.cache?.filter(r => r.id !== guild.id).map(r => r.toString()).join(', ') || 'None';
    const thumb = user?.displayAvatarURL?.({ size: 256 }) || null;
    await send(ch, logContainer(null, '## Member Left', [
      `**User:** ${user?.tag || user?.username || 'Unknown'} left the server.`,
      `**User ID:** \`${user?.id}\``,
      `**Member Count:** ${guild.memberCount}`,
      `**Left At:** ${ts()}`,
      `**Roles [${(member?.roles?.cache?.size || 1) - 1}]:** ${roles.substring(0, 500) || 'None'}`,
    ], thumb));
  },

  async messageDeleted(guild, message) {
    if (message.author?.bot) return;
    const ch = await getChannel(guild, 'message'); if (!ch) return;

    const channelId = message.channelId || message.channel?.id;
    const channelDisplay = channelId ? `<#${channelId}>` : (message.channel?.name || 'Unknown Channel');

    let executor = 'Self-deleted / Unknown';
    try {
      await new Promise(r => setTimeout(r, 600));
      const audit = await guild.fetchAuditLogs({ limit: 5, type: AuditLogEvent.MessageDelete });
      for (const entry of audit.entries.values()) {
        if (Date.now() - entry.createdTimestamp < 12000 && (entry.target?.id === message.author?.id || entry.extra?.channel?.id === channelId)) {
          executor = `<@${entry.executor.id}> (${entry.executor.tag || entry.executor.username})`;
          break;
        }
      }
    } catch {}

    const author = message.author
      ? `<@${message.author.id}> (${message.author.tag || message.author.username})`
      : 'Unknown (uncached)';

    let content;
    if (message.content === null || message.content === undefined) {
      content = '_[Message content uncached]_';
    } else if (message.content.trim() === '') {
      content = '_[No text — media or attachment only]_';
    } else {
      content = message.content.substring(0, 900);
    }

    const fields = [
      `**Author:** ${author}`,
      `**Channel:** ${channelDisplay}`,
      `**Deleted By:** ${executor}`,
      `**Message ID:** \`${message.id}\``,
      `**User ID:** \`${message.author?.id || 'Unknown'}\``,
      `**Sent At:** ${message.createdTimestamp ? ts(message.createdTimestamp) : 'Unknown'}`,
      `**Content:**\n>>> ${content}`,
    ];

    let attList = [];
    if (message.attachments instanceof Map) attList = Array.from(message.attachments.values());
    else if (Array.isArray(message.attachments)) attList = message.attachments;
    if (attList.length > 0) {
      fields.push(`**Attachments (${attList.length}):** ${attList.map(a => `[${a.name || 'file'}](${a.url})`).join(', ').substring(0, 500)}`);
    }

    await send(ch, logContainer(null, '## Message Deleted', fields));
  },

  async messageEdited(guild, oldMsg, newMsg) {
    if (oldMsg.author?.bot || oldMsg.content === newMsg.content) return;
    const ch = await getChannel(guild, 'message'); if (!ch) return;
    const author = oldMsg.author ? `<@${oldMsg.author.id}> (${oldMsg.author.tag || oldMsg.author.username})` : 'Unknown';
    await send(ch, logContainer(null, '## Message Edited', [
      `**Author:** ${author}`,
      `**Channel:** <#${newMsg.channelId}>`,
      `**Jump to Message:** [Click Here](${newMsg.url})`,
      `**Message ID:** \`${newMsg.id}\``,
      `**Edited At:** ${ts()}`,
      `**Before:**\n>>> ${oldMsg.content?.substring(0, 450) || '_[Empty / Uncached]_'}`,
      `**After:**\n>>> ${newMsg.content?.substring(0, 450) || '_[Empty]_'}`,
    ]));
  },

  async vcJoined(guild, member, channel) {
    const ch = await getChannel(guild, 'vc'); if (!ch) return;
    const mId = member?.id || member?.user?.id || 'Unknown';
    const mTag = member?.user?.tag || member?.user?.username || member?.displayName || mId;
    const thumb = member?.user?.displayAvatarURL?.({ size: 256 }) || member?.displayAvatarURL?.({ size: 256 }) || null;
    await send(ch, logContainer(null, '## Joined Voice Channel', [
      `**Member:** <@${mId}> (${mTag})`,
      `**Channel:** **${channel?.name || 'Voice Channel'}** \`${channel?.id || ''}\``,
      `**User ID:** \`${mId}\``,
      `**Time:** ${ts()}`,
    ], thumb));
  },

  async vcLeft(guild, member, channel) {
    const ch = await getChannel(guild, 'vc'); if (!ch) return;
    const mId = member?.id || member?.user?.id || 'Unknown';
    const mTag = member?.user?.tag || member?.user?.username || member?.displayName || mId;
    const thumb = member?.user?.displayAvatarURL?.({ size: 256 }) || member?.displayAvatarURL?.({ size: 256 }) || null;
    await send(ch, logContainer(null, '## Left Voice Channel', [
      `**Member:** <@${mId}> (${mTag})`,
      `**Channel:** **${channel?.name || 'Voice Channel'}** \`${channel?.id || ''}\``,
      `**User ID:** \`${mId}\``,
      `**Time:** ${ts()}`,
    ], thumb));
  },

  async vcMoved(guild, member, oldCh, newCh) {
    const ch = await getChannel(guild, 'vc'); if (!ch) return;
    const mId = member?.id || member?.user?.id || 'Unknown';
    const mTag = member?.user?.tag || member?.user?.username || member?.displayName || mId;
    const thumb = member?.user?.displayAvatarURL?.({ size: 256 }) || member?.displayAvatarURL?.({ size: 256 }) || null;
    await send(ch, logContainer(null, '## Switched Voice Channel', [
      `**Member:** <@${mId}> (${mTag})`,
      `**From:** **${oldCh?.name || 'Old Channel'}** \`${oldCh?.id || ''}\``,
      `**To:** **${newCh?.name || 'New Channel'}** \`${newCh?.id || ''}\``,
      `**User ID:** \`${mId}\``,
      `**Time:** ${ts()}`,
    ], thumb));
  },

  async channelCreated(guild, channel, exec) {
    const ch = await getChannel(guild, 'audit'); if (!ch) return;
    await send(ch, logContainer(null, '## Channel Created', [
      `**Channel:** ${channel} \`${channel.name}\``,
      `**Type:** \`${channel.type}\``,
      `**Channel ID:** \`${channel.id}\``,
      `**Executor:** ${exec ? `<@${exec.id}> (${exec.tag})` : 'Unknown'}`,
      `**Time:** ${ts()}`,
    ]));
  },

  async channelDeleted(guild, channel, exec) {
    const ch = await getChannel(guild, 'audit'); if (!ch) return;
    await send(ch, logContainer(null, '## Channel Deleted', [
      `**Channel Name:** \`${channel.name}\``,
      `**Channel ID:** \`${channel.id}\``,
      `**Type:** \`${channel.type}\``,
      `**Executor:** ${exec ? `<@${exec.id}> (${exec.tag})` : 'Unknown'}`,
      `**Time:** ${ts()}`,
    ]));
  },

  async channelUpdated(guild, oldC, newC, exec) {
    const ch = await getChannel(guild, 'audit'); if (!ch) return;
    const changes = [];
    if (oldC.name !== newC.name)   changes.push(`**Name:** \`${oldC.name}\` → \`${newC.name}\``);
    if (oldC.topic !== newC.topic) changes.push(`**Topic:** \`${oldC.topic || 'None'}\` → \`${newC.topic || 'None'}\``);
    if (oldC.nsfw !== newC.nsfw)   changes.push(`**NSFW:** ${oldC.nsfw} → ${newC.nsfw}`);
    if (!changes.length) return;
    await send(ch, logContainer(null, '## Channel Updated', [
      `**Channel:** ${newC} \`${newC.name}\``,
      `**Channel ID:** \`${newC.id}\``,
      `**Executor:** ${exec ? `<@${exec.id}> (${exec.tag})` : 'Unknown'}`,
      `**Changes:**\n${changes.join('\n')}`,
      `**Time:** ${ts()}`,
    ]));
  },

  async roleCreated(guild, role, exec) {
    const ch = await getChannel(guild, 'audit'); if (!ch) return;
    await send(ch, logContainer(null, '## Role Created', [
      `**Role:** ${role} \`${role.name}\``,
      `**Role ID:** \`${role.id}\``,
      `**Color:** \`${role.hexColor}\``,
      `**Executor:** ${exec ? `<@${exec.id}> (${exec.tag})` : 'Unknown'}`,
      `**Time:** ${ts()}`,
    ]));
  },

  async roleDeleted(guild, role, exec) {
    const ch = await getChannel(guild, 'audit'); if (!ch) return;
    await send(ch, logContainer(null, '## Role Deleted', [
      `**Role Name:** \`${role.name}\``,
      `**Role ID:** \`${role.id}\``,
      `**Color:** \`${role.hexColor}\``,
      `**Executor:** ${exec ? `<@${exec.id}> (${exec.tag})` : 'Unknown'}`,
      `**Time:** ${ts()}`,
    ]));
  },

  async avatarChanged(guild, user, oldURL, newURL) {
    const ch = await getChannel(guild, 'audit'); if (!ch) return;
    const fields = [
      `**User:** <@${user.id}> (${user.tag}) changed their profile picture`,
      `**User ID:** \`${user.id}\``,
      `**Time:** ${ts()}`,
      `**Old Avatar:** ${oldURL ? `[Click to view](${oldURL})` : 'No previous avatar'}`,
      `**New Avatar:** [Click to view](${newURL})`,
    ];
    await send(ch, logContainer(null, '## Avatar Changed', fields, newURL));
  },

  async usernameChanged(guild, oldUser, newUser) {
    const ch = await getChannel(guild, 'audit'); if (!ch) return;
    const changes = [];
    if (oldUser.username !== newUser.username)
      changes.push(`**Username:** \`${oldUser.username}\` → \`${newUser.username}\``);
    if (oldUser.discriminator !== newUser.discriminator)
      changes.push(`**Tag:** \`#${oldUser.discriminator}\` → \`#${newUser.discriminator}\``);
    if (!changes.length) return;
    await send(ch, logContainer(null, '## Username Changed', [
      `**User:** <@${newUser.id}> changed their username`,
      `**Old:** \`${oldUser.tag}\``,
      `**New:** \`${newUser.tag}\``,
      `**User ID:** \`${newUser.id}\``,
      `**Changes:**\n${changes.join('\n')}`,
      `**Time:** ${ts()}`,
    ], newUser.displayAvatarURL?.({ size: 256 }) || null));
  },

  async modAction(guild, type, target, exec, reason, extra = {}) {
    const ch = await getChannel(guild, 'audit'); if (!ch) return;

    const titleMap = {
      ban: 'Member Banned', kick: 'Member Kicked', timeout: 'Member Timed Out',
      mute: 'Member Muted', unmute: 'Member Unmuted', untimeout: 'Timeout Removed',
      warn: 'Member Warned', unban: 'Member Unbanned',
    };

    const targetTag = target?.tag || target?.user?.tag || target?.username || 'Unknown';
    const targetId  = target?.id  || target?.user?.id || 'Unknown';
    const execTag   = exec ? `<@${exec.id}> (${exec.tag || exec.username})` : 'AutoMod';
    const thumbURL  = target?.displayAvatarURL?.({ size: 256 })
                   || target?.user?.displayAvatarURL?.({ size: 256 })
                   || null;

    const fields = [
      `**Target:** <@${targetId}> (${targetTag})`,
      `**Moderator:** ${execTag}`,
      `**Reason:** ${reason || 'No reason provided'}`,
      `**Time:** ${ts()}`,
      ...Object.entries(extra).map(([k, v]) => `**${k}:** ${v}`),
    ];

    await send(ch, logContainer(
      null,
      `## ${titleMap[type] || type.toUpperCase()}`,
      fields,
      thumbURL,
    ));
  },

  async securityAlert(guild, type, description, extra = {}) {
    const ch = await getChannel(guild, 'audit'); if (!ch) return;
    const fields = [
      description,
      `**Time:** ${ts()}`,
      ...Object.entries(extra).map(([k, v]) => `**${k}:** ${v}`),
    ];
    await send(ch, logContainer(null, `## Security Alert — ${type}`, fields));
  },

  async inviteCreated(guild, invite) {
    const ch = await getChannel(guild, 'audit'); if (!ch) return;
    const inviter = invite.inviter ? `<@${invite.inviter.id}> (${invite.inviter.tag})` : 'Unknown';
    const channel = invite.channel ? `<#${invite.channel.id}> (\`${invite.channel.name}\`)` : 'Unknown';
    const maxAge  = invite.maxAge === 0 ? 'Never' : `${Math.floor(invite.maxAge / 3600)}h ${Math.floor((invite.maxAge % 3600) / 60)}m`;
    const maxUses = invite.maxUses === 0 ? 'Unlimited' : `${invite.maxUses}`;
    const fields = [
      `**Invite Code:** \`${invite.code}\``,
      `**URL:** https://discord.gg/${invite.code}`,
      `**Created By:** ${inviter}`,
      `**Channel:** ${channel}`,
      `**Expires In:** ${maxAge}`,
      `**Max Uses:** ${maxUses}`,
      `**Temporary:** ${invite.temporary ? 'Yes' : 'No'}`,
      `**Time:** ${ts()}`,
    ];
    const thumb = invite.inviter ? invite.inviter.displayAvatarURL({ size: 256 }) : null;
    await send(ch, logContainer(null, '## Invite Created', fields, thumb));
  },

  async inviteDeleted(guild, invite) {
    const ch = await getChannel(guild, 'audit'); if (!ch) return;
    const channel = invite.channel ? `<#${invite.channel.id}> (\`${invite.channel.name}\`)` : 'Unknown';
    await send(ch, logContainer(null, '## Invite Deleted', [
      `**Invite Code:** \`${invite.code}\``,
      `**URL:** ~~https://discord.gg/${invite.code}~~`,
      `**Channel:** ${channel}`,
      `**Uses:** ${invite.uses || 0}`,
      `**Time:** ${ts()}`,
    ]));
  },
};

module.exports = L;
