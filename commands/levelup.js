const { QuickDB } = require("quick.db");
const db = new QuickDB();
const Discord = require("discord.js");

module.exports.run = async (client, message, args) => {
  const user = message.author;
  const item = args[0];
  const money = await db.get(`money_${user.id}`) || 0;

  // Skill configuration: [dbKey, displayName, baseCost, maxLevel]
  const skills = {
    rob: ['thieflevel', 'Robbery', 2000, 5],
    gather: ['gatheringlevel', 'Gathering', 5000, 5],
    fish: ['fishinglevel', 'Fishing', 10000, 5],
    hunt: ['huntinglevel', 'Hunting', 15000, 5],
    craft: ['craftinglevel', 'Crafting', 20000, 5],
    work: ['workinglevel', 'Working', 25000, 5],
    combat: ['combatlevel', 'Combat', 2000, 5]
  };

  if (!item) {
    let buyMessage = "```css\n" +
        "Level Up Your Skills\n" +
        "Just type the skill name after =lvl to purchase the upgrade.\n" +
        "Maximum level is 5, players start at level 0. Ex: '=lvl rob'\n" +
        "Cost Formula: Base Cost × Next Level\n\n";

    for (const [skillName, [dbKey, displayName, baseCost, maxLevel]] of Object.entries(skills)) {
      buyMessage += `${displayName}: '${skillName}' => ${baseCost.toLocaleString()} Kopeks (base)\n`;
    }

    buyMessage += "\nThe Tavernkeeper thanks you for playing.\n```";
    message.channel.send(buyMessage);
    return;
  }

  // Check if the skill exists
  if (!skills[item]) {
    message.channel.send(`${user.username}, that's not a valid skill! Use =lvl to see available skills.`);
    return;
  }

  const [dbKey, displayName, baseCost, maxLevel] = skills[item];
  const currentLevel = await db.get(`${dbKey}_${user.id}`) || 0;
  const nextLevel = currentLevel + 1;
  const upgradeCost = baseCost * nextLevel;

  // Check if already at max level
  if (currentLevel >= maxLevel) {
    message.channel.send(`${user.username} is already max level in ${displayName}!`);
    return;
  }

  // Check if user has enough money
  if (money < upgradeCost) {
    message.channel.send(`${user.username} doesn't have enough money! Need ${upgradeCost.toLocaleString()} kopeks, but only have ${money.toLocaleString()}.`);
    return;
  }

  // Process the upgrade
  try {
    await db.sub(`money_${user.id}`, upgradeCost);
    await db.set(`${dbKey}_${user.id}`, nextLevel);
    message.channel.send(`${user.username} just purchased a Level in ${displayName}! New Level: ${nextLevel} (Cost: ${upgradeCost.toLocaleString()} kopeks)`);
  } catch (error) {
    console.error("Error processing level up:", error);
    message.channel.send(`${user.username}, sorry, something went wrong with the upgrade.`);
  }
};

module.exports.help = {
  name: "levelup",
  aliases: ["level", "up", "lvl"]
};