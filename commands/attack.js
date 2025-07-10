
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

    // Deal 1 damage to monsters
    let damageDealt = 1;
    let killedMonster = "";
    let hitMonster = "";
    
    const monsterArray = ["goblin", "mephit", "broodling", "ogre", "automaton"];
    const monsterHealthArray = [1, 5, 10, 25, 50];
    
    // Find the first available monster to attack
    for (let i = 0; i < monsterArray.length; i++) {
        const monsterType = monsterArray[i];
        const monsterCount = monsters[monsterType] || 0;
        
        if (monsterCount > 0) {
            hitMonster = monsterType;
            
            // Get current damage for this monster type
            const currentDamage = await db.get(`monster_damage_${monsterType}`) || 0;
            const newDamage = currentDamage + 1;
            
            // Check if monster dies
            if (newDamage >= monsterHealthArray[i]) {
                // Monster dies - remove it and reset damage
                await db.sub(`Monsters.${monsterType}`, 1);
                await db.set(`monster_damage_${monsterType}`, 0);
                killedMonster = monsterType;
            } else {
                // Monster survives - record damage
                await db.set(`monster_damage_${monsterType}`, newDamage);
            }
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
    } else if (hitMonster) {
        const currentDamage = await db.get(`monster_damage_${hitMonster}`) || 0;
        const maxHealth = monsterHealthArray[monsterArray.indexOf(hitMonster)];
        message.channel.send(`⚔️ ${member} hits a ${hitMonster} for 1 damage! (${currentDamage}/${maxHealth} damage) ${remainingMonsters} monsters remaining.`);
    } else {
        message.channel.send(`⚔️ ${member} attacks but misses! ${remainingMonsters} monsters remaining.`);
    }
};

module.exports.help = {
    name: "attack",
    aliases: ["atk", "fight"]
};
