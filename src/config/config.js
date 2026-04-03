module.exports = {
  BOT_NAME: 'GAMERZ WORKSHOP',
  PREFIX: '!',
  COLORS: {
    PRIMARY:  0x5865F2, SUCCESS: 0x57F287, ERROR: 0xED4245,
    WARNING:  0xFEE75C, SECURITY: 0xFF6B35, LOG: 0x2F3136,
    AUDIT:    0x7289DA, ROLE: 0x9B59B6,  VC: 0x1ABC9C,
    JOIN:     0x2ECC71, LEAVE: 0xE74C3C,  MOD: 0xE67E22,
  },
  EMOJIS: {
    SUCCESS:'✅', ERROR:'❌', WARNING:'⚠️', INFO:'ℹ️',
    SHIELD:'🛡️', LOCK:'🔒', UNLOCK:'🔓', BAN:'🔨',
    KICK:'👢',   MUTE:'🔇', WARN:'⚠️',   ROLE:'🏷️',
    LOG:'📋',    VC:'🔊',   JOIN:'📥',    LEAVE:'📤',
    EDIT:'✏️',   DELETE:'🗑️',PHOTO:'🖼️',  AUDIT:'📊', GAMER:'🎮',
  },
  SECURITY: {
    ANTI_RAID:    { JOIN_THRESHOLD: 10, JOIN_INTERVAL: 10000 },
    ANTI_SPAM:    { MSG_THRESHOLD: 7,   MSG_INTERVAL: 5000   },
    ANTI_MENTION: { THRESHOLD: 5 },
  },
};
