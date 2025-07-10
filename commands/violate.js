
const { QuickDB } = require("quick.db");
const db = new QuickDB();
const Discord = require("discord.js");

// Store active pranks
const activePranks = new Map();

module.exports.run = async (client, message, args) => {
    const prankster = message.author;
    const target = message.mentions.users.first();

    if (!target) {
        return message.channel.send("❌ You must mention a user to prank! Usage: `=violate @user`");
    }

    if (target.id === prankster.id) {
        return message.channel.send("❌ You cannot prank yourself!");
    }

    if (target.bot) {
        return message.channel.send("❌ You cannot prank bots!");
    }

    // Check if prankster is dead
    const pranksterDeathTime = await db.get(`death_cooldown_${prankster.id}`);
    if (pranksterDeathTime && Date.now() - pranksterDeathTime < 86400000) { // 24 hours
        const remainingTime = Math.ceil((86400000 - (Date.now() - pranksterDeathTime)) / 3600000);
        return message.channel.send(`💀 You are still recovering from death! Wait ${remainingTime} more hours.`);
    }

    // Check if target is dead
    const targetDeathTime = await db.get(`death_cooldown_${target.id}`);
    if (targetDeathTime && Date.now() - targetDeathTime < 86400000) { // 24 hours
        return message.channel.send(`💀 ${target.username} is still recovering from death and cannot be pranked!`);
    }

    // Check if either player is in battle or prank
    if (activePranks.has(prankster.id)) {
        return message.channel.send("🎭 You are already pranking someone!");
    }
    if (activePranks.has(target.id)) {
        return message.channel.send(`🎭 ${target.username} is already being pranked!`);
    }

    // Check draw cooldown
    const drawCooldown = await db.get(`prank_cooldown_${prankster.id}_${target.id}`);
    if (drawCooldown && Date.now() - drawCooldown < 3600000) { // 1 hour
        const remainingTime = Math.ceil((3600000 - (Date.now() - drawCooldown)) / 60000);
        return message.channel.send(`⏰ You must wait ${remainingTime} more minutes before pranking ${target.username} again.`);
    }

    // Start the prank battle
    await startPrankBattle(message, prankster, target, client);
};

async function startPrankBattle(message, prankster, target, client) {
    // Mark both players as in prank
    activePranks.set(prankster.id, target.id);
    activePranks.set(target.id, prankster.id);

    const prankData = {
        prankster: {
            id: prankster.id,
            username: prankster.username,
            health: 10,
            weapon: await getBestWeapon(prankster.id),
            armor: await getBestArmor(prankster.id),
            combatLevel: await db.get(`combatlevel_${prankster.id}`) || 0
        },
        target: {
            id: target.id,
            username: target.username,
            health: 10,
            weapon: await getBestWeapon(target.id),
            armor: await getBestArmor(target.id),
            combatLevel: await db.get(`combatlevel_${target.id}`) || 0
        },
        round: 0
    };

    const embed = new Discord.EmbedBuilder()
        .setTitle("🎭 Prank Battle Begins!")
        .setColor("#FFD700")
        .setDescription(`${prankster.username} attempts to violate ${target.username} with pranks!`)
        .addFields(
            {
                name: `${prankData.prankster.username} (Prankster)`,
                value: `❤️ Health: ${prankData.prankster.health}/10\n🗡️ Weapon: ${prankData.prankster.weapon.name}\n🛡️ Armor: ${prankData.prankster.armor.name}`,
                inline: true
            },
            {
                name: `${prankData.target.username} (Defender)`,
                value: `❤️ Health: ${prankData.target.health}/10\n🗡️ Weapon: ${prankData.target.weapon.name}\n🛡️ Armor: ${prankData.target.armor.name}`,
                inline: true
            },
            {
                name: "Rules",
                value: `The prankster doesn't deal damage but tries to humiliate!\nThe defender fights back normally for 5 rounds!`,
                inline: false
            }
        );

    message.channel.send({ embeds: [embed] });

    // Start prank rounds
    setTimeout(() => {
        runPrankRounds(message, prankData, client);
    }, 3000);
}

async function runPrankRounds(message, prankData, client) {
    if (prankData.round >= 5) {
        // Prankster wins - target gets humiliated
        await handlePrankSuccess(message, prankData, client);
        return;
    }

    if (prankData.prankster.health <= 0) {
        // Target successfully defended - prankster loses everything
        await handlePrankFailed(message, prankData, client);
        return;
    }

    prankData.round++;

    // Prankster's turn - attempt prank (no damage)
    const prankMessages = [
        "stuffs a wet fish down their trousers",
        "dumps a bucket of cow manure on their head",
        "ties their shoelaces together when they're not looking",
        "replaces their drink with pickle juice",
        "puts a 'Kick Me' sign on their back",
        "covers their chair with honey",
        "hides a rubber snake in their belongings",
        "switches their salt with sugar",
        "puts plastic wrap over their doorway",
        "fills their boots with jelly beans"
    ];

    const randomPrank = prankMessages[Math.floor(Math.random() * prankMessages.length)];

    // Target's turn - fight back
    const combatDamage = [1, 1, 2, 3, 5, 10][prankData.target.combatLevel] || 1;
    const weaponDamage = Math.floor(Math.random() * (prankData.target.weapon.maxDamage - prankData.target.weapon.minDamage + 1)) + prankData.target.weapon.minDamage;
    const totalDamage = combatDamage + weaponDamage;
    const finalDamage = Math.max(1, totalDamage - prankData.prankster.armor.defense);

    prankData.prankster.health -= finalDamage;
    prankData.prankster.health = Math.max(0, prankData.prankster.health);

    const embed = new Discord.EmbedBuilder()
        .setTitle(`🎭 Prank Round ${prankData.round}/5`)
        .setColor("#FFA500")
        .setDescription(`${prankData.prankster.username} ${randomPrank}!\n${prankData.target.username} fights back!`)
        .addFields(
            {
                name: "Prank Attempt",
                value: `🎪 ${prankData.prankster.username}'s prank: "${randomPrank}"`,
                inline: false
            },
            {
                name: "Counter Attack",
                value: `🗡️ Combat Damage: ${combatDamage}\n⚔️ Weapon Damage: ${weaponDamage}\n🛡️ Armor Blocked: ${Math.min(totalDamage, prankData.prankster.armor.defense)}\n💥 Final Damage: ${finalDamage}`,
                inline: false
            },
            {
                name: `${prankData.prankster.username} (Prankster)`,
                value: `❤️ Health: ${prankData.prankster.health}/10`,
                inline: true
            },
            {
                name: `${prankData.target.username} (Defender)`,
                value: `❤️ Health: ${prankData.target.health}/10`,
                inline: true
            }
        );

    message.channel.send({ embeds: [embed] });

    // Continue battle after 5 seconds
    setTimeout(() => {
        runPrankRounds(message, prankData, client);
    }, 5000);
}

async function handlePrankSuccess(message, prankData, client) {
    // Remove from active pranks
    activePranks.delete(prankData.prankster.id);
    activePranks.delete(prankData.target.id);

    const humiliationMessages = [
        "is covered head to toe in sticky honey and feathers!",
        "has been painted bright pink while they slept!",
        "is wearing a tutu and tiara, looking fabulous!",
        "has 'PRANKED' written on their forehead in permanent marker!",
        "is stuck in a giant soap bubble!",
        "has been turned into a human burrito with blankets!",
        "is wearing clown shoes that won't come off!",
        "has been decorated with rainbow glitter from head to toe!"
    ];

    const randomHumiliation = humiliationMessages[Math.floor(Math.random() * humiliationMessages.length)];

    const embed = new Discord.EmbedBuilder()
        .setTitle("🎪 Prank Success!")
        .setColor("#FF69B4")
        .setDescription(`${prankData.prankster.username} successfully pranks ${prankData.target.username}!`)
        .addFields(
            {
                name: "Humiliation Complete!",
                value: `${prankData.target.username} ${randomHumiliation}`,
                inline: false
            },
            {
                name: "Result",
                value: `${prankData.prankster.username} gains nothing but satisfaction!\n${prankData.target.username} suffers only embarrassment!`,
                inline: false
            }
        );

    message.channel.send({ embeds: [embed] });
}

async function handlePrankFailed(message, prankData, client) {
    // Remove from active pranks
    activePranks.delete(prankData.prankster.id);
    activePranks.delete(prankData.target.id);

    // Set death cooldown for prankster
    await db.set(`death_cooldown_${prankData.prankster.id}`, Date.now());

    // Transfer wallet
    const pranksterMoney = await db.get(`money_${prankData.prankster.id}`) || 0;
    if (pranksterMoney > 0) {
        await db.add(`money_${prankData.target.id}`, pranksterMoney);
        await db.set(`money_${prankData.prankster.id}`, 0);
    }

    // Transfer best weapon and armor
    const pranksterBestWeapon = await getBestWeapon(prankData.prankster.id);
    const pranksterBestArmor = await getBestArmor(prankData.prankster.id);

    if (pranksterBestWeapon.type !== "none") {
        await db.sub(`weapon_${pranksterBestWeapon.type}_${prankData.prankster.id}`, 1);
        await db.add(`weapon_${pranksterBestWeapon.type}_${prankData.target.id}`, 1);
    }

    if (pranksterBestArmor.type !== "none") {
        await db.sub(`armor_${pranksterBestArmor.type}_${prankData.prankster.id}`, 1);
        await db.add(`armor_${pranksterBestArmor.type}_${prankData.target.id}`, 1);
    }

    const embed = new Discord.EmbedBuilder()
        .setTitle("🛡️ Prank Defense Success!")
        .setColor("#00FF00")
        .setDescription(`${prankData.target.username} successfully fends off the prankster!`)
        .addFields(
            {
                name: "Justice Served!",
                value: `💰 Kopeks Stolen: ${pranksterMoney.toLocaleString()}\n🗡️ Weapon Taken: ${pranksterBestWeapon.name}\n🛡️ Armor Taken: ${pranksterBestArmor.name}`,
                inline: false
            },
            {
                name: "Death Penalty",
                value: `${prankData.prankster.username} cannot attack anyone for 24 hours.`,
                inline: false
            }
        );

    message.channel.send({ embeds: [embed] });
}

async function getBestWeapon(userId) {
    const weapons = [
        { type: "rifle", name: "Rifle", minDamage: 6, maxDamage: 12 },
        { type: "shotgun", name: "Shotgun", minDamage: 4, maxDamage: 10 },
        { type: "pistol", name: "Pistol", minDamage: 2, maxDamage: 5 },
        { type: "sword", name: "Sword", minDamage: 1, maxDamage: 3 },
        { type: "knife", name: "Knife", minDamage: 1, maxDamage: 1 }
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
    name: "violate",
    aliases: ["prank", "humiliate"]
};
