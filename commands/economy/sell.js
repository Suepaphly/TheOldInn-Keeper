
const Discord = require("discord.js");
const { QuickDB } = require("quick.db");
const db = new QuickDB();

module.exports.run = async (client, message, args) => {
    // Check if town is under attack
    const ptt = require("../../utility/protectTheTavern.js");
    if (ptt.lockArena) {
        return message.channel.send(
            "⚔️ The town is under attack! All civilian activities are suspended until the battle ends.",
        );
    }

    const user = message.author;
    const itemName = args[0];
    const quantity = parseInt(args[1]) || 1;

    if (!itemName) {
        // Show shop items (same as =shop default)
        const embed = new Discord.EmbedBuilder()
            .setTitle("🛍️ Weapon & Armor Shop")
            .setColor("#FFD700")
            .setDescription("Use `=sell [item] [quantity]` to sell items or `=buy [item]` to purchase")
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
                    value: `**White/Black/Red/Blue/Green** - 4,000 kopeks each (Quest rewards only)`,
                    inline: true,
                },
                {
                    name: "💰 Your Balance",
                    value: `${(await db.get(`money_${user.id}`)) || 0} kopeks`,
                    inline: false,
                },
                {
                    name: "💡 Selling",
                    value: `Items sell for 50% of their purchase price`,
                    inline: false,
                },
            );

        return message.channel.send({ embeds: [embed] });
    }

    if (quantity < 1) {
        return message.channel.send("❌ Quantity must be at least 1!");
    }

    const itemLower = itemName.toLowerCase();

    // Define item prices (half of shop prices)
    const weapons = {
        knife: { cost: 5, name: "Knife", shopPrice: 10 },
        sword: { cost: 50, name: "Sword", shopPrice: 100 },
        pistol: { cost: 500, name: "Pistol", shopPrice: 1000 },
        shotgun: { cost: 1250, name: "Shotgun", shopPrice: 2500 },
        rifle: { cost: 2500, name: "Rifle", shopPrice: 5000 },
    };

    const armor = {
        cloth: { cost: 250, name: "Cloth Armor", shopPrice: 500 },
        leather: { cost: 500, name: "Leather Armor", shopPrice: 1000 },
        chainmail: { cost: 750, name: "Chainmail Armor", shopPrice: 1500 },
        studded: { cost: 1500, name: "Studded Armor", shopPrice: 3000 },
        plate: { cost: 3000, name: "Plate Armor", shopPrice: 6000 },
        dragonscale: { cost: 6000, name: "Dragonscale Armor", shopPrice: 12000 },
    };

    const crystals = {
        white: { cost: 4000, name: "White Crystal", shopPrice: 4000 },
        black: { cost: 4000, name: "Black Crystal", shopPrice: 4000 },
        red: { cost: 4000, name: "Red Crystal", shopPrice: 4000 },
        blue: { cost: 4000, name: "Blue Crystal", shopPrice: 4000 },
        green: { cost: 4000, name: "Green Crystal", shopPrice: 4000 },
    };

    if (weapons[itemLower]) {
        const userWeaponCount = (await db.get(`weapon_${itemLower}_${user.id}`)) || 0;
        if (userWeaponCount < quantity) {
            return message.channel.send(
                `❌ You only have ${userWeaponCount} ${weapons[itemLower].name}(s) to sell!`,
            );
        }

        const sellPrice = weapons[itemLower].cost * quantity;
        await db.sub(`weapon_${itemLower}_${user.id}`, quantity);
        await db.add(`money_${user.id}`, sellPrice);

        const embed = new Discord.EmbedBuilder()
            .setTitle("💰 Item Sold!")
            .setColor("#00FF00")
            .setDescription(`You sold ${quantity}x ${weapons[itemLower].name} for ${sellPrice.toLocaleString()} kopeks!`)
            .addFields(
                { name: "Item", value: `${weapons[itemLower].name}`, inline: true },
                { name: "Quantity", value: `${quantity}`, inline: true },
                { name: "Total Price", value: `${sellPrice.toLocaleString()} kopeks`, inline: true }
            );

        message.channel.send({ embeds: [embed] });

    } else if (armor[itemLower]) {
        const userArmorCount = (await db.get(`armor_${itemLower}_${user.id}`)) || 0;
        if (userArmorCount < quantity) {
            return message.channel.send(
                `❌ You only have ${userArmorCount} ${armor[itemLower].name}(s) to sell!`,
            );
        }

        const sellPrice = armor[itemLower].cost * quantity;
        await db.sub(`armor_${itemLower}_${user.id}`, quantity);
        await db.add(`money_${user.id}`, sellPrice);

        const embed = new Discord.EmbedBuilder()
            .setTitle("💰 Item Sold!")
            .setColor("#00FF00")
            .setDescription(`You sold ${quantity}x ${armor[itemLower].name} for ${sellPrice.toLocaleString()} kopeks!`)
            .addFields(
                { name: "Item", value: `${armor[itemLower].name}`, inline: true },
                { name: "Quantity", value: `${quantity}`, inline: true },
                { name: "Total Price", value: `${sellPrice.toLocaleString()} kopeks`, inline: true }
            );

        message.channel.send({ embeds: [embed] });

    } else if (crystals[itemLower]) {
        const userCrystalCount = (await db.get(`crystal_${itemLower}_${user.id}`)) || 0;
        if (userCrystalCount < quantity) {
            return message.channel.send(
                `❌ You only have ${userCrystalCount} ${crystals[itemLower].name}(s) to sell!`,
            );
        }

        const sellPrice = crystals[itemLower].cost * quantity;
        await db.sub(`crystal_${itemLower}_${user.id}`, quantity);
        await db.add(`money_${user.id}`, sellPrice);

        const embed = new Discord.EmbedBuilder()
            .setTitle("💰 Crystal Sold!")
            .setColor("#9932CC")
            .setDescription(`You sold ${quantity}x ${crystals[itemLower].name} for ${sellPrice.toLocaleString()} kopeks!`)
            .addFields(
                { name: "Crystal", value: `${crystals[itemLower].name}`, inline: true },
                { name: "Quantity", value: `${quantity}`, inline: true },
                { name: "Total Price", value: `${sellPrice.toLocaleString()} kopeks`, inline: true }
            );

        message.channel.send({ embeds: [embed] });

    } else {
        message.channel.send(
            `❌ Item not found! Available items to sell:\n\n**Weapons:** knife, sword, pistol, shotgun, rifle\n**Armor:** cloth, leather, chainmail, studded, plate, dragonscale\n**Crystals:** white, black, red, blue, green\n\nUsage: \`=sell [item] [quantity]\``,
        );
    }
};

module.exports.help = {
    name: "sell",
    aliases: []
};
