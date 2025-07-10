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
        // Clear any existing turn attack tracking
        const allEntries = await db.all();
        const turnAttackEntries = allEntries.filter(entry => entry.id.startsWith("turn_attack_"));
        for (const entry of turnAttackEntries) {
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
            
            // Show turn number every turn
            if (channel) {
                channel.send(`--- **Turn ${turn}/10** --- (${totalMonstersLeft} monsters remaining)`);
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
            await new Promise(resolve => setTimeout(resolve, 5000)); // 5 seconds between turns
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

async function displayBattleState() {
    try {
        const ramparts = await db.get("rampart") || 0;
        const walls = await db.get("wall") || 0;
        const castle = await db.get("castle") || 0;
        const monsters = await db.get("Monsters") || {};
        
        console.log(`\n🏰 Town Status: Ramparts: ${ramparts}, Walls: ${walls}, Castle: ${castle}`);
        console.log(`👹 Monster Army: ${Object.entries(monsters).map(([type, count]) => `${type}: ${count}`).join(", ")}`);
    } catch (error) {
        console.error("Error displaying battle state:", error);
    }
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

        // Calculate town damage for each wall layer
        let townDamage = await calculateTownDamage();
        
        // Add castle troops damage if castle still stands
        const castleHP = await db.get("castle") || 0;
        if (castleHP > 0) {
            const castleTroops = await db.get("Troops_castle") || {};
            let castleDamage = 0;
            for (let i = 0; i < troopArray.length; i++) {
                const troopType = troopArray[i];
                const troopCount = castleTroops[troopType] || 0;
                castleDamage += troopCount * troopDmgArray[i];
            }
            
            if (castleDamage > 0 && channel) {
                channel.send(`🏰 **Castle troops sally forth!** Dealing ${castleDamage} additional damage!`);
            }
            townDamage += castleDamage;
        }
        
        // Apply town damage to monsters (starting with weakest)
        let remainingDamage = townDamage;
        let totalKilled = 0;
        let killReport = [];
        for (let i = 0; i < monsterArray.length && remainingDamage > 0; i++) {
            const monsterType = monsterArray[i];
            const monsterCount = monsters[monsterType];
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
            channel.send(`⚔️ **Town defenses strike!** Killed: ${killReport.join(", ")} (${townDamage} total damage dealt)`);
        }

        // Calculate monster damage
        let monsterDamage = 0;
        for (let i = 0; i < monsterArray.length; i++) {
            const monsterType = monsterArray[i];
            const monsterCount = (await db.get(`Monsters.${monsterType}`)) || 0;
            monsterDamage += monsterCount * monsterDmgArray[i];
        }

        // Apply monster damage to walls (starting with ramparts)
        await applyDamageToWalls(monsterDamage, channel);

        // Check if castle is destroyed
        const castle = await db.get("castle") || 0;
        if (castle <= 0) {
            if (channel) channel.send("💀 Castle destroyed! Monsters have won!");
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
        const castle = await db.get("castle") || 0;
        const monsters = await db.get("Monsters") || {};
        const totalMonsters = Object.values(monsters).reduce((sum, count) => sum + count, 0);
        
        if (castle <= 0) {
            if (channel) channel.send("💀 **DEFEAT!** The monsters have breached the castle and conquered the town!");
            
            // Handle bank stealing
            await handleBankStealing(channel);
            
            // Reset defenses for rebuild
            await setupNewGame();
        } else if (totalMonsters === 0) {
            // Victory case is already handled in the battle loop
            if (channel) channel.send("🎉 Town defenses held strong!");
        }
        // Note: Monster retreat is handled in the battle loop at turn 10
        
        // Clear any remaining troop contracts
        await endTroopContract();
        
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
        
        // Calculate player's current troops at this location
        var playerTroops = await db.get(`player_troops_${player.id}_${wallArray[locIndex]}`) || 0;
        
        // Each 5 walls allows 1 troop per player
        var maxTroopsForPlayer = Math.floor(locWall / 5);
        var troopsAfterPurchase = playerTroops + number;
        
        if (troopsAfterPurchase > maxTroopsForPlayer) {
            message.channel.send(`${player.username} you can only have ${maxTroopsForPlayer} troops at ${wallArray[locIndex]} (1 per 5 walls). You currently have ${playerTroops}.`);
        } else if (wBal < troopCostArray[typeIndex] * number) {
            message.channel.send(`${player.username} doesn't have enough kopeks to buy ${number} of ${troopArray[typeIndex]}.`);
        } else {
            await db.add(`Troops_${wallArray[locIndex]}.total`, number);
            await db.add(`Troops_${wallArray[locIndex]}.${troopArray[typeIndex]}`, number);
            await db.add(`player_troops_${player.id}_${wallArray[locIndex]}`, number);
            await db.sub(`money_${player.id}`, troopCostArray[typeIndex] * number);
            message.channel.send(`${player.username} just bought ${number} units of ${troopArray[typeIndex]}. (${troopsAfterPurchase}/${maxTroopsForPlayer} troops at ${wallArray[locIndex]})`);
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
        
        // Calculate player's current traps at this location
        var playerTraps = await db.get(`player_traps_${player.id}_${wallArray[locIndex]}`) || 0;
        
        // Each 5 walls allows 1 trap per player
        var maxTrapsForPlayer = Math.floor(locWall / 5);
        var trapsAfterPurchase = playerTraps + number;

        if (trapsAfterPurchase > maxTrapsForPlayer) {
            message.channel.send(`${player.username} you can only have ${maxTrapsForPlayer} traps at ${wallArray[locIndex]} (1 per 5 walls). You currently have ${playerTraps}.`);
        } else if (wBal < trapCostArray[typeIndex] * number) {
            message.channel.send(`${player.username} doesn't have enough kopeks to buy ${number} units of ${trapArray[typeIndex]}.`);
        } else {
            await db.add(`Traps_${wallArray[locIndex]}.total`, number);
            await db.add(`Traps_${wallArray[locIndex]}.${trapArray[typeIndex]}`, number);
            await db.add(`player_traps_${player.id}_${wallArray[locIndex]}`, number);
            await db.sub(`money_${player.id}`, trapCostArray[typeIndex] * number);
            message.channel.send(`${player.username} just bought ${number} units of ${trapArray[typeIndex]}. (${trapsAfterPurchase}/${maxTrapsForPlayer} traps at ${wallArray[locIndex]})`);
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

function getPlayerAttack() {
    // Adds and returns all the player attacks for the turn
}

async function calculateTownDamage() {
    try {
        let totalDamage = 0;
        
        // Calculate damage from each wall layer
        for (const wall of wallArray) {
            const troops = await db.get(`Troops_${wall}`) || {};
            const traps = await db.get(`Traps_${wall}`) || {};
            
            // Add troop damage
            for (let i = 0; i < troopArray.length; i++) {
                const troopType = troopArray[i];
                const troopCount = troops[troopType] || 0;
                totalDamage += troopCount * troopDmgArray[i];
            }
            
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

function calcTrap(wall) {
    // Calculate damage or effects caused by traps
}

function calcArmy(field) {
    // Calculate the effectiveness or damage caused by the army
}

async function applyDamageToWalls(damage, channel) {
    try {
        let remainingDamage = damage;
        let damageReport = [];
        let trapDamage = 0;
        
        // Damage ramparts first
        const ramparts = await db.get("rampart") || 0;
        if (remainingDamage > 0 && ramparts > 0) {
            const rampartDamage = Math.min(remainingDamage, ramparts);
            await db.sub("rampart", rampartDamage);
            remainingDamage -= rampartDamage;
            damageReport.push(`🛡️ Ramparts: -${rampartDamage} HP`);
            
            // Fire rampart traps when breached
            if (rampartDamage > 0) {
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
        
        // Then damage walls
        const walls = await db.get("wall") || 0;
        if (remainingDamage > 0 && walls > 0) {
            const wallDamage = Math.min(remainingDamage, walls);
            await db.sub("wall", wallDamage);
            remainingDamage -= wallDamage;
            damageReport.push(`🧱 Walls: -${wallDamage} HP`);
            
            // Fire wall traps when breached
            if (wallDamage > 0) {
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
        
        // Finally damage castle
        const castle = await db.get("castle") || 0;
        if (remainingDamage > 0 && castle > 0) {
            const castleDamage = Math.min(remainingDamage, castle);
            await db.sub("castle", castleDamage);
            remainingDamage -= castleDamage;
            damageReport.push(`🏰 Castle: -${castleDamage} HP`);
            
            // Fire castle traps when breached
            if (castleDamage > 0) {
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
        
        if (channel && damageReport.length > 0) {
            channel.send(`💥 **Damage Report:** ${damageReport.join(", ")}`);
        }
        
        // Apply trap damage back to monsters if any traps fired
        if (trapDamage > 0) {
            await applyTrapDamageToMonsters(trapDamage, channel);
        }
        
    } catch (error) {
        console.error("Error applying damage to walls:", error);
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
function scheduleRandomAttack() {
    // Generate random time between 1-24 hours (in milliseconds)
    const minHours = 1;
    const maxHours = 24;
    const randomHours = Math.random() * (maxHours - minHours) + minHours;
    const randomMs = randomHours * 60 * 60 * 1000;
    
    console.log(`Next automatic monster attack scheduled in ${randomHours.toFixed(1)} hours`);
    
    setTimeout(async () => {
        try {
            // Check if there are monsters in the pool
            const monsters = await db.get("Monsters") || {};
            const totalMonsters = Object.values(monsters).reduce((sum, count) => sum + count, 0);
            
            if (totalMonsters >= 10 && !lockArena && scheduledAttackChannel) {
                console.log("Automatic monster attack triggered!");
                scheduledAttackChannel.send("🌙 **AUTOMATIC MONSTER ATTACK!** The creatures of the night have grown restless and attack the town!");
                
                // Start the battle
                await startBattle(scheduledAttackChannel);
            } else {
                console.log("Automatic attack skipped - not enough monsters or battle in progress");
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
    
    console.log("Random monster attack scheduler initialized!");
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
    lockArena,
    currentBattleTurn,
    initializeScheduler,
    scheduleRandomAttack
};
