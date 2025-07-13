const { QuickDB } = require("quick.db");
const db = new QuickDB();
const Discord = require("discord.js");

// Utility function to check if the user can add to their backpack
async function canAddToBackpack(userId) {
    const weaponCounts = await db.get(`weapon_${userId}`) || {};
    const armorCounts = await db.get(`armor_${userId}`) || {};

    let totalItems = 0;

    for (const weapon in weaponCounts) {
        totalItems += weaponCounts[weapon];
    }
    for (const armor in armorCounts) {
        totalItems += armorCounts[armor];
    }

    return totalItems < 10;
}

// Utility function to get the backpack full message
function getBackpackFullMessage() {
    return `🎒 Your backpack is full! You can only carry 10 items. Please sell some items using \`=sell\` before acquiring more.`;
}

module.exports.run = async (client, message, args) => {
    // Check if town is under attack
    const ptt = require("../utility/protectTheTavern.js");
    if (ptt.lockArena) {
        return message.channel.send(
            "⚔️ The town is under attack! All civilian activities are suspended until the battle ends.",
        );
    }

    const user = message.author;
    const money = (await db.get(`money_${user.id}`)) || 0;

    if (!args[0]) {
        // Show shop items
        const embed = new Discord.EmbedBuilder()
            .setTitle("🛍️ Weapon & Armor Shop")
            .setColor("#FFD700")
            .setDescription("Use `=shop buy [item]` to purchase items")
            .addFields(
                {
                    name: "🗡️ Weapons",
                    value: `**Knife** - 10 kopeks (+1 Damage)\n**Sword** - 100 kopeks (1-3 Damage)\n**Pistol** - 1,000 kopeks (2-5 Damage)\n**Shotgun** - 2,500 kopeks (4-10 Damage)\n**Rifle** - 5,000 kopeks (6-12 Damage)`,
                    inline: true,
                },
                {
                    name: "🛡️ Armor",
                    value: `**Cloth** - 500 kopeks (+1 Defense)\n**Leather** - 1,000 kopeks (+2 Defense)\n**Chainmail** - 1,500 kopeks (+3 Defense)\n**Studded** - 3,000 kopeks (+5 Defense)\n**Plate** - 6,000 kopeks (+10 Defense)\n**Dragonscale** - 12,000 kopeks (+20 Defense)`,
                    inline: true,
                },
                {
                    name: "💎 Crystals",
                    value: `**White Crystal** - 4,000 kopeks (Special Ability)\n**Black Crystal** - 4,000 kopeks (Special Ability)\n**Red Crystal** - 4,000 kopeks (Special Ability)\n**Blue Crystal** - 4,000 kopeks (Special Ability)\n**Green Crystal** - 4,000 kopeks (Special Ability)`,
                    inline: true,
                },
                {
                    name: "💰 Your Balance",
                    value: `${money.toLocaleString()} kopeks`,
                    inline: false,
                },
            );

        return message.channel.send({ embeds: [embed] });
    }

    if (args[0] === "buy" && args[1]) {
        const item = args[1].toLowerCase();

        const weapons = {
            knife: { cost: 10, name: "Knife", damage: [1, 3] },
            sword: { cost: 100, name: "Sword", damage: [2, 4] },
            pistol: { cost: 1000, name: "Pistol", damage: [3, 5] },
            shotgun: { cost: 2500, name: "Shotgun", damage: [4, 10] },
            rifle: { cost: 5000, name: "Rifle", damage: [6, 12] },
        };

        const armor = {
            cloth: { cost: 500, name: "Cloth Armor", defense: 1 },
            leather: { cost: 1000, name: "Leather Armor", defense: 2 },
            chainmail: { cost: 1500, name: "Chainmail Armor", defense: 3 },
            studded: { cost: 3000, name: "Studded Armor", defense: 5 },
            plate: { cost: 6000, name: "Plate Armor", defense: 10 },
            dragonscale: { cost: 12000, name: "Dragonscale Armor", defense: 20 },
        };

        const crystals = {
            white: { cost: 4000, name: "White Crystal" },
            black: { cost: 4000, name: "Black Crystal" },
            red: { cost: 4000, name: "Red Crystal" },
            blue: { cost: 4000, name: "Blue Crystal" },
            green: { cost: 4000, name: "Green Crystal" },
        };

        if (weapons[item]) {
            if (money < weapons[item].cost) {
                return message.channel.send(
                    `❌ You need ${weapons[item].cost.toLocaleString()} kopeks to buy a ${weapons[item].name}. You have ${money.toLocaleString()}.`,
                );
            }

            if (!(await canAddToBackpack(user.id))) {
                return message.channel.send(getBackpackFullMessage());
            }

            await db.sub(`money_${user.id}`, weapons[item].cost);
            await db.add(`weapon_${item}_${user.id}`, 1);

            message.channel.send(
                `✅ You bought a ${weapons[item].name} for ${weapons[item].cost.toLocaleString()} kopeks!`,
            );
        } else if (armor[item]) {
            if (money < armor[item].cost) {
                return message.channel.send(
                    `❌ You need ${armor[item].cost.toLocaleString()} kopeks to buy ${armor[item].name}. You have ${money.toLocaleString()}.`,
                );
            }

            if (!(await canAddToBackpack(user.id))) {
                return message.channel.send(getBackpackFullMessage());
            }

            await db.sub(`money_${user.id}`, armor[item].cost);
            await db.add(`armor_${item}_${user.id}`, 1);

            message.channel.send(
                `✅ You bought ${armor[item].name} for ${armor[item].cost.toLocaleString()} kopeks!`,
            );
        } else if (crystals[item]) {
            if (money < crystals[item].cost) {
                return message.channel.send(
                    `❌ You need ${crystals[item].cost.toLocaleString()} kopeks to buy a ${crystals[item].name}. You have ${money.toLocaleString()}.`,
                );
            }

            if (!(await canAddToBackpack(user.id))) {
                return message.channel.send(getBackpackFullMessage());
            }

            await db.sub(`money_${user.id}`, crystals[item].cost);
            await db.add(`crystal_${item}_${user.id}`, 1);

            message.channel.send(
                `✅ You bought a ${crystals[item].name} for ${crystals[item].cost.toLocaleString()} kopeks!`,
            );
        }
         else {
            message.channel.send(
                `❌ Item not found! Available items: knife, sword, pistol, shotgun, rifle, cloth, leather, chainmail, studded, plate`,
            );
        }
    } else if (args[0] === "sell" && args[1]) {
        const item = args[1].toLowerCase();

        const weapons = {
            knife: { cost: 10, name: "Knife", damage: [1, 3] },
            sword: { cost: 100, name: "Sword", damage: [2, 4] },
            pistol: { cost: 1000, name: "Pistol", damage: [3, 5] },
            shotgun: { cost: 2500, name: "Shotgun", damage: [4, 10] },
            rifle: { cost: 5000, name: "Rifle", damage: [6, 12] },
        };

        const armor = {
            cloth: { cost: 500, name: "Cloth Armor", defense: 1 },
            leather: { cost: 1000, name: "Leather Armor", defense: 2 },
            chainmail: { cost: 1500, name: "Chainmail Armor", defense: 3 },
            studded: { cost: 3000, name: "Studded Armor", defense: 5 },
            plate: { cost: 6000, name: "Plate Armor", defense: 10 },
            dragonscale: { cost: 12000, name: "Dragonscale Armor", defense: 20 },
        };

        const crystals = {
            white: { cost: 4000, name: "White Crystal" },
            black: { cost: 4000, name: "Black Crystal" },
            red: { cost: 4000, name: "Red Crystal" },
            blue: { cost: 4000, name: "Blue Crystal" },
            green: { cost: 4000, name: "Green Crystal" },
        };

        if (weapons[item]) {
            const userWeaponCount = (await db.get(`weapon_${item}_${user.id}`)) || 0;
            if (userWeaponCount <= 0) {
                return message.channel.send(
                    `❌ You don't have any ${weapons[item].name} to sell!`,
                );
            }

            const sellPrice = Math.floor(weapons[item].cost / 2);
            await db.sub(`weapon_${item}_${user.id}`, 1);
            await db.add(`money_${user.id}`, sellPrice);

            message.channel.send(
                `💰 You sold a ${weapons[item].name} for ${sellPrice.toLocaleString()} kopeks!`,
            );
        } else if (armor[item]) {
            const userArmorCount = (await db.get(`armor_${item}_${user.id}`)) || 0;
            if (userArmorCount <= 0) {
                return message.channel.send(
                    `❌ You don't have any ${armor[item].name} to sell!`,
                );
            }

            const sellPrice = Math.floor(armor[item].cost / 2);
            await db.sub(`armor_${item}_${user.id}`, 1);
            await db.add(`money_${user.id}`, sellPrice);

            message.channel.send(
                `💰 You sold ${armor[item].name} for ${sellPrice.toLocaleString()} kopeks!`,
            );
        } else if (crystals[item]) {
            const count = await db.get(`crystal_${item}_${user.id}`) || 0;
            if (count <= 0) {
                return message.channel.send(`❌ You don't have any ${crystals[item].name} to sell!`);
            }

            await db.sub(`crystal_${item}_${user.id}`, 1);
            await db.add(`money_${user.id}`, 4000);

            message.channel.send(
                `✅ You sold a ${crystals[item].name} for 4,000 kopeks!`,
            );
        } else {
            message.channel.send(
                `❌ Item not found! Available items: knife, sword, pistol, shotgun, rifle, cloth, leather, chainmail, studded, plate, white, black, red, blue, green`,
            );
        }
    } else {
        message.channel.send(
            `❌ Use \`=shop\` to view items, \`=shop buy [item]\` to purchase, or \`=shop sell [item]\` to sell.`,
        );
    }
};

module.exports.help = {
    name: "shop",
    aliases: [],
};