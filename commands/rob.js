const Discord = require("discord.js");
const db = require("quick.db");
const ms = require("parse-ms");

module.exports.run = async (bot, message, args) => {

let user = message.mentions.members.first() || 0;
let thief = message.author;
let targetuser = await db.fetch(`money_${user.id}`)
let author = await db.fetch(`rob_${thief.id}`)
let thieflevel = await db.fetch(`thieflevel_${thief.id}`) || 0;
let author2 = await db.fetch(`money_${thief.id}`)
let robchance = [52, 60, 70, 80, 90, 95];
let robamt = [20, 30, 40, 50, 60, 70];

let timeout = 36000000;

    const resp = db.all();
    var money = "";

    // Sort from higher to lower
    resp.sort((a, b) => (a.data < b.data) ? 1 : -1);
    money = resp.filter((item) => item.ID.includes("money_"));

    let content = "";
    var list = 11;
    if(money.length < 10){
      list = money.length;  
    }
   
    for (let i = 0; i < 5; i++) {
        let user = bot.users.cache.get(money[i].ID.split('_')[1]).tag

        var conv = money[i].data.toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",");

        content += `${i+1}. **${user}** => ${conv}\n`
    
    }

    const embed = new Discord.MessageEmbed()
    .setDescription(`**${message.guild.name} Kopek Leaderboard (In Wallet) **\n\n${content}`)
    .setColor("#FFFFFF");

    
    
    if(args[0] === null || user === 0){     
        message.channel.send(embed);   
    } else if (author !== null && timeout - (Date.now() - author) > 0) {
        let time = ms(timeout - (Date.now() - author));

        let timeEmbed = new Discord.MessageEmbed()
        .setColor("#FFFFFF")
        .setDescription(`:pirate_flag: ${message.author.username} You have already robbed someone\n\nTry again in ${time.hours}h ${time.minutes}m ${time.seconds}s `);
        message.channel.send(timeEmbed)
      } else if (user.id === 853832646970310677) {
      
        let robTavern = new Discord.MessageEmbed()
        .setColor("#FFFFFF")
        .setDescription(`:pirate_flag: ${message.author.username} You can't Rob the Ol' Innkeeper! Who would run the Inn?!?! \n The town makes you sleep outside tonight as pennance.`);
        message.channel.send(robTavern)
          
      } else {

    let moneyEmbed = new Discord.MessageEmbed()
      .setColor("#FFFFFF")
      .setDescription(`:pirate_flag: ${message.author.username} You need at least 200 kopeks in both wallets to rob someone.`);

    if (author2 < 200 || targetuser < 200) {
        return message.channel.send(moneyEmbed)

    }
    let moneyEmbed2 = new Discord.MessageEmbed()
      .setColor("#FFFFFF")
      .setDescription(`:detective: ${message.author.username} ${user.user.username} does not have anything you can rob`);
    if (targetuser < 200) {
        return message.channel.send(moneyEmbed2)
    }
    
    var perc = (Math.floor(Math.random() * robamt[thieflevel]) + 1)*0.01;
    var kopek = Math.floor(targetuser*perc);
    var caught = Math.floor(Math.random() *99)+1;
    if(caught > (100-robchance[thieflevel])) {
        let embed = new Discord.MessageEmbed()
        .setDescription(`:ninja: ${message.author.username} You robbed ${user} and got away with ${kopek} kopeks`)
        .setColor("#FFFFFF")
        message.channel.send(embed)
        db.subtract(`money_${user.id}`, kopek)
        db.add(`money_${thief.id}`, kopek)
    } else {
        var kopek = author2*perc;
        if (kopek > author2){
          kopek = author2;   
        }
        let embed = new Discord.MessageEmbed()
        .setDescription(`:ninja: ${message.author.username} You got caught by the town guard and were forced to pay ${kopek} kopeks restitution to ${user}.`)
        .setColor("#FFFFFF")
        message.channel.send(embed)
        db.subtract(`money_${thief.id}`, kopek)
        db.add(`money_${user.id}`, kopek)
    }

    db.set(`rob_${thief.id}`, Date.now())

    }
};


module.exports.help = {
  name:"rob",
  aliases: ["rop"]
}
