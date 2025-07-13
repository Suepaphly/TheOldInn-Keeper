
const Discord = require("discord.js");
const { QuickDB } = require("quick.db");
const db = new QuickDB();

module.exports.run = async (client, message, args) => {
    const userId = message.author.id;
    
    // Check if user has the Thief feat
    const hasThiefFeat = await db.get(`feat_thief_${userId}`) || 0;
    if (!hasThiefFeat) {
        return message.channel.send("❌ You need the **Thief** feat to steal from other players! Purchase it with `=lvl thief`");
    }

    // Check cooldown (1 hour)
    const cooldownKey = `steal_cooldown_${userId}`;
    const lastSteal = await db.get(cooldownKey);
    const cooldownTime = 3600000; // 1 hour in milliseconds
    
    if (lastSteal && (Date.now() - lastSteal) < cooldownTime) {
        const timeLeft = cooldownTime - (Date.now() - lastSteal);
        const minutesLeft = Math.ceil(timeLeft / 60000);
        return message.channel.send(`❌ You can steal again in ${minutesLeft} minutes!`);
    }

    // Get target user
    const target = message.mentions.users.first();
    if (!target) {
        return message.channel.send("❌ You must mention a user to steal from! Usage: `=steal @username`");
    }

    if (target.id === userId) {
        return message.channel.send("❌ You can't steal from yourself!");
    }

    if (target.bot) {
        return message.channel.send("❌ You can't steal from bots!");
    }

    // Check if target is dead
    const targetDead = await db.get(`dead_${target.id}`);
    if (targetDead) {
        return message.channel.send("❌ You can't steal from dead players!");
    }

    // Check if user is dead
    const userDead = await db.get(`dead_${userId}`);
    if (userDead) {
        return message.channel.send("❌ Dead players can't steal!");
    }

    // Get user's rob level for success rate
    const robLevel = await db.get(`thieflevel_${userId}`) || 0;
    const baseSuccessRate = 20; // 20% base success rate
    const levelBonus = robLevel * 15; // 15% per rob level
    const successRate = Math.min(baseSuccessRate + levelBonus, 95); // Cap at 95%

    // Roll for success
    const roll = Math.floor(Math.random() * 100) + 1;
    const success = roll <= successRate;

    // Set cooldown regardless of success/failure
    await db.set(cooldownKey, Date.now());

    if (!success) {
        return message.channel.send(`❌ **Steal Failed!** You failed to steal from ${target.username}. Your success rate was ${successRate}%. Try leveling up your rob skill!`);
    }

    // Get target's backpack
    const targetBackpack = await db.get(`backpack_${target.id}`) || {};
    const targetItems = Object.keys(targetBackpack).filter(item => 
        !item.includes('troop') && 
        !item.includes('monster') && 
        targetBackpack[item] > 0
    );

    if (targetItems.length === 0) {
        return message.channel.send(`❌ ${target.username} has no items to steal!`);
    }

    // Select a random item
    const randomItem = targetItems[Math.floor(Math.random() * targetItems.length)];
    const stolenAmount = 1;

    // Remove item from target
    await db.sub(`backpack_${target.id}.${randomItem}`, stolenAmount);
    if (targetBackpack[randomItem] - stolenAmount <= 0) {
        await db.delete(`backpack_${target.id}.${randomItem}`);
    }

    // Add item to thief
    await db.add(`backpack_${userId}.${randomItem}`, stolenAmount);

    // Format item name for display
    const itemName = randomItem.charAt(0).toUpperCase() + randomItem.slice(1);

    const embed = new Discord.EmbedBuilder()
        .setTitle("🥷 Successful Steal!")
        .setColor("#8B008B")
        .setDescription(`${message.author.username} successfully stole from ${target.username}!`)
        .addFields(
            { name: "Stolen Item", value: `${itemName} (x${stolenAmount})`, inline: true },
            { name: "Success Rate", value: `${successRate}%`, inline: true },
            { name: "Next Steal", value: "Available in 1 hour", inline: true }
        )
        .setTimestamp();

    message.channel.send({ embeds: [embed] });

    // Try to notify the target
    try {
        const dmEmbed = new Discord.EmbedBuilder()
            .setTitle("🚨 You've Been Robbed!")
            .setColor("#FF0000")
            .setDescription(`${message.author.username} stole ${itemName} from you using their Thief feat!`);
        
        await target.send({ embeds: [dmEmbed] });
    } catch (err) {
        // User has DMs disabled
    }
};

module.exports.help = {
    name: "steal",
    aliases: ["rob", "pickpocket"]
};
