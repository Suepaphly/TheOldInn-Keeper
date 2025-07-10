
const { QuickDB } = require("quick.db");
const db = new QuickDB();
const Discord = require('discord.js');
const ptt = require("../utility/protectTheTavern.js");

module.exports.run = async (client, message, args) => {
    const user = message.author;
    const member = message.guild.members.cache.get(user.id);

    // Check if there's an active battle using the new system
    if (!ptt.lockArena) {
        return message.channel.send("❌ No battle is currently active! Use `=summon` to add monsters or wait for an automatic attack.");
    }

    // Check if player has already attacked this turn
    const currentTurn = ptt.currentBattleTurn;
    const hasAttackedThisTurn = await db.get(`turn_attack_${user.id}_${currentTurn}`);
    
    if (hasAttackedThisTurn) {
        return message.channel.send("⏰ You have already attacked this turn! Wait for the next turn.");
    }

    // Check if there are any monsters left
    const monsters = await db.get("Monsters") || {};
    const totalMonsters = Object.values(monsters).reduce((sum, count) => sum + count, 0);
    
    if (totalMonsters <= 0) {
        return message.channel.send("🎉 All monsters have been defeated! The battle will end soon.");
    }

    // Deal 1 damage to monsters (kill 1 goblin if available, otherwise damage stronger monsters)
    let damageDealt = 0;
    let killedMonster = "";
    
    // Try to kill monsters starting with weakest
    const monsterArray = ["goblin", "mephit", "broodling", "ogre", "automaton"];
    const monsterHealthArray = [1, 5, 10, 25, 50];
    
    for (let i = 0; i < monsterArray.length; i++) {
        const monsterType = monsterArray[i];
        const monsterCount = monsters[monsterType] || 0;
        
        if (monsterCount > 0) {
            await db.sub(`Monsters.${monsterType}`, 1);
            damageDealt = monsterHealthArray[i];
            killedMonster = monsterType;
            break;
        }
    }

    // Mark that this player has attacked this turn
    await db.set(`turn_attack_${user.id}_${currentTurn}`, true);

    // Check remaining monsters
    const updatedMonsters = await db.get("Monsters") || {};
    const remainingMonsters = Object.values(updatedMonsters).reduce((sum, count) => sum + count, 0);

    if (killedMonster) {
        message.channel.send(`⚔️ ${member} slays a ${killedMonster}! ${remainingMonsters} monsters remaining.`);
    } else {
        message.channel.send(`⚔️ ${member} attacks but misses! ${remainingMonsters} monsters remaining.`);
    }
};

module.exports.help = {
    name: "attack",
    aliases: ["atk", "fight"]
};
