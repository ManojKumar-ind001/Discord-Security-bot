const fs   = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '..', '..', 'bot-config.json');

// Default bot config
let config = {
  activity: {
    type: 'watching',  // playing, watching, listening, streaming, custom
    message: '/help | Security Bot',
    status: 'dnd',     // online, idle, dnd
  },
};

// Load from file
try {
  if(fs.existsSync(configPath)){
    const raw = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    config = { ...config, ...raw };
    console.log('[BOT CONFIG] Loaded bot-config.json');
  }
} catch(e){
  console.error('[BOT CONFIG] Failed to load:', e.message);
}

// Save to file
function save(){
  try{
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
  }catch(e){
    console.error('[BOT CONFIG] Failed to save:', e.message);
  }
}

module.exports = {
  get(){
    return config;
  },

  setActivity(type, message, status){
    config.activity = { type, message, status };
    save();
  },
};
