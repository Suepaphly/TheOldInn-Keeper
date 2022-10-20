const Discord = require('discord.js')
const db = require('quick.db')

module.exports.run = async (bot, message, args) => {
   
    const resp = db.all();
    var money = "";

    // Sort from higher to lower
    resp.sort((a, b) => (a.data < b.data) ? 1 : -1);
    money = resp.filter((item) => item.ID.includes("bank_"));

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
    .setDescription(`**${message.guild.name} Kopek Leaderboard (In Bank) **\n\n${content}`)
    .setColor("#FFFFFF")

    message.channel.send(embed)
   }


module.exports.help = {
    name:"leaderboard",
    aliases: ["top"]
}
