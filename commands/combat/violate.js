const { QuickDB } = require("quick.db");
const db = new QuickDB();
const Discord = require("discord.js");
const {
    canAddToBackpack,
    getBackpackFullMessage,
} = require("../../utility/backpackUtils.js");

// Store active pranks
const activePranks = new Map();

module.exports.run = async (client, message, args) => {
    const user = message.author;
    const target = message.mentions.users.first();

    // Check if user is on a quest
    const { isOnQuest } = require("../quest.js");
    if (await isOnQuest(user.id)) {
        return message.channel.send(
            "❌ You cannot violate players while on a quest!",
        );
    }

    // Check if target is on a quest
    if (target && (await isOnQuest(target.id))) {
        return message.channel.send(
            "❌ You cannot violate players who are on a quest!",
        );
    }

    if (!target) {
        return message.channel.send(
            "❌ You must mention a user to violate! Usage: `=violate @user`",
        );
    }

    if (target.id === user.id) {
        return message.channel.send("❌ You cannot prank yourself!");
    }

    if (target.bot) {
        return message.channel.send("❌ You cannot prank bots!");
    }

    // Check if prankster is dead
    const pranksterDeathTime = await db.get(`death_cooldown_${user.id}`);
    if (pranksterDeathTime && Date.now() - pranksterDeathTime < 86400000) {
        // 24 hours
        const remainingTime = Math.ceil(
            (86400000 - (Date.now() - pranksterDeathTime)) / 3600000,
        );
        return message.channel.send(
            `💀 You are still recovering from death! Wait ${remainingTime} more hours.`,
        );
    }

    // Check if target is dead
    const targetDeathTime = await db.get(`death_cooldown_${target.id}`);
    if (targetDeathTime) {
        if (Date.now() - targetDeathTime < 86400000) {
            // 24 hours
            return message.channel.send(
                `💀 ${target.username} is still recovering from death and cannot be violated!`,
            );
        } else {
            // Timer expired, clean up the database
            await db.delete(`death_cooldown_${target.id}`);
        }
    }

    // Check if either player is in battle or prank
    if (activePranks.has(user.id)) {
        return message.channel.send("🎭 You are already violating someone!");
    }
    if (activePranks.has(target.id)) {
        return message.channel.send(
            `🎭 ${target.username} is already being pranked!`,
        );
    }

    // Check draw cooldown
    const drawCooldown = await db.get(`prank_cooldown_${user.id}_${target.id}`);
    if (drawCooldown && Date.now() - drawCooldown < 3600000) {
        // 1 hour
        const remainingTime = Math.ceil(
            (3600000 - (Date.now() - drawCooldown)) / 60000,
        );
        return message.channel.send(
            `⏰ You must wait ${remainingTime} more minutes before violating ${target.username} again.`,
        );
    }

    // Start the prank battle
    await startPrankBattle(message, user, target, client);
};

async function startPrankBattle(message, prankster, target, client) {
    // Mark both players as in prank
    activePranks.set(prankster.id, target.id);
    activePranks.set(target.id, prankster.id);

    const pranksterCombatLevel =
        (await db.get(`combatlevel_${prankster.id}`)) || 0;
    const targetCombatLevel = (await db.get(`combatlevel_${target.id}`)) || 0;

    const prankData = {
        prankster: {
            id: prankster.id,
            username: prankster.username,
            health: 5 + pranksterCombatLevel * 2,
            maxHealth: 5 + pranksterCombatLevel * 2,
            weapon: await getBestWeapon(prankster.id),
            armor: await getBestArmor(prankster.id),
            combatLevel: pranksterCombatLevel,
        },
        target: {
            id: target.id,
            username: target.username,
            health: 5 + targetCombatLevel * 2,
            maxHealth: 5 + targetCombatLevel * 2,
            weapon: await getBestWeapon(target.id),
            armor: await getBestArmor(target.id),
            combatLevel: targetCombatLevel,
        },
        round: 0,
    };

    const embed = new Discord.EmbedBuilder()
        .setTitle("🎭 Battle Begins!")
        .setColor("#FFD700")
        .setDescription(
            `${prankster.username} attempts to violate ${target.username}!`,
        )
        .addFields(
            {
                name: `${prankData.prankster.username}`,
                value: `❤️ Health: ${prankData.prankster.health}/${prankData.prankster.maxHealth}\n🗡️ Weapon: ${prankData.prankster.weapon.name}\n🛡️ Armor: ${prankData.prankster.armor.name}`,
                inline: true,
            },
            {
                name: `${prankData.target.username} (Defender)`,
                value: `❤️ Health: ${prankData.target.health}/${prankData.target.maxHealth}\n🗡️ Weapon: ${prankData.target.weapon.name}\n🛡️ Armor: ${prankData.target.armor.name}`,
                inline: true,
            },
            {
                name: "Rules",
                value: `The violator doesn't deal damage but tries to humiliate!\nThe defender fights back normally for 4 rounds!`,
                inline: false,
            },
        );

    const battleMessage = await message.channel.send({ embeds: [embed] });

    // Start prank rounds
    setTimeout(() => {
        runPrankRounds(message, prankData, client, battleMessage);
    }, 3000);
}

async function runPrankRounds(
    message,
    prankData,
    client,
    battleMessage = null,
) {
    if (prankData.round >= 4) {
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
        "fills their boots with jelly beans",
    ];

    const randomPrank =
        prankMessages[Math.floor(Math.random() * prankMessages.length)];

    // Target's turn - fight back
    const combatDamage = prankData.target.combatLevel + 1;
    const weaponDamage =
        Math.floor(
            Math.random() *
                (prankData.target.weapon.maxDamage -
                    prankData.target.weapon.minDamage +
                    1),
        ) + prankData.target.weapon.minDamage;
    const totalDamage = combatDamage + weaponDamage;
    const finalDamage = Math.max(
        1,
        totalDamage - prankData.prankster.armor.defense,
    );

    prankData.prankster.health -= finalDamage;
    prankData.prankster.health = Math.max(0, prankData.prankster.health);

    const embed = new Discord.EmbedBuilder()
        .setTitle(`🎭 Violate Round ${prankData.round}/4`)
        .setColor("#FFA500")
        .setDescription(
            `${prankData.prankster.username} ${randomPrank}!\n${prankData.target.username} counters for ${finalDamage} damage!`,
        )
        .addFields(
            {
                name: `${prankData.prankster.username} (Prankster)`,
                value: `❤️ ${prankData.prankster.health}/${prankData.prankster.maxHealth}`,
                inline: true,
            },
            {
                name: `${prankData.target.username} (Defender)`,
                value: `❤️ ${prankData.target.health}/${prankData.target.maxHealth}`,
                inline: true,
            },
        );

    if (battleMessage) {
        await battleMessage.edit({ embeds: [embed] });
    } else {
        battleMessage = await message.channel.send({ embeds: [embed] });
    }

    // Continue battle after 3 seconds
    setTimeout(() => {
        runPrankRounds(message, prankData, client, battleMessage);
    }, 3000);
}

async function handlePrankSuccess(message, prankData, client) {
    // Remove from active pranks
    activePranks.delete(prankData.prankster.id);
    activePranks.delete(prankData.target.id);

    const humiliationMessages = [
        "is bent over the bunk, earning their commissary the hard way.",
        "just moaned 'yes, Daddy' loud enough to wake the whole cellblock.",
        "is wearing nothing but cuffs and a grin in solitary.",
        "learned the true meaning of 'protective custody' last night.",
        "has been officially claimed — collar and all.",
        "is on all fours, scrubbing the floor... and getting watched.",
        "just finished roleplaying 'warden and inmate' — and forgot the safe word.",
        "is now known as 'Princess Peaches' on D-block",
    ];

    const randomHumiliation =
        humiliationMessages[
            Math.floor(Math.random() * humiliationMessages.length)
        ];

    const embed = new Discord.EmbedBuilder()
        .setTitle("🎪 Horrible Outcome!")
        .setColor("#FF69B4")
        .setDescription(
            `${prankData.prankster.username} successfully violated ${prankData.target.username}!`,
        )
        .addFields(
            {
                name: "Humiliation Complete!",
                value: `${prankData.target.username} ${randomHumiliation}`,
                inline: false,
            },
            {
                name: "Result",
                value: `${prankData.prankster.username} gains nothing but satisfaction!\n${prankData.target.username} suffers only embarrassment!`,
                inline: false,
            },
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
    const pranksterMoney =
        (await db.get(`money_${prankData.prankster.id}`)) || 0;
    if (pranksterMoney > 0) {
        await db.add(`money_${prankData.target.id}`, pranksterMoney);
        await db.set(`money_${prankData.prankster.id}`, 0);
    }

    // Transfer best weapon and armor
    const pranksterBestWeapon = await getBestWeapon(prankData.prankster.id);
    const pranksterBestArmor = await getBestArmor(prankData.prankster.id);

    let transferredItems = [];
    let droppedItems = [];

    if (pranksterBestWeapon.type !== "none") {
        if (await canAddToBackpack(prankData.target.id)) {
            await db.sub(
                `weapon_${pranksterBestWeapon.type}_${prankData.prankster.id}`,
                1,
            );
            await db.add(
                `weapon_${pranksterBestWeapon.type}_${prankData.target.id}`,
                1,
            );
            transferredItems.push(pranksterBestWeapon.name);
        } else {
            await db.sub(
                `weapon_${pranksterBestWeapon.type}_${prankData.prankster.id}`,
                1,
            );
            droppedItems.push(pranksterBestWeapon.name);
        }
    }

    if (pranksterBestArmor.type !== "none") {
        if (await canAddToBackpack(prankData.target.id)) {
            await db.sub(
                `armor_${pranksterBestArmor.type}_${prankData.prankster.id}`,
                1,
            );
            await db.add(
                `armor_${pranksterBestArmor.type}_${prankData.target.id}`,
                1,
            );
            transferredItems.push(pranksterBestArmor.name);
        } else {
            await db.sub(
                `armor_${pranksterBestArmor.type}_${prankData.prankster.id}`,
                1,
            );
            droppedItems.push(pranksterBestArmor.name);
        }
    }

    let justiceText = `💰 Kopeks Stolen: ${pranksterMoney.toLocaleString()}`;
    if (transferredItems.length > 0) {
        justiceText += `\n🎒 Items Taken: ${transferredItems.join(", ")}`;
    }
    if (droppedItems.length > 0) {
        justiceText += `\n💔 Items Lost (backpack full): ${droppedItems.join(", ")}`;
    }

    const embed = new Discord.EmbedBuilder()
        .setTitle("🛡️ Defense Success!")
        .setColor("#00FF00")
        .setDescription(
            `${prankData.target.username} successfully fends off the prankster!`,
        )
        .addFields(
            {
                name: "Justice Served!",
                value: justiceText,
                inline: false,
            },
            {
                name: "Death Penalty",
                value: `${prankData.prankster.username} cannot attack anyone for 24 hours.`,
                inline: false,
            },
        );

    if (droppedItems.length > 0) {
        embed.addFields({
            name: "💡 Tip",
            value: `Use \`=shop sell [item]\` to make backpack space!`,
            inline: false,
        });
    }

    message.channel.send({ embeds: [embed] });

    // Set draw cooldown
    await db.set(`prank_cooldown_${prankData.prankster.id}_${prankData.target.id}`, Date.now());
}

async function getBestWeapon(userId) {
    const weapons = [
        { type: "rifle", name: "Rifle", minDamage: 6, maxDamage: 12 },
        { type: "shotgun", name: "Shotgun", minDamage: 4, maxDamage: 10 },
        { type: "pistol", name: "Pistol", minDamage: 3, maxDamage: 5 },
        { type: "sword", name: "Sword", minDamage: 2, maxDamage: 4 },
        { type: "knife", name: "Knife", minDamage: 1, maxDamage: 3 }
    ];

    // Check for dual pistols first (Guns Akimbo feat)
    const hasGunsAkimbo = await db.get(`feat_guns_akimbo_${userId}`) || false;
    const pistolCount = await db.get(`weapon_pistol_${userId}`) || 0;

    if (hasGunsAkimbo && pistolCount >= 2) {
        // Check if dual pistols are the best weapon by comparing max potential damage
        const dualPistolMaxDamage = 5 * 2; // 5 max damage per pistol * 2 pistols

        // Check if any better weapon exists
        const rifleCount = await db.get(`weapon_rifle_${userId}`) || 0;
        const shotgunCount = await db.get(`weapon_shotgun_${userId}`) || 0;

        if (rifleCount === 0 && shotgunCount === 0) {
            return { 
                type: "pistol", 
                name: "Dual Pistols", 
                minDamage: 3, 
                maxDamage: 5, 
                isDual: true 
            };
        }
    }

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
        { type: "cloth", name: "Cloth Armor", defense: 1 },
    ];

    for (const armor of armors) {
        const count = (await db.get(`armor_${armor.type}_${userId}`)) || 0;
        if (count > 0) {
            return armor;
        }
    }

    return { type: "none", name: "No Armor", defense: 0 };
}

module.exports.help = {
    name: "violate",
    aliases: ["prank", "humiliate"],
};