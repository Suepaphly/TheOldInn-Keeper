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
    lockArena = true;
    console.log("Battle started! The arena is locked.");

    // Initialize battle state
    try {

        //retrieve defenses and monsters

        // Display initial battle state

        // Start the battle turns
        for (let turn = 0; turn < 60; turn++) {
            if (!await attackTurn()) {
                break; // Stop the battle if all monsters are defeated or have breached the defenses
            }
            await new Promise(resolve => setTimeout(resolve, 60000)); // Wait for one minute between turns

            // if turn is divisible by 5, show the battle state again
        }

        // Conclude the battle
        await endBattle(defenses, monsters);
    } catch (error) {
        console.error("Error during battle:", error);
    }

    lockArena = false;
    console.log("Battle ended! The arena is unlocked.");
}


function attackTurn() {
    // Calculate Town Damage
    // Calculate Monster Damage
    // Display Battle 
}

function endBattle() {
    // Disburse Reward
}

//--------------------- User Linked Functions

async function buyArmy(type, number, location, player, message) {
    try {
        var typeIndex = troopArray.indexOf(type);
        var locIndex = wallArray.indexOf(location);
        var totalTroops = await db.get(`Troops_${wallArray[locIndex]}.total`);
        var locWall = await db.get(`${wallArray[locIndex]}`);
        var wBal = await db.get(`money_${player.id}`);
        var locAvail = (locWall / 10 - totalTroops) >= number;

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
        var totalTraps = await db.get(`Traps_${wallArray[locIndex]}.total`);
        var locWall = await db.get(`${wallArray[locIndex]}`);
        var wBal = await db.get(`money_${player.id}`);
        var locAvail = (locWall / 10 - totalTraps) >= number;

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


function summonMonster(type, number, playerid) {
    // Player summoned monsters
}


//--------------------- Utility Functions

function endTroopContract() {
    // Dismiss all troops at the end of each week. 
}

function getPlayerAttack() {
    // Adds and returns all the player attacks for the turn
}

function calculateTownDamage() {
    // Calculate damage inflicted by the town
}

function calcTrap(wall) {
    // Calculate damage or effects caused by traps
}

function calcArmy(field) {
    // Calculate the effectiveness or damage caused by the army
}

async function addMonster(type, number) {
    try {
        let monsters = await db.get("Monsters");
        let found = false;
        for (let i = 0; i < monsters.length; i++) {
            if (monsters[i].name === type) {
                found = true;
                await db.add("Monsters" + monsters[i].name, number);
                break;
            }
        }
        if (!found) {
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
    buyArmy,
    buyTrap,
    buyWall,
    rmArmy,
    rmTrap,
    rmWall,
    setupNewGame,
    addMonster,
    startBattle,
    endBattle,
};
