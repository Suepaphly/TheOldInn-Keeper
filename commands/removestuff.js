const db = require("quick.db") 
const Discord = require("discord.js");
const ptt = require("../utility/protectTheTavern.js");

module.exports.run = async (client, message, args) => {

  let ms;
  try {
    ms = (await import("parse-ms")).default;
  } catch (error) {
    console.error("Failed to import parse-ms", error);
    return;
  }
  
      var user = message.author;
      var item = args[0];
      var amount = args[1];
      var location = args[2];
      var money = await db.fetch(`money_${message.author.id}`);
      
  
      if(item == null || !amount == null ){
          var buyEmbed = new Discord.MessageEmbed()
            .setColor('#000001')
            .setTitle("Buy Castle Walls, Army Troops, and Defensive Traps.")
            .setDescription(`Just type =buy [wall, army, or trap] [amount] [Traps and Army: Choose Rampart, Wall, or Castle]. 
                            \n You can leave the amount blank to see prices and current amounts. 
                            \n Ex: =buy town_gaurd 5 rampart; =buy rampart 2; =buy boiling_oil 4 castle`)
            .setFooter('The Tavernkeeper thanks you for playing. \n');
          message.channel.send(buyEmbed);
      } else {
        var mtype = null;
        

        
        if(ptt.troopArray.includes(item) && ptt.wallArray.includes(location)) {
          ptt.rmArmy(item, amount, location, user, message);
          return;
        } else if(ptt.trapArray.includes(item) && ptt.wallArray.includes(location)) {
          ptt.rmTrap(item, amount, location, user, message);
          return;
        } else if(ptt.wallArray.includes(item)){ 
          ptt.rmWall(item, amount, user, message);
          return;
        } else {
          message.channel.send("Make sure you set the location! Ex: =buy boiling_oil 1 castle"); 
        }
        
       
        
        //ptt.monsterArray.includes(item) mtype = "monster";
        
        
        
      }

  
}

module.exports.help = {
    name:"removestuff",
    aliases: ["rm"]
}
