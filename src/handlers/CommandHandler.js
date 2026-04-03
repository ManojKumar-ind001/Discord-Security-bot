
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

class CommandHandler {
  constructor(client){ this.client = client; }
  load(){
    const base = path.join(__dirname,'../commands');
    let n = 0;
    for(const cat of fs.readdirSync(base)){
      const catPath = path.join(base,cat);
      if(!fs.statSync(catPath).isDirectory()) continue;
      for(const file of fs.readdirSync(catPath).filter(f=>f.endsWith('.js'))){
        try{
          const cmd = require(path.join(catPath,file));
          if(cmd.data) this.client.slashCommands.set(cmd.data.name, cmd), n++;
          if(cmd.prefixName) this.client.prefixCommands.set(cmd.prefixName, cmd);
        }catch(e){ console.error(chalk.red('[CMD] Failed:',file,e.message)); }
      }
    }
    console.log(chalk.green('[CMD] Loaded '+n+' slash commands'));
  }
}
module.exports = CommandHandler;
