var cron = require('node-cron');
const { QuickDB } = require("quick.db");
const db = new QuickDB();
const Discord = require("discord.js");

// Store reference to the Discord client for scheduled attacks
let discordClient = null;
let scheduledAttackChannel = null;

const troopArray = ["town_guard", "mercenary", "soldier", "knight", "royal_guard"];
const troopCostArray = [10, 20, 30, 50, 100];
const troopHealthArray = [1, 5, 10, 25, 50];
const troopDmgArray = [1, 2, 5, 7, 9];

const trapArray = ["spikes", "boiling_oil", "repeater", "ballista", "cannon"];
const trapCostArray = [100, 200, 300, 500, 1000];
const trapDmgArray = [5, 10, 15, 25, 50];

const wallArray = ["rampart", "wall", "castle"];
const wallCostArray = [50, 500, 5000];
const wallHealthArray = [1, 10, 100];

const monsterArray = ["goblin", "mephit", "broodling", "ogre", "automaton"];
const monsterCostArray = [10, 20, 30, 50, 100];
const monsterHealthArray = [1, 5, 10, 25, 50];
const monsterDmgArray = [2, 8, 14, 21, 28];
const monsterTimeArray = [21600000, 43200000, 86400000, 172800000, 259200000];

var lockArena = false;
var currentBattleTurn = 0;

//--------------------- Main Game Loop Functions

async function setupNewGame() {
    try {
        await db.set(`rampart`, 100);
        await db.set(`wall`, 10);
        await db.set(`castle`, 1);

        await db.set(`Troops_rampart`, {town_guard: 0, mercenary: 0, soldier: 0, knight: 0, royal_guard: 0});
        await db.set(`Traps_rampart`, {spikes: 0, boiling_Oil: 0, repeater: 0, ballista: 0, cannon: 0});

        await db.set(`Troops_wall`, {town_guard: 0, mercenary: 0, soldier: 0, knight: 0, royal_guard: 0});
        await db.set(`Traps_wall`, {spikes: 0, boiling_Oil: 0, repeater: 0, ballista: 0, cannon: 0});

        await db.set(`Troops_castle`, {town_guard: 0, mercenary: 0, soldier: 0, knight: 0, royal_guard: 0});
        await db.set(`Traps_castle`, {spikes: 0, boiling_Oil: 0, repeater: 0, ballista: 0, cannon: 0});

        await db.set(`Monsters`, {goblin: 0, mephit: 0, broodling: 0, ogre: 0, automaton: 0});
        
        // Clear all player troop and trap tracking
        const allEntries = await db.all();
        const playerEntries = allEntries.filter(entry => 
            entry.id.startsWith("player_troops_") || entry.id.startsWith("player_traps_")
        );
        for (const entry of playerEntries) {
            await db.delete(entry.id);
        }
    } catch (error) {
        console.error('Failed to setup new game:', error);
    }
}


async function startBattle(channel) {
    if (lockArena) {
        if (channel) channel.send("Battle already in progress!");
        return;
    }
    
    lockArena = true;
    currentBattleTurn = 0;
    if (channel) channel.send("🏰 Battle started! The arena is locked.");

    try {
        // Clear any existing turn attack tracking and freeze effects
        const allEntries = await db.all();
        const turnAttackEntries = allEntries.filter(entry => entry.id.startsWith("turn_attack_"));
        for (const entry of turnAttackEntries) {
            await db.delete(entry.id);
        }
        
        // Clear freeze-related effects
        await db.delete("freeze_used_this_combat");
        await db.delete("monsters_frozen_this_turn");
        
        // Clear user freeze tracking
        const freezeEntries = allEntries.filter(entry => entry.id.startsWith("user_freeze_used_"));
        for (const entry of freezeEntries) {
            await db.delete(entry.id);
        }
        // Display initial battle state
        const monsters = await db.get("Monsters") || {};
        const totalMonsters = Object.values(monsters).reduce((sum, count) => sum + count, 0);
        
        if (totalMonsters === 0) {
            if (channel) channel.send("No monsters to battle! Battle cancelled.");
            lockArena = false;
            return;
        }
        
        if (channel) channel.send(`⚔️ ${totalMonsters} monsters approach the town!`);
        
        // Start the battle turns (limited to 10 turns)
        for (let turn = 1; turn <= 10; turn++) {
            currentBattleTurn = turn;
            
            // Clear player attack tracking for this turn
            const allEntries = await db.all();
            const turnAttackEntries = allEntries.filter(entry => entry.id.startsWith("turn_attack_"));
            for (const entry of turnAttackEntries) {
                await db.delete(entry.id);
            }
            
            // Check if there are still monsters before each turn
            const currentMonsters = await db.get("Monsters") || {};
            const totalMonstersLeft = Object.values(currentMonsters).reduce((sum, count) => sum + count, 0);
            
            if (totalMonstersLeft === 0) {
                if (channel) channel.send("🎉 All monsters have been defeated!");
                break;
            }
            
            // Show turn number and defense status every turn
            if (channel) {
                const ramparts = await db.get("rampart") || 0;
                const walls = await db.get("wall") || 0;
                const castle = await db.get("castle") || 0;
                
                // Calculate total troops
                const rampartTroops = await db.get("Troops_rampart") || {};
                const wallTroops = await db.get("Troops_wall") || {};
                const castleTroops = await db.get("Troops_castle") || {};
                
                const totalRampartTroops = Object.values(rampartTroops).reduce((sum, count) => sum + (count || 0), 0);
                const totalWallTroops = Object.values(wallTroops).reduce((sum, count) => sum + (count || 0), 0);
                const totalCastleTroops = Object.values(castleTroops).reduce((sum, count) => sum + (count || 0), 0);
                const totalTroops = totalRampartTroops + totalWallTroops + totalCastleTroops;
                
                channel.send(`--- **Turn ${turn}/10** ---\n🏰 **Defenses:** ${ramparts} ramparts, ${walls} walls, ${castle} castle\n⚔️ **Troops:** ${totalTroops} defenders\n👹 **Enemies:** ${totalMonstersLeft} monsters`);
            }
            
            const battleResult = await attackTurn(channel);
            if (!battleResult.continue) {
                break; // Stop the battle if all monsters are defeated or have breached the defenses
            }
            
            // Check if this is the last turn - monsters retreat
            if (turn === 10) {
                const remainingMonsters = await db.get("Monsters") || {};
                const remainingTotal = Object.values(remainingMonsters).reduce((sum, count) => sum + count, 0);
                
                if (remainingTotal > 0) {
                    if (channel) {
                        channel.send(`🏃‍♂️ **Monster Retreat!** ${remainingTotal} monsters flee back into the wilderness!`);
                        channel.send("🎉 **VICTORY!** The town has successfully defended against the monster attack!");
                    }
                    
                    // Clear all monsters and reset summoner claims
                    await db.set("Monsters", {goblin: 0, mephit: 0, broodling: 0, ogre: 0, automaton: 0});
                    
                    // Clear monster summoner tracking (players lose claim to retreating monsters)
                    const allEntries = await db.all();
                    const summonerEntries = allEntries.filter(entry => entry.id.startsWith("monster_summoner_"));
                    for (const entry of summonerEntries) {
                        await db.delete(entry.id);
                    }
                }
                break;
            }
            
            // Wait between turns
            await new Promise(resolve => setTimeout(resolve, 15000)); // 15 seconds between turns
        }

        // Conclude the battle
        await endBattle(channel);
    } catch (error) {
        console.error("Error during battle:", error);
        if (channel) channel.send("❌ Battle encountered an error!");
    }

    lockArena = false;
    currentBattleTurn = 0;
    if (channel) channel.send("Battle ended! The arena is unlocked.");
}


async function attackTurn(channel) {
    try {
        // Get current defenses and monsters
        const monsters = await db.get("Monsters") || {goblin: 0, mephit: 0, broodling: 0, ogre: 0, automaton: 0};
        
        // Calculate total monster count
        let totalMonsters = Object.values(monsters).reduce((sum, count) => sum + count, 0);
        if (totalMonsters === 0) {
            if (channel) channel.send("🎉 No monsters left! Town has won!");
            return { continue: false, victory: true }; // End battle - town wins
        }

        // PHASE 1: Monster attacks
        let monsterDamage = 0;
        const monstersFrozen = await db.get("monsters_frozen_this_turn") || false;
        
        if (monstersFrozen) {
            // Monsters are frozen - no damage this turn
            if (channel) channel.send("🧊 **Monsters are frozen solid!** They cannot attack this turn!");
            // Clear freeze effect for next turn
            await db.delete("monsters_frozen_this_turn");
        } else {
            // Normal monster damage calculation
            for (let i = 0; i < monsterArray.length; i++) {
                const monsterType = monsterArray[i];
                const monsterCount = (await db.get(`Monsters.${monsterType}`)) || 0;
                monsterDamage += monsterCount * monsterDmgArray[i];
            }
            
            if (monsterDamage > 0) {
                // Apply monster damage to defenses
                await applyDamageToDefenses(monsterDamage, channel);
            }
        }

        // PHASE 2: Player defend actions (already handled in defend.js during turn)
        
        // PHASE 3: Traps fire (already handled in applyDamageToDefenses)
        
        // PHASE 4: Troops attack monsters
        let troopDamage = await calculateActiveTroopDamage(channel);
        if (troopDamage > 0) {
            await applyTroopDamageToMonsters(troopDamage, channel);
        }

        // Check if all defenses are destroyed (walls, troops, and traps)
        const ramparts = await db.get("rampart") || 0;
        const walls = await db.get("wall") || 0;
        const castle = await db.get("castle") || 0;
        
        // Check total troops across all locations
        const rampartTroops = await db.get("Troops_rampart") || {};
        const wallTroops = await db.get("Troops_wall") || {};
        const castleTroops = await db.get("Troops_castle") || {};
        
        const totalRampartTroops = Object.values(rampartTroops).reduce((sum, count) => sum + (count || 0), 0);
        const totalWallTroops = Object.values(wallTroops).reduce((sum, count) => sum + (count || 0), 0);
        const totalCastleTroops = Object.values(castleTroops).reduce((sum, count) => sum + (count || 0), 0);
        const totalTroops = totalRampartTroops + totalWallTroops + totalCastleTroops;
        
        // Check total traps across all locations
        const rampartTraps = await db.get("Traps_rampart") || {};
        const wallTraps = await db.get("Traps_wall") || {};
        const castleTraps = await db.get("Traps_castle") || {};
        
        const totalRampartTraps = Object.values(rampartTraps).reduce((sum, count) => sum + (count || 0), 0);
        const totalWallTraps = Object.values(wallTraps).reduce((sum, count) => sum + (count || 0), 0);
        const totalCastleTraps = Object.values(castleTraps).reduce((sum, count) => sum + (count || 0), 0);
        const totalTraps = totalRampartTraps + totalWallTraps + totalCastleTraps;
        
        // Town is defeated if all walls AND all troops AND all traps are destroyed
        if (ramparts <= 0 && walls <= 0 && castle <= 0 && totalTroops <= 0 && totalTraps <= 0) {
            if (channel) channel.send("💀 **TOTAL DEFEAT!** All walls, troops, and traps have been destroyed! Monsters have completely conquered the town!");
            return { continue: false, victory: false }; // End battle - monsters win
        }
        
        // Also end if just castle is destroyed and no other defenses remain
        if (castle <= 0 && totalTroops <= 0 && totalTraps <= 0) {
            if (channel) channel.send("💀 **CASTLE FALLEN!** The castle has been destroyed and no defenders remain! Monsters have won!");
            return { continue: false, victory: false }; // End battle - monsters win
        }

        return { continue: true, victory: null }; // Continue battle
    } catch (error) {
        console.error("Error in attack turn:", error);
        return { continue: false, victory: null };
    }
}

async function endBattle(channel) {
    try {
        const ramparts = await db.get("rampart") || 0;
        const walls = await db.get("wall") || 0;
        const castle = await db.get("castle") || 0;
        const monsters = await db.get("Monsters") || {};
        const totalMonsters = Object.values(monsters).reduce((sum, count) => sum + count, 0);
        
        // Check if town was completely defeated
        const rampartTroops = await db.get("Troops_rampart") || {};
        const wallTroops = await db.get("Troops_wall") || {};
        const castleTroops = await db.get("Troops_castle") || {};
        
        const totalRampartTroops = Object.values(rampartTroops).reduce((sum, count) => sum + (count || 0), 0);
        const totalWallTroops = Object.values(wallTroops).reduce((sum, count) => sum + (count || 0), 0);
        const totalCastleTroops = Object.values(castleTroops).reduce((sum, count) => sum + (count || 0), 0);
        const totalTroops = totalRampartTroops + totalWallTroops + totalCastleTroops;
        
        const rampartTraps = await db.get("Traps_rampart") || {};
        const wallTraps = await db.get("Traps_wall") || {};
        const castleTraps = await db.get("Traps_castle") || {};
        
        const totalRampartTraps = Object.values(rampartTraps).reduce((sum, count) => sum + (count || 0), 0);
        const totalWallTraps = Object.values(wallTraps).reduce((sum, count) => sum + (count || 0), 0);
        const totalCastleTraps = Object.values(castleTraps).reduce((sum, count) => sum + (count || 0), 0);
        const totalTraps = totalRampartTraps + totalWallTraps + totalCastleTraps;
        
        const isCompletelyDefeated = (ramparts <= 0 && walls <= 0 && castle <= 0 && totalTroops <= 0 && totalTraps <= 0) ||
                                   (castle <= 0 && totalTroops <= 0 && totalTraps <= 0);
        
        if (isCompletelyDefeated) {
            if (channel) channel.send("💀 **COMPLETE DEFEAT!** The monsters have destroyed all defenses and conquered the town!");
            
            // Handle bank stealing
            await handleBankStealing(channel);
            
            // Reset defenses for rebuild
            await setupNewGame();
        } else if (totalMonsters === 0) {
            // Victory case is already handled in the battle loop
            if (channel) channel.send("🎉 Town defenses held strong!");
        }
        // Note: Monster retreat is handled in the battle loop at turn 10
        
        // Comprehensive garbage collection for battle cleanup
        await performBattleGarbageCollection(channel);
        
        if (channel) channel.send("Battle concluded. Preparing for next conflict...");
    } catch (error) {
        console.error("Error ending battle:", error);
    }
}

//--------------------- User Linked Functions

async function buyArmy(type, number, location, player, message) {
    try {
        var typeIndex = troopArray.indexOf(type);
        var locIndex = wallArray.indexOf(location);
        var locWall = await db.get(`${wallArray[locIndex]}`) || 0;
        var wBal = await db.get(`money_${player.id}`) || 0;
        
        // Ensure number is parsed as integer
        number = parseInt(number);
        
        // Check for Tactician feat (50% cost reduction, rounded up)
        const hasTacticianFeat = await db.get(`feat_tactician_${player.id}`) || 0;
        let troopCost = troopCostArray[typeIndex] * number;
        if (hasTacticianFeat) {
            troopCost = Math.ceil(troopCost * 0.5); // 50% reduction, rounded up
        }
        
        // Calculate player's current troops at this location
        var playerTroops = await db.get(`player_troops_${player.id}_${wallArray[locIndex]}`) || 0;
        
        // Each 5 walls allows 1 troop per player
        var maxTroopsForPlayer = Math.floor(locWall / 5);
        var troopsAfterPurchase = playerTroops + number;
        
        if (troopsAfterPurchase > maxTroopsForPlayer) {
            message.channel.send(`${player.username} you can only have ${maxTroopsForPlayer} troops at ${wallArray[locIndex]} (1 per 5 walls). You currently have ${playerTroops}.`);
        } else if (wBal < troopCost) {
            message.channel.send(`${player.username} doesn't have enough kopeks to buy ${number} of ${troopArray[typeIndex]}.`);
        } else {
            await db.add(`Troops_${wallArray[locIndex]}.total`, number);
            await db.add(`Troops_${wallArray[locIndex]}.${troopArray[typeIndex]}`, number);
            await db.add(`player_troops_${player.id}_${wallArray[locIndex]}`, number);
            await db.sub(`money_${player.id}`, troopCost);
            
            let purchaseMessage = `${player.username} just bought ${number} units of ${troopArray[typeIndex]}. (${troopsAfterPurchase}/${maxTroopsForPlayer} troops at ${wallArray[locIndex]})`;
            if (hasTacticianFeat) {
                purchaseMessage += ` ⚔️ **Tactician feat** reduced the cost by 50%!`;
            }
            message.channel.send(purchaseMessage);
        }
    } catch (error) {
        console.error('Error buying army:', error);
    }
}


async function buyTrap(type, number, location, player, message) {
    try {
        var typeIndex = trapArray.indexOf(type);
        var locIndex = wallArray.indexOf(location);
        var locWall = await db.get(`${wallArray[locIndex]}`) || 0;
        var wBal = await db.get(`money_${player.id}`) || 0;
        
        // Ensure number is parsed as integer
        number = parseInt(number);
        
        // Check for Mechanist feat (50% cost reduction, rounded up)
        const hasMechanistFeat = await db.get(`feat_mechanist_${player.id}`) || 0;
        let trapCost = trapCostArray[typeIndex] * number;
        if (hasMechanistFeat) {
            trapCost = Math.ceil(trapCost * 0.5); // 50% reduction, rounded up
        }
        
        // Calculate player's current traps at this location
        var playerTraps = await db.get(`player_traps_${player.id}_${wallArray[locIndex]}`) || 0;
        
        // Each 5 walls allows 1 trap per player
        var maxTrapsForPlayer = Math.floor(locWall / 5);
        var trapsAfterPurchase = playerTraps + number;

        if (trapsAfterPurchase > maxTrapsForPlayer) {
            message.channel.send(`${player.username} you can only have ${maxTrapsForPlayer} traps at ${wallArray[locIndex]} (1 per 5 walls). You currently have ${playerTraps}.`);
        } else if (wBal < trapCost) {
            message.channel.send(`${player.username} doesn't have enough kopeks to buy ${number} units of ${trapArray[typeIndex]}.`);
        } else {
            await db.add(`Traps_${wallArray[locIndex]}.total`, number);
            await db.add(`Traps_${wallArray[locIndex]}.${trapArray[typeIndex]}`, number);
            await db.add(`player_traps_${player.id}_${wallArray[locIndex]}`, number);
            await db.sub(`money_${player.id}`, trapCost);
            
            let purchaseMessage = `${player.username} just bought ${number} units of ${trapArray[typeIndex]}. (${trapsAfterPurchase}/${maxTrapsForPlayer} traps at ${wallArray[locIndex]})`;
            if (hasMechanistFeat) {
                purchaseMessage += ` 🔧 **Mechanist feat** reduced the cost by 50%!`;
            }
            message.channel.send(purchaseMessage);
        }
    } catch (error) {
        console.error('Error buying trap:', error);
    }
}



async function buyWall(type, number, player, message) {
    try {
        var typeIndex = wallArray.indexOf(type);
        var lowerWallUnits = typeIndex > 0 ? await db.get(`${wallArray[typeIndex - 1]}`) : null;
        var currentWallUnits = await db.get(`${wallArray[typeIndex]}`);
        var wBal = await db.get(`money_${player.id}`);
        var locAvail = [true,
            (lowerWallUnits / 10 - currentWallUnits) >= number,
            (lowerWallUnits / 10 - currentWallUnits) >= number][typeIndex];

        if (wBal >= wallCostArray[typeIndex] * number && locAvail) {
            await db.add(`${wallArray[typeIndex]}`, number);
            await db.sub(`money_${player.id}`, wallCostArray[typeIndex] * number);
            message.channel.send(`${player.username} just bought ${number} units of ${wallArray[typeIndex]}.`);
        } else if (wBal < wallCostArray[typeIndex] * number) {
            message.channel.send(`${player.username} doesn't have enough kopeks to buy ${number} units of ${wallArray[typeIndex]}.`);
        } else if (!locAvail) {
            message.channel.send(`${player.username} there aren't enough ${wallArray[typeIndex - 1]}s to build ${number} ${wallArray[typeIndex]}(s).`);
        }
    } catch (error) {
        console.error('Error buying wall:', error);
    }
}

async function rmArmy(type, number, location, player, message) {
    try {
        var typeIndex = troopArray.indexOf(type);
        var locIndex = wallArray.indexOf(location);
        var totalTroops = await db.get(`Troops_${wallArray[locIndex]}.total`);
        var troopTypeCount = await db.get(`Troops_${wallArray[locIndex]}.${troopArray[typeIndex]}`);
        var wBal = await db.get(`money_${player.id}`);
        var locAvail = totalTroops >= number && troopTypeCount >= number;

        if (wBal >= troopCostArray[typeIndex] * number && locAvail) {
            await db.sub(`Troops_${wallArray[locIndex]}.total`, number);
            await db.sub(`Troops_${wallArray[locIndex]}.${troopArray[typeIndex]}`, number);
            await db.sub(`money_${player.id}`, troopCostArray[typeIndex] * number);
            message.channel.send(`${player.username} just dismissed ${number} units of ${troopArray[typeIndex]}.`);
        } else if (wBal < troopCostArray[typeIndex] * number) {
            message.channel.send(`${player.username} doesn't have enough kopeks to dismiss ${number} of ${troopArray[typeIndex]}.`);
        } else if (!locAvail) {
            message.channel.send(`${player.username} there aren't enough ${troopArray[typeIndex]}s to remove ${number}.`);
        }
    } catch (error) {
        console.error('Error removing army:', error);
    }
}

async function rmTrap(type, number, location, player, message) {
    try {
        var typeIndex = trapArray.indexOf(type);
        var locIndex = wallArray.indexOf(location);
        var totalTraps = await db.get(`Traps_${wallArray[locIndex]}.total`);
        var trapTypeCount = await db.get(`Traps_${wallArray[locIndex]}.${trapArray[typeIndex]}`);
        var wBal = await db.get(`money_${player.id}`);
        var locAvail = totalTraps >= number && trapTypeCount >= number;

        if (wBal >= trapCostArray[typeIndex] * number && locAvail) {
            await db.sub(`Traps_${wallArray[locIndex]}.total`, number);
            await db.sub(`Traps_${wallArray[locIndex]}.${trapArray[typeIndex]}`, number);
            await db.sub(`money_${player.id}`, trapCostArray[typeIndex] * number);
            message.channel.send(`${player.username} just removed ${number} units of ${trapArray[typeIndex]}.`);
        } else if (wBal < trapCostArray[typeIndex] * number) {
            message.channel.send(`${player.username} doesn't have enough kopeks to remove ${number} units of ${trapArray[typeIndex]}.`);
        } else if (!locAvail) {
            message.channel.send(`${player.username} there aren't enough ${trapArray[typeIndex]}s to remove ${number}.`);
        }
    } catch (error) {
        console.error('Error removing trap:', error);
    }
}

async function rmWall(type, number, player, message) {
    try {
        var typeIndex = wallArray.indexOf(type);
        var wallUnits = await db.get(`${wallArray[typeIndex]}`);
        var wBal = await db.get(`money_${player.id}`);
        var locAvail = wallUnits >= number;

        if (wBal >= wallCostArray[typeIndex] * number && locAvail) {
            await db.sub(`${wallArray[typeIndex]}`, number);
            await db.sub(`money_${player.id}`, wallCostArray[typeIndex] * number);
            message.channel.send(`${player.username} just destroyed ${number} units of ${wallArray[typeIndex]}.`);
        } else if (wBal < wallCostArray[typeIndex] * number) {
            message.channel.send(`${player.username} doesn't have enough kopeks to destroy ${number} units of ${wallArray[typeIndex]}.`);
        } else if (!locAvail) {
            message.channel.send(`${player.username} there aren't enough ${wallArray[typeIndex]}s to destroy ${number}.`);
        }
    } catch (error) {
        console.error('Error destroying wall:', error);
    }
}


async function summonMonster(type, number, playerid) {
    try {
        const typeIndex = monsterArray.indexOf(type);
        if (typeIndex === -1) {
            console.log(`Invalid monster type: ${type}`);
            return false;
        }
        
        const cost = monsterCostArray[typeIndex] * number;
        const playerMoney = await db.get(`money_${playerid}`) || 0;
        
        if (playerMoney >= cost) {
            await db.sub(`money_${playerid}`, cost);
            await addMonster(type, number);
            
            // Track monster summoner for reward distribution
            const currentContribution = await db.get(`monster_summoner_${playerid}`) || 0;
            await db.set(`monster_summoner_${playerid}`, currentContribution + cost);
            
            console.log(`Player ${playerid} summoned ${number} ${type}(s) for ${cost} kopeks`);
            return true;
        } else {
            console.log(`Player ${playerid} doesn't have enough kopeks to summon ${number} ${type}(s)`);
            return false;
        }
    } catch (error) {
        console.error("Error summoning monster:", error);
        return false;
    }
}

async function handleBankStealing(channel) {
    try {
        // Get all bank accounts
        const allEntries = await db.all();
        const bankEntries = allEntries.filter(entry => entry.id.startsWith("bank_"));
        
        if (bankEntries.length === 0) {
            if (channel) channel.send("💰 No bank accounts found to raid!");
            return;
        }
        
        let totalStolen = 0;
        let stealingResults = [];
        
        // Steal from each player's bank (20-80%)
        for (const entry of bankEntries) {
            const userId = entry.id.split('_')[1];
            const bankAmount = entry.value || 0;
            
            if (bankAmount > 0) {
                const stealPercentage = Math.floor(Math.random() * 61) + 20; // 20-80%
                const stolenAmount = Math.floor(bankAmount * (stealPercentage / 100));
                
                await db.sub(`bank_${userId}`, stolenAmount);
                totalStolen += stolenAmount;
                
                stealingResults.push({
                    userId: userId,
                    stolen: stolenAmount,
                    percentage: stealPercentage
                });
            }
        }
        
        if (totalStolen === 0) {
            if (channel) channel.send("💰 The monster army found no wealth to plunder!");
            return;
        }
        
        // Get monster summoners and their contributions
        const summonerEntries = allEntries.filter(entry => entry.id.startsWith("monster_summoner_"));
        let totalContributions = 0;
        const summoners = [];
        
        for (const entry of summonerEntries) {
            const userId = entry.id.split('_')[2];
            const contribution = entry.value || 0;
            if (contribution > 0) {
                summoners.push({ userId, contribution });
                totalContributions += contribution;
            }
        }
        
        // Distribute stolen funds to summoners
        if (summoners.length > 0 && totalContributions > 0) {
            for (const summoner of summoners) {
                const share = Math.floor(totalStolen * (summoner.contribution / totalContributions));
                await db.add(`money_${summoner.userId}`, share);
            }
        }
        
        // Clear summoner tracking for next battle
        for (const entry of summonerEntries) {
            await db.delete(entry.id);
        }
        
        // Send results to Discord
        if (channel) {
            let message = `💰 **BANK RAID RESULTS** 💰\n`;
            message += `Total stolen: **${totalStolen.toLocaleString()} kopeks**\n\n`;
            
            if (summoners.length > 0) {
                message += `**Rewards distributed to monster summoners:**\n`;
                for (const summoner of summoners) {
                    const share = Math.floor(totalStolen * (summoner.contribution / totalContributions));
                    const percentage = Math.round((summoner.contribution / totalContributions) * 100);
                    message += `<@${summoner.userId}>: ${share.toLocaleString()} kopeks (${percentage}% of loot)\n`;
                }
            } else {
                message += `No monster summoners found - stolen wealth vanishes into the void!\n`;
            }
            
            message += `\n**Individual bank losses:**\n`;
            for (const result of stealingResults) {
                message += `<@${result.userId}>: -${result.stolen.toLocaleString()} kopeks (${result.percentage}%)\n`;
            }
            
            channel.send(message);
        }
        
    } catch (error) {
        console.error("Error handling bank stealing:", error);
        if (channel) channel.send("❌ Error processing bank raid!");
    }
}


//--------------------- Utility Functions

async function endTroopContract() {
    try {
        // Dismiss all troops from all locations
        for (const wall of wallArray) {
            const emptyTroops = {town_guard: 0, mercenary: 0, soldier: 0, knight: 0, royal_guard: 0, total: 0};
            await db.set(`Troops_${wall}`, emptyTroops);
        }
        console.log("All troop contracts have ended. Troops dismissed.");
    } catch (error) {
        console.error("Error ending troop contracts:", error);
    }
}

async function calculateTownDamage() {
    try {
        let totalDamage = 0;
        
        // Calculate damage from traps only (troops are handled separately now)
        for (const wall of wallArray) {
            const traps = await db.get(`Traps_${wall}`) || {};
            
            // Add trap damage
            for (let i = 0; i < trapArray.length; i++) {
                const trapType = trapArray[i];
                const trapCount = traps[trapType] || 0;
                totalDamage += trapCount * trapDmgArray[i];
            }
        }
        
        return totalDamage;
    } catch (error) {
        console.error("Error calculating town damage:", error);
        return 0;
    }
}

async function applyDamageToDefenses(damage, channel) {
    try {
        let remainingDamage = damage;
        let damageReport = [];
        let trapDamage = 0;
        
        // Calculate total wall health (each wall type has health based on count * health per unit)
        const rampartCount = await db.get("rampart") || 0;
        const wallCount = await db.get("wall") || 0;
        const castleCount = await db.get("castle") || 0;
        
        // Damage ramparts first (1 HP per rampart unit)
        if (remainingDamage > 0 && rampartCount > 0) {
            const rampartHealth = rampartCount * wallHealthArray[0]; // 1 HP per rampart
            const rampartDamage = Math.min(remainingDamage, rampartHealth);
            const rampartsDestroyed = Math.min(rampartDamage, rampartCount);
            
            if (rampartsDestroyed > 0) {
                await db.sub("rampart", rampartsDestroyed);
                remainingDamage -= rampartDamage;
                damageReport.push(`🛡️ Ramparts: -${rampartsDestroyed} units (${rampartDamage} damage)`);
                
                // Fire rampart traps when breached
                const rampartTraps = await db.get("Traps_rampart") || {};
                let rampartTrapDamage = 0;
                for (let i = 0; i < trapArray.length; i++) {
                    const trapType = trapArray[i];
                    const trapCount = rampartTraps[trapType] || 0;
                    rampartTrapDamage += trapCount * trapDmgArray[i];
                }
                if (rampartTrapDamage > 0) {
                    trapDamage += rampartTrapDamage;
                    if (channel) channel.send(`💣 **Rampart traps activate!** Dealing ${rampartTrapDamage} damage to attackers!`);
                }
            }
        }
        
        // If ramparts are destroyed, damage troops at rampart location
        const updatedRamparts = await db.get("rampart") || 0;
        if (updatedRamparts <= 0 && remainingDamage > 0) {
            remainingDamage = await applyDamageToTroops("rampart", remainingDamage, channel);
        }
        
        // Then damage walls (10 HP per wall unit)
        const currentWallCount = await db.get("wall") || 0;
        if (remainingDamage > 0 && currentWallCount > 0) {
            const wallHealth = currentWallCount * wallHealthArray[1]; // 10 HP per wall
            const wallDamage = Math.min(remainingDamage, wallHealth);
            const wallsDestroyed = Math.min(Math.floor(wallDamage / wallHealthArray[1]), currentWallCount);
            
            if (wallsDestroyed > 0) {
                await db.sub("wall", wallsDestroyed);
                remainingDamage -= wallsDestroyed * wallHealthArray[1];
                damageReport.push(`🧱 Walls: -${wallsDestroyed} units (${wallsDestroyed * wallHealthArray[1]} damage)`);
                
                // Fire wall traps when breached
                const wallTraps = await db.get("Traps_wall") || {};
                let wallTrapDamage = 0;
                for (let i = 0; i < trapArray.length; i++) {
                    const trapType = trapArray[i];
                    const trapCount = wallTraps[trapType] || 0;
                    wallTrapDamage += trapCount * trapDmgArray[i];
                }
                if (wallTrapDamage > 0) {
                    trapDamage += wallTrapDamage;
                    if (channel) channel.send(`💣 **Wall traps activate!** Dealing ${wallTrapDamage} damage to attackers!`);
                }
            }
        }
        
        // If walls are destroyed, damage troops at wall location
        const updatedWalls = await db.get("wall") || 0;
        if (updatedWalls <= 0 && remainingDamage > 0) {
            remainingDamage = await applyDamageToTroops("wall", remainingDamage, channel);
        }
        
        // Finally damage castle (100 HP per castle unit)
        const currentCastleCount = await db.get("castle") || 0;
        if (remainingDamage > 0 && currentCastleCount > 0) {
            const castleHealth = currentCastleCount * wallHealthArray[2]; // 100 HP per castle
            const castleDamage = Math.min(remainingDamage, castleHealth);
            const castlesDestroyed = Math.min(Math.floor(castleDamage / wallHealthArray[2]), currentCastleCount);
            
            if (castlesDestroyed > 0) {
                await db.sub("castle", castlesDestroyed);
                remainingDamage -= castlesDestroyed * wallHealthArray[2];
                damageReport.push(`🏰 Castle: -${castlesDestroyed} units (${castlesDestroyed * wallHealthArray[2]} damage)`);
                
                // Fire castle traps when breached
                const castleTraps = await db.get("Traps_castle") || {};
                let castleTrapDamage = 0;
                for (let i = 0; i < trapArray.length; i++) {
                    const trapType = trapArray[i];
                    const trapCount = castleTraps[trapType] || 0;
                    castleTrapDamage += trapCount * trapDmgArray[i];
                }
                if (castleTrapDamage > 0) {
                    trapDamage += castleTrapDamage;
                    if (channel) channel.send(`💣 **Castle traps activate!** Dealing ${castleTrapDamage} damage to attackers!`);
                }
            }
        }
        
        // If castle is destroyed, damage troops at castle location
        const finalCastleCount = await db.get("castle") || 0;
        if (finalCastleCount <= 0 && remainingDamage > 0) {
            remainingDamage = await applyDamageToTroops("castle", remainingDamage, channel);
        }
        
        if (channel && damageReport.length > 0) {
            channel.send(`💥 **Damage Report:** ${damageReport.join(", ")}`);
        }
        
        // Apply trap damage back to monsters if any traps fired
        if (trapDamage > 0) {
            await applyTrapDamageToMonsters(trapDamage, channel);
        }
        
    } catch (error) {
        console.error("Error applying damage to defenses:", error);
    }
}

async function applyTrapDamageToMonsters(trapDamage, channel) {
    try {
        const monsters = await db.get("Monsters") || {};
        let remainingDamage = trapDamage;
        let totalKilled = 0;
        let killReport = [];
        
        // Apply trap damage to monsters (starting with weakest)
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
        
        if (channel && totalKilled > 0) {
            channel.send(`🔥 **Trap casualties:** ${killReport.join(", ")} (${trapDamage} trap damage dealt)`);
        }
    } catch (error) {
        console.error("Error applying trap damage to monsters:", error);
    }
}

async function applyDamageToTroops(location, damage, channel) {
    try {
        const troops = await db.get(`Troops_${location}`) || {};
        let remainingDamage = damage;
        let totalKilled = 0;
        let killReport = [];
        
        // Apply damage to troops (starting with weakest) - each troop has specific HP
        for (let i = 0; i < troopArray.length && remainingDamage > 0; i++) {
            const troopType = troopArray[i];
            const troopCount = troops[troopType] || 0;
            if (troopCount > 0) {
                const troopHP = troopHealthArray[i];
                const troopsKilled = Math.min(Math.floor(remainingDamage / troopHP), troopCount);
                if (troopsKilled > 0) {
                    await db.sub(`Troops_${location}.${troopType}`, troopsKilled);
                    
                    // Update total troop count
                    const currentTotal = troops.total || 0;
                    const newTotal = Math.max(0, currentTotal - troopsKilled);
                    await db.set(`Troops_${location}.total`, newTotal);
                    
                    const damageUsed = troopsKilled * troopHP;
                    remainingDamage -= damageUsed;
                    totalKilled += troopsKilled;
                    killReport.push(`${troopsKilled} ${troopType}(s) (${damageUsed} damage)`);
                }
            }
        }
        
        if (channel && totalKilled > 0) {
            channel.send(`⚔️ **${location.charAt(0).toUpperCase() + location.slice(1)} troops slain:** ${killReport.join(", ")}`);
        }
        
        return remainingDamage;
    } catch (error) {
        console.error("Error applying damage to troops:", error);
        return damage;
    }
}

async function calculateActiveTroopDamage(channel) {
    try {
        let totalDamage = 0;
        let attackReport = [];
        
        // Only troops from locations with intact walls can attack
        const ramparts = await db.get("rampart") || 0;
        const walls = await db.get("wall") || 0;
        const castle = await db.get("castle") || 0;
        
        // Rampart troops attack if ramparts are intact
        if (ramparts > 0) {
            const rampartTroops = await db.get("Troops_rampart") || {};
            let rampartDamage = 0;
            for (let i = 0; i < troopArray.length; i++) {
                const troopType = troopArray[i];
                const troopCount = rampartTroops[troopType] || 0;
                rampartDamage += troopCount * troopDmgArray[i];
            }
            if (rampartDamage > 0) {
                totalDamage += rampartDamage;
                attackReport.push(`Rampart troops: ${rampartDamage} damage`);
            }
        }
        
        // Wall troops attack if walls are intact
        if (walls > 0) {
            const wallTroops = await db.get("Troops_wall") || {};
            let wallDamage = 0;
            for (let i = 0; i < troopArray.length; i++) {
                const troopType = troopArray[i];
                const troopCount = wallTroops[troopType] || 0;
                wallDamage += troopCount * troopDmgArray[i];
            }
            if (wallDamage > 0) {
                totalDamage += wallDamage;
                attackReport.push(`Wall troops: ${wallDamage} damage`);
            }
        }
        
        // Castle troops attack if castle is intact
        if (castle > 0) {
            const castleTroops = await db.get("Troops_castle") || {};
            let castleDamage = 0;
            for (let i = 0; i < troopArray.length; i++) {
                const troopType = troopArray[i];
                const troopCount = castleTroops[troopType] || 0;
                castleDamage += troopCount * troopDmgArray[i];
            }
            if (castleDamage > 0) {
                totalDamage += castleDamage;
                attackReport.push(`Castle troops: ${castleDamage} damage`);
            }
        }
        
        if (channel && totalDamage > 0) {
            channel.send(`🗡️ **Troops counterattack!** ${attackReport.join(", ")}`);
        }
        
        return totalDamage;
    } catch (error) {
        console.error("Error calculating troop damage:", error);
        return 0;
    }
}

async function applyTroopDamageToMonsters(troopDamage, channel) {
    try {
        const monsters = await db.get("Monsters") || {};
        let remainingDamage = troopDamage;
        let totalKilled = 0;
        let killReport = [];
        
        // Apply troop damage to monsters (starting with weakest)
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
        
        if (channel && totalKilled > 0) {
            channel.send(`⚔️ **Troop casualties on monsters:** ${killReport.join(", ")} (${troopDamage} troop damage dealt)`);
        }
    } catch (error) {
        console.error("Error applying troop damage to monsters:", error);
    }
}

async function addMonster(type, number) {
    try {
        const typeIndex = monsterArray.indexOf(type);
        if (typeIndex !== -1) {
            await db.add(`Monsters.${type}`, number);
            console.log(`Added ${number} ${type}(s) to the monster army`);
        } else {
            console.log("No monsters of type: '" + type + "' in Database");
        }
    } catch (error) {
        console.error('Failed to add monster:', error);
    }
}

// Function to schedule random monster attacks
function scheduleRandomAttack(customDelayMs = null) {
    // Use custom delay if provided, otherwise generate random time between 1-24 hours
    let randomMs;
    if (customDelayMs !== null) {
        randomMs = customDelayMs;
    } else {
        const minHours = 1;
        const maxHours = 24;
        const randomHours = Math.random() * (maxHours - minHours) + minHours;
        randomMs = randomHours * 60 * 60 * 1000;
    }
    
    if (customDelayMs !== null) {
        console.log(`Next automatic monster attack scheduled immediately (custom delay: ${customDelayMs}ms)`);
    } else {
        const randomHours = randomMs / (60 * 60 * 1000);
        console.log(`Next automatic monster attack scheduled in ${randomHours.toFixed(1)} hours`);
    }
    
    setTimeout(async () => {
        try {
            // Check if there are monsters in the pool
            const monsters = await db.get("Monsters") || {};
            const totalMonsters = Object.values(monsters).reduce((sum, count) => sum + count, 0);
            
            if (totalMonsters > 0 && !lockArena && scheduledAttackChannel) {
                console.log("Automatic monster attack triggered!");
                scheduledAttackChannel.send("🌙 **AUTOMATIC MONSTER ATTACK!** The creatures of the night have grown restless and attack the town!");
                
                // Start the battle
                await startBattle(scheduledAttackChannel);
            } else {
                console.log(`Automatic attack skipped - ${totalMonsters === 0 ? 'no monsters available' : 'battle in progress'}`);
            }
        } catch (error) {
            console.error("Error during scheduled attack:", error);
        }
        
        // Schedule the next random attack
        scheduleRandomAttack();
    }, randomMs);
}

// Function to initialize the monster attack scheduler
function initializeScheduler(client, defaultChannel) {
    discordClient = client;
    scheduledAttackChannel = defaultChannel;
    
    // Start the first scheduled attack
    scheduleRandomAttack();
    
    // Initialize automatic monster spawning
    initializeMonsterSpawning();
    
    console.log("Random monster attack scheduler initialized!");
}

// Function to initialize automatic monster spawning
function initializeMonsterSpawning() {
    // Convert milliseconds to cron expressions and start spawning
    for (let i = 0; i < monsterArray.length; i++) {
        const monsterType = monsterArray[i];
        const intervalMs = monsterTimeArray[i];
        
        // Convert milliseconds to minutes for cron
        const intervalMinutes = Math.floor(intervalMs / 60000);
        
        // Create cron expression for the interval
        let cronExpression;
        if (intervalMinutes >= 60) {
            const hours = Math.floor(intervalMinutes / 60);
            cronExpression = `0 */${hours} * * *`; // Every X hours
        } else {
            cronExpression = `*/${intervalMinutes} * * * *`; // Every X minutes
        }
        
        // Schedule the monster spawning
        cron.schedule(cronExpression, async () => {
            try {
                console.log(`Automatic spawn: Adding 1 ${monsterType}`);
                await addMonster(monsterType, 1);
                
                // Notify the channel if available
                if (scheduledAttackChannel) {
                    scheduledAttackChannel.send(`🌟 A wild ${monsterType} has appeared and joined the monster army!`);
                }
            } catch (error) {
                console.error(`Error spawning ${monsterType}:`, error);
            }
        });
        
        console.log(`Automatic ${monsterType} spawning scheduled every ${intervalMinutes} minutes`);
    }
}

// Comprehensive garbage collection for battle cleanup
async function performBattleGarbageCollection(channel) {
    try {
        console.log("Starting battle garbage collection...");
        
        const allEntries = await db.all();
        let deletedCount = 0;
        
        // 1. Clear all freeze-related effects
        const freezeRelated = allEntries.filter(entry => 
            entry.id === "freeze_used_this_combat" ||
            entry.id === "monsters_frozen_this_turn" ||
            entry.id.startsWith("user_freeze_used_")
        );
        for (const entry of freezeRelated) {
            await db.delete(entry.id);
            deletedCount++;
        }
        
        // 2. Clear all turn attack tracking
        const turnAttackEntries = allEntries.filter(entry => 
            entry.id.startsWith("turn_attack_")
        );
        for (const entry of turnAttackEntries) {
            await db.delete(entry.id);
            deletedCount++;
        }
        
        // 3. Clear monster damage tracking
        const monsterDamageEntries = allEntries.filter(entry => 
            entry.id.startsWith("monster_damage_")
        );
        for (const entry of monsterDamageEntries) {
            await db.delete(entry.id);
            deletedCount++;
        }
        
        // 4. Clear stray monster summoner entries (if monsters are gone)
        const monsters = await db.get("Monsters") || {};
        const totalMonsters = Object.values(monsters).reduce((sum, count) => sum + count, 0);
        
        if (totalMonsters === 0) {
            const summonerEntries = allEntries.filter(entry => 
                entry.id.startsWith("monster_summoner_")
            );
            for (const entry of summonerEntries) {
                await db.delete(entry.id);
                deletedCount++;
            }
        }
        
        // 5. Clean up empty troop/trap objects with zero values
        const locationCleanup = ["rampart", "wall", "castle"];
        for (const location of locationCleanup) {
            const troops = await db.get(`Troops_${location}`) || {};
            const traps = await db.get(`Traps_${location}`) || {};
            
            // Clean troops - remove zero counts and fix total
            let actualTroopTotal = 0;
            let troopsChanged = false;
            for (const troopType of troopArray) {
                if (troops[troopType] <= 0 && troops[troopType] !== undefined) {
                    delete troops[troopType];
                    troopsChanged = true;
                } else if (troops[troopType] > 0) {
                    actualTroopTotal += troops[troopType];
                }
            }
            
            // Fix troop total if it doesn't match
            if (troops.total !== actualTroopTotal) {
                troops.total = actualTroopTotal;
                troopsChanged = true;
            }
            
            if (troopsChanged) {
                await db.set(`Troops_${location}`, troops);
            }
            
            // Clean traps - remove zero counts and fix total
            let actualTrapTotal = 0;
            let trapsChanged = false;
            for (const trapType of trapArray) {
                if (traps[trapType] <= 0 && traps[trapType] !== undefined) {
                    delete traps[trapType];
                    trapsChanged = true;
                } else if (traps[trapType] > 0) {
                    actualTrapTotal += traps[trapType];
                }
            }
            
            // Fix trap total if it doesn't match
            if (traps.total !== actualTrapTotal) {
                traps.total = actualTrapTotal;
                trapsChanged = true;
            }
            
            if (trapsChanged) {
                await db.set(`Traps_${location}`, traps);
            }
        }
        
        // 6. Clean up monster object - remove zero counts
        let monstersChanged = false;
        for (const monsterType of monsterArray) {
            if (monsters[monsterType] <= 0 && monsters[monsterType] !== undefined) {
                delete monsters[monsterType];
                monstersChanged = true;
            }
        }
        
        if (monstersChanged) {
            await db.set("Monsters", monsters);
        }
        
        // 7. Clean up orphaned player tracking data for users who no longer have troops/traps
        const playerTrackingEntries = allEntries.filter(entry => 
            entry.id.startsWith("player_troops_") || entry.id.startsWith("player_traps_")
        );
        
        for (const entry of playerTrackingEntries) {
            if (entry.value <= 0) {
                await db.delete(entry.id);
                deletedCount++;
            }
        }
        
        // 8. Clean up any legacy "currentMonsters" entries (old system)
        const legacyEntries = allEntries.filter(entry => 
            entry.id === "currentMonsters" || 
            entry.id === "currentMonsterHealth" ||
            entry.id.startsWith("monster_health_") ||
            entry.id.startsWith("battle_")
        );
        for (const entry of legacyEntries) {
            await db.delete(entry.id);
            deletedCount++;
        }
        
        console.log(`Battle garbage collection completed. Deleted ${deletedCount} stray entries.`);
        
        if (channel && deletedCount > 0) {
            channel.send(`🧹 Cleaned up ${deletedCount} stray database entries.`);
        }
        
    } catch (error) {
        console.error("Error during battle garbage collection:", error);
    }
}

module.exports = {
    troopArray,
    troopCostArray,
    troopHealthArray,
    troopDmgArray,
    trapArray,
    trapCostArray,
    trapDmgArray,
    wallArray,
    wallCostArray,
    wallHealthArray,
    monsterArray,
    monsterCostArray,
    monsterHealthArray,
    monsterDmgArray,
    monsterTimeArray,
    buyArmy,
    buyTrap,
    buyWall,
    rmArmy,
    rmTrap,
    rmWall,
    setupNewGame,
    addMonster,
    summonMonster,
    startBattle,
    endBattle,
    endTroopContract,
    handleBankStealing,
    performBattleGarbageCollection,
    get lockArena() { return lockArena; },
    get currentBattleTurn() { return currentBattleTurn; },
    initializeScheduler,
    scheduleRandomAttack
};
