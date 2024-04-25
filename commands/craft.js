const db = require("quick.db") 
const Discord = require("discord.js");
const mg = require("../utility/utility.js");

module.exports.run = async (client, message, args) => {

  let ms;
  try {
    ms = (await import("parse-ms")).default;
  } catch (error) {
    console.error("Failed to import parse-ms", error);
    return;
  }
    
 const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]) || message.member;
 let user = message.author;
 let author = await db.fetch(`craft_${user.id}`)
 let userlevel = await db.fetch(`craftinglevel_${user.id}`)

 let timeout = 9000000;
    
 if (author !== null && timeout - (Date.now() - author) > 9000) {
      let time = ms(timeout - (Date.now() - author));
    
        message.channel.send(`**${member.user.tag}**, you already crafted recently, try again in \`${time.hours} hours, ${time.minutes} minutes, ${time.seconds} seconds\`.`)
      } else {
       
    let rarefish = [
      "**:violin: (Violin)**",
      "**:guitar: (Guitar)**",
      "**:telescope: (Telescope)**",
      "**:house: (House)**",
      "**:sailboat: (Sailboat)**"
    ]
    
    let bigfish = [
      "**:crossed_swords: (Swords)**",
      "**:shield: (Shield)**",
      "**:hut: (Hut)**",
      "**:trumpet: (Trumpet)**",
      "**:canoe: (Canoe)**"
    ]
    
    let fish = [
"**:axe: (Axe)**",
"**:tent: (Tent)**",
"**:dagger: (Dagger)**",
"**:boomerang: (Boomerang)**",
"**:teapot: (Teapot)**"
    ]
    
    let trash = [
"**:hammer: (Hammer)**",
"**:wrench: (Wrench)**",
"**:screwdriver: (Screwdriver)**",
"**:pick: (Pickaxe)**",
"**:closed_lock_with_key: (Lock and Key)**"
    ]
    
    
   var fisharray = [trash, fish, bigfish, rarefish];
   var fishresult;
       
   if(userlevel != null){ 
      fishresult = mg.skillMinigame("craft", userlevel);
   } else {
      fishresult = mg.skillMinigame("craft", 0);
   }
        if (!args[0]) {
        message.channel.send(`**CRAFTING MINIGAME:** - :tools:\n**${member.user.tag}** crafted a ${fisharray[fishresult[0]][fishresult[1]]} and earned \`${fishresult[2]}\` kopeks.`)
    db.add(`money_${user.id}`, fishresult[2]);
    db.set(`craft_${user.id}`, Date.now());
    }
   }
}
module.exports.help = {
    name:"craft",
    aliases: []
}
