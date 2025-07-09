
const Discord = require("discord.js");
const { QuickDB } = require("quick.db");
const db = new QuickDB();
const ptt = require("../utility/protectTheTavern.js");

exports.run = async (client, message, args) => {
    const user = message.author;
    const type = args[0];
    const amount = parseInt(args[1]) || 1;
    
    if (!type) {
        const embed = new Discord.MessageEmbed()
            .setTitle("👹 Monster Summoning")
            .setDescription("Summon monsters to attack the town!")
            .addField("Usage", "=summon [monster_type] [amount]")
            .addField("Available Monsters", 
                ptt.monsterArray.map((monster, i) => 
                    `**${monster}**: ${ptt.monsterCostArray[i]} kopeks (HP: ${ptt.monsterHealthArray[i]}, DMG: ${ptt.monsterDmgArray[i]})`
                ).join("\n")
            )
            .setColor("#8B0000")
            .setFooter("The Tavernkeeper thanks you for playing.");
        
        return message.channel.send(embed);
    }
    
    if (!ptt.monsterArray.includes(type)) {
        return message.channel.send(`Invalid monster type! Available monsters: ${ptt.monsterArray.join(", ")}`);
    }
    
    if (amount <= 0 || amount > 100) {
        return message.channel.send("Amount must be between 1 and 100!");
    }
    
    const success = await ptt.summonMonster(type, amount, user.id);
    
    if (success) {
        const typeIndex = ptt.monsterArray.indexOf(type);
        const totalCost = ptt.monsterCostArray[typeIndex] * amount;
        message.channel.send(`👹 ${user.username} has summoned ${amount} ${type}(s) for ${totalCost} kopeks!`);
    } else {
        const typeIndex = ptt.monsterArray.indexOf(type);
        const totalCost = ptt.monsterCostArray[typeIndex] * amount;
        message.channel.send(`${user.username}, you need ${totalCost} kopeks to summon ${amount} ${type}(s)!`);
    }
};

module.exports.help = {
    name: "summon",
    aliases: ["monster", "spawn"]
};
