
require('dotenv').config();
const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

const commands = [];
const base = path.join(__dirname,'commands');
for(const cat of fs.readdirSync(base)){
  const cp=path.join(base,cat);
  if(!fs.statSync(cp).isDirectory()) continue;
  for(const file of fs.readdirSync(cp).filter(f=>f.endsWith('.js'))){
    try{
      const cmd = require(path.join(cp,file));
      if(cmd.data) commands.push(cmd.data.toJSON());
    }catch(e){ console.error(chalk.red('[DEPLOY] Failed to load',file,e.message)); }
  }
}

const rest = new REST({version:'10'}).setToken(process.env.TOKEN);

(async()=>{
  try{
    console.log(chalk.blue('[DEPLOY] Deploying '+commands.length+' commands...'));
    const isGuild = process.argv.includes('--guild');
    if(isGuild){
      await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),{body:commands});
      console.log(chalk.green('[DEPLOY] Guild commands deployed (instant refresh)'));
    }else{
      await rest.put(Routes.applicationCommands(process.env.CLIENT_ID),{body:commands});
      console.log(chalk.green('[DEPLOY] Global commands deployed (may take up to 1 hour)'));
    }
  }catch(e){ console.error(chalk.red('[DEPLOY] Error:',e)); }
})();
