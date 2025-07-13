
const Discord = require("discord.js");
const { QuickDB } = require("quick.db");
const db = new QuickDB();

module.exports.run = async (client, message, args) => {
    const user = message.author;
    
    // Check if user has the Investigator feat
    const hasInvestigatorFeat = await db.get(`feat_investigator_${user.id}`) || 0;
    if (!hasInvestigatorFeat) {
        return message.channel.send("❌ You need the **Investigator** feat to use this command! Purchase it with `=lvl investigator`");
    }

    // Check cooldown (1 hour = 3600000 ms)
    const cooldownTime = 3600000;
    const lastUsed = await db.get(`snoop_cooldown_${user.id}`);
    
    if (lastUsed && (Date.now() - lastUsed) < cooldownTime) {
        const timeLeft = Math.ceil((cooldownTime - (Date.now() - lastUsed)) / 60000);
        return message.channel.send(`⏰ You can use snoop again in **${timeLeft}** minutes!`);
    }

    const target = message.mentions.users.first() || 
                  (args[0] ? await client.users.fetch(args[0]).catch(() => null) : null);

    if (!target) {
        return message.channel.send("❌ You must mention a user or provide a user ID! Usage: `=snoop @user` or `=snoop <userID>`");
    }

    if (target.id === user.id) {
        return message.channel.send("❌ You can't snoop on yourself! Use `=bal` and `=backpack` instead.");
    }

    try {
        // Get target's data
        const money = await db.get(`money_${target.id}`) || 0;
        const bank = await db.get(`bank_${target.id}`) || 0;
        const allData = await db.all();
        
        // Get items from backpack (weapons, armor, crystals only)
        const items = allData.filter(item => 
            item.id.includes(`_${target.id}`) && 
            (item.id.startsWith('weapon_') || 
             item.id.startsWith('armor_') || 
             item.id.startsWith('crystal_')) &&
            item.value > 0
        );

        let itemsList = "None";
        if (items.length > 0) {
            itemsList = items.map(item => {
                let itemName = item.id.replace(`_${target.id}`, '').replace(/_/g, ' ');
                
                // Clean up item names
                if (itemName.startsWith('weapon ')) {
                    itemName = itemName.replace('weapon ', '');
                }
                if (itemName.startsWith('armor ')) {
                    itemName = itemName.replace('armor ', '') + ' armor';
                }
                if (itemName.startsWith('crystal ')) {
                    itemName = itemName.replace('crystal ', '') + ' crystal';
                }
                
                // Capitalize first letter
                itemName = itemName.charAt(0).toUpperCase() + itemName.slice(1);
                
                return `${itemName} (x${item.value})`;
            }).slice(0, 10).join('\n'); // Limit to 10 items to avoid spam
            
            if (items.length > 10) {
                itemsList += `\n... and ${items.length - 10} more items`;
            }
        }

        const embed = new Discord.EmbedBuilder()
            .setTitle(`🕵️ Investigation Report: ${target.username}`)
            .setColor("#9932CC")
            .setDescription(`You've successfully investigated ${target.username}'s belongings!`)
            .addFields(
                { name: "💰 Kopeks", value: money.toLocaleString(), inline: true },
                { name: "🏦 Bank", value: bank.toLocaleString(), inline: true },
                { name: "🎒 Items", value: itemsList, inline: false }
            )
            .setFooter({ text: `Investigated by ${user.username} using Investigator feat` });

        message.channel.send({ embeds: [embed] });

        // Set cooldown
        await db.set(`snoop_cooldown_${user.id}`, Date.now());

    } catch (error) {
        console.error("Error during investigation:", error);
        message.channel.send("❌ An error occurred while investigating the target.");
    }
};

module.exports.help = {
    name: "snoop",
    aliases: ["investigate", "spy"]
};
