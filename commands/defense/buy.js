
<old_str>const { QuickDB } = require("quick.db");
const db = new QuickDB();
const ptt = require("../../utility/protectTheTavern.js");

module.exports.run = async (client, message, args) => {
    // Redirect to the new =protect command
    message.channel.send("⚠️ The `=buy` command has been replaced with `=protect`! Please use `=protect` instead for all town defense purchases.\n\nExample: `=protect` for the interactive menu, or `=protect 5 rampart town_guard` for direct purchases.");
}

module.exports.help = {
    name: "buy",
    aliases: ["b"]
}</old_str>
<new_str>const { QuickDB } = require("quick.db");
const db = new QuickDB();
const Discord = require("discord.js");
const {
    canAddToBackpack,
    getBackpackFullMessage,
} = require("../../utility/backpackUtils.js");

module.exports.run = async (client, message, args) => {
    // Check if town is under attack
    const ptt = require("../../utility/protectTheTavern.js");
    if (ptt.lockArena) {
        return message.channel.send(
            "⚔️ The town is under attack! All civilian activities are suspended until the battle ends.",
        );
    }

    const user = message.author;
    const money = (await db.get(`money_${user.id}`)) || 0;
    
    // Owner ID for restricted purchases
    const ownerID = "367445249376649217";

    if (!args[0]) {
        // Show shop items (same as =shop default)
        const embed = new Discord.EmbedBuilder()
            .setTitle("🛍️ Weapon & Armor Shop")
            .setColor("#FFD700")
            .setDescription("Use `=buy [item]` or `=shop buy [item]` to purchase items")
            .addFields(
                {
                    name: "🗡️ Weapons",
                    value: `**Knife** - 10 kopeks (+1 Damage)\n**Sword** - 100 kopeks (1-3 Damage)\n**Pistol** - 1,000 kopeks (2-5 Damage)\n**Shotgun** - 2,500 kopeks (4-10 Damage)\n**Rifle** - 5,000 kopeks (6-12 Damage)`,
                    inline: true,
                },
                {
                    name: "🛡️ Armor",
                    value: `**Cloth** - 500 kopeks (+1 Defense)\n**Leather** - 1,000 kopeks (+2 Defense)\n**Chainmail** - 1,500 kopeks (+3 Defense)\n**Studded** - 3,000 kopeks (+5 Defense)\n**Plate** - 6,000 kopeks (+10 Defense)\n**Dragonscale** - 12,000 kopeks (+20 Defense) ${user.id === ownerID ? '' : '(Owner Only)'}`,
                    inline: true,
                },
                {
                    name: "💎 Crystals (Owner Only)",
                    value: user.id === ownerID ? 
                        `**White Crystal** - 4,000 kopeks (Special Ability)\n**Black Crystal** - 4,000 kopeks (Special Ability)\n**Red Crystal** - 4,000 kopeks (Special Ability)\n**Blue Crystal** - 4,000 kopeks (Special Ability)\n**Green Crystal** - 4,000 kopeks (Special Ability)` :
                        `*Restricted to bot owner only*`,
                    inline: true,
                },
                {
                    name: "💰 Your Balance",
                    value: `${money.toLocaleString()} kopeks`,
                    inline: false,
                },
                {
                    name: "🏰 Town Defense",
                    value: `Use \`=protect\` for walls, troops, and traps`,
                    inline: false,
                },
            );

        return message.channel.send({ embeds: [embed] });
    }

    // Handle item purchase
    const item = args[0].toLowerCase();

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
        dragonscale: { cost: 12000, name: "Dragonscale Armor", defense: 20, ownerOnly: true },
    };

    const crystals = {
        white: { cost: 4000, name: "White Crystal", ownerOnly: true },
        black: { cost: 4000, name: "Black Crystal", ownerOnly: true },
        red: { cost: 4000, name: "Red Crystal", ownerOnly: true },
        blue: { cost: 4000, name: "Blue Crystal", ownerOnly: true },
        green: { cost: 4000, name: "Green Crystal", ownerOnly: true },
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
        // Check if item is owner-only
        if (armor[item].ownerOnly && user.id !== ownerID) {
            return message.channel.send(
                `❌ ${armor[item].name} can only be purchased by the bot owner!`,
            );
        }

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
        // Check if user is owner
        if (user.id !== ownerID) {
            return message.channel.send(
                `❌ Crystals can only be purchased by the bot owner!`,
            );
        }

        if (money < crystals[item].cost) {
            return message.channel.send(
                `❌ You need ${crystals[item].cost.toLocaleString()} kopeks to buy a ${crystals[item].name}. You have ${money.toLocaleString()}.`,
            );
        }

        await db.sub(`money_${user.id}`, crystals[item].cost);
        await db.add(`crystal_${item}_${user.id}`, 1);

        message.channel.send(
            `✅ You bought a ${crystals[item].name} for ${crystals[item].cost.toLocaleString()} kopeks!`,
        );
    } else {
        message.channel.send(
            `❌ Item not found! Available items: knife, sword, pistol, shotgun, rifle, cloth, leather, chainmail, studded, plate\n\n*Note: Crystals and Dragonscale Armor are restricted items.*\n\n🏰 **For town defenses use:** \`=protect\``,
        );
    }
};

module.exports.help = {
    name: "buy",
    aliases: ["b"]
}</new_str>
