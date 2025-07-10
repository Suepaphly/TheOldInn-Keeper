const { QuickDB } = require("quick.db");
const db = new QuickDB();
const Discord = require('discord.js');

module.exports.run = async (client, message, args) => {
    const user = message.author;
    const member = message.guild.members.cache.get(user.id);

    // Check if there's an active battle
    const battleActive = await db.get("battleActive");
    if (!battleActive) {
        return message.channel.send("❌ No battle is currently active! Use `=summon` to start attacking the town.");
    }

    // Check attack cooldown (5 seconds)
    const attackCooldown = await db.get(`attackCooldown_${user.id}`);
    const now = Date.now();
    const cooldownTime = 5000; // 5 seconds

    if (attackCooldown && (now - attackCooldown) < cooldownTime) {
        const remaining = Math.ceil((cooldownTime - (now - attackCooldown)) / 1000);
        return message.channel.send(`⏰ You must wait ${remaining} seconds before attacking again!`);
    }

    // Deal 10 damage to monsters
    const currentMonsters = await db.get("currentMonsters") || 0;
    if (currentMonsters <= 0) {
        return message.channel.send("🎉 All monsters have been defeated! The tavern is safe for now.");
    }

    const damage = 1;
    const newMonsterHealth = Math.max(0, currentMonsters - damage);
    await db.set("currentMonsters", newMonsterHealth);
    await db.set(`attackCooldown_${user.id}`, now);

    // Award experience and money for attacking
    const currentLevel = await db.get(`combat_level_${user.id}`) || 0;
    await db.add(`combat_level_${user.id}`, 1);
    await db.add(`money_${user.id}`, 5);

    if (newMonsterHealth <= 0) {
        await db.set("battleActive", false);
        message.channel.send(`⚔️ ${member} deals ${damage} damage and defeats the last monsters! The tavern is saved! 🏰\n💰 You earned 5 kopeks and 1 combat XP!`);
    } else {
        message.channel.send(`⚔️ ${member} deals ${damage} damage to the monsters! ${newMonsterHealth} monster health remaining.\n💰 You earned 5 kopeks and 1 combat XP!`);
    }
};

module.exports.help = {
    name: "attack",
    aliases: ["atk", "fight"]
};