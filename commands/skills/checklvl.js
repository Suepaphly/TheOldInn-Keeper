const { QuickDB } = require("quick.db");
const db = new QuickDB();
const Discord = require('discord.js');

module.exports.run = async (bot, message, args) => {
// Retrieve all data from the database
const allData = await db.all();

// Filter the data for levels
const filteredData = allData.filter(item => item.id && item.id.includes(`level_${message.author.id}`));

// Filter the data for feats
const featData = allData.filter(item => item.id && item.id.includes(`feat_`) && item.id.includes(`_${message.author.id}`) && item.value === 1);

// Sort data from higher to lower
filteredData.sort((a, b) => b.value - a.value);

let content = "";

if (filteredData.length === 0) {
    content += "**No Levels**\n";
} else {
    content += "**=== SKILL LEVELS ===**\n";
    for (let i = 0; i < filteredData.length; i++) {
        const parts = filteredData[i].id.split('level_');
        const user = parts[0];
        const lev = await db.get(filteredData[i].id);
        const levelType = user.charAt(0).toUpperCase() + user.slice(1);
        content += `${i + 1}. **${levelType} Level** => ${lev}\n`;
    }
}

// Add feats section
if (featData.length > 0) {
    content += "\n**=== FEATS ===**\n";
    const featNames = {
        'feat_akimbo': 'Guns Akimbo',
        'feat_healer': 'Healer',
        'feat_tactician': 'Tactician',
        'feat_mechanist': 'Mechanist',
        'feat_ninja': 'Ninja',
        'feat_investigator': 'Investigator'
    };
    
    for (let i = 0; i < featData.length; i++) {
        const featKey = featData[i].id.split(`_${message.author.id}`)[0];
        const featName = featNames[featKey] || 'Unknown Feat';
        content += `${i + 1}. **${featName}** ✅\n`;
    }
} else {
    content += "\n**=== FEATS ===**\n**No Feats Purchased**\n";
}

  message.channel.send(`**<@${message.author.id}>'s Character Progress**\n\n${content}`);
};

module.exports.help = {
    name: "checklvl",
    aliases: ["check", "lvls", "stat", "stats", "checklvls"]
};