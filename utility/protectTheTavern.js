var cron = require('node-cron');
const { QuickDB } = require("quick.db");
const db = new QuickDB();
const Discord = require("discord.js");

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
    } catch (error) {
        console.error('Failed to setup new game:', error);
    }
}


async function startBattle() {
    if (lockArena) {
        console.log("Battle already in progress!");
        return;
    }
    
    lockArena = true;
    console.log("🏰 Battle started! The arena is locked.");

    try {
        // Display initial battle state
        const monsters = await db.get("Monsters") || {};
        const totalMonsters = Object.values(monsters).reduce((sum, count) => sum + count, 0);
        
        if (totalMonsters === 0) {
            console.log("No monsters to battle! Battle cancelled.");
            lockArena = false;
            return;
        }
        
        console.log(`⚔️ ${totalMonsters} monsters approach the town!`);
        
        // Start the battle turns
        for (let turn = 1; turn <= 60; turn++) {
            console.log(`\n--- Turn ${turn} ---`);
            
            if (!await attackTurn()) {
                break; // Stop the battle if all monsters are defeated or have breached the defenses
            }
            
            // Show battle state every 5 turns
            if (turn % 5 === 0) {
                await displayBattleState();
            }
            
            // Wait for one minute between turns (reduced for testing)
            await new Promise(resolve => setTimeout(resolve, 10000)); // 10 seconds for testing
        }

        // Conclude the battle
        await endBattle();
    } catch (error) {
        console.error("Error during battle:", error);
    }

    lockArena = false;
    console.log("Battle ended! The arena is unlocked.");
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


async function attackTurn() {
    try {
        // Get current defenses and monsters
        const monsters = await db.get("Monsters") || {goblin: 0, mephit: 0, broodling: 0, ogre: 0, automaton: 0};
        
        // Calculate total monster count
        let totalMonsters = Object.values(monsters).reduce((sum, count) => sum + count, 0);
        if (totalMonsters === 0) {
            console.log("No monsters left! Town has won!");
            return false; // End battle
        }

        // Calculate town damage for each wall layer
        let townDamage = await calculateTownDamage();
        
        // Apply town damage to monsters (starting with weakest)
        let remainingDamage = townDamage;
        for (let i = 0; i < monsterArray.length && remainingDamage > 0; i++) {
            const monsterType = monsterArray[i];
            const monsterCount = monsters[monsterType];
            if (monsterCount > 0) {
                const monstersKilled = Math.min(Math.floor(remainingDamage / monsterHealthArray[i]), monsterCount);
                if (monstersKilled > 0) {
                    await db.sub(`Monsters.${monsterType}`, monstersKilled);
                    remainingDamage -= monstersKilled * monsterHealthArray[i];
                    console.log(`Town killed ${monstersKilled} ${monsterType}s`);
                }
            }
        }

        // Calculate monster damage
        let monsterDamage = 0;
        for (let i = 0; i < monsterArray.length; i++) {
            const monsterType = monsterArray[i];
            const monsterCount = monsters[monsterType] || 0;
            monsterDamage += monsterCount * monsterDmgArray[i];
        }

        // Apply monster damage to walls (starting with ramparts)
        await applyDamageToWalls(monsterDamage);

        // Check if castle is destroyed
        const castle = await db.get("castle") || 0;
        if (castle <= 0) {
            console.log("Castle destroyed! Monsters have won!");
            return false; // End battle
        }

        console.log(`Battle continues - Town dealt ${townDamage} damage, Monsters dealt ${monsterDamage} damage`);
        return true; // Continue battle
    } catch (error) {
        console.error("Error in attack turn:", error);
        return false;
    }
}

async function endBattle() {
    try {
        const castle = await db.get("castle") || 0;
        const monsters = await db.get("Monsters") || {};
        const totalMonsters = Object.values(monsters).reduce((sum, count) => sum + count, 0);
        
        if (castle > 0 && totalMonsters === 0) {
            console.log("🎉 VICTORY! The town has successfully defended against the monster attack!");
            // Reset monsters for next battle
            await db.set("Monsters", {goblin: 0, mephit: 0, broodling: 0, ogre: 0, automaton: 0});
        } else if (castle <= 0) {
            console.log("💀 DEFEAT! The monsters have breached the castle and conquered the town!");
            // Reset defenses for rebuild
            await setupNewGame();
        }
        
        // Clear any remaining troop contracts
        await endTroopContract();
        
        console.log("Battle concluded. Preparing for next conflict...");
    } catch (error) {
        console.error("Error ending battle:", error);
    }
}

//--------------------- User Linked Functions

async function buyArmy(type, number, location, player, message) {
    try {
        var typeIndex = troopArray.indexOf(type);
        var locIndex = wallArray.indexOf(location);
        var totalTroops = await db.get(`Troops_${wallArray[locIndex]}.total`) || 0;
        var totalTraps = await db.get(`Traps_${wallArray[locIndex]}.total`) || 0;
        var totalDefense = totalTroops + totalTraps;
        var locWall = await db.get(`${wallArray[locIndex]}`) || 0;
        var wBal = await db.get(`money_${player.id}`) || 0;
        var maxUnits = (locWall / 10) || 0; // Each wall unit can house 10 units
        var locAvail = (maxUnits - totalDefense) >= number;

        if (wBal >= troopCostArray[typeIndex] * number && locAvail) {
            await db.add(`Troops_${wallArray[locIndex]}.total`, number);
            await db.add(`Troops_${wallArray[locIndex]}.${troopArray[typeIndex]}`, number);
            await db.sub(`money_${player.id}`, troopCostArray[typeIndex] * number);
            message.channel.send(`${player.username} just bought ${number} units of ${troopArray[typeIndex]}.`);
        } else if (wBal < troopCostArray[typeIndex] * number) {
            message.channel.send(`${player.username} doesn't have enough kopeks to buy ${number} of ${troopArray[typeIndex]}.`);
        } else {
            message.channel.send(`${player.username} there aren't enough ${wallArray[locIndex]}s to house ${number} ${troopArray[typeIndex]}(s).`);
        }
    } catch (error) {
        console.error('Error buying army:', error);
    }
}


async function buyTrap(type, number, location, player, message) {
    try {
        var typeIndex = trapArray.indexOf(type);
        var locIndex = wallArray.indexOf(location);
        var totalTroops = await db.get(`Troops_${wallArray[locIndex]}.total`) || 0;
        var totalTraps = await db.get(`Traps_${wallArray[locIndex]}.total`) || 0;
        var totalDefense = totalTroops + totalTraps;
        var locWall = await db.get(`${wallArray[locIndex]}`) || 0;
        var wBal = await db.get(`money_${player.id}`) || 0;
        var maxUnits = (locWall / 10) || 0; // Each rampart can house 11 units
        var locAvail = (maxUnits - totalDefense) >= number;

        if (wBal >= trapCostArray[typeIndex] * number && locAvail) {
            await db.add(`Traps_${wallArray[locIndex]}.total`, number);
            await db.add(`Traps_${wallArray[locIndex]}.${trapArray[typeIndex]}`, number);
            await db.sub(`money_${player.id}`, trapCostArray[typeIndex] * number);
            message.channel.send(`${player.username} just bought ${number} units of ${trapArray[typeIndex]}.`);
        } else if (wBal < trapCostArray[typeIndex] * number) {
            message.channel.send(`${player.username} doesn't have enough kopeks to buy ${number} units of ${trapArray[typeIndex]}.`);
        } else {
            message.channel.send(`${player.username} there aren't enough ${wallArray[locIndex]}s to build ${number} ${trapArray[typeIndex]}(s).`);
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

async function applyDamageToWalls(damage) {
    try {
        let remainingDamage = damage;
        
        // Damage ramparts first
        const ramparts = await db.get("rampart") || 0;
        if (remainingDamage > 0 && ramparts > 0) {
            const rampartDamage = Math.min(remainingDamage, ramparts);
            await db.sub("rampart", rampartDamage);
            remainingDamage -= rampartDamage;
            console.log(`Ramparts took ${rampartDamage} damage`);
        }
        
        // Then damage walls
        const walls = await db.get("wall") || 0;
        if (remainingDamage > 0 && walls > 0) {
            const wallDamage = Math.min(remainingDamage, walls);
            await db.sub("wall", wallDamage);
            remainingDamage -= wallDamage;
            console.log(`Walls took ${wallDamage} damage`);
        }
        
        // Finally damage castle
        const castle = await db.get("castle") || 0;
        if (remainingDamage > 0 && castle > 0) {
            const castleDamage = Math.min(remainingDamage, castle);
            await db.sub("castle", castleDamage);
            remainingDamage -= castleDamage;
            console.log(`Castle took ${castleDamage} damage`);
        }
    } catch (error) {
        console.error("Error applying damage to walls:", error);
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
    lockArena
};
