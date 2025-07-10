
const { QuickDB } = require("quick.db");
const db = new QuickDB();
const Discord = require("discord.js");
const cron = require("node-cron");

// Store active battles
const activeBattles = new Map();

module.exports.run = async (client, message, args) => {
    const attacker = message.author;
    const target = message.mentions.users.first();

    if (!target) {
        return message.channel.send("❌ You must mention a user to attack! Usage: `=attack @user`");
    }

    if (target.id === attacker.id) {
        return message.channel.send("❌ You cannot attack yourself!");
    }

    if (target.bot) {
        return message.channel.send("❌ You cannot attack bots!");
    }

    // Check if attacker is dead
    const attackerDeathTime = await db.get(`death_cooldown_${attacker.id}`);
    if (attackerDeathTime && Date.now() - attackerDeathTime < 86400000) { // 24 hours
        const remainingTime = Math.ceil((86400000 - (Date.now() - attackerDeathTime)) / 3600000);
        return message.channel.send(`💀 You are still recovering from death! Wait ${remainingTime} more hours.`);
    }

    // Check if target is dead
    const targetDeathTime = await db.get(`death_cooldown_${target.id}`);
    if (targetDeathTime && Date.now() - targetDeathTime < 86400000) { // 24 hours
        return message.channel.send(`💀 ${target.username} is still recovering from death and cannot be attacked!`);
    }

    // Check if either player is in battle
    if (activeBattles.has(attacker.id)) {
        return message.channel.send("⚔️ You are already in a battle!");
    }
    if (activeBattles.has(target.id)) {
        return message.channel.send(`⚔️ ${target.username} is already in a battle!`);
    }

    // Check draw cooldown
    const drawCooldown = await db.get(`draw_cooldown_${attacker.id}_${target.id}`);
    if (drawCooldown && Date.now() - drawCooldown < 3600000) { // 1 hour
        const remainingTime = Math.ceil((3600000 - (Date.now() - drawCooldown)) / 60000);
        return message.channel.send(`⏰ You must wait ${remainingTime} more minutes before attacking ${target.username} again after your last draw.`);
    }

    // Start the battle
    await startPlayerBattle(message, attacker, target, client);
};

async function startPlayerBattle(message, attacker, target, client) {
    // Mark both players as in battle
    activeBattles.set(attacker.id, target.id);
    activeBattles.set(target.id, attacker.id);

    const attackerCombatLevel = await db.get(`combatlevel_${attacker.id}`) || 0;
    const targetCombatLevel = await db.get(`combatlevel_${target.id}`) || 0;
    
    const battleData = {
        attacker: {
            id: attacker.id,
            username: attacker.username,
            health: 5 + (attackerCombatLevel * 2),
            maxHealth: 5 + (attackerCombatLevel * 2),
            weapon: await getBestWeapon(attacker.id),
            armor: await getBestArmor(attacker.id),
            combatLevel: attackerCombatLevel
        },
        target: {
            id: target.id,
            username: target.username,
            health: 5 + (targetCombatLevel * 2),
            maxHealth: 5 + (targetCombatLevel * 2),
            weapon: await getBestWeapon(target.id),
            armor: await getBestArmor(target.id),
            combatLevel: targetCombatLevel
        },
        round: 0
    };

    // Determine turn order by combat level (higher goes first, random for ties)
    let players = [battleData.attacker, battleData.target];
    if (battleData.target.combatLevel > battleData.attacker.combatLevel) {
        players = [battleData.target, battleData.attacker];
    } else if (battleData.target.combatLevel === battleData.attacker.combatLevel) {
        if (Math.random() < 0.5) {
            players = [battleData.target, battleData.attacker];
        }
    }

    const embed = new Discord.EmbedBuilder()
        .setTitle("⚔️ Player Battle Begins!")
        .setColor("#FF0000")
        .setDescription(`${attacker.username} attacks ${target.username}!`)
        .addFields(
            {
                name: `${battleData.attacker.username}`,
                value: `❤️ Health: ${battleData.attacker.health}/${battleData.attacker.maxHealth}\n🗡️ Weapon: ${battleData.attacker.weapon.name}\n🛡️ Armor: ${battleData.attacker.armor.name}`,
                inline: true
            },
            {
                name: `${battleData.target.username}`,
                value: `❤️ Health: ${battleData.target.health}/${battleData.target.maxHealth}\n🗡️ Weapon: ${battleData.target.weapon.name}\n🛡️ Armor: ${battleData.target.armor.name}`,
                inline: true
            },
            {
                name: "Turn Order",
                value: `${players[0].username} goes first, then ${players[1].username}`,
                inline: false
            }
        );

    message.channel.send({ embeds: [embed] });

    // Start battle rounds
    setTimeout(() => {
        runBattleRounds(message, battleData, players, 0, client);
    }, 3000);
}

async function runBattleRounds(message, battleData, players, currentPlayerIndex, client) {
    if (battleData.round >= 4) {
        // Draw - both players survive
        await handleDraw(message, battleData);
        return;
    }

    if (battleData.attacker.health <= 0 || battleData.target.health <= 0) {
        // Someone died
        await handleBattleEnd(message, battleData, client);
        return;
    }

    battleData.round++;
    const currentPlayer = players[currentPlayerIndex];
    const otherPlayer = players[1 - currentPlayerIndex];

    // Calculate damage
    const combatDamage = [1, 1, 2, 3, 5, 10][currentPlayer.combatLevel] || 1;
    const weaponDamage = Math.floor(Math.random() * (currentPlayer.weapon.maxDamage - currentPlayer.weapon.minDamage + 1)) + currentPlayer.weapon.minDamage;
    const totalDamage = combatDamage + weaponDamage;
    const finalDamage = Math.max(1, totalDamage - otherPlayer.armor.defense);

    otherPlayer.health -= finalDamage;
    otherPlayer.health = Math.max(0, otherPlayer.health);

    const embed = new Discord.EmbedBuilder()
        .setTitle(`⚔️ Round ${battleData.round}/4`)
        .setColor("#FFA500")
        .setDescription(`${currentPlayer.username} attacks ${otherPlayer.username}!`)
        .addFields(
            {
                name: "Attack Details",
                value: `🗡️ Combat Damage: ${combatDamage}\n⚔️ Weapon Damage: ${weaponDamage}\n🛡️ Armor Blocked: ${Math.min(totalDamage, otherPlayer.armor.defense)}\n💥 Final Damage: ${finalDamage}`,
                inline: false
            },
            {
                name: `${battleData.attacker.username}`,
                value: `❤️ Health: ${battleData.attacker.health}/${battleData.attacker.maxHealth}`,
                inline: true
            },
            {
                name: `${battleData.target.username}`,
                value: `❤️ Health: ${battleData.target.health}/${battleData.target.maxHealth}`,
                inline: true
            }
        );

    message.channel.send({ embeds: [embed] });

    // Continue battle after 5 seconds
    setTimeout(() => {
        runBattleRounds(message, battleData, players, 1 - currentPlayerIndex, client);
    }, 5000);
}

async function handleDraw(message, battleData) {
    // Remove from active battles
    activeBattles.delete(battleData.attacker.id);
    activeBattles.delete(battleData.target.id);

    // Set draw cooldown
    await db.set(`draw_cooldown_${battleData.attacker.id}_${battleData.target.id}`, Date.now());
    await db.set(`draw_cooldown_${battleData.target.id}_${battleData.attacker.id}`, Date.now());

    const embed = new Discord.EmbedBuilder()
        .setTitle("🤝 Battle Draw!")
        .setColor("#808080")
        .setDescription("Both fighters survive after 4 intense rounds!")
        .addFields(
            {
                name: "Result",
                value: `${battleData.attacker.username} and ${battleData.target.username} fought valiantly but neither could claim victory.`,
                inline: false
            },
            {
                name: "Cooldown",
                value: "You cannot attack each other again for 1 hour.",
                inline: false
            }
        );

    message.channel.send({ embeds: [embed] });
}

async function handleBattleEnd(message, battleData, client) {
    // Remove from active battles
    activeBattles.delete(battleData.attacker.id);
    activeBattles.delete(battleData.target.id);

    let winner, loser;
    if (battleData.attacker.health <= 0) {
        winner = battleData.target;
        loser = battleData.attacker;
    } else {
        winner = battleData.attacker;
        loser = battleData.target;
    }

    // Set death cooldown for loser
    await db.set(`death_cooldown_${loser.id}`, Date.now());

    // Transfer wallet
    const loserMoney = await db.get(`money_${loser.id}`) || 0;
    if (loserMoney > 0) {
        await db.add(`money_${winner.id}`, loserMoney);
        await db.set(`money_${loser.id}`, 0);
    }

    // Transfer best weapon and armor
    const loserBestWeapon = await getBestWeapon(loser.id);
    const loserBestArmor = await getBestArmor(loser.id);

    if (loserBestWeapon.type !== "none") {
        await db.sub(`weapon_${loserBestWeapon.type}_${loser.id}`, 1);
        await db.add(`weapon_${loserBestWeapon.type}_${winner.id}`, 1);
    }

    if (loserBestArmor.type !== "none") {
        await db.sub(`armor_${loserBestArmor.type}_${loser.id}`, 1);
        await db.add(`armor_${loserBestArmor.type}_${winner.id}`, 1);
    }

    const embed = new Discord.EmbedBuilder()
        .setTitle("🏆 Battle Victory!")
        .setColor("#00FF00")
        .setDescription(`${winner.username} emerges victorious!`)
        .addFields(
            {
                name: "Spoils of War",
                value: `💰 Kopeks Stolen: ${loserMoney.toLocaleString()}\n🗡️ Weapon Taken: ${loserBestWeapon.name}\n🛡️ Armor Taken: ${loserBestArmor.name}`,
                inline: false
            },
            {
                name: "Death Penalty",
                value: `${loser.username} cannot attack anyone for 24 hours.`,
                inline: false
            }
        );

    message.channel.send({ embeds: [embed] });
}

async function getBestWeapon(userId) {
    const weapons = [
        { type: "rifle", name: "Rifle", minDamage: 6, maxDamage: 12 },
        { type: "shotgun", name: "Shotgun", minDamage: 4, maxDamage: 10 },
        { type: "pistol", name: "Pistol", minDamage: 3, maxDamage: 5 },
        { type: "sword", name: "Sword", minDamage: 2, maxDamage: 4 },
        { type: "knife", name: "Knife", minDamage: 1, maxDamage: 3 }
    ];

    for (const weapon of weapons) {
        const count = await db.get(`weapon_${weapon.type}_${userId}`) || 0;
        if (count > 0) {
            return weapon;
        }
    }

    return { type: "none", name: "Fists", minDamage: 0, maxDamage: 0 };
}

async function getBestArmor(userId) {
    const armors = [
        { type: "plate", name: "Plate Armor", defense: 10 },
        { type: "studded", name: "Studded Armor", defense: 5 },
        { type: "chainmail", name: "Chainmail Armor", defense: 3 },
        { type: "leather", name: "Leather Armor", defense: 2 },
        { type: "cloth", name: "Cloth Armor", defense: 1 }
    ];

    for (const armor of armors) {
        const count = await db.get(`armor_${armor.type}_${userId}`) || 0;
        if (count > 0) {
            return armor;
        }
    }

    return { type: "none", name: "No Armor", defense: 0 };
}

module.exports.help = {
    name: "attack",
    aliases: ["pvp", "fight"]
};
