
const Discord = require("discord.js");
const { QuickDB } = require("quick.db");
const db = new QuickDB();
const { getBackpackCount } = require("../../utility/backpackUtils.js");

module.exports.run = async (client, message, args) => {
    const ownerID = [
        "367445249376649217"
    ];
    
    if (!ownerID.includes(message.author.id)) {
        return message.channel.send("❌ Only the bot owner can use this command!");
    }

    const target = message.mentions.users.first() || 
                  (args[0] ? await client.users.fetch(args[0]).catch(() => null) : null);

    if (!target) {
        return message.channel.send("❌ You must mention a user or provide a user ID! Usage: `=snoop @user` or `=snoop <userID>`");
    }

    try {
        const allItems = await db.all();

        // Get wallet info
        const money = await db.get(`money_${target.id}`) || 0;
        const bankMoney = await db.get(`bank_${target.id}`) || 0;

        // Filter user's items
        const userWeapons = allItems.filter(item => 
            item.id.startsWith("weapon_") && item.id.endsWith(`_${target.id}`)
        );
        const userArmor = allItems.filter(item => 
            item.id.startsWith("armor_") && item.id.endsWith(`_${target.id}`)
        );
        const userCrystals = allItems.filter(item => 
            item.id.startsWith("crystal_") && item.id.endsWith(`_${target.id}`)
        );

        const weaponData = {
            knife: { name: "Knife", damage: "1-3", emoji: "🔪" },
            sword: { name: "Sword", damage: "2-4", emoji: "⚔️" },
            pistol: { name: "Pistol", damage: "3-5", emoji: "🔫" },
            shotgun: { name: "Shotgun", damage: "4-10", emoji: "💥" },
            rifle: { name: "Rifle", damage: "6-12", emoji: "🎯" }
        };

        const armorData = {
            cloth: { name: "Cloth Armor", defense: "1", emoji: "👕" },
            leather: { name: "Leather Armor", defense: "2", emoji: "🧥" },
            chainmail: { name: "Chainmail Armor", defense: "3", emoji: "⛓️" },
            studded: { name: "Studded Armor", defense: "5", emoji: "🦺" },
            plate: { name: "Plate Armor", defense: "10", emoji: "🛡️" },
            dragonscale: { name: "Dragonscale Armor", defense: "20", emoji: "🐲" }
        };

        const crystalData = {
            white: { name: "White Crystal", emoji: "⚪" },
            black: { name: "Black Crystal", emoji: "⚫" },
            red: { name: "Red Crystal", emoji: "🔴" },
            blue: { name: "Blue Crystal", emoji: "🔵" },
            green: { name: "Green Crystal", emoji: "🟢" }
        };

        let weaponText = "";
        let armorText = "";
        let crystalText = "";

        if (userWeapons.length === 0) {
            weaponText = "No weapons owned";
        } else {
            for (const weapon of userWeapons) {
                const weaponType = weapon.id.split('_')[1];
                const count = weapon.value;
                if (weaponData[weaponType] && count > 0) {
                    weaponText += `${weaponData[weaponType].emoji} ${weaponData[weaponType].name} x${count}\n`;
                }
            }
        }

        if (userArmor.length === 0) {
            armorText = "No armor owned";
        } else {
            for (const armor of userArmor) {
                const armorType = armor.id.split('_')[1];
                const count = armor.value;
                if (armorData[armorType] && count > 0) {
                    armorText += `${armorData[armorType].emoji} ${armorData[armorType].name} x${count}\n`;
                }
            }
        }

        if (userCrystals.length === 0) {
            crystalText = "No crystals owned";
        } else {
            for (const crystal of userCrystals) {
                const crystalType = crystal.id.split('_')[1];
                const count = crystal.value;
                if (crystalData[crystalType] && count > 0) {
                    crystalText += `${crystalData[crystalType].emoji} ${crystalData[crystalType].name} x${count}\n`;
                }
            }
        }

        const totalItems = await getBackpackCount(target.id);

        const embed = new Discord.EmbedBuilder()
            .setTitle(`🕵️ Snooping on ${target.username}`)
            .setColor("#800080")
            .addFields(
                {
                    name: "💰 Wallet",
                    value: `Kopeks: ${money.toLocaleString()}\nBank: ${bankMoney.toLocaleString()}`,
                    inline: true
                },
                {
                    name: "🗡️ Weapons",
                    value: weaponText || "No weapons owned",
                    inline: true
                },
                {
                    name: "🛡️ Armor",
                    value: armorText || "No armor owned", 
                    inline: true
                },
                {
                    name: "🔮 Crystals",
                    value: crystalText || "No crystals owned",
                    inline: false
                },
                {
                    name: "📊 Summary",
                    value: `Backpack: ${totalItems}/10 items\nTotal Wealth: ${(money + bankMoney).toLocaleString()} kopeks`,
                    inline: false
                }
            );

        message.channel.send({ embeds: [embed] });

    } catch (error) {
        console.error("Error snooping on user:", error);
        message.channel.send("❌ An error occurred while trying to snoop on the user.");
    }
};

module.exports.help = {
    name: "snoop",
    aliases: ["inspect", "viewinventory"]
};
