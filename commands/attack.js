
const Discord = require("discord.js");
const { QuickDB } = require("quick.db");
const db = new QuickDB();
const ptt = require("../utility/protectTheTavern.js");

module.exports.run = async (client, message, args) => {
    const user = message.author;
    
    // Check if there are monsters to attack
    const monsters = await db.get("Monsters") || {};
    const totalMonsters = Object.values(monsters).reduce((sum, count) => sum + count, 0);
    
    if (totalMonsters === 0) {
        return message.channel.send(`${user.username}, there are no monsters to attack! The town is safe.`);
    }
    
    // Check if battle is active and enforce turn-based attacking
    if (ptt.lockArena && ptt.currentBattleTurn > 0) {
        // During battle: one attack per turn
        const hasAttackedThisTurn = await db.get(`turn_attack_${user.id}_${ptt.currentBattleTurn}`);
        if (hasAttackedThisTurn) {
            return message.channel.send(`${user.username}, you have already attacked this turn! Wait for the next turn.`);
        }
        
        // Mark that this player has attacked this turn
        await db.set(`turn_attack_${user.id}_${ptt.currentBattleTurn}`, true);
    } else {
        // Outside of battle: regular cooldown (5 minutes)
        const lastAttack = await db.get(`attack_cooldown_${user.id}`);
        if (lastAttack && (Date.now() - lastAttack < 300000)) { // 5 minutes cooldown
            const timeLeft = Math.ceil((300000 - (Date.now() - lastAttack)) / 1000);
            return message.channel.send(`${user.username}, you must wait ${timeLeft} seconds before attacking again!`);
        }
        
        // Set cooldown for outside-battle attacks
        await db.set(`attack_cooldown_${user.id}`, Date.now());
    }
    
    // Deal 10 damage to monsters (starting with weakest)
    let remainingDamage = 10;
    let totalKilled = 0;
    let killReport = [];
    
    const monsterArray = ptt.monsterArray;
    const monsterHealthArray = ptt.monsterHealthArray;
    
    for (let i = 0; i < monsterArray.length && remainingDamage > 0; i++) {
        const monsterType = monsterArray[i];
        const monsterCount = monsters[monsterType] || 0;
        if (monsterCount > 0) {
            const monstersKilled = Math.min(Math.floor(remainingDamage / monsterHealthArray[i]), monsterCount);
            if (monstersKilled > 0) {
                await db.sub(`Monsters.${monsterType}`, monstersKilled);
                remainingDamage -= monstersKilled * monsterHealthArray[i];
                totalKilled += monstersKilled;
                killReport.push(`${monstersKilled} ${monsterType}(s)`);
            }
        }
    }
    
    if (totalKilled > 0) {
        message.channel.send(`⚔️ ${user.username} attacks the monster horde! Killed: ${killReport.join(", ")} (10 damage dealt)`);
    } else {
        message.channel.send(`⚔️ ${user.username} attacks but the monsters are too strong to kill with this strike! (10 damage dealt)`);
    }
    
    // Check if all monsters are defeated
    const remainingMonsters = await db.get("Monsters") || {};
    const remainingTotal = Object.values(remainingMonsters).reduce((sum, count) => sum + count, 0);
    
    if (remainingTotal === 0) {
        message.channel.send("🎉 All monsters have been defeated by the brave defenders!");
    }
};

module.exports.help = {
    name: "attack",
    aliases: ["atk", "strike"]
};
