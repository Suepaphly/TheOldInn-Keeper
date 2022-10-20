const db = require("quick.db") 
const Discord = require("discord.js");
const ms = require("parse-ms");
const mg = require("../utility/utility.js");

module.exports.run = async (client, message, args) => {
    
 const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]) || message.member;
 let user = message.author;
 let author = await db.fetch(`fish_${user.id}`)
 let userlevel = await db.fetch(`fishinglevel_${user.id}`)

 let timeout = 1800000;
    
 if (author !== null && timeout - (Date.now() - author) > 9000) {
      let time = ms(timeout - (Date.now() - author));
    
        message.channel.send(`**${member.user.tag}**, you already fished recently, try again in \`${time.minutes} minutes, ${time.seconds} seconds\`.`)
      } else {
       
    let rarefish = [
    "**🐡`(Blow Fish)`**",
    "**:crown:`(Crown)`**",
    "**:ring:`(Ring)`**",
    "**:whale2:`(Whale)`**",
    "**:lobster:`(Lobster)`**"
    ]
    
    let bigfish = [
    "**🐬`(Dolphin)`**",
    "**🦈`(Shark)`**",
    "**🦑`(Squid)`**",
    "**:octopus:`(Octopus)`**",
    "**:crocodile:`(Crocodile)`**"
    ]
    
    let fish = [
    "**🐠`(Tropical Fish)`**",
    "**🐟`(Fish)`**",
    "**🦐`(Shrimp)`**",
    "**:crab:`(Crab)`**",
    "**:turtle:`(Turtle)`**"
    ]
    
    let trash = [
    "**👕`(Shirt)`**",
    "**:athletic_shoe:`(Shoe)`**",
    "**:military_helmet:`(Helmet)`**",
    "**:billed_cap:`(Hat)`**",
    "**:thong_sandal:`(Sandal)`**"
    ]
    
   var fisharray = [trash, fish, bigfish, rarefish];
   var fishresult;
       
   if(userlevel != null){ 
      fishresult = mg.skillMinigame("fish", userlevel);
   } else {
      fishresult = mg.skillMinigame("fish", 0);
   }
   
        if (!args[0]) {
        message.channel.send(`**FISH MINIGAME:** - 🎣\n**${member.user.tag}** fished a ${fisharray[fishresult[0]][fishresult[1]]} and earned \`${fishresult[2]}\` kopeks.`)
    db.add(`money_${user.id}`, fishresult[2]);
    db.set(`fish_${user.id}`, Date.now());
    }
   }
}
module.exports.help = {
    name:"fish",
    aliases: []
}
