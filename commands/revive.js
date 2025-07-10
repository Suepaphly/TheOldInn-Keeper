
const { QuickDB } = require("quick.db");
const db = new QuickDB();

module.exports.run = async (client, message, args) => {
    // Check if town is under attack
    const ptt = require("../utility/protectTheTavern.js");
    if (ptt.lockArena) {
        return message.channel.send("⚔️ The town is under attack! All civilian activities are suspended until the battle ends.");
    }

    const user = message.author;
    const targetUser = message.mentions.members.first();

    if (!targetUser) {
        return message.channel.send("❌ You must mention a user to revive! Usage: `=revive @username`");
    }

    // Check if user has enough money
    const userMoney = await db.get(`money_${user.id}`) || 0;
    const reviveCost = 1000;

    if (userMoney < reviveCost) {
        return message.channel.send(`❌ You need ${reviveCost} kopeks to revive someone. You have ${userMoney} kopeks.`);
    }

    // Check if target user is actually dead
    const deathTimer = await db.get(`death_cooldown_${targetUser.id}`);
    
    if (!deathTimer) {
        return message.channel.send(`❌ ${targetUser.user.username} is not currently dead and doesn't need to be revived.`);
    }

    // Check if death timer is still active (24 hours = 86400000 ms)
    const timeRemaining = 86400000 - (Date.now() - deathTimer);
    
    if (timeRemaining <= 0) {
        // Timer already expired, clean up the database
        await db.delete(`death_cooldown_${targetUser.id}`);
        return message.channel.send(`❌ ${targetUser.user.username} has already recovered naturally and doesn't need to be revived.`);
    }

    // Perform the revival
    await db.sub(`money_${user.id}`, reviveCost);
    await db.delete(`death_cooldown_${targetUser.id}`);

    message.channel.send(`✨ ${user.username} spent ${reviveCost} kopeks to revive ${targetUser.user.username}! They can now participate in combat again.`);
};

module.exports.help = {
    name: "revive",
    aliases: ["resurrect", "heal"]
};
