const { QuickDB } = require("quick.db");
const db = new QuickDB();
const Discord = require("discord.js");

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
                    value: `**Cloth** - 500 kopeks (+1 Defense)\n**Leather** - 1,000 kopeks (+2 Defense)\n**Chainmail** - 1,500 kopeks (+3 Defense)\n**Studded** - 3,000 kopeks (+5 Defense)\n**Plate** - 6,000 kopeks (+10 Defense)`,
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
        };

        if (weapons[item]) {
            if (money < weapons[item].cost) {
                return message.channel.send(
                    `❌ You need ${weapons[item].cost.toLocaleString()} kopeks to buy a ${weapons[item].name}. You have ${money.toLocaleString()}.`,
                );
            }

            await db.sub(`money_${user.id}`, weapons[item].cost);
            await db.add(`weapon_${item}_${user.id}`, 1);

            message.channel.send(
                `⚔️ You purchased a ${weapons[item].name} for ${weapons[item].cost.toLocaleString()} kopeks!`,
            );
        } else if (armor[item]) {
            if (money < armor[item].cost) {
                return message.channel.send(
                    `❌ You need ${armor[item].cost.toLocaleString()} kopeks to buy ${armor[item].name}. You have ${money.toLocaleString()}.`,
                );
            }

            await db.sub(`money_${user.id}`, armor[item].cost);
            await db.add(`armor_${item}_${user.id}`, 1);

            message.channel.send(
                `🛡️ You purchased ${armor[item].name} for ${armor[item].cost.toLocaleString()} kopeks!`,
            );
        } else {
            message.channel.send(
                `❌ Item not found! Available items: knife, sword, pistol, shotgun, rifle, cloth, leather, chainmail, studded, plate`,
            );
        }
    } else {
        message.channel.send(
            `❌ Use \`=shop\` to view items or \`=shop buy [item]\` to purchase.`,
        );
    }
};

module.exports.help = {
    name: "shop",
    aliases: [],
};
