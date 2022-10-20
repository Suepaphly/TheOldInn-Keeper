const db = require("quick.db") 
const Discord = require("discord.js");
const ms = require("parse-ms");
const mg = require("../utility/utility.js");

module.exports.run = async (client, message, args) => {
   
    let user = message.author;
    const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]) || message.member;

    let bbal = await db.fetch(`bank_${user.id}`);
    let withdraw = Math.floor(Math.abs(parseInt(args[0])));

    let timer = await db.fetch(`deposit_${user.id}`)

    if(!withdraw || withdraw === null || withdraw === 0 || args[0] === "all"){ 
            let total = await db.fetch(`bank_${user.id}`);
            await db.subtract(`bank_${user.id}`, total);
            await db.add(`money_${user.id}`, total);
            let newbal = await db.fetch(`money_${user.id}`);
            message.channel.send(`**${member.user.tag}** just withdrew \'${total}\' into their wallet. Their new wallet balance is \'${newbal}\'`);
    } else {      
        if(withdraw <= bbal) {
            await db.subtract(`bank_${user.id}`, withdraw);
            await db.add(`money_${user.id}`, withdraw);
            let newbbal = await db.fetch(`bank_${user.id}`);
            message.channel.send(`**${member.user.tag}** just withdrew \'${withdraw}\' into their wallet. Their new bank balance is \'${newbbal}\'`);
        } else {
            message.channel.send(`${user.username} Please send a valid amount of Kopeks`);
        }
    }
  
 }


module.exports.help = {
  name:"withdraw",
  aliases: ["wd"]
}
