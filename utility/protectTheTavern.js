var cron = require('node-cron');
const db = require("quick.db") 
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

function setupNewGame () {
  db.set(`rampart`, 100);
  db.set(`wall`, 10);
  db.set(`castle`, 1);
  
  db.set(`Troops_rampart`, {total: 0, town_guard: 0, mercenary: 0, soldier: 0, knight: 0, royal_guard: 0});
  db.set(`Traps_rampart`, {total: 0, spikes: 0, boiling_Oil: 0, repeater: 0, ballista: 0, cannon: 0});
  
  db.set(`Troops_wall`, {total: 0, town_guard: 0, mercenary: 0, soldier: 0, knight: 0, royal_guard: 0});
  db.set(`Traps_wall`, {total: 0, spikes: 0, boiling_Oil: 0, repeater: 0, ballista: 0, cannon: 0});
  
  db.set(`Troops_castle`, {total: 0, town_guard: 0, mercenary: 0, soldier: 0, knight: 0, royal_guard: 0});
  db.set(`Traps_castle`, {total: 0, spikes: 0, boiling_Oil: 0, repeater: 0, ballista: 0, cannon: 0});
  
  console.log(db.fetch(`rampart`));
}

function addMonster (type, number) { //used by admin to add a number of monsters to the next attack. 
  let monsters = db.get("Monsters");
  for (let i = 0; i < monsters.length; i++) {
     if (monsters[i].name === type) {
       db.add("ActiveMonsters."+monsters[i].name, number);
     } else {
       console.log("No monsters of type: \'"+type+"\' in Database");
     }
  }
}

function startBattle () {
  //called by cron job start battle 12pm and 7pm. 
  lockArena = true;
  
  //announce monsters and defenses
  
  //attackTurn()
  
  // announce resolution
  
  //wait 1 min
  
  //loop until 60 attacks (minutes) or 100% defeated. 
  
  //endBattle()
}

function attackTurn () {
  
  //calculateTownDamage()
  
  //calculateMonsterDamage()
  
  //Display Battle 
}

function endBattle () {
  //Disburse Reward
}

function endTroopContract() {
  //Dismiss all troops at the end of each week. 
}


function summonMonster (type, number, playerid) {
 //player summoned monsters
}

function getPlayerAttack () {
  //adds and returns all the player attacks for the turn
}

//--------------------------------------------------

function calculateTownDamage () {
  
}

function calcTrap(wall) { 
  
}

function calcArmy(field) { 
  
}

//Database functions----------------------------------------------------------------------------------------------------------

function buyArmy (type, number, location, player, message) {
    
    //type = index of typeArray
    var typeArray = this.troopArray;
    var costArray = this.troopCostArray;
    var locArray = this.wallArray;
  
    var typeIndex = typeArray.indexOf(type);  
    var locIndex = locArray.indexOf(location);
  
    var locAvail = ((db.fetch(`${locArray[locIndex]}`)/10)-db.fetch(`Troops_${locArray[locIndex]}`).total)>=number;
  
    var wBal = db.fetch(`money_${player.id}`);
    
    if (wBal >= costArray[typeIndex]*number && locAvail){
      
        db.add(`Troops_${locArray[locIndex]}.total`, number);
        db.add(`Troops_${locArray[locIndex]}.${typeArray[typeIndex]}`, number);
        db.subtract(`money_${player.id}`, costArray[typeIndex]*number);
        message.channel.send(`${player.username} just bought ${number} units of ${typeArray[typeIndex]}.`);
      
    } else if (wBal <= costArray[typeIndex]*number) {         
      
        message.channel.send(`${player.username} doesn't have enough kopeks to buy ${number} of ${typeArray[typeIndex]}.`);
      
    } else if (!locAvail) {
      
        message.channel.send(`${player.username} there aren't enough ${locArray[locIndex]}s to house ${number} ${typeArray[typeIndex]}(s).`);   
      
    }
  
}

function buyTrap (type, number, location, player, message) {
    //type = index of typeArray
    let typeArray = this.trapArray;
    let costArray = this.trapCostArray;
    let locArray = this.wallArray;
    
    var typeIndex = typeArray.indexOf(type);  
    var locIndex = locArray.indexOf(location);
  
    let locAvail = ((db.fetch(`${locArray[locIndex]}`)/10)-db.fetch(`Traps_${locArray[locIndex]}`).total)>=number;
  
    let wBal = db.fetch(`money_${player.id}`);
    
    if (wBal >= costArray[typeIndex]*number && locAvail){
      
        db.add(`Traps_${locArray[locIndex]}.total`, number);
        db.add(`Traps_${locArray[locIndex]}.${typeArray[typeIndex]}`, number);
        db.subtract(`money_${player.id}`, costArray[typeIndex]*number);
        message.channel.send(`${player.username} just bought ${number} units of ${typeArray[typeIndex]}.`);
      
    } else if (wBal <= costArray[type]*number) {         
      
        message.channel.send(`${player.username} doesn't have enough kopeks to buy ${number} units of ${typeArray[typeIndex]}.`);
      
    } else if (!locAvail) {
      
        message.channel.send(`${player.username} there aren't enough ${locArray[locIndex]}s to build ${number} ${typeArray[typeIndex]}(s).`);   
      
    }
}


function buyWall (type, number, player, message) {

    //type = index of typeArray
    let typeArray = this.wallArray;
    let costArray = this.wallCostArray;
    
    var typeIndex = typeArray.indexOf(type);  
  
    let locAvail = [true, 
                   ((db.fetch(`${typeArray[typeIndex-1]}`)/10)-db.fetch(`${typeArray[typeIndex]}`))>=number,                   
                   ((db.fetch(`${typeArray[typeIndex-1]}`)/10)-db.fetch(`${typeArray[typeIndex]}`))>=number];
  
    let wBal = db.fetch(`money_${player.id}`);
    
    if (wBal >= costArray[typeIndex]*number && locAvail[typeIndex]){
      
        db.add(`${typeArray[typeIndex]}`, number);
        db.subtract(`money_${player.id}`, costArray[typeIndex]*number);
        message.channel.send(`${player.username} just bought ${number} units of ${typeArray[typeIndex]}.`);
      
    } else if (wBal <= costArray[typeIndex]*number) {         
      
        message.channel.send(`${player.username} doesn't have enough kopeks to buy ${number} units of ${typeArray[typeIndex]}.`);
      
    } else if (!locAvail[type]) {
      
        message.channel.send(`${player.username} there aren't enough ${typeArray[type-1]}s to build ${number} ${typeArray[typeIndex]}(s).`);   
      
    }
}

function rmArmy (type, number, location, player, message) {
     
    //type = index of typeArray
    var typeArray = this.troopArray;
    var costArray = this.troopCostArray;
    var locArray = this.wallArray;
  
    var typeIndex = typeArray.indexOf(type);  
    var locIndex = locArray.indexOf(location);
  
    var locAvail = (db.fetch(`Troops_${locArray[locIndex]}`).total)>=number;
  
    var wBal = db.fetch(`money_${player.id}`);
    
    if (wBal >= costArray[typeIndex]*number && locAvail){
      
        db.subtract(`Troops_${locArray[locIndex]}.total`, number);
        db.subtract(`Troops_${locArray[locIndex]}.${typeArray[typeIndex]}`, number);
        db.subtract(`money_${player.id}`, costArray[typeIndex]*number);
        message.channel.send(`${player.username} just dismissed ${number} units of ${typeArray[typeIndex]}.`);
      
    } else if (wBal <= costArray[typeIndex]*number) {         
      
        message.channel.send(`${player.username} doesn't have enough kopeks to dismiss ${number} of ${typeArray[typeIndex]}.`);
      
    } else if (!locAvail) {
      
        message.channel.send(`${player.username} there aren't enough ${typeArray[typeIndex]}s to remove ${number} ${typeArray[typeIndex]}.`);   
      
    }
}

function rmTrap (type, number, location, player, message) {
     //type = index of typeArray
    let typeArray = this.trapArray;
    let costArray = this.trapCostArray;
    let locArray = this.wallArray;
    
    var typeIndex = typeArray.indexOf(type);  
    var locIndex = locArray.indexOf(location);
  
    let locAvail = (db.fetch(`Traps_${locArray[locIndex]}`).total)>=number;
  
    let wBal = db.fetch(`money_${player.id}`);
    
    if (wBal >= costArray[typeIndex]*number && locAvail){
      
        db.subtract(`Traps_${locArray[locIndex]}.total`, number);
        db.subtract(`Traps_${locArray[locIndex]}.${typeArray[typeIndex]}`, number);
        db.subtract(`money_${player.id}`, costArray[typeIndex]*number);
        message.channel.send(`${player.username} just removed ${number} units of ${typeArray[typeIndex]}.`);
      
    } else if (wBal <= costArray[type]*number) {         
      
        message.channel.send(`${player.username} doesn't have enough kopeks to remove ${number} units of ${typeArray[typeIndex]}.`);
      
    } else if (!locAvail) {
      
        message.channel.send(`${player.username} there aren't enough ${typeArray[typeIndex]}s to remove ${number} ${typeArray[typeIndex]}.`);   
      
    }
}

function rmWall (type, number, player, message) {
 

    //type = index of typeArray
    let typeArray = this.wallArray;
    let costArray = this.wallCostArray;
    
    var typeIndex = typeArray.indexOf(type);  
  
    let locAvail = [true, 
                   (db.fetch(`${typeArray[typeIndex]}`))>=number,                   
                   (db.fetch(`${typeArray[typeIndex]}`))>=number];
  
    let wBal = db.fetch(`money_${player.id}`);
    
    if (wBal >= costArray[typeIndex]*number && locAvail[typeIndex]){
      
        db.subtract(`${typeArray[typeIndex]}`, number);
        db.subtract(`money_${player.id}`, costArray[typeIndex]*number);
        message.channel.send(`${player.username} just destroyed ${number} units of ${typeArray[typeIndex]}.`);
      
    } else if (wBal <= costArray[typeIndex]*number) {         
      
        message.channel.send(`${player.username} doesn't have enough kopeks to destroy ${number} units of ${typeArray[typeIndex]}.`);
      
    } else if (!locAvail[type]) {
      
        message.channel.send(`${player.username} there aren't enough ${typeArray[typeIndex]}s to destroy ${number} ${typeArray[typeIndex]}.`);   
      
    }
}


module.exports = { troopArray, 
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
                  rmWall};
