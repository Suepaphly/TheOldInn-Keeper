
const Discord = require("discord.js");
const { QuickDB } = require("quick.db");
const db = new QuickDB();

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
        return message.channel.send("❌ You must mention a user or provide a user ID! Usage: `=resetskills @user` or `=resetskills <userID>`");
    }

    try {
        // Reset all skill levels to 0
        const skills = {
            rob: 'thieflevel',
            gather: 'gatheringlevel',
            fish: 'fishinglevel',
            hunt: 'huntinglevel',
            craft: 'craftinglevel',
            work: 'workinglevel',
            combat: 'combatlevel'
        };

        // Reset all feats
        const feats = {
            akimbo: 'feat_akimbo',
            healer: 'feat_healer',
            tactician: 'feat_tactician',
            mechanist: 'feat_mechanist',
            ninja: 'feat_ninja',
            investigator: 'feat_investigator'
        };

        // Reset skills
        for (const [skillName, dbKey] of Object.entries(skills)) {
            await db.set(`${dbKey}_${target.id}`, 0);
        }

        // Reset feats
        for (const [featName, dbKey] of Object.entries(feats)) {
            await db.delete(`${dbKey}_${target.id}`);
        }

        const embed = new Discord.EmbedBuilder()
            .setTitle("🔄 Skills & Feats Reset")
            .setColor("#FF6600")
            .setDescription(`All skills and feats have been reset for ${target.username}.`)
            .addFields(
                { 
                    name: "Skills Reset", 
                    value: "• Robbery\n• Gathering\n• Fishing\n• Hunting\n• Crafting\n• Working\n• Combat", 
                    inline: true 
                },
                { 
                    name: "Feats Removed", 
                    value: "• Guns Akimbo\n• Healer\n• Tactician\n• Mechanist\n• Ninja\n• Investigator", 
                    inline: true 
                },
                { 
                    name: "Reset By", 
                    value: message.author.username, 
                    inline: false 
                }
            );

        message.channel.send({ embeds: [embed] });

        // Try to notify the user if possible
        try {
            const dmEmbed = new Discord.EmbedBuilder()
                .setTitle("🔄 Skills & Feats Reset")
                .setColor("#FF6600")
                .setDescription("Your skills and feats have been reset by the bot administrator. You can re-level and purchase feats again using `=lvl`.");
            
            await target.send({ embeds: [dmEmbed] });
        } catch (err) {
            // User has DMs disabled or bot can't DM them
            console.log(`Could not DM ${target.username} about skills reset`);
        }

    } catch (error) {
        console.error("Error resetting skills and feats:", error);
        message.channel.send("❌ An error occurred while trying to reset skills and feats.");
    }
};

module.exports.help = {
    name: "resetskills",
    aliases: ["resetskill", "skillreset", "featreset"]
};
