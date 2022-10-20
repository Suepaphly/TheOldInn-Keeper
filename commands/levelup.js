const db = require("quick.db") 
const Discord = require("discord.js");
const ms = require("parse-ms");

module.exports.run = async (client, message, args) => {
  
      let user = message.author;
      let item = args[0];
      let money = await db.fetch(`money_${message.author.id}`);
      
  
      if(!item){
          var buyEmbed = new Discord.MessageEmbed()
            .setColor('#000001')
            .setTitle("Level Up Your Skills")
            .setDescription("Just type the word in quotes after =lvl to purchase the item. \n Maximum level is 5, players start at level 0. Ex: \'=lvl rob\'")
            .addField("Increase Rob", "\'rob\' => 2,000 Kopeks")
            .addField("Increase Gathering", "\'gather\' => 5,000 Kopeks")
            .addField("Increase Fishing", "\'fish\' => 10,000 Kopeks")
            .addField("Increase Hunting", "\'hunt\' => 15,000 Kopeks")
            .addField("Increase Crafting", "\'craft\' => 20,000 Kopeks")
            .addField("Increase Work", "\'work\' => 25,000 Kopeks")
            .setFooter('The Tavernkeeper thanks you for playing. \n');
          message.channel.send(buyEmbed);
      } else if (item === "gather") {
        
          let level = await db.fetch(`gatheringlevel_${message.author.id}`);

          if(money >= 5000 && level < 5){
            level = level+1
            db.subtract(`money_${message.author.id}`, 5000);
            db.add(`gatheringlevel_${message.author.id}`, 1);
            message.channel.send(user.username + " just purchased a Level in Gathering! New Level: " + level);
          } else if (money < 5000) {
            message.channel.send(user.username + "doesn't have enough money!");            
          } else if (level === 5) {
            message.channel.send(user.username + " is already max level!");
          } else {
            message.channel.send(user.username + " sorry, something went wrong.");            
          }
        
      } else if (item === "fish") {
        
          let level = await db.fetch(`fishinglevel_${message.author.id}`);

          if(money >= 10000 && level < 5){
            level = level+1
            db.subtract(`money_${message.author.id}`, 10000);
            db.add(`fishinglevel_${message.author.id}`, 1);
            message.channel.send(user.username + " just purchased a Level in Fishing! New Level: " + level);
          } else if (money < 10000) {
            message.channel.send(user.username + "doesn't have enough money!");            
          } else if (level === 5) {
            message.channel.send(user.username + " is already max level!");
          } else {
            message.channel.send(user.username + " sorry, something went wrong.");            
          }
        
      } else if (item === "hunt") {
        
          let level = await db.fetch(`huntinglevel_${message.author.id}`);

          if(money >= 15000 && level < 5){
            level = level+1
            db.subtract(`money_${message.author.id}`, 15000);
            db.add(`huntinglevel_${message.author.id}`, 1);
            message.channel.send(user.username + " just purchased a Level in Hunting! New Level: " + level);
          } else if (money < 15000) {
            message.channel.send(user.username + " doesn't have enough money!");            
          } else if (level === 5) {
            message.channel.send(user.username + " is already max level!");
          } else {
            message.channel.send(user.username + " sorry, something went wrong.");            
          }
        
      } else if (item === "craft") {
        
          let level = await db.fetch(`craftinglevel_${message.author.id}`);

          if(money >= 20000 && level < 5){
            level = level+1
            db.subtract(`money_${message.author.id}`, 20000);
            db.add(`craftinglevel_${message.author.id}`, 1);
            message.channel.send(user.username + " just purchased a Level in Crafting! New Level: " + level);
          } else if (money < 20000) {
            message.channel.send(user.username + "doesn't have enough money!");            
          } else if (level === 5) {
            message.channel.send(user.username + " is already max level!");
          } else {
            message.channel.send(user.username + " sorry, something went wrong.");            
          }
        
      } else if (item === "work") {
        
          let level = await db.fetch(`workinglevel_${message.author.id}`);

          if(money >= 25000 && level < 5){
            level = level+1
            db.subtract(`money_${message.author.id}`, 25000);
            db.add(`workinglevel_${message.author.id}`, 1);
            message.channel.send(user.username + " just purchased a Level in Working! New Level: " + level);
          } else if (money < 25000) {
            message.channel.send(user.username + " doesn't have enough money!");            
          } else if (level === 5) {
            message.channel.send(user.username + " is already max level!");
          } else {
            message.channel.send(user.username + " sorry, something went wrong.");            
          }
        
      }  else if (item === "rob") {
        
          let level = await db.fetch(`thieflevel_${message.author.id}`);

          if(money >= 2000 && level < 5){
            level = level+1
            db.subtract(`money_${message.author.id}`, 2000);
            db.add(`thieflevel_${message.author.id}`, 1);
            message.channel.send(user.username + " just purchased a Level in Robbery! New Level: " + level);
          } else if (money < 2000) {
            message.channel.send(user.username + " doesn't have enough money!");            
          } else if (level === 5) {
            message.channel.send(user.username + " is already max level!");
          } else {
            message.channel.send(user.username + " sorry, something went wrong.");            
          }
        
      }       
  
}

module.exports.help = {
    name:"levelup",
    aliases: ["level", "up", "lvl"]
}
