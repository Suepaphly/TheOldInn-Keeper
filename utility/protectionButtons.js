
const Discord = require("discord.js");
const { QuickDB } = require("quick.db");
const db = new QuickDB();
const ptt = require("./protectTheTavern.js");

async function handleProtectionButton(interaction) {
    try {
        // Always defer the interaction first
        if (!interaction.deferred && !interaction.replied) {
            await interaction.deferUpdate();
        }

        const customId = interaction.customId;
        
        if (customId === 'protect_walls') {
            await showWallsInterface(interaction);
        } else if (customId === 'protect_troops') {
            await showTroopsInterface(interaction);
        } else if (customId === 'protect_traps') {
            await showTrapsInterface(interaction);
        } else if (customId === 'protect_status') {
            await showStatusInterface(interaction);
        } else if (customId === 'protect_help') {
            await showHelpInterface(interaction);
        } else if (customId === 'back_to_main') {
            await showMainInterface(interaction);
        } else if (customId.startsWith('buy_wall_')) {
            await handleWallPurchase(interaction);
        } else if (customId.startsWith('buy_troop_')) {
            await handleTroopPurchase(interaction);
        } else if (customId.startsWith('buy_trap_')) {
            await handleTrapPurchase(interaction);
        } else if (customId.startsWith('location_')) {
            await handleLocationPurchase(interaction);
        }
    } catch (error) {
        console.error('Error handling protection button:', error);
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ content: "❌ An error occurred while processing your request.", ephemeral: true });
        } else {
            await interaction.editReply({ content: "❌ An error occurred while processing your request." });
        }
    }
}

async function showMainInterface(interaction) {
    const user = interaction.user;
    const money = await db.get(`money_${user.id}`) || 0;

    const embed = new Discord.EmbedBuilder()
        .setTitle("🏰 TOWN PROTECTION CENTER")
        .setColor("#4169E1")
        .setDescription(`Welcome to the Town Protection Center, ${user.username}!\nChoose what you'd like to protect the town with.`)
        .addFields(
            { name: "💰 Your Kopeks", value: `${money.toLocaleString()}`, inline: true },
            { name: "🏰 Current Status", value: await getDefenseStatus(), inline: true }
        )
        .setFooter({ text: "Choose a category to get started!" });

    const row1 = new Discord.ActionRowBuilder()
        .addComponents(
            new Discord.ButtonBuilder()
                .setCustomId('protect_walls')
                .setLabel('🏗️ Build Walls')
                .setStyle(Discord.ButtonStyle.Primary),
            new Discord.ButtonBuilder()
                .setCustomId('protect_troops')
                .setLabel('⚔️ Deploy Troops')
                .setStyle(Discord.ButtonStyle.Success),
            new Discord.ButtonBuilder()
                .setCustomId('protect_traps')
                .setLabel('🕳️ Set Traps')
                .setStyle(Discord.ButtonStyle.Danger)
        );

    const row2 = new Discord.ActionRowBuilder()
        .addComponents(
            new Discord.ButtonBuilder()
                .setCustomId('protect_status')
                .setLabel('📊 View Status')
                .setStyle(Discord.ButtonStyle.Secondary),
            new Discord.ButtonBuilder()
                .setCustomId('protect_help')
                .setLabel('❓ Help')
                .setStyle(Discord.ButtonStyle.Secondary)
        );

    await interaction.editReply({ embeds: [embed], components: [row1, row2] });
}

async function showWallsInterface(interaction) {
    const money = await db.get(`money_${interaction.user.id}`) || 0;
    const ramparts = await db.get("rampart") || 0;
    const walls = await db.get("wall") || 0;
    const castle = await db.get("castle") || 0;

    const embed = new Discord.EmbedBuilder()
        .setTitle("🏗️ WALL CONSTRUCTION")
        .setColor("#8B4513")
        .setDescription("Build walls to strengthen your town's defenses!")
        .addFields(
            { name: "💰 Your Kopeks", value: `${money.toLocaleString()}`, inline: true },
            { name: "Current Defenses", value: `🪵 Ramparts: ${ramparts}\n🧱 Walls: ${walls}\n🏰 Castle: ${castle}`, inline: true }
        );

    const row1 = new Discord.ActionRowBuilder()
        .addComponents(
            new Discord.ButtonBuilder()
                .setCustomId('buy_wall_rampart_1')
                .setLabel('🪵 Rampart (50)')
                .setStyle(Discord.ButtonStyle.Secondary)
                .setDisabled(money < 50),
            new Discord.ButtonBuilder()
                .setCustomId('buy_wall_rampart_5')
                .setLabel('🪵 5 Ramparts (250)')
                .setStyle(Discord.ButtonStyle.Secondary)
                .setDisabled(money < 250),
            new Discord.ButtonBuilder()
                .setCustomId('buy_wall_rampart_10')
                .setLabel('🪵 10 Ramparts (500)')
                .setStyle(Discord.ButtonStyle.Secondary)
                .setDisabled(money < 500)
        );

    const row2 = new Discord.ActionRowBuilder()
        .addComponents(
            new Discord.ButtonBuilder()
                .setCustomId('buy_wall_wall_1')
                .setLabel('🧱 Wall (500)')
                .setStyle(Discord.ButtonStyle.Primary)
                .setDisabled(money < 500 || ramparts < 10),
            new Discord.ButtonBuilder()
                .setCustomId('buy_wall_wall_5')
                .setLabel('🧱 5 Walls (2.5K)')
                .setStyle(Discord.ButtonStyle.Primary)
                .setDisabled(money < 2500 || ramparts < 50),
            new Discord.ButtonBuilder()
                .setCustomId('buy_wall_castle_1')
                .setLabel('🏰 Castle (5K)')
                .setStyle(Discord.ButtonStyle.Danger)
                .setDisabled(money < 5000 || walls < 10)
        );

    const row3 = new Discord.ActionRowBuilder()
        .addComponents(
            new Discord.ButtonBuilder()
                .setCustomId('back_to_main')
                .setLabel('⬅️ Back')
                .setStyle(Discord.ButtonStyle.Secondary)
        );

    await interaction.editReply({ embeds: [embed], components: [row1, row2, row3] });
}

async function showTroopsInterface(interaction) {
    const money = await db.get(`money_${interaction.user.id}`) || 0;

    const embed = new Discord.EmbedBuilder()
        .setTitle("⚔️ TROOP DEPLOYMENT")
        .setColor("#228B22")
        .setDescription("Deploy troops to defend the town!")
        .addFields(
            { name: "💰 Your Kopeks", value: `${money.toLocaleString()}`, inline: true },
            { name: "Info", value: "Select a troop type, then choose location", inline: true }
        );

    const row1 = new Discord.ActionRowBuilder()
        .addComponents(
            new Discord.ButtonBuilder()
                .setCustomId('buy_troop_town_guard')
                .setLabel('👮 Town Guard (10)')
                .setStyle(Discord.ButtonStyle.Secondary)
                .setDisabled(money < 10),
            new Discord.ButtonBuilder()
                .setCustomId('buy_troop_mercenary')
                .setLabel('⚔️ Mercenary (20)')
                .setStyle(Discord.ButtonStyle.Secondary)
                .setDisabled(money < 20),
            new Discord.ButtonBuilder()
                .setCustomId('buy_troop_soldier')
                .setLabel('🛡️ Soldier (30)')
                .setStyle(Discord.ButtonStyle.Secondary)
                .setDisabled(money < 30)
        );

    const row2 = new Discord.ActionRowBuilder()
        .addComponents(
            new Discord.ButtonBuilder()
                .setCustomId('buy_troop_knight')
                .setLabel('🏇 Knight (50)')
                .setStyle(Discord.ButtonStyle.Primary)
                .setDisabled(money < 50),
            new Discord.ButtonBuilder()
                .setCustomId('buy_troop_royal_guard')
                .setLabel('👑 Royal Guard (100)')
                .setStyle(Discord.ButtonStyle.Danger)
                .setDisabled(money < 100)
        );

    const row3 = new Discord.ActionRowBuilder()
        .addComponents(
            new Discord.ButtonBuilder()
                .setCustomId('back_to_main')
                .setLabel('⬅️ Back')
                .setStyle(Discord.ButtonStyle.Secondary)
        );

    await interaction.editReply({ embeds: [embed], components: [row1, row2, row3] });
}

async function showTrapsInterface(interaction) {
    const money = await db.get(`money_${interaction.user.id}`) || 0;

    const embed = new Discord.EmbedBuilder()
        .setTitle("🕳️ TRAP DEPLOYMENT")
        .setColor("#8B0000")
        .setDescription("Set traps to damage attackers!")
        .addFields(
            { name: "💰 Your Kopeks", value: `${money.toLocaleString()}`, inline: true },
            { name: "Info", value: "Select a trap type, then choose location", inline: true }
        );

    const row1 = new Discord.ActionRowBuilder()
        .addComponents(
            new Discord.ButtonBuilder()
                .setCustomId('buy_trap_spikes')
                .setLabel('🗡️ Spikes (100)')
                .setStyle(Discord.ButtonStyle.Secondary)
                .setDisabled(money < 100),
            new Discord.ButtonBuilder()
                .setCustomId('buy_trap_boiling_oil')
                .setLabel('🔥 Boiling Oil (200)')
                .setStyle(Discord.ButtonStyle.Secondary)
                .setDisabled(money < 200),
            new Discord.ButtonBuilder()
                .setCustomId('buy_trap_repeater')
                .setLabel('🏹 Repeater (300)')
                .setStyle(Discord.ButtonStyle.Primary)
                .setDisabled(money < 300)
        );

    const row2 = new Discord.ActionRowBuilder()
        .addComponents(
            new Discord.ButtonBuilder()
                .setCustomId('buy_trap_ballista')
                .setLabel('🎯 Ballista (500)')
                .setStyle(Discord.ButtonStyle.Primary)
                .setDisabled(money < 500),
            new Discord.ButtonBuilder()
                .setCustomId('buy_trap_cannon')
                .setLabel('💥 Cannon (1000)')
                .setStyle(Discord.ButtonStyle.Danger)
                .setDisabled(money < 1000)
        );

    const row3 = new Discord.ActionRowBuilder()
        .addComponents(
            new Discord.ButtonBuilder()
                .setCustomId('back_to_main')
                .setLabel('⬅️ Back')
                .setStyle(Discord.ButtonStyle.Secondary)
        );

    await interaction.editReply({ embeds: [embed], components: [row1, row2, row3] });
}

async function showLocationSelection(interaction, type, item) {
    const ramparts = await db.get("rampart") || 0;
    const walls = await db.get("wall") || 0;
    const castle = await db.get("castle") || 0;
    
    const playerRampartSlots = await db.get(`player_${type}_${interaction.user.id}_rampart`) || 0;
    const playerWallSlots = await db.get(`player_${type}_${interaction.user.id}_wall`) || 0;
    const playerCastleSlots = await db.get(`player_${type}_${interaction.user.id}_castle`) || 0;

    const maxRampartSlots = Math.floor(ramparts / 5);
    const maxWallSlots = Math.floor(walls / 5);
    const maxCastleSlots = Math.floor(castle / 5);

    const embed = new Discord.EmbedBuilder()
        .setTitle(`📍 SELECT LOCATION FOR ${item.toUpperCase()}`)
        .setColor("#9932CC")
        .setDescription("Choose where to deploy your purchase:")
        .addFields(
            { name: "🪵 Rampart", value: `${playerRampartSlots}/${maxRampartSlots} slots used`, inline: true },
            { name: "🧱 Wall", value: `${playerWallSlots}/${maxWallSlots} slots used`, inline: true },
            { name: "🏰 Castle", value: `${playerCastleSlots}/${maxCastleSlots} slots used`, inline: true }
        );

    const row = new Discord.ActionRowBuilder()
        .addComponents(
            new Discord.ButtonBuilder()
                .setCustomId(`location_rampart_${item}`)
                .setLabel('🪵 Rampart')
                .setStyle(Discord.ButtonStyle.Secondary)
                .setDisabled(playerRampartSlots >= maxRampartSlots || ramparts === 0),
            new Discord.ButtonBuilder()
                .setCustomId(`location_wall_${item}`)
                .setLabel('🧱 Wall')
                .setStyle(Discord.ButtonStyle.Primary)
                .setDisabled(playerWallSlots >= maxWallSlots || walls === 0),
            new Discord.ButtonBuilder()
                .setCustomId(`location_castle_${item}`)
                .setLabel('🏰 Castle')
                .setStyle(Discord.ButtonStyle.Danger)
                .setDisabled(playerCastleSlots >= maxCastleSlots || castle === 0)
        );

    const backRow = new Discord.ActionRowBuilder()
        .addComponents(
            new Discord.ButtonBuilder()
                .setCustomId('back_to_main')
                .setLabel('⬅️ Back to Main')
                .setStyle(Discord.ButtonStyle.Secondary)
        );

    await interaction.editReply({ embeds: [embed], components: [row, backRow] });
}

async function handleWallPurchase(interaction) {
    const parts = interaction.customId.split('_');
    const wallType = parts[2];
    const amount = parseInt(parts[3]);
    
    const user = interaction.user;
    
    // Create a mock message object for the buyWall function
    const mockMessage = {
        channel: {
            send: async (content) => {
                await interaction.followUp({ content, ephemeral: true });
            }
        }
    };
    
    await ptt.buyWall(wallType, amount, user, mockMessage);
    await showWallsInterface(interaction);
}

async function handleTroopPurchase(interaction) {
    if (interaction.customId.startsWith('buy_troop_')) {
        const troopType = interaction.customId.replace('buy_troop_', '');
        await showLocationSelection(interaction, 'troops', troopType);
    }
}

async function handleTrapPurchase(interaction) {
    if (interaction.customId.startsWith('buy_trap_')) {
        const trapType = interaction.customId.replace('buy_trap_', '');
        await showLocationSelection(interaction, 'traps', trapType);
    }
}

async function handleLocationPurchase(interaction) {
    const parts = interaction.customId.split('_');
    const location = parts[1];
    const item = parts[2];
    
    const user = interaction.user;
    
    // Create a mock message object
    const mockMessage = {
        channel: {
            send: async (content) => {
                await interaction.followUp({ content, ephemeral: true });
            }
        }
    };
    
    // Determine if it's a troop or trap and call appropriate function
    if (ptt.troopArray.includes(item)) {
        await ptt.buyArmy(item, 1, location, user, mockMessage);
        await showTroopsInterface(interaction);
    } else if (ptt.trapArray.includes(item)) {
        await ptt.buyTrap(item, 1, location, user, mockMessage);
        await showTrapsInterface(interaction);
    }
}

async function showStatusInterface(interaction) {
    const ramparts = await db.get("rampart") || 0;
    const walls = await db.get("wall") || 0;
    const castle = await db.get("castle") || 0;
    
    const embed = new Discord.EmbedBuilder()
        .setTitle("📊 TOWN DEFENSE STATUS")
        .setColor("#4169E1")
        .setDescription("Current state of town defenses:")
        .addFields(
            { name: "🪵 Ramparts", value: `${ramparts}`, inline: true },
            { name: "🧱 Walls", value: `${walls}`, inline: true },
            { name: "🏰 Castle", value: `${castle}`, inline: true }
        );

    const row = new Discord.ActionRowBuilder()
        .addComponents(
            new Discord.ButtonBuilder()
                .setCustomId('back_to_main')
                .setLabel('⬅️ Back')
                .setStyle(Discord.ButtonStyle.Secondary)
        );

    await interaction.editReply({ embeds: [embed], components: [row] });
}

async function showHelpInterface(interaction) {
    const embed = new Discord.EmbedBuilder()
        .setTitle("❓ PROTECTION HELP")
        .setColor("#FFD700")
        .setDescription("How the town protection system works:")
        .addFields(
            { name: "🏗️ Walls", value: "Build ramparts first, then walls, then castle. Each provides defense points.", inline: false },
            { name: "⚔️ Troops", value: "Deploy troops to fight monsters. Requires 5 walls per troop slot per player.", inline: false },
            { name: "🕳️ Traps", value: "Set traps to damage attackers. Requires 5 walls per trap slot per player.", inline: false },
            { name: "💡 Strategy", value: "Build walls first to create slots, then fill with troops and traps!", inline: false }
        );

    const row = new Discord.ActionRowBuilder()
        .addComponents(
            new Discord.ButtonBuilder()
                .setCustomId('back_to_main')
                .setLabel('⬅️ Back')
                .setStyle(Discord.ButtonStyle.Secondary)
        );

    await interaction.editReply({ embeds: [embed], components: [row] });
}

async function getDefenseStatus() {
    const ramparts = await db.get("rampart") || 0;
    const walls = await db.get("wall") || 0;
    const castle = await db.get("castle") || 0;
    
    if (castle > 0) return "🏰 Castle Strong";
    if (walls > 0) return "🧱 Walls Standing";
    if (ramparts > 0) return "🪵 Ramparts Up";
    return "💀 Defenseless";
}

module.exports = { handleProtectionButton };
