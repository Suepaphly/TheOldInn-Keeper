const { QuickDB } = require("quick.db");
const db = new QuickDB();
const Discord = require("discord.js");

module.exports.run = async (client, message, args) => {

  let ms;
  try {
    ms = (await import("parse-ms")).default;
  } catch (error) {
    console.error("Failed to import parse-ms", error);
    return;
  }

  let user = message.author;
  let item = args[0];
  let money = await db.get(`money_${message.author.id}`);


  if(!item){
    let buyMessage = "```css\n" +
        "Level Up Your Skills\n" +
        "Just type the word in quotes after =lvl to purchase the item.\n" +
        "Maximum level is 5, players start at level 0. Ex: '=lvl rob'\n" +
        "Increase Rob: 'rob' => 2,000 Kopeks\n" +
        "Increase Gathering: 'gather' => 5,000 Kopeks\n" +
        "Increase Fishing: 'fish' => 10,000 Kopeks\n" +
        "Increase Hunting: 'hunt' => 15,000 Kopeks\n" +
        "Increase Crafting: 'craft' => 20,000 Kopeks\n" +
        "Increase Work: 'work' => 25,000 Kopeks\n" +
        "The Tavernkeeper thanks you for playing.\n" +
        "```";
    message.channel.send(buyMessage);
  } else if (item === "gather") {

    let level = await db.get(`gatheringlevel_${message.author.id}`);

    if(money >= 5000 && level < 5){
      level++;
      await db.sub(`money_${message.author.id}`, 5000);
      await db.add(`gatheringlevel_${message.author.id}`, 1);
      message.channel.send(user.username + " just purchased a Level in Gathering! New Level: " + level);
    } else if (money < 5000) {
      message.channel.send(user.username + " doesn't have enough money!");            
    } else if (level === 5) {
      message.channel.send(user.username + " is already max level!");
    } else {
      message.channel.send(user.username + " sorry, something went wrong.");            
    }

  } else if (item === "fish") {

    let level = await db.get(`fishinglevel_${message.author.id}`);

    if(money >= 10000 && level < 5){
      level++;
      await db.sub(`money_${message.author.id}`, 10000);
      await db.add(`fishinglevel_${message.author.id}`, 1);
      message.channel.send(user.username + " just purchased a Level in Fishing! New Level: " + level);
    } else if (money < 10000) {
      message.channel.send(user.username + " doesn't have enough money!");            
    } else if (level === 5) {
      message.channel.send(user.username + " is already max level!");
    } else {
      message.channel.send(user.username + " sorry, something went wrong.");            
    }

  } else if (item === "hunt") {

    let level = await db.get(`huntinglevel_${message.author.id}`);

    if(money >= 15000 && level < 5){
      level++;
      await db.sub(`money_${message.author.id}`, 15000);
      await db.add(`huntinglevel_${message.author.id}`, 1);
      message.channel.send(user.username + " just purchased a Level in Hunting! New Level: " + level);
    } else if (money < 15000) {
      message.channel.send(user.username + " doesn't have enough money!");            
    } else if (level === 5) {
      message.channel.send(user.username + " is already max level!");
    } else {
      message.channel.send(user.username + " sorry, something went wrong.");            
    }

  } else if (item === "craft") {

    let level = await db.get(`craftinglevel_${message.author.id}`);

    if(money >= 20000 && level < 5){
      level++;
      await db.sub(`money_${message.author.id}`, 20000);
      await db.add(`craftinglevel_${message.author.id}`, 1);
      message.channel.send(user.username + " just purchased a Level in Crafting! New Level: " + level);
    } else if (money < 20000) {
      message.channel.send(user.username + " doesn't have enough money!");            
    } else if (level === 5) {
      message.channel.send(user.username + " is already max level!");
    } else {
      message.channel.send(user.username + " sorry, something went wrong.");            
    }

  } else if (item === "work") {

    let level = await db.get(`workinglevel_${message.author.id}`);

    if(money >= 25000 && level < 5){
      level++;
      await db.sub(`money_${message.author.id}`, 25000);
      await db.add(`workinglevel_${message.author.id}`, 1);
      message.channel.send(user.username + " just purchased a Level in Working! New Level: " + level);
    } else if (money < 25000) {
      message.channel.send(user.username + " doesn't have enough money!");            
    } else if (level === 5) {
      message.channel.send(user.username + " is already max level!");
    } else {
      message.channel.send(user.username + " sorry, something went wrong.");            
    }

  }  else if (item === "rob") {

    let level = await db.get(`thieflevel_${message.author.id}`);

    if(money >= 2000 && level < 5){
      level++;
      await db.sub(`money_${message.author.id}`, 2000);
      await db.add(`thieflevel_${message.author.id}`, 1);
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
