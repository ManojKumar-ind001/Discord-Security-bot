
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

class EventHandler {
  constructor(client){ this.client = client; }
  load(){
    const base = path.join(__dirname,'../events');
    let n = 0;
    for(const file of fs.readdirSync(base).filter(f=>f.endsWith('.js'))){
      try{
        const evt = require(path.join(base,file));
        if(evt.once) this.client.once(evt.name,(...args)=>evt.execute(...args,this.client));
        else this.client.on(evt.name,(...args)=>evt.execute(...args,this.client));
        n++;
      }catch(e){ console.error(chalk.red('[EVT] Failed:',file,e.message)); }
    }
    console.log(chalk.green('[EVT] Loaded '+n+' events'));
  }
}
module.exports = EventHandler;
