const { QuickDB } = require("quick.db");
const db = new QuickDB();
const Discord = require('discord.js');

module.exports.run = async (bot, message, args) => {
// Retrieve all data from the database
const allData = await db.all();

// Filter the data, ensuring that each item has an id property and the id includes the specific pattern
const filteredData = allData.filter(item => item.id && item.id.includes(`level_${message.author.id}`));

// Sort data from higher to lower
filteredData.sort((a, b) => b.value - a.value);

let content = "";

if (filteredData.length === 0) {
    content += "**No Levels**";
} else {
    for (let i = 0; i < filteredData.length; i++) {
        const parts = filteredData[i].id.split('level_');
        const user = parts[0];
        const lev = await db.get(filteredData[i].id);
        const levelType = user.charAt(0).toUpperCase() + user.slice(1);
        content += `${i + 1}. **${levelType} Level** => ${lev}\n`;
    }
}

  message.channel.send(`**<@${message.author.id}>'s Skill Levels**\n\n${content}`);
};

module.exports.help = {
    name: "checklvl",
    aliases: ["check", "lvls", "stat", "stats", "checklvls"]
};