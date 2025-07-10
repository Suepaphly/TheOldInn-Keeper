
const { QuickDB } = require("quick.db");
const db = new QuickDB();
const Discord = require("discord.js");

module.exports.run = async (client, message, args) => {
    const user = message.author;
    const allItems = await db.all();
    
    // Filter user's weapons and armor
    const userWeapons = allItems.filter(item => 
        item.id.startsWith("weapon_") && item.id.endsWith(`_${user.id}`)
    );
    const userArmor = allItems.filter(item => 
        item.id.startsWith("armor_") && item.id.endsWith(`_${user.id}`)
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
        plate: { name: "Plate Armor", defense: "10", emoji: "🛡️" }
    };

    let weaponText = "";
    let armorText = "";

    if (userWeapons.length === 0) {
        weaponText = "No weapons owned";
    } else {
        for (const weapon of userWeapons) {
            const weaponType = weapon.id.split('_')[1];
            const count = weapon.value;
            if (weaponData[weaponType] && count > 0) {
                weaponText += `${weaponData[weaponType].emoji} ${weaponData[weaponType].name} x${count} (${weaponData[weaponType].damage} dmg)\n`;
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
                armorText += `${armorData[armorType].emoji} ${armorData[armorType].name} x${count} (+${armorData[armorType].defense} def)\n`;
            }
        }
    }

    const embed = new Discord.EmbedBuilder()
        .setTitle(`🎒 ${user.username}'s Backpack`)
        .setColor("#8B4513")
        .addFields(
            {
                name: "🗡️ Weapons",
                value: weaponText || "No weapons owned",
                inline: true
            },
            {
                name: "🛡️ Armor",
                value: armorText || "No armor owned", 
                inline: true
            }
        );

    message.channel.send({ embeds: [embed] });
};

module.exports.help = {
    name: "backpack",
    aliases: ["bag", "inventory"]
};
