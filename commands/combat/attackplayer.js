const { QuickDB } = require("quick.db");
const db = new QuickDB();
const Discord = require("discord.js");
const cron = require("node-cron");
const { canAddToBackpack, getBackpackFullMessage } = require("../../utility/backpackUtils.js");

// Store active battles
const activeBattles = new Map();

module.exports.run = async (client, message, args) => {
    const attacker = message.author;
    const target = message.mentions.users.first();

    // Check if user is on a quest
    const { isOnQuest } = require('../quest.js');
    if (await isOnQuest(attacker.id)) {
        return message.channel.send("❌ You cannot attack players while on a quest!");
    }

    // Check if target is on a quest
    if (target && await isOnQuest(target.id)) {
        return message.channel.send("❌ You cannot attack players who are on a quest!");
    }

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
    if (attackerDeathTime) {
        if (Date.now() - attackerDeathTime < 86400000) { // 24 hours
            const remainingTime = Math.ceil((86400000 - (Date.now() - attackerDeathTime)) / 3600000);
            return message.channel.send(`💀 You are still recovering from death! Wait ${remainingTime} more hours.`);
        } else {
            // Timer expired, clean up the database
            await db.delete(`death_cooldown_${attacker.id}`);
        }
    }

    // Check if target is dead
    const targetDeathTime = await db.get(`death_cooldown_${target.id}`);
    if (targetDeathTime) {
        if (Date.now() - targetDeathTime < 86400000) { // 24 hours
            return message.channel.send(`💀 ${target.username} is still recovering from death and cannot be attacked!`);
        } else {
            // Timer expired, clean up the database
            await db.delete(`death_cooldown_${target.id}`);
        }
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

    const battleMessage = await message.channel.send({ embeds: [embed] });

    // Start battle rounds
    setTimeout(() => {
        runBattleRounds(message, battleData, players, 0, client, battleMessage);
    }, 3000);
}

async function runBattleRounds(message, battleData, players, currentPlayerIndex, client, battleMessage = null) {
    if (battleData.round >= 4) {
        // Draw - both players survive
        await handleDraw(message, battleData);
        return;
    }

    if (battleData.attacker.health <= 0) {
        await handleBattleEnd(message, battleData, battleData.target, battleData.attacker, client);
        return;
    }

    if (battleData.target.health <= 0) {
        await handleBattleEnd(message, battleData, battleData.attacker, battleData.target, client);
        return;
    }

    battleData.round++;

    const currentPlayer = players[currentPlayerIndex];
    const otherPlayer = players[1 - currentPlayerIndex];

    // Calculate damage - check for dual pistols
    const combatDamage = currentPlayer.combatLevel + 1;
    let finalDamage = 0;
    let attackDescription = "";

    // Check if player has dual pistols (Guns Akimbo feat)
    if (currentPlayer.weapon.isDual) {
        // First pistol attack
        const firstWeaponDamage = Math.floor(Math.random() * (currentPlayer.weapon.maxDamage - currentPlayer.weapon.minDamage + 1)) + currentPlayer.weapon.minDamage;
        const firstTotalDamage = combatDamage + firstWeaponDamage;
        const firstFinalDamage = Math.max(1, firstTotalDamage - otherPlayer.armor.defense);

        // Second pistol attack
        const secondWeaponDamage = Math.floor(Math.random() * (currentPlayer.weapon.maxDamage - currentPlayer.weapon.minDamage + 1)) + currentPlayer.weapon.minDamage;
        const secondTotalDamage = combatDamage + secondWeaponDamage;
        const secondFinalDamage = Math.max(1, secondTotalDamage - otherPlayer.armor.defense);

        finalDamage = firstFinalDamage + secondFinalDamage;
        
        const dualAttacks = [
            "activates **Guns Akimbo** and spins both pistols like a gunslinger, unleashing a devastating barrage",
            "triggers **Guns Akimbo** and draws both pistols in a blur of motion, bullets flying in perfect sync",
            "uses **Guns Akimbo** to empty both clips in a thunderous display of firepower",
            "channels **Guns Akimbo** with a spectacular dual-pistol assault like an old west gunslinger",
            "unleashes **Guns Akimbo** and becomes a whirlwind of lead and steel with both guns blazing"
        ];
        const randomDualAttack = dualAttacks[Math.floor(Math.random() * dualAttacks.length)];
        attackDescription = `${randomDualAttack}! 🔫🔫\nFirst shot: ${firstFinalDamage} damage! Second shot: ${secondFinalDamage} damage!\nTotal damage: ${finalDamage}!`;
    } else {
        // Normal single weapon attack with flavor text
        const weaponDamage = Math.floor(Math.random() * (currentPlayer.weapon.maxDamage - currentPlayer.weapon.minDamage + 1)) + currentPlayer.weapon.minDamage;
        const totalDamage = combatDamage + weaponDamage;
        finalDamage = Math.max(1, totalDamage - otherPlayer.armor.defense);
        
        // Get weapon-specific attack descriptions
        const weaponAttacks = getWeaponAttackDescriptions(currentPlayer.weapon.type, currentPlayer.username, otherPlayer.username);
        const randomAttack = weaponAttacks[Math.floor(Math.random() * weaponAttacks.length)];
        attackDescription = `${randomAttack} for ${finalDamage} damage!`;
    }

    // Apply damage
    otherPlayer.health -= finalDamage;
    otherPlayer.health = Math.max(0, otherPlayer.health);

    // Update battleData with new health values
    if (currentPlayerIndex === 0) {
        battleData.target.health = otherPlayer.health;
    } else {
        battleData.attacker.health = otherPlayer.health;
    }

    const embed = new Discord.EmbedBuilder()
        .setTitle(`⚔️ Round ${battleData.round}/4`)
        .setColor("#FFA500")
        .setDescription(`${currentPlayer.username} ${attackDescription}`)
        .addFields(
            {
                name: `${battleData.attacker.username}`,
                value: `❤️ ${battleData.attacker.health}/${battleData.attacker.maxHealth}`,
                inline: true
            },
            {
                name: `${battleData.target.username}`,
                value: `❤️ ${battleData.target.health}/${battleData.target.maxHealth}`,
                inline: true
            }
        );

    if (battleMessage) {
        await battleMessage.edit({ embeds: [embed] });
    } else {
        battleMessage = await message.channel.send({ embeds: [embed] });
    }

    // Continue battle after 3 seconds
    setTimeout(() => {
        runBattleRounds(message, battleData, players, 1 - currentPlayerIndex, client, battleMessage);
    }, 3000);
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

    // Check for Ninja feat escape attempt
    const hasNinjaFeat = await db.get(`feat_ninja_${loser.id}`) || 0;
    let ninjaEscaped = false;
    
    if (hasNinjaFeat) {
        const escapeChance = Math.random() * 100;
        if (escapeChance <= 80) { // 80% success rate
            ninjaEscaped = true;
            
            const escapeEmbed = new Discord.EmbedBuilder()
                .setTitle("💨 Ninja Escape!")
                .setColor("#9932CC")
                .setDescription(`${loser.username} throws a smoke bomb and vanishes into the shadows!`)
                .addFields(
                    {
                        name: "Escape Successful!",
                        value: `🥷 **Ninja feat** activated! ${loser.username} escapes defeat and avoids all penalties.`,
                        inline: false
                    },
                    {
                        name: "Result",
                        value: `${winner.username} wins the battle, but ${loser.username} slips away unharmed!`,
                        inline: false
                    }
                );

            message.channel.send({ embeds: [escapeEmbed] });
            return; // Exit early - no penalties for ninja escape
        }
    }

    // Set death cooldown for loser (only if ninja escape failed or no ninja feat)
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

    let itemsToTransfer = 0;
    if (loserBestWeapon.type !== "none") itemsToTransfer++;
    if (loserBestArmor.type !== "none") itemsToTransfer++;

    let transferredItems = [];
    let droppedItems = [];

    if (loserBestWeapon.type !== "none") {
        if (await canAddToBackpack(winner.id)) {
            await db.sub(`weapon_${loserBestWeapon.type}_${loser.id}`, 1);
            await db.add(`weapon_${loserBestWeapon.type}_${winner.id}`, 1);
            transferredItems.push(loserBestWeapon.name);
        } else {
            await db.sub(`weapon_${loserBestWeapon.type}_${loser.id}`, 1);
            droppedItems.push(loserBestWeapon.name);
        }
    }

    if (loserBestArmor.type !== "none") {
        if (await canAddToBackpack(winner.id)) {
            await db.sub(`armor_${loserBestArmor.type}_${loser.id}`, 1);
            await db.add(`armor_${loserBestArmor.type}_${winner.id}`, 1);
            transferredItems.push(loserBestArmor.name);
        } else {
            await db.sub(`armor_${loserBestArmor.type}_${loser.id}`, 1);
            droppedItems.push(loserBestArmor.name);
        }
    }

    // Check if winner can carry the loot
    if (!(await canAddToBackpack(winner.id, itemsToTransfer))) {
        return message.channel.send(
            `❌ ${winner.username}'s backpack is full! They can only carry 10 items. Some loot was dropped.`,
        );
    }

    let spoilsText = `💰 Kopeks Stolen: ${loserMoney.toLocaleString()}`;
    if (transferredItems.length > 0) {
        spoilsText += `\n🎒 Items Taken: ${transferredItems.join(', ')}`;
    }
    if (droppedItems.length > 0) {
        spoilsText += `\n💔 Items Lost (backpack full): ${droppedItems.join(', ')}`;
    }

    let victoryDescription = `${winner.username} emerges victorious!`;
    if (hasNinjaFeat && !ninjaEscaped) {
        victoryDescription += `\n💨 ${loser.username} attempted to escape with their Ninja feat but failed!`;
    }

    const embed = new Discord.EmbedBuilder()
        .setTitle("🏆 Battle Victory!")
        .setColor("#00FF00")
        .setDescription(victoryDescription)
        .addFields(
            {
                name: "Spoils of War",
                value: spoilsText,
                inline: false
            },
            {
                name: "Death Penalty",
                value: `${loser.username} cannot attack anyone for 24 hours.`,
                inline: false
            }
        );

    if (droppedItems.length > 0) {
        embed.addFields({
            name: "💡 Tip",
            value: `Use \`=shop sell [item]\` to make backpack space for future battles!`,
            inline: false
        });
    }

    message.channel.send({ embeds: [embed] });
}

function getWeaponAttackDescriptions(weaponType, attackerName, targetName) {
    const attacks = {
        rifle: [
            `${attackerName} takes careful aim with their rifle and fires a precise shot at ${targetName}`,
            `${attackerName} shoulders their rifle and delivers a devastating long-range strike`,
            `${attackerName} works the bolt action smoothly, sending a high-velocity round toward ${targetName}`,
            `${attackerName} steadies their rifle against their shoulder and squeezes off a tactical shot`,
            `${attackerName} lines up the crosshairs and unleashes the full power of their rifle`
        ],
        shotgun: [
            `${attackerName} pumps their shotgun with a menacing *click-clack* and blasts ${targetName}`,
            `${attackerName} levels their shotgun and unleashes a spread of buckshot`,
            `${attackerName} fires a thunderous shotgun blast that echoes across the battlefield`,
            `${attackerName} chambers another shell and delivers a devastating close-range blast`,
            `${attackerName} brings their shotgun to bear and fires a bone-rattling shot`
        ],
        pistol: [
            `${attackerName} draws their pistol in a quick-draw motion and fires at ${targetName}`,
            `${attackerName} steadies their pistol with both hands and squeezes off a precise shot`,
            `${attackerName} fans the hammer of their pistol like an old west gunslinger`,
            `${attackerName} takes a combat stance and delivers a well-aimed pistol shot`,
            `${attackerName} quick-fires their sidearm with practiced precision`
        ],
        sword: [
            `${attackerName} draws their blade and delivers a swift sword strike to ${targetName}`,
            `${attackerName} lunges forward with their sword in a classic fencing attack`,
            `${attackerName} swings their sword in a deadly arc toward ${targetName}`,
            `${attackerName} parries and ripostes with their gleaming blade`,
            `${attackerName} executes a masterful sword technique against ${targetName}`
        ],
        knife: [
            `${attackerName} flicks open their knife and strikes with lightning speed`,
            `${attackerName} closes the distance and delivers a precise knife thrust`,
            `${attackerName} slashes with their combat knife in a fluid motion`,
            `${attackerName} brandishes their blade and strikes like a viper`,
            `${attackerName} weaves past defenses and lands a quick knife strike`
        ],
        none: [
            `${attackerName} throws a devastating haymaker punch at ${targetName}`,
            `${attackerName} delivers a brutal uppercut with their bare fists`,
            `${attackerName} unleashes a flurry of punches in a boxing combination`,
            `${attackerName} grapples with ${targetName} and lands a crushing blow`,
            `${attackerName} channels their inner brawler with a powerful right hook`
        ]
    };
    
    return attacks[weaponType] || attacks.none;
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