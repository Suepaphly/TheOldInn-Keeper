
const { QuickDB } = require("quick.db");
const db = new QuickDB();
const Discord = require('discord.js');
const ptt = require("../../utility/protectTheTavern.js");

module.exports.run = async (client, message, args) => {
    const user = message.author;
    const member = message.guild.members.cache.get(user.id);
    const mentionedUser = message.mentions.users.first();

    // If a user is mentioned, redirect to PvP combat
    if (mentionedUser) {
        const pvpAttack = require('./attackplayer.js');
        return pvpAttack.run(client, message, args);
    }

    // Town combat logic (no user mentioned)
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

    // Get combat level and calculate damage
    const combatLevel = await db.get(`combatlevel_${user.id}`) || 0;
    let damageDealt = combatLevel + 1; // +1 damage for each combat level
    let killedMonster = "";
    let hitMonster = "";
    
    // Use the same arrays as protectTheTavern.js
    const monsterArray = ptt.monsterArray;
    const monsterHealthArray = ptt.monsterHealthArray;
    
    // Find the first available monster to attack (starting with weakest)
    for (let i = 0; i < monsterArray.length; i++) {
        const monsterType = monsterArray[i];
        const monsterCount = monsters[monsterType] || 0;
        
        if (monsterCount > 0) {
            hitMonster = monsterType;
            
            // Get current damage for this monster type
            const currentDamage = await db.get(`monster_damage_${monsterType}`) || 0;
            const newDamage = currentDamage + damageDealt;
            
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

    // Handle monster slaying rewards
    if (killedMonster) {
        // Check if multiple players attacked this turn and deal with priority
        const allEntries = await db.all();
        const currentTurnAttackers = allEntries.filter(entry => 
            entry.id.startsWith(`turn_attack_`) && entry.id.endsWith(`_${currentTurn}`)
        );
        
        let rewardWinner = user.id;
        let highestCombatLevel = combatLevel;
        
        // If multiple attackers this turn, determine winner by combat level (with random tiebreaker)
        if (currentTurnAttackers.length > 1) {
            const candidates = [];
            
            for (const attacker of currentTurnAttackers) {
                const attackerId = attacker.id.split('_')[2];
                const attackerCombatLevel = await db.get(`combatlevel_${attackerId}`) || 0;
                
                if (attackerCombatLevel > highestCombatLevel) {
                    highestCombatLevel = attackerCombatLevel;
                    rewardWinner = attackerId;
                    candidates.length = 0; // Clear previous candidates
                    candidates.push(attackerId);
                } else if (attackerCombatLevel === highestCombatLevel) {
                    candidates.push(attackerId);
                }
            }
            
            // Random selection among tied highest combat level players
            if (candidates.length > 1) {
                rewardWinner = candidates[Math.floor(Math.random() * candidates.length)];
            }
        }
        
        // Calculate and award the reward (one-tenth of summoning cost)
        const monsterCostArray = ptt.monsterCostArray;
        const monsterIndex = monsterArray.indexOf(killedMonster);
        const reward = Math.floor(monsterCostArray[monsterIndex] / 10);
        
        await db.add(`money_${rewardWinner}`, reward);
        
        // Check remaining monsters first
        const updatedMonsters = await db.get("Monsters") || {};
        const remainingMonsters = Object.values(updatedMonsters).reduce((sum, count) => sum + count, 0);
        
        // Send appropriate message
        if (rewardWinner === user.id) {
            message.channel.send(`⚔️ ${member} slays a ${killedMonster} with ${damageDealt} damage and claims ${reward} kopeks! ${remainingMonsters} monsters remaining.`);
        } else {
            const winnerMember = message.guild.members.cache.get(rewardWinner);
            message.channel.send(`⚔️ ${member} slays a ${killedMonster} with ${damageDealt} damage! ${winnerMember} claims the ${reward} kopek bounty due to superior combat skill! ${remainingMonsters} monsters remaining.`);
        }
    }

    if (!killedMonster) {
        if (hitMonster) {
            const currentDamage = await db.get(`monster_damage_${hitMonster}`) || 0;
            const maxHealth = monsterHealthArray[monsterArray.indexOf(hitMonster)];
            
            // Get updated monster count for display
            const updatedMonsters = await db.get("Monsters") || {};
            const remainingMonsters = Object.values(updatedMonsters).reduce((sum, count) => sum + count, 0);
            
            message.channel.send(`⚔️ ${member} hits a ${hitMonster} for ${damageDealt} damage! (${currentDamage}/${maxHealth} damage) ${remainingMonsters} monsters remaining.`);
        } else {
            // Get updated monster count for display
            const updatedMonsters = await db.get("Monsters") || {};
            const remainingMonsters = Object.values(updatedMonsters).reduce((sum, count) => sum + count, 0);
            
            message.channel.send(`⚔️ ${member} attacks but misses! ${remainingMonsters} monsters remaining.`);
        }
    }
};

module.exports.help = {
    name: "attack",
    aliases: ["atk", "fight"]
};
