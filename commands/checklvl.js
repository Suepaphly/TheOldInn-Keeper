const Discord = require('discord.js')
const db = require('quick.db')

module.exports.run = async (bot, message, args) => {
   
    const resp = db.all();
    var lvls = "";

    // Sort from higher to lower
    resp.sort((a, b) => (a.data < b.data) ? 1 : -1);
    lvls = resp.filter((item) => item.ID.includes(`level_${message.author.id}`));

    let content = "";
   
   if (lvls.length === 0){
      content += `**No Levels**`;     
   }
   
   for (let i = 0; i < lvls.length; i++) {
        let user = lvls[i].ID.split('level_')[0];
        if (user === "thief") {
          let lev = await db.fetch(`thieflevel_${message.author.id}`);
          content += `${i+1}. **Robbery Level** => ${lev}\n`;
          
        } else if (user === "gathering" ) {
          let lev = await db.fetch(`gatheringlevel_${message.author.id}`);
          content += `${i+1}. **Gathering Level** => ${lev}\n`;
          
        } else if (user === "fishing" ) {
          let lev = await db.fetch(`fishinglevel_${message.author.id}`);
          content += `${i+1}. **Fishing Level** => ${lev}\n`;
          
        } else if (user === "hunting" ) {
          let lev = await db.fetch(`huntinglevel_${message.author.id}`);
          content += `${i+1}. **Hunting Level** => ${lev}\n`;
          
        } else if (user === "crafting" ) {
          let lev = await db.fetch(`craftinglevel_${message.author.id}`);
          content += `${i+1}. **Crafting Level** => ${lev}\n`;
          
        } else if (user === "working" ) {
          let lev = await db.fetch(`workinglevel_${message.author.id}`);
          content += `${i+1}. **Working Level** => ${lev}\n`;
          
        }
    }

    const embed = new Discord.MessageEmbed()
    .setDescription(`**${message.author.username} Skill Levels **\n\n${content}`)
    .setColor("#FFFFFF")

    message.channel.send(embed)
   }


module.exports.help = {
    name:"checklvls",
    aliases: ["lvls", "stat", "stats"]
}
