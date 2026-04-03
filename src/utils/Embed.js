
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { COLORS, EMOJIS, BOT_NAME } = require('../config/config');

class Embed {
  static footer(client){ return { text: '🎮 '+BOT_NAME, iconURL: client?.user?.displayAvatarURL()||undefined }; }
  static base(color, title, desc, client, fields=[]){
    const e = new EmbedBuilder().setColor(color).setDescription(desc).setFooter(this.footer(client)).setTimestamp();
    if(title) e.setAuthor({ name: title, iconURL: client?.user?.displayAvatarURL() || undefined });
    if(fields.length) e.addFields(fields);
    return e;
  }
  static success(t,d,c,f=[]){ return this.base(COLORS.SUCCESS, EMOJIS.SUCCESS+' '+t, d, c, f); }
  static error(t,d,c,f=[]){ return this.base(COLORS.ERROR, EMOJIS.ERROR+' '+t, d, c, f); }
  static warning(t,d,c,f=[]){ return this.base(COLORS.WARNING, EMOJIS.WARNING+' '+t, d, c, f); }
  static info(t,d,c,f=[]){ return this.base(COLORS.AUDIT, EMOJIS.INFO+' '+t, d, c, f); }
  static security(t,d,c,f=[]){ return this.base(COLORS.SECURITY, EMOJIS.SHIELD+' '+t, d, c, f); }
  static panel(t,d,c,f=[],color=COLORS.PRIMARY){
    const e = new EmbedBuilder().setColor(color).setAuthor({name:'🎮 '+BOT_NAME, iconURL:c?.user?.displayAvatarURL()||undefined}).setTitle(t).setDescription(d).setFooter(this.footer(c)).setTimestamp();
    if(f.length) e.addFields(f);
    return e;
  }
  static confirmRow(id='confirm'){
    return new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(id+'_yes').setLabel('Confirm').setStyle(ButtonStyle.Danger).setEmoji('✅'),
      new ButtonBuilder().setCustomId(id+'_no').setLabel('Cancel').setStyle(ButtonStyle.Secondary).setEmoji('❌')
    );
  }
}
module.exports = Embed;
