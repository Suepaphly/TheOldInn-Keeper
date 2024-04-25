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
 let author = await db.fetch(`gather_${user.id}`)
 let userlevel = await db.fetch(`gatheringlevel_${user.id}`)

 let timeout = 900000;
    
 if (author !== null && timeout - (Date.now() - author) > 9000) {
      let time = ms(timeout - (Date.now() - author));
    
        message.channel.send(`**${member.user.tag}**, you already gathered recently, try again in \`${time.minutes} minutes, ${time.seconds} seconds\`.`)
      } else {
       
    let rarefish = [
    "**:mushroom:`(Mushroom)`**",
    "**:onion:`(Onion)`**",
    "**:garlic:`(Garlic)`**",
    "**:bell_pepper:`(Bell Pepper)`**",
    "**:avocado:`(Avocado)`**"
    ]  
              
              
    let bigfish = [
    "**:potato:`(Potato)`**",
    "**:hot_pepper:`(Cayenne Pepper)`**",
    "**:eggplant:`(Eggplant)`**",
    "**:melon:`(Melon)`**",
    "**:tomato:`(Tomato)`**"
    ]
    
    let fish = [
    "**:cucumber:`(Cucumber)`**",
    "**:kiwi:`(Kiwi)`**",
    "**:apple:`(Apple)`**",
    "**:strawberry:`(Strawberry)`**",
    "**:blueberries:`(Blueberry)`**"
    ]
    
    let trash = [
    "**:corn:`(Corn)`**",
    "**:leafy_green:`(Lettuce)`**",
    "**:coconut:`(Coconut)`**",
    "**:lemon:`(Lemon)`**",
    "**:olive: `(Olive)`**"
    ]
    
   var fisharray = [trash, fish, bigfish, rarefish];
   var fishresult;
       
   if(userlevel != null){ 
      fishresult = mg.skillMinigame("gather", userlevel);
   } else {
      fishresult = mg.skillMinigame("gather", 0);
   }
          
        if (!args[0]) {
        message.channel.send(`**GATHERING MINIGAME:** - :basket: \n**${member.user.tag}** gathered a ${fisharray[fishresult[0]][fishresult[1]]} and earned \`${fishresult[2]}\` kopeks.`)
    db.add(`money_${user.id}`, fishresult[2])
    db.set(`gather_${user.id}`, Date.now())
    }
   }
}
module.exports.help = {
    name:"gather",
    aliases: []
}
