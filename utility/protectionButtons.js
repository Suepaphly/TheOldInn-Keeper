
const { QuickDB } = require("quick.db");
const db = new QuickDB();
const Discord = require("discord.js");
const ptt = require("./protectTheTavern.js");

async function handleProtectionButton(interaction) {
    const userId = interaction.user.id;
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
    } else if (customId.startsWith('buy_wall_')) {
        await handleWallPurchase(interaction);
    } else if (customId.startsWith('buy_troop_') || customId.startsWith('location_')) {
        await handleTroopPurchase(interaction);
    } else if (customId.startsWith('buy_trap_') || customId.startsWith('trap_location_')) {
        await handleTrapPurchase(interaction);
    } else if (customId === 'back_to_main') {
        await showMainInterface(interaction);
    }
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
                .setLabel('🪵 Rampart (100)')
                .setStyle(Discord.ButtonStyle.Secondary)
                .setDisabled(money < 100),
            new Discord.ButtonBuilder()
                .setCustomId('buy_wall_rampart_5')
                .setLabel('🪵 5 Ramparts (500)')
                .setStyle(Discord.ButtonStyle.Secondary)
                .setDisabled(money < 500),
            new Discord.ButtonBuilder()
                .setCustomId('buy_wall_rampart_10')
                .setLabel('🪵 10 Ramparts (1K)')
                .setStyle(Discord.ButtonStyle.Secondary)
                .setDisabled(money < 1000)
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

    await interaction.update({ embeds: [embed], components: [row1, row2, row3] });
}

async function showTroopsInterface(interaction) {
    const money = await db.get(`money_${interaction.user.id}`) || 0;

    const embed = new Discord.EmbedBuilder()
        .setTitle("⚔️ TROOP DEPLOYMENT")
        .setColor("#FF6B6B")
        .setDescription("Deploy troops to defend specific locations!\n*Note: You need 5 walls per troop slot*")
        .addFields(
            { name: "💰 Your Kopeks", value: `${money.toLocaleString()}`, inline: true },
            { name: "Troop Types", value: "🛡️ Town Guard (50)\n⚔️ Mercenary (100)\n🗡️ Soldier (200)\n🏇 Knight (500)\n👑 Royal Guard (1K)", inline: true }
        );

    const row1 = new Discord.ActionRowBuilder()
        .addComponents(
            new Discord.ButtonBuilder()
                .setCustomId('buy_troop_town_guard')
                .setLabel('🛡️ Town Guard (50)')
                .setStyle(Discord.ButtonStyle.Secondary)
                .setDisabled(money < 50),
            new Discord.ButtonBuilder()
                .setCustomId('buy_troop_mercenary')
                .setLabel('⚔️ Mercenary (100)')
                .setStyle(Discord.ButtonStyle.Secondary)
                .setDisabled(money < 100),
            new Discord.ButtonBuilder()
                .setCustomId('buy_troop_soldier')
                .setLabel('🗡️ Soldier (200)')
                .setStyle(Discord.ButtonStyle.Primary)
                .setDisabled(money < 200)
        );

    const row2 = new Discord.ActionRowBuilder()
        .addComponents(
            new Discord.ButtonBuilder()
                .setCustomId('buy_troop_knight')
                .setLabel('🏇 Knight (500)')
                .setStyle(Discord.ButtonStyle.Primary)
                .setDisabled(money < 500),
            new Discord.ButtonBuilder()
                .setCustomId('buy_troop_royal_guard')
                .setLabel('👑 Royal Guard (1K)')
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

    await interaction.update({ embeds: [embed], components: [row1, row2, row3] });
}

async function showTrapsInterface(interaction) {
    const money = await db.get(`money_${interaction.user.id}`) || 0;

    const embed = new Discord.EmbedBuilder()
        .setTitle("🕳️ TRAP DEPLOYMENT")
        .setColor("#9932CC")
        .setDescription("Set traps to damage attacking monsters!\n*Note: You need 5 walls per trap slot*")
        .addFields(
            { name: "💰 Your Kopeks", value: `${money.toLocaleString()}`, inline: true },
            { name: "Trap Types", value: "🪤 Spikes (25)\n🔥 Boiling Oil (75)\n🏹 Repeater (150)\n🎯 Ballista (300)\n💥 Cannon (750)", inline: true }
        );

    const row1 = new Discord.ActionRowBuilder()
        .addComponents(
            new Discord.ButtonBuilder()
                .setCustomId('buy_trap_spikes')
                .setLabel('🪤 Spikes (25)')
                .setStyle(Discord.ButtonStyle.Secondary)
                .setDisabled(money < 25),
            new Discord.ButtonBuilder()
                .setCustomId('buy_trap_boiling_oil')
                .setLabel('🔥 Boiling Oil (75)')
                .setStyle(Discord.ButtonStyle.Secondary)
                .setDisabled(money < 75),
            new Discord.ButtonBuilder()
                .setCustomId('buy_trap_repeater')
                .setLabel('🏹 Repeater (150)')
                .setStyle(Discord.ButtonStyle.Primary)
                .setDisabled(money < 150)
        );

    const row2 = new Discord.ActionRowBuilder()
        .addComponents(
            new Discord.ButtonBuilder()
                .setCustomId('buy_trap_ballista')
                .setLabel('🎯 Ballista (300)')
                .setStyle(Discord.ButtonStyle.Primary)
                .setDisabled(money < 300),
            new Discord.ButtonBuilder()
                .setCustomId('buy_trap_cannon')
                .setLabel('💥 Cannon (750)')
                .setStyle(Discord.ButtonStyle.Danger)
                .setDisabled(money < 750)
        );

    const row3 = new Discord.ActionRowBuilder()
        .addComponents(
            new Discord.ButtonBuilder()
                .setCustomId('back_to_main')
                .setLabel('⬅️ Back')
                .setStyle(Discord.ButtonStyle.Secondary)
        );

    await interaction.update({ embeds: [embed], components: [row1, row2, row3] });
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
        .setTitle(`📍 Choose Deployment Location`)
        .setColor("#FFD700")
        .setDescription(`Where would you like to deploy your ${item}?`)
        .addFields(
            { name: "🪵 Rampart", value: `Your slots: ${playerRampartSlots}/${maxRampartSlots}`, inline: true },
            { name: "🧱 Wall", value: `Your slots: ${playerWallSlots}/${maxWallSlots}`, inline: true },
            { name: "🏰 Castle", value: `Your slots: ${playerCastleSlots}/${maxCastleSlots}`, inline: true }
        );

    const prefix = type === 'troops' ? 'location' : 'trap_location';
    
    const row = new Discord.ActionRowBuilder()
        .addComponents(
            new Discord.ButtonBuilder()
                .setCustomId(`${prefix}_rampart_${item}`)
                .setLabel('🪵 Rampart')
                .setStyle(Discord.ButtonStyle.Secondary)
                .setDisabled(playerRampartSlots >= maxRampartSlots || maxRampartSlots === 0),
            new Discord.ButtonBuilder()
                .setCustomId(`${prefix}_wall_${item}`)
                .setLabel('🧱 Wall')
                .setStyle(Discord.ButtonStyle.Primary)
                .setDisabled(playerWallSlots >= maxWallSlots || maxWallSlots === 0),
            new Discord.ButtonBuilder()
                .setCustomId(`${prefix}_castle_${item}`)
                .setLabel('🏰 Castle')
                .setStyle(Discord.ButtonStyle.Danger)
                .setDisabled(playerCastleSlots >= maxCastleSlots || maxCastleSlots === 0)
        );

    const backRow = new Discord.ActionRowBuilder()
        .addComponents(
            new Discord.ButtonBuilder()
                .setCustomId('back_to_main')
                .setLabel('⬅️ Back')
                .setStyle(Discord.ButtonStyle.Secondary)
        );

    await interaction.update({ embeds: [embed], components: [row, backRow] });
}

async function handleWallPurchase(interaction) {
    const parts = interaction.customId.split('_');
    const wallType = parts[2];
    const amount = parseInt(parts[3]);
    
    const user = interaction.user;
    await ptt.buyWall(wallType, amount, user, { channel: { send: () => {} } });
    
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
    } else if (interaction.customId.startsWith('location_')) {
        const parts = interaction.customId.split('_');
        const location = parts[1];
        const troopType = parts[2];
        
        const mockMessage = {
            channel: {
                send: async (content) => {
                    await interaction.followUp({ content, ephemeral: true });
                }
            }
        };
        
        await ptt.buyArmy(troopType, 1, location, interaction.user, mockMessage);
        await showTroopsInterface(interaction);
    }
}

async function handleTrapPurchase(interaction) {
    if (interaction.customId.startsWith('buy_trap_')) {
        const trapType = interaction.customId.replace('buy_trap_', '');
        await showLocationSelection(interaction, 'traps', trapType);
    } else if (interaction.customId.startsWith('trap_location_')) {
        const parts = interaction.customId.split('_');
        const location = parts[2];
        const trapType = parts[3];
        
        const mockMessage = {
            channel: {
                send: async (content) => {
                    await interaction.followUp({ content, ephemeral: true });
                }
            }
        };
        
        await ptt.buyTrap(trapType, 1, location, interaction.user, mockMessage);
        await showTrapsInterface(interaction);
    }
}

async function showMainInterface(interaction) {
    const money = await db.get(`money_${interaction.user.id}`) || 0;

    const embed = new Discord.EmbedBuilder()
        .setTitle("🏰 TOWN PROTECTION CENTER")
        .setColor("#4169E1")
        .setDescription(`Welcome to the Town Protection Center, ${interaction.user.username}!\nChoose what you'd like to protect the town with.`)
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

    await interaction.update({ embeds: [embed], components: [row1, row2] });
}

async function showStatusInterface(interaction) {
    try {
        // Get current defense status
        const ramparts = await db.get("rampart") || 0;
        const walls = await db.get("wall") || 0;
        const castle = await db.get("castle") || 0;
        
        // Get troop counts
        const rampartTroops = await db.get("Troops_rampart") || {};
        const wallTroops = await db.get("Troops_wall") || {};
        const castleTroops = await db.get("Troops_castle") || {};
        
        // Get trap counts
        const rampartTraps = await db.get("Traps_rampart") || {};
        const wallTraps = await db.get("Traps_wall") || {};
        const castleTraps = await db.get("Traps_castle") || {};
        
        // Get monster counts
        const monsters = await db.get("Monsters") || {};
        
        const embed = new Discord.EmbedBuilder()
            .setTitle("📊 TOWN DEFENSE STATUS")
            .setColor("#4169E1")
            .addFields(
                { 
                    name: "🏗️ Fortifications", 
                    value: `🪵 Ramparts: ${ramparts}\n🧱 Walls: ${walls}\n🏰 Castle: ${castle}`, 
                    inline: true 
                },
                { 
                    name: "⚔️ Total Troops", 
                    value: `🪵 Rampart: ${(rampartTroops.total || 0)}\n🧱 Wall: ${(wallTroops.total || 0)}\n🏰 Castle: ${(castleTroops.total || 0)}`, 
                    inline: true 
                },
                { 
                    name: "🕳️ Total Traps", 
                    value: `🪵 Rampart: ${(rampartTraps.total || 0)}\n🧱 Wall: ${(wallTraps.total || 0)}\n🏰 Castle: ${(castleTraps.total || 0)}`, 
                    inline: true 
                },
                { 
                    name: "👹 Monster Army", 
                    value: `🟢 Goblins: ${monsters.goblin || 0}\n🔵 Mephits: ${monsters.mephit || 0}\n🟡 Broodlings: ${monsters.broodling || 0}\n🟠 Ogres: ${monsters.ogre || 0}\n🔴 Automatons: ${monsters.automaton || 0}`, 
                    inline: true 
                }
            );

        const row = new Discord.ActionRowBuilder()
            .addComponents(
                new Discord.ButtonBuilder()
                    .setCustomId('back_to_main')
                    .setLabel('⬅️ Back to Main')
                    .setStyle(Discord.ButtonStyle.Secondary)
            );

        await interaction.update({ embeds: [embed], components: [row] });
    } catch (error) {
        console.error("Error in showStatusInterface:", error);
        await showMainInterface(interaction);
    }
}

async function showHelpInterface(interaction) {
    const embed = new Discord.EmbedBuilder()
        .setTitle("❓ PROTECTION HELP")
        .setColor("#17a2b8")
        .setDescription("Learn how to protect your town effectively!")
        .addFields(
            { name: "🏗️ Building Walls", value: "• Build ramparts first (cheapest)\n• Walls require 10 ramparts per wall\n• Castle requires 10 walls per castle\n• More walls = more troop/trap slots", inline: false },
            { name: "⚔️ Deploying Troops", value: "• Every 5 walls = 1 troop slot per player\n• Troops fight back against monsters\n• Higher tier troops deal more damage\n• Troops are dismissed when walls fall", inline: false },
            { name: "🕳️ Setting Traps", value: "• Every 5 walls = 1 trap slot per player\n• Traps activate when walls are breached\n• Higher tier traps deal more damage\n• Traps fire automatically during battle", inline: false },
            { name: "💡 Strategy Tips", value: "• Balance walls, troops, and traps\n• Stronger defenses protect weaker ones\n• Coordinate with other players\n• Check =showmap for current status", inline: false }
        );

    const row = new Discord.ActionRowBuilder()
        .addComponents(
            new Discord.ButtonBuilder()
                .setCustomId('back_to_main')
                .setLabel('⬅️ Back to Main')
                .setStyle(Discord.ButtonStyle.Secondary)
        );

    await interaction.update({ embeds: [embed], components: [row] });
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

module.exports = {
    handleProtectionButton
};
