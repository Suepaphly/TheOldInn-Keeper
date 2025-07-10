const { QuickDB } = require("quick.db");
const db = new QuickDB();
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
      var money = await db.get(`money_${message.author.id}`);
      
  
      if(item == null || !amount == null ){
        let buyMessage = "**Buy Castle Walls, Army Troops, and Defensive Traps.**\n" +
        "**Just type =buy [wall, army, or trap] [amount] [Traps and Army: Choose Rampart, Wall, or Castle].**\n" +
        "You can leave the amount blank to see prices and current amounts.\n" +
        "**Examples:**\n" +
        "=buy town_guard 5 rampart;\n" +
        "=buy rampart 2;\n" +
        "=buy boiling_oil 4 castle\n\n" +
        "The Tavernkeeper thanks you for playing.";

        message.channel.send(buyMessage);

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
