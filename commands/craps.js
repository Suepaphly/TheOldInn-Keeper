const db = require("quick.db") 
const Discord = require("discord.js");
const ms = require("parse-ms");

module.exports.run = async (client, message, args) => {

    const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]) || message.member;
    let user = message.author;
    let money = Math.abs(parseInt(args[1]));
    let moneydb = await db.fetch(`money_${message.author.id}`)    
    
      if (args[0] === 'all' || args[0] === 'max') {
          money = moneydb;
      } else {
          money = parseInt(args[0]);
      }
    
      if (!money || money < 1 || money > moneydb) {
          message.channel.send("Enter a valid number of kopeks.")
          return
      }

      if (!moneydb) {
          message.channel.send("You do not have enough kopeks")
          return
      }
   


  
    var dice1 = Math.floor(Math.random() * (6 - 1) + 1);
    var dice2 = Math.floor(Math.random() * (6 - 1) + 1);
    var total = dice1+dice2;
    var dicemsg, dicemsg2, resultmsg1, subdice1, subdice2, subtotal = " ";
 
  
    if(total === 2 || total === 12 || total === 3){
        dicemsg = "You rolled a **" + dice1 + "**, and **" + dice2 + "** for a total of: " + total + "\n ** You Lose: " + money + " kopeks.**";
        db.subtract(`money_${message.author.id}`, money);
      
    } else if (total === 7) {
      dicemsg = "You rolled a **" + dice1 + "**, and **" + dice2 + "** for a total of: " + total + "\n ** You Win!!! " + money*5 + " kopeks!**";
      db.add(`money_${message.author.id}`, money*4);
        
    } else if (total === 11) {
      dicemsg = "You rolled a **" + dice1 + "**, and **" + dice2 + "** for a total of: " + total + "\n ** You Win!!! " + money*2 + " kopeks!**";
      db.add(`money_${message.author.id}`, money);

    } else if(total != 2 && total != 12 && total != 3 && total != 7 && total != 11){
        dicemsg = "You rolled a **" + dice1 + "**, and **" + dice2 + "** for a total of: **" + total + ". Rolling Again:**";
           subdice1 = Math.floor(Math.random() * (6 - 1) + 1);
           subdice2 = Math.floor(Math.random() * (6 - 1) + 1);
           subtotal = subdice1+subdice2;
           
            dicemsg += "\n You rolled a **" + subdice1 + "**, and **" + subdice2 + "** for a total of: **" + subtotal + "**";
            if(total === subtotal){
             dicemsg += "\n **You win! " + money*2 + " kopeks!** :moneybag: :moneybag: :moneybag: ";
             db.add(`money_${message.author.id}`, money)
            } else {
             dicemsg += "\n **You lose. " + money + " kopeks!**";   
             db.subtract(`money_${message.author.id}`, money)
            }        
    }   
        

    var gambleEmbed = new Discord.MessageEmbed()
      .setColor('#000001')
      .setTitle(message.author.username + "'s :game_die: :game_die: Craps Game. Good Luck!")
      .addField("Results:", dicemsg)
      .setFooter('The Tavernkeeper thanks you for playing. \n');

    message.channel.send(gambleEmbed);
}

module.exports.help = {
    name:"craps",
    aliases: ["dice"]
}
