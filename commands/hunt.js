const Discord = require("discord.js");
const db = require("quick.db");
const ms = require("parse-ms");
const mg = require("../utility/utility.js");

module.exports.run = async (client, message, args) => {

    const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]) || message.member;
    let user = message.author;
    let author = await db.fetch(`hunt_${user.id}`)
 let userlevel = await db.fetch(`huntinglevel_${user.id}`)

    let timeout = 3600000;
    
    if (author !== null && timeout - (Date.now() - author) > 0) {
        let time = ms(timeout - (Date.now() - author));
    
    
        message.channel.send(`**${member.user.tag}**, you already hunted recently, try again in \`${time.minutes} minutes, ${time.seconds} seconds\`.`)
      } else {


    let rarehunt = [
        "**🦃 `(Turkey)`**", 
        "**🐃 `(Water Buffalo)`**",
        "**:bison: `(Bison)`**",
        "**:zebra: `(Zebra)`**",
        "**:kangaroo: `(Kangaroo)`**"
    ]
    
    let bighunt = [
        "**:sheep: `(Sheep)`**",
        "**🐂 `(Ox)`**",
        "**🐄 `(Cow)`**",
        "**🐖 `(Pig)`**",
        "**:deer: `(Deer)`**"
    ]
    
    let hunt = [
        "**🐰 `(Rabbit)`**",
        "**🐔 `(Chicken)`**",
        "**🐍 `(Snake)`**",
        "**:goat: `(Goat)`**",
        "**:duck:  `(Duck)`**"
    ]
    
    let trash = [
        "**🐰 `(Rabbit)`**",
        "**🐸 `(Frog)`**",
        "**🐓 `(Rooster)`**",
        "**🐿 `(Chipmunk)`**",
        "**:rat: `(Rat)`**"
    ]
 

   var fisharray = [trash, hunt, bighunt, rarehunt];
   var fishresult;
       
   if(userlevel != null){ 
      fishresult = mg.skillMinigame("hunt", userlevel);
   } else {
      fishresult = mg.skillMinigame("hunt", 0);
   }
        message.channel.send(`**HUNT MINIGAME:** - 🏹\n**${member.user.tag}** has hunted a ${fisharray[fishresult[0]][fishresult[1]]} and earned \`${fishresult[2]}\` kopeks.`)

    db.add(`money_${user.id}`, fishresult[2])
    db.set(`hunt_${user.id}`, Date.now())

    };
    }


module.exports.help = {
  name:"hunt",
  aliases: []
}
