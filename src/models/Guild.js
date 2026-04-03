const fs   = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', '..', 'database.json');

// ── Load file into memory on startup ──────────────────────────────────────────
const mem = new Map();
try {
  if(fs.existsSync(dbPath)){
    const raw = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
    for(const [k, v] of Object.entries(raw)) mem.set(k, v);
    console.log('[DB] Loaded database.json —', mem.size, 'guild(s)');
  }
} catch(e){
  console.error('[DB] Failed to load database.json:', e.message);
}

// ── Persist memory → file ─────────────────────────────────────────────────────
function saveLocal(){
  try{
    const obj = {};
    for(const [k, v] of mem.entries()) obj[k] = v;
    fs.writeFileSync(dbPath, JSON.stringify(obj, null, 2), 'utf-8');
    console.log('[DB] Saved to database.json');
  }catch(e){
    console.error('[DB] Failed to save database.json:', e.message);
  }
}

// ── Default structure ─────────────────────────────────────────────────────────
function defaultData(guildId){
  return {
    guildId,
    prefix: '!',
    logChannels: { audit: null, join: null, vc: null, message: null },
    security: {
      verificationRole: null, trappedChannel: null,
    },
    automod: {
      antiSpam:    { enabled: true,  threshold: 7, interval: 5, action: 'timeout' },
      antiLinks:   { enabled: false, threshold: 1, action: 'delete', allowedDomains: [] },
      antiMention: { enabled: true,  threshold: 5, action: 'timeout', protectedRoles: [] },
    },
    joinMessage: null,
    modRoles: [], adminRoles: [],
    mutedRole: null, welcomeChannel: null,
    warns: [],
  };
}

// ── Ensure structure without replacing existing values ────────────────────────
function ensureStructure(data, guildId){
  const def = defaultData(guildId);

  // Top-level objects
  if(!data.logChannels) data.logChannels = {};
  if(!data.security)    data.security    = {};
  if(!data.automod)     data.automod     = {};

  // logChannels — fill missing keys only
  for(const key in def.logChannels){
    if(!(key in data.logChannels)) data.logChannels[key] = def.logChannels[key];
  }

  // security — fill missing keys only
  for(const key in def.security){
    if(!(key in data.security)) data.security[key] = def.security[key];
  }

  // automod — fill missing MODULE objects only, never overwrite existing ones
  for(const key in def.automod){
    if(!(key in data.automod)) data.automod[key] = def.automod[key];
  }
  // Remove old/removed automod keys
  delete data.automod.antiRaid;
  delete data.automod.lockOnRaid;

  // Arrays
  if(!Array.isArray(data.warns))      data.warns      = [];
  if(!Array.isArray(data.modRoles))   data.modRoles   = [];
  if(!Array.isArray(data.adminRoles)) data.adminRoles = [];

  // Scalar defaults
  if(!data.prefix)   data.prefix   = def.prefix;
  if(!data.guildId)  data.guildId  = guildId;
  if(data.joinMessage   === undefined) data.joinMessage   = null;
  if(data.mutedRole     === undefined) data.mutedRole     = null;
  if(data.welcomeChannel=== undefined) data.welcomeChannel= null;

  return data;
}

// ── Public API ────────────────────────────────────────────────────────────────
module.exports = {
  async get(guildId){
    if(!mem.has(guildId)){
      const fresh = defaultData(guildId);
      mem.set(guildId, fresh);
      saveLocal();
      return fresh;
    }
    // Return direct reference from mem with structure ensured
    const data = mem.get(guildId);
    ensureStructure(data, guildId);
    return data;
  },

  async save(guildId, data){
    try{
      console.log('[DB] Saving guild', guildId, 'logChannels:', data.logChannels);
      mem.set(guildId, data);
      saveLocal();
      return data;
    }catch(e){
      console.error('[DB] Save failed for guild', guildId, ':', e.message);
      return data;
    }
  },
};
