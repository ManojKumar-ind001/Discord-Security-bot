# 🛡️ GAMERZ WORKSHOP Security Bot

A powerful Discord security and moderation bot built with Discord.js v14.

**🌐 Bot Owner:** [Manoj Kumar](https://www.manojinfo.in/)

---

## ⚙️ Setup & Installation

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env` and fill in:
```env
TOKEN=your_bot_token
CLIENT_ID=your_bot_client_id
GUILD_ID=your_server_id
```

### 3. Deploy Commands
```bash
node src/deploy-commands.js --guild
```

### 4. Start Bot
```bash
node src/index.js
# or with auto-restart:
npx nodemon src/index.js
```

---

## 📋 First Time Setup

After bot is online, run these commands:

1. **`/setup logs type:Audit Log channel:#audit-logs`** — Set audit log channel
2. **`/setup logs type:Join/Leave Log channel:#join-logs`** — Set join/leave log channel
3. **`/setup logs type:Voice Log channel:#vc-logs`** — Set voice log channel
4. **`/setup logs type:Message Log channel:#message-logs`** — Set message log channel
5. **`/automod`** — Configure AutoMod modules
6. **`/security trappedchannel channel:#honeytrap`** — Set honeypot channel (optional)

---

## 📊 Log Channels

| Log Type | What it logs |
|---|---|
| **Audit Log** | Mod actions (ban/kick/mute/timeout), Role add/remove, Avatar changes, Username changes, Channel create/delete/update, Role create/delete, Invite create/delete, Security alerts |
| **Join/Leave Log** | Member joins (with account age warning for new accounts), Member leaves (with roles list) |
| **Voice Log** | VC join, VC leave, VC switch between channels |
| **Message Log** | Message deleted (with content + attachments), Message edited (before/after) |

---

## 🤖 AutoMod System

Configure via **`/automod`** command — interactive dashboard with dropdowns.

### 💬 Anti-Spam
Detects rapid message spam and takes action.
- **Threshold** — How many messages trigger it (default: 7)
- **Interval** — Time window in seconds (default: 5s)
- **Action** — `timeout` (1 min) or `delete`
- On trigger: Deletes all spam messages + applies action
- Admins/Mods with ManageGuild are exempt

### 🔗 Anti-Links
Blocks specific domains. All other links are allowed.
- **Blocked Domains** — Add domains to block (e.g. `youtube.com`)
- **Threshold** — How many blocked links trigger action (default: 1)
- **Action** — `timeout` (2 min) or `delete`
- If blocked domains list is empty, no links are blocked

### 📢 Anti-Mention
Prevents mass mention spam.
- **Threshold** — How many mentions trigger it (default: 5)
- **Action** — `timeout` (2 min) or `delete`
- **Protected Roles** — Specific role IDs that trigger action if mentioned (optional)
- Counts both user mentions and role mentions

---

## 🔨 Moderation Commands

### `/ban` - Ban a user
**Usage:** `/ban user:@username reason:"Spamming" days:7`
- `user` - Select the user to ban
- `reason` - Why they're being banned (optional)
- `days` - Delete their message history (0-7 days, default: 0)
- **Example:** `/ban user:@Spammer reason:"Advertising" days:1`

### `/unban` - Unban a user
**Usage:** `/unban userid:123456789 reason:"Appeal accepted"`
- `userid` - Discord User ID (right-click user → Copy ID)
- `reason` - Why they're being unbanned (optional)
- **Example:** `/unban userid:836475130544783360 reason:"Mistake"`

### `/kick` - Kick a user
**Usage:** `/kick user:@username reason:"Breaking rules"`
- `user` - Select the user to kick
- `reason` - Why they're being kicked (optional)
- **Example:** `/kick user:@Troublemaker reason:"Toxic behavior"`

### `/mute` - Timeout a user
**Usage:** `/mute user:@username duration:10m reason:"Spam"`
- `user` - Select the user to timeout
- `duration` - How long (10m, 1h, 2d, max 28d)
- `reason` - Why they're being muted (optional)
- **Examples:**
  - `/mute user:@Spammer duration:10m reason:"Spam"`
  - `/mute user:@Toxic duration:1h reason:"Toxic chat"`
  - `/mute user:@Raider duration:1d reason:"Raid attempt"`

### `/unmute` - Remove timeout
**Usage:** `/unmute user:@username reason:"Timeout served"`
- `user` - Select the user to unmute
- `reason` - Why timeout is being removed (optional)
- **Example:** `/unmute user:@User reason:"Apologized"`

### `/warn` - Give a warning
**Usage:** `/warn user:@username reason:"Mild spam"`
- `user` - Select the user to warn
- `reason` - What they did wrong
- **Example:** `/warn user:@NewUser reason:"Please don't spam"`

### `/warning view` - View warnings
**Usage:** `/warning view user:@username`
- Shows all warnings with dates and reasons
- **Example:** `/warning view user:@Troublemaker`

### `/clearwarn` - Clear all warnings
**Usage:** `/clearwarn user:@username`
- Removes all warnings from a user
- **Example:** `/clearwarn user:@ReformedUser`

### `/purge` - Delete messages
**Usage:** `/purge amount:50`
- `amount` - How many messages to delete (1-100)
- **Example:** `/purge amount:20`

### `/lock` - Lock a channel
**Usage:** `/lock channel:#general reason:"Heated argument"`
- `channel` - Channel to lock (optional, defaults to current)
- `reason` - Why it's being locked (optional)
- **Example:** `/lock channel:#general reason:"Cooling down"`

### `/unlock` - Unlock a channel
**Usage:** `/unlock channel:#general reason:"Situation resolved"`
- `channel` - Channel to unlock (optional, defaults to current)
- `reason` - Why it's being unlocked (optional)
- **Example:** `/unlock channel:#general`

### `/lockdown start` - Lock entire server
**Usage:** `/lockdown start reason:"Raid in progress"`
- Locks ALL channels in the server
- Use only in emergencies
- **Example:** `/lockdown start reason:"Mass raid"`

### `/lockdown end` - Unlock entire server
**Usage:** `/lockdown end`
- Unlocks ALL channels
- **Example:** `/lockdown end`

### `/slowmode` - Set slowmode
**Usage:** `/slowmode seconds:10 channel:#general`
- `seconds` - Delay between messages (0 = disable, max 21600)
- `channel` - Channel to apply slowmode (optional, defaults to current)
- **Examples:**
  - `/slowmode seconds:5 channel:#general`
  - `/slowmode seconds:0 channel:#chat` (disable slowmode)

### `/role` - Manage roles
**Usage:** `/role add user:@username role:@Member`
**Usage:** `/role remove user:@username role:@Muted`
- `action` - Choose `add` or `remove`
- `user` - Select the user
- `role` - Select the role
- **Examples:**
  - `/role add user:@NewUser role:@Verified`
  - `/role remove user:@User role:@VIP`

### `/banlist` - View banned users
**Usage:** `/banlist`
- Shows all banned users with their IDs
- **Example:** `/banlist`

---

## 🛡️ Security Commands

### `/automod` - Configure AutoMod
**Usage:** `/automod`
- Opens interactive dashboard
- Use dropdown to select module (Anti-Spam, Anti-Links, Anti-Mention)
- Click "Enable/Disable Module" button
- Click "Configure Settings" to change thresholds and actions
- **Steps:**
  1. Run `/automod`
  2. Select "Anti-Links" from dropdown
  3. Click "Enable Module" (turns green)
  4. Click "Configure Settings"
  5. Fill in modal: threshold=1, action=delete, domains=youtube.com, .gg, discord.gg
  6. Click Submit

### `/security status` - View security overview
**Usage:** `/security status`
- Shows AutoMod module status (enabled/disabled)
- Shows log channels
- Shows bot health (ping, uptime)
- **Example:** `/security status`

### `/security trappedchannel` - Set honeypot
**Usage:** `/security trappedchannel channel:#honeytrap`
- Anyone who types there gets 24h timeout
- Their last 12h messages are deleted
- **Example:** `/security trappedchannel channel:#free-nitro`

### `/security joinrole` - Auto-role on join
**Usage:** `/security joinrole role:@Member`
- New members automatically get this role
- **Example:** `/security joinrole role:@Unverified`

### `/security joinmsg` - Welcome DM
**Usage:** `/security joinmsg message:"Welcome {user} to {server}!"`
- New members get this DM
- Use `{user}` for username, `{server}` for server name
- **Example:** `/security joinmsg message:"Hey {user}! Welcome to {server}. Read #rules first!"`

### `/setup logs` - Configure log channels
**Usage:** `/setup logs type:Audit Log channel:#audit-logs`
- `type` - Choose: Audit Log, Join/Leave Log, Voice Log, Message Log
- `channel` - Select the channel
- **Examples:**
  - `/setup logs type:Audit Log channel:#mod-logs`
  - `/setup logs type:Join/Leave Log channel:#join-logs`
  - `/setup logs type:Voice Log channel:#vc-logs`
  - `/setup logs type:Message Log channel:#message-logs`

### `/setup view` - View log channels
**Usage:** `/setup view`
- Shows all configured log channels
- **Example:** `/setup view`

### `/modconfig` - Configure mod/admin roles
**Usage:** `/modconfig`
- View current mod and admin roles
- Roles are auto-detected hourly
- **Example:** `/modconfig`

---

## ℹ️ Info Commands

### `/help` - Interactive help menu
**Usage:** `/help`
- Opens dropdown menu
- Select category to see commands
- **Example:** `/help`

### `/userinfo` - View user info
**Usage:** `/userinfo user:@username`
- Shows join date, account age, roles, etc.
- **Example:** `/userinfo user:@Manoj`

### `/serverinfo` - View server info
**Usage:** `/serverinfo`
- Shows member count, channels, roles, boost level
- **Example:** `/serverinfo`

### `/avatar` - View user avatar
**Usage:** `/avatar user:@username`
- Shows full-size profile picture
- **Example:** `/avatar user:@Manoj`

### `/botinfo` - View bot info
**Usage:** `/botinfo`
- Shows uptime, ping, server count
- **Example:** `/botinfo`

---

## 🔧 Utility Commands

### `/ping` - Check bot latency
**Usage:** `/ping`
- Shows bot response time and API ping
- **Example:** `/ping`

### `/uptime` - Check bot uptime
**Usage:** `/uptime`
- Shows how long bot has been online
- **Example:** `/uptime`

### `/activity` - Change bot status
**Usage:** `/activity type:Watching message:"/help | Security Bot" status:dnd`
- `type` - Playing, Watching, Listening, Streaming, Custom
- `message` - Activity text
- `status` - online, idle, dnd
- Settings persist across restarts
- **Examples:**
  - `/activity type:Watching message:"/help" status:dnd`
  - `/activity type:Playing message:"Minecraft" status:online`
  - `/activity type:Listening message:"Spotify" status:idle`

### `/embed` - Create custom embed
**Usage:** `/embed`
- Opens modal to create rich embed message
- **Example:** `/embed`

### `/say` - Make bot speak
**Usage:** `/say message:"Hello everyone!"`
- Bot sends your message
- Mod only
- **Example:** `/say message:"Server maintenance in 10 minutes"`

### `/nick` - Change nickname
**Usage:** `/nick user:@username nickname:"New Name"`
- Changes user's server nickname
- **Example:** `/nick user:@User nickname:"VIP Member"`

### `/poll` - Create a poll
**Usage:** `/poll question:"Best game?" options:"Minecraft, Fortnite, Valorant"`
- `question` - Poll question
- `options` - Comma-separated options (max 4)
- **Example:** `/poll question:"Movie night?" options:"Friday, Saturday, Sunday"`

### `/suggest` - Submit suggestion
**Usage:** `/suggest suggestion:"Add music bot"`
- Sends suggestion to suggestions channel
- **Example:** `/suggest suggestion:"Weekly events please!"`

---

## 🪤 Honeypot / Trapped Channel

Set a channel that looks normal but traps bad actors.

**How it works:**
1. Set it with `/security trappedchannel channel:#honeytrap`
2. Make the channel visible to everyone but don't tell members what it is
3. If anyone sends a message there → **24 hour timeout** immediately
4. Bot deletes their **last 12 hours** of messages across all channels
5. Action is logged to audit log

**Tip:** Name it something suspicious like `#free-nitro` or `#admin-only` to catch raiders.

---

## ⚠️ Warning System

- `/warn user reason` — Add a warning
- `/warning view user` — See all warnings with reasons and dates
- `/clearwarn user` — Remove all warnings
- Warnings are stored permanently in `database.json`

---

## 💾 Database

Bot uses local JSON file storage (`database.json`). No MongoDB required.

**What is saved:**
- Log channel IDs
- AutoMod settings (enabled/disabled, thresholds, actions, blocked domains)
- Security settings (honeypot channel, join role, join message)
- Mod/Admin role IDs (auto-synced hourly)
- Warning history
- Bot activity settings

**Settings persist across restarts** — all configuration is saved immediately when changed.

---

## 📁 Project Structure

```
src/
├── commands/
│   ├── info/          # help, userinfo, serverinfo, avatar, botinfo
│   ├── moderation/    # ban, kick, mute, unmute, warn, lock, purge, etc.
│   ├── security/      # automod, setup, security, modconfig
│   └── utility/       # ping, uptime, activity, poll, embed, etc.
├── events/            # Discord event handlers
├── handlers/          # Command & Event loaders
├── models/            # Guild.js (database), BotConfig.js (activity)
└── utils/             # Logger.js, Embed.js, Permissions.js, messageCache.js
```

---

## 🔑 Permission Levels

| Level | Who | Can use |
|---|---|---|
| **Admin** | Roles with Administrator or ManageGuild | All security & setup commands |
| **Mod** | Roles with ModerateMembers or ManageMessages | All moderation commands |
| **Everyone** | All members | Info & utility commands |

Roles are auto-detected hourly based on Discord permissions. You can also manually configure them with `/modconfig`.

---

## 👨‍💻 Developer

**Created by:** [Manoj Kumar](https://www.manojinfo.in/)

For support, custom bot development, or inquiries, visit [manojinfo.in](https://www.manojinfo.in/)

---

## 📝 License

This bot is developed and maintained by Manoj Kumar. All rights reserved.
