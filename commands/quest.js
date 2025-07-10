const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { QuickDB } = require("quick.db");
const db = new QuickDB();

// Active quests storage
const activeQuests = new Map();

// Location data
const locations = {
    plains: {
        name: "🌾 Wide Open Plains",
        description: "Rolling grasslands stretch to the horizon",
        second: "🏰 Ruined Castle",
        secondDescription: "Ancient stones crumble in forgotten halls"
    },
    forest: {
        name: "🌲 Dark Forest",
        description: "Twisted trees whisper ancient secrets",
        second: "🕳️ Underground Caves",
        secondDescription: "Deep tunnels echo with mysterious sounds"
    }
};

// Quest types and their monster values
const questTypes = {
    monster: {
        name: "⚔️ Ambush",
        description: "Fight off an ambush of monsters"
    },
    riddle: {
        name: "🧩 Ancient Riddle",
        description: "Solve mysterious riddles"
    },
    maze: {
        name: "🌿 Hedge Maze",
        description: "Navigate through a dangerous maze"
    },
    trolley: {
        name: "🚃 Moral Dilemma",
        description: "Face an impossible choice"
    }
};

const riddles = [
    {
        question: "I have cities, but no houses. I have mountains, but no trees. I have water, but no fish. What am I?",
        options: ["A painting", "A map", "A dream"],
        correct: 1
    },
    {
        question: "The more you take, the more you leave behind. What am I?",
        options: ["Footsteps", "Memories", "Time"],
        correct: 0
    },
    {
        question: "I am not alive, but I grow. I don't have lungs, but I need air. What am I?",
        options: ["A plant", "Fire", "A balloon"],
        correct: 1
    },
    {
        question: "What has keys but no locks, space but no room, and you can enter but not go inside?",
        options: ["A piano", "A keyboard", "A house"],
        correct: 1
    },
    {
        question: "I am tall when I am young, and short when I am old. What am I?",
        options: ["A tree", "A candle", "A person"],
        correct: 1
    },
    {
        question: "What gets wetter the more it dries?",
        options: ["A sponge", "A towel", "Rain"],
        correct: 1
    },
    {
        question: "I have a head and a tail, but no body. What am I?",
        options: ["A snake", "A coin", "A comet"],
        correct: 1
    },
    {
        question: "What can travel around the world while staying in a corner?",
        options: ["A stamp", "A spider", "Light"],
        correct: 0
    },
    {
        question: "I am always hungry and will die if not fed, but whatever I touch will soon turn red. What am I?",
        options: ["A vampire", "Fire", "Rust"],
        correct: 1
    },
    {
        question: "What has many teeth but cannot bite?",
        options: ["A shark", "A comb", "A saw"],
        correct: 1
    },
    {
        question: "I am light as a feather, yet the strongest person cannot hold me for much longer than a minute. What am I?",
        options: ["Air", "Your breath", "A thought"],
        correct: 1
    },
    {
        question: "What breaks but never falls, and what falls but never breaks?",
        options: ["Dawn and night", "Glass and rain", "Silence and tears"],
        correct: 0
    },
    {
        question: "I have no beginning, end, or middle. What am I?",
        options: ["A circle", "Time", "Space"],
        correct: 0
    },
    {
        question: "What comes once in a minute, twice in a moment, but never in a thousand years?",
        options: ["The letter M", "Lightning", "A heartbeat"],
        correct: 0
    },
    {
        question: "I am taken from a mine and shut up in a wooden case, from which I am never released, yet I am used by almost everyone. What am I?",
        options: ["Coal", "A pencil lead", "A diamond"],
        correct: 1
    },
    {
        question: "What has one eye but cannot see?",
        options: ["A cyclops", "A needle", "A potato"],
        correct: 1
    },
    {
        question: "What goes up but never comes down?",
        options: ["A balloon", "Your age", "Smoke"],
        correct: 1
    },
    {
        question: "I am always in front of you but can't be seen. What am I?",
        options: ["Air", "The future", "Your nose"],
        correct: 1
    },
    {
        question: "What has a thumb and four fingers but is not alive?",
        options: ["A statue", "A glove", "A robot"],
        correct: 1
    },
    {
        question: "I can be cracked, made, told, and played. What am I?",
        options: ["A joke", "An egg", "Music"],
        correct: 0
    },
    {
        question: "What runs around the yard without moving?",
        options: ["A dog", "A fence", "The wind"],
        correct: 1
    },
    {
        question: "I have branches but no fruit, trunk, or leaves. What am I?",
        options: ["A tree in winter", "A bank", "A river"],
        correct: 1
    },
    {
        question: "What disappears as soon as you say its name?",
        options: ["A secret", "Silence", "Magic"],
        correct: 1
    }
];

const trolleyScenarios = [
    { many: "5 grandmothers", one: "1 judge" },
    { many: "5 old men", one: "1 baby" },
    { many: "3 doctors", one: "1 criminal" },
    { many: "4 teachers", one: "1 student" },
    { many: "5 strangers", one: "1 friend" },
    { many: "3 children", one: "1 elderly person" },
    { many: "4 workers", one: "1 CEO" },
    { many: "5 tourists", one: "1 local" },
    { many: "2 philosophers", one: "1 scientist" },
    { many: "6 prisoners", one: "1 guard" },
    { many: "3 musicians", one: "1 deaf person" },
    { many: "4 athletes", one: "1 disabled person" },
    { many: "5 rich people", one: "1 poor person" },
    { many: "2 engineers", one: "1 artist" },
    { many: "4 soldiers", one: "1 pacifist" },
    { many: "3 lawyers", one: "1 honest person" },
    { many: "5 adults", one: "1 teenager" },
    { many: "2 twins", one: "1 only child" },
    { many: "4 doctors", one: "1 patient" },
    { many: "3 firefighters", one: "1 arsonist" },
    { many: "5 teachers", one: "1 dropout" },
    { many: "2 parents", one: "1 orphan" },
    { many: "6 voters", one: "1 politician" },
    { many: "3 police officers", one: "1 criminal" },
    { many: "4 chefs", one: "1 food critic" },
    { many: "5 workers", one: "1 robot" },
    { many: "2 identical twins", one: "1 triplet" },
    { many: "3 honest people", one: "1 liar" },
    { many: "6 strangers", one: "1 family member" },
    { many: "4 healthy people", one: "1 sick person" },
    { many: "3 students", one: "1 professor" },
    { many: "5 employees", one: "1 boss" },
    { many: "2 competitors", one: "1 teammate" },
    { many: "4 villains", one: "1 hero" },
    { many: "3 pessimists", one: "1 optimist" },
    { many: "5 humans", one: "1 alien" },
    { many: "2 enemies", one: "1 ally" },
    { many: "4 conservatives", one: "1 liberal" }
];

module.exports.run = async (client, message, args) => {
    const userId = message.author.id;

    // Check for debug mode (owner only)
    if (args[0] === 'debug' && userId === '217069557263286273') { // Replace with actual owner ID
        if (!args[1]) {
            const debugEmbed = new EmbedBuilder()
                .setTitle("🔧 QUEST DEBUG COMMANDS")
                .setColor("#FFA500")
                .setDescription("**Owner-only debug commands for testing individual quest types**\n\n**Available Quest Names:**\n• `monster` - Combat quest with 2 monsters\n• `riddle` - Ancient riddle solving quest\n• `maze` - Hedge maze navigation quest\n• `trolley` - Moral dilemma trolley problem")
                .addFields(
                    { name: "Usage", value: "`=quest debug <questname>`", inline: false },
                    { name: "Quest Details", value: "🗡️ **monster** - Fight Goblin Scout → Orc Raider\n🧩 **riddle** - Solve 2 random riddles (death on failure)\n🌿 **maze** - Navigate 2-stage maze with traps/combat\n🚃 **trolley** - Face moral choices with vengeance risk", inline: false },
                    { name: "Debug Features", value: "• Complete after 1 quest instead of 2\n• 30-minute timeout still applies\n• No real rewards given", inline: false }
                );

            return message.channel.send({ embeds: [debugEmbed] });
        }

        const questType = args[1].toLowerCase();
        if (!questTypes[questType]) {
            return message.channel.send("❌ Invalid quest type! Available: monster, riddle, maze, trolley");
        }

        // Start debug quest immediately
        await startDebugQuest(message, userId, questType);
        return;
    }

    // Check if user is already on a quest
    if (activeQuests.has(userId)) {
        return message.channel.send("❌ You are already on a quest! Complete it first before starting another.");
    }

    // Check if user is dead
    const deathTimer = await db.get(`death_cooldown_${userId}`);
    if (deathTimer && Date.now() - deathTimer < 86400000) { // 24 hours
        return message.channel.send("💀 You cannot go on quests while dead! Use `=revive` first.");
    }

    // Create location selection embed
    const embed = new EmbedBuilder()
        .setTitle("🗺️ CHOOSE YOUR DESTINATION")
        .setColor("#FFD700")
        .setDescription("Select a location to explore. You must complete **TWO quests** to earn the 250 kopek reward!\n\n⚠️ Once started, you cannot engage in combat, gambling, or economic activities until completed!")
        .addFields(
            { name: locations.plains.name, value: `${locations.plains.description}\n*Leads to: ${locations.plains.second}*`, inline: false },
            { name: locations.forest.name, value: `${locations.forest.description}\n*Leads to: ${locations.forest.second}*`, inline: false }
        )
        .setFooter({ text: "⏰ You have 30 minutes to complete once started!" });

    // Create buttons
    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('location_plains')
                .setLabel('🌾 Wide Open Plains')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('location_forest')
                .setLabel('🌲 Dark Forest')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId('quest_cancel')
                .setLabel('❌ Cancel')
                .setStyle(ButtonStyle.Secondary)
        );

    const questMessage = await message.channel.send({ 
        embeds: [embed], 
        components: [row] 
    });

    // Set up collector
    const filter = (interaction) => {
        return interaction.user.id === message.author.id;
    };

    const collector = questMessage.createMessageComponentCollector({
        filter,
        time: 60000 // 1 minute to choose
    });

    collector.on('collect', async (interaction) => {
        if (interaction.customId === 'quest_cancel') {
            await interaction.update({
                embeds: [new EmbedBuilder()
                    .setTitle("❌ Quest Cancelled")
                    .setColor("#FF0000")
                    .setDescription("You decided not to embark on a quest today.")],
                components: []
            });
            collector.stop();
            return;
        }

        // Start the selected location
        const location = interaction.customId.replace('location_', '');
        await startLocationQuest(interaction, location, userId);
        collector.stop();
    });

    collector.on('end', (collected, reason) => {
        if (reason === 'time' && !collected.size) {
            questMessage.edit({
                embeds: [new EmbedBuilder()
                    .setTitle("⏰ Quest Selection Timeout")
                    .setColor("#FF0000")
                    .setDescription("You took too long to choose a location.")],
                components: []
            });
        }
    });
};

async function startLocationQuest(interaction, location, userId) {
    // Mark user as on quest
    const questData = {
        location: location,
        startTime: Date.now(),
        questsCompleted: 0,
        totalMonsterValue: 0,
        currentQuest: null
    };

    activeQuests.set(userId, questData);
    await db.set(`on_quest_${userId}`, true);

    // Set 30 minute timeout
    setTimeout(async () => {
        if (activeQuests.has(userId)) {
            activeQuests.delete(userId);
            await db.delete(`on_quest_${userId}`);

            const timeoutEmbed = new EmbedBuilder()
                .setTitle("⏰ Quest Timeout")
                .setColor("#FF0000")
                .setDescription("Your quest has timed out after 30 minutes. You can start a new quest when ready.");

            try {
                await interaction.followUp({ embeds: [timeoutEmbed] });
            } catch (err) {
                console.log("Failed to send timeout message:", err);
            }
        }
    }, 1800000); // 30 minutes

    // Randomly select first quest type
    const questTypeNames = Object.keys(questTypes);
    const randomQuest = questTypeNames[Math.floor(Math.random() * questTypeNames.length)];

    const locationData = locations[location];
    const embed = new EmbedBuilder()
        .setTitle(`${locationData.name} - Quest 1/2`)
        .setColor("#4169E1")
        .setDescription(`You arrive at the ${locationData.name.toLowerCase()}. ${locationData.description}.\n\nA ${questTypes[randomQuest].name} awaits you!`)
        .addFields(
            { name: "Progress", value: "0/2 quests completed", inline: false }
        );

    try {
        await interaction.update({ embeds: [embed], components: [] });
    } catch (error) {
        if (error.code === 10062) {
            // Interaction expired, send a new message instead
            await interaction.followUp({ embeds: [embed], components: [] });
        } else {
            console.error('Error updating interaction:', error);
            throw error;
        }
    }

    // Add a continue button for better pacing
    setTimeout(() => {
        const continueEmbed = new EmbedBuilder()
            .setTitle(`${locationData.name} - Ready to Begin`)
            .setColor("#4169E1")
            .setDescription(`You steel yourself for what lies ahead. A ${questTypes[randomQuest].name} awaits!`)
            .addFields(
                { name: "Progress", value: "0/2 quests completed", inline: false },
                { name: "Quest Type", value: questTypes[randomQuest].description, inline: false }
            );

        const continueRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('quest_start_first')
                    .setLabel('⚔️ Begin Quest')
                    .setStyle(ButtonStyle.Primary)
            );

        interaction.editReply({ embeds: [continueEmbed], components: [continueRow] }).catch(() => {
            interaction.followUp({ embeds: [continueEmbed], components: [continueRow] });
        });

        // Set up collector for start button
        const filter = (i) => i.user.id === userId;
        const startCollector = interaction.message.createMessageComponentCollector({ filter, time: 1800000 });

        startCollector.on('collect', async (i) => {
            if (i.customId === 'quest_start_first') {
                questData.currentQuest = randomQuest;

                switch (randomQuest) {
                    case 'monster':
                        await startMonsterQuest(i, userId);
                        break;
                    case 'riddle':
                        await startRiddleQuest(i, userId);
                        break;
                    case 'maze':
                        await startMazeQuest(i, userId);
                        break;
                    case 'trolley':
                        await startTrolleyQuest(i, userId);
                        break;
                }
                startCollector.stop();
            }
        });
    }, 2000);
}

async function startMonsterQuest(interaction, userId) {
    const quest = activeQuests.get(userId);
    const combatLevel = await db.get(`combatlevel_${userId}`) || 0;

    quest.data = {
        round: 1,
        playerHealth: 5 + (combatLevel * 2),
        playerMaxHealth: 5 + (combatLevel * 2),
        playerWeapon: await getBestWeapon(userId),
        playerArmor: await getBestArmor(userId),
        combatLevel: combatLevel,
        monsters: ["Goblin Scout", "Orc Raider"],
        currentMonsterHealth: 0,
        currentMonsterMaxHealth: 0
    };

    // Initialize first monster
    const currentMonster = quest.data.monsters[quest.data.round - 1];
    const monsterStats = getMonsterStats(currentMonster, combatLevel);
    quest.data.currentMonsterHealth = monsterStats.health;
    quest.data.currentMonsterMaxHealth = monsterStats.health;

    const embed = new EmbedBuilder()
        .setTitle(`⚔️ AMBUSH - ${currentMonster} (${quest.data.round}/2)`)
        .setColor("#FF0000")
        .setDescription(`You are ambushed by a **${currentMonster}**!`)
        .addFields(
            { name: "Your Health", value: `${quest.data.playerHealth}/${quest.data.playerMaxHealth} HP`, inline: true },
            { name: "Your Weapon", value: quest.data.playerWeapon.name, inline: true },
            { name: "Your Armor", value: quest.data.playerArmor.name, inline: true },
            { name: "Enemy Health", value: `${quest.data.currentMonsterHealth}/${quest.data.currentMonsterMaxHealth} HP`, inline: true },
            { name: "Enemy", value: currentMonster, inline: true }
        );

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('monster_attack')
                .setLabel('⚔️ Attack')
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId('monster_run')
                .setLabel('🏃 Run Away')
                .setStyle(ButtonStyle.Secondary)
        );

    try {
        await interaction.editReply({ embeds: [embed], components: [row] });
    } catch (error) {
        if (error.code === 10062) {
            // Interaction expired, send a new message instead
            await interaction.followUp({ embeds: [embed], components: [row] });
        } else {
            console.error('Error editing reply:', error);
            throw error;
        }
    }

    // Set up monster combat collector
    const filter = (i) => i.user.id === userId;
    const collector = interaction.message.createMessageComponentCollector({ filter, time: 1800000 });

    collector.on('collect', async (i) => {
        await handleMonsterCombat(i, userId, collector);
    });
}

async function handleMonsterCombat(interaction, userId, collector) {
    const quest = activeQuests.get(userId);
    if (!quest) return;

    if (interaction.customId === 'monster_run') {
        await endQuest(interaction, userId, false, "You fled from the monsters! Your quest ends in cowardly retreat.");
        collector.stop();
        return;
    }

    const currentMonster = quest.data.monsters[quest.data.round - 1];
    const monsterStats = getMonsterStats(currentMonster, quest.data.combatLevel);

    // Player attacks monster
    const playerCombatDamage = quest.data.combatLevel + 1;
    const playerWeaponDamage = Math.floor(Math.random() * (quest.data.playerWeapon.maxDamage - quest.data.playerWeapon.minDamage + 1)) + quest.data.playerWeapon.minDamage;
    const playerTotalDamage = playerCombatDamage + playerWeaponDamage;
    const playerFinalDamage = Math.max(1, playerTotalDamage - monsterStats.defense);

    quest.data.currentMonsterHealth -= playerFinalDamage;
    quest.data.currentMonsterHealth = Math.max(0, quest.data.currentMonsterHealth);

    let battleText = `You attack the ${currentMonster} for ${playerFinalDamage} damage!`;

    // Check if monster is defeated
    if (quest.data.currentMonsterHealth <= 0) {
        quest.totalMonsterValue += monsterStats.value;
        quest.data.round++;

        if (quest.data.round > 2) {
            // Monster quest complete!
            await completeQuest(interaction, userId);
            collector.stop();
            return;
        }

        // Show victory message first with continue button
        const embed = new EmbedBuilder()
            .setTitle(`⚔️ AMBUSH - ${currentMonster} DEFEATED!`)
            .setColor("#00FF00")
            .setDescription(`${battleText}\n\n**${currentMonster} defeated!** You stand victorious over your fallen foe.`)
            .addFields(
                { name: "Victory", value: "The creature falls to your superior combat skills!", inline: false }
            );

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('monster_victory_continue')
                    .setLabel('➡️ Continue')
                    .setStyle(ButtonStyle.Primary)
            );

        await interaction.update({ embeds: [embed], components: [row] });

        // Set up collector for continue button
        const filter = (i) => i.user.id === userId;
        const continueCollector = interaction.message.createMessageComponentCollector({ filter, time: 1800000 });

        continueCollector.on('collect', async (i) => {
            if (i.customId === 'monster_victory_continue') {
                // Next monster
                const nextMonster = quest.data.monsters[quest.data.round - 1];
                const nextMonsterStats = getMonsterStats(nextMonster, quest.data.combatLevel);
                quest.data.currentMonsterHealth = nextMonsterStats.health;
                quest.data.currentMonsterMaxHealth = nextMonsterStats.health;

                const nextEmbed = new EmbedBuilder()
                    .setTitle(`⚔️ AMBUSH - ${nextMonster} (${quest.data.round}/2)`)
                    .setColor("#FF0000")
                    .setDescription(`You advance to the next monster.\n\nA **${nextMonster}** appears!`)
                    .addFields(
                        { name: "Your Health", value: `${quest.data.playerHealth}/${quest.data.playerMaxHealth} HP`, inline: true },
                        { name: "Your Weapon", value: quest.data.playerWeapon.name, inline: true },
                        { name: "Your Armor", value: quest.data.playerArmor.name, inline: true },
                        { name: "Enemy Health", value: `${quest.data.currentMonsterHealth}/${quest.data.currentMonsterMaxHealth} HP`, inline: true },
                        { name: "Enemy", value: nextMonster, inline: true }
                    );

                const nextRow = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('monster_attack')
                            .setLabel('⚔️ Attack')
                            .setStyle(ButtonStyle.Danger),
                        new ButtonBuilder()
                            .setCustomId('monster_run')
                            .setLabel('🏃 Run Away')
                            .setStyle(ButtonStyle.Secondary)
                    );

                await i.update({ embeds: [nextEmbed], components: [nextRow] });
                continueCollector.stop();
            }
        });

        return;
    }

    // Monster attacks back
    const monsterFinalDamage = Math.max(1, monsterStats.damage - quest.data.playerArmor.defense);
    quest.data.playerHealth -= monsterFinalDamage;
    quest.data.playerHealth = Math.max(0, quest.data.playerHealth);

    battleText += `\nThe ${currentMonster} retaliates for ${monsterFinalDamage} damage!`;

    // Check if player died
    if (quest.data.playerHealth <= 0) {
        await endQuest(interaction, userId, false, "You were defeated in combat!");
        collector.stop();
        return;
    }

    // Combat continues
    const embed = new EmbedBuilder()
        .setTitle(`⚔️ AMBUSH - ${currentMonster} (${quest.data.round}/2)`)
        .setColor("#FF0000")
        .setDescription(`${battleText}\n\nThe battle continues!`)
        .addFields(
            { name: "Your Health", value: `${quest.data.playerHealth}/${quest.data.playerMaxHealth} HP`, inline: true },
            { name: "Your Weapon", value: quest.data.playerWeapon.name, inline: true },
            { name: "Your Armor", value: quest.data.playerArmor.name, inline: true },
            { name: "Enemy Health", value: `${quest.data.currentMonsterHealth}/${quest.data.currentMonsterMaxHealth} HP`, inline: true },
            { name: "Enemy", value: currentMonster, inline: true }
        );

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('monster_attack')
                .setLabel('⚔️ Attack')
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId('monster_run')
                .setLabel('🏃 Run Away')
                .setStyle(ButtonStyle.Secondary)
        );

    await interaction.update({ embeds: [embed], components: [row] });
}

async function startRiddleQuest(interaction, userId) {
    const quest = activeQuests.get(userId);
    quest.data = {
        riddleIndex: Math.floor(Math.random() * riddles.length),
        solved: 0,
        required: 2
    };

    const riddle = riddles[quest.data.riddleIndex];

    const embed = new EmbedBuilder()
        .setTitle("🧩 ANCIENT RIDDLE - 1/2")
        .setColor("#4B0082")
        .setDescription(`**The ancient sphinx speaks:**\n\n*"${riddle.question}"*`)
        .addFields(
            { name: "Progress", value: `${quest.data.solved}/${quest.data.required} riddles solved`, inline: false }
        );

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('riddle_0')
                .setLabel(riddle.options[0])
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('riddle_1')
                .setLabel(riddle.options[1])
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('riddle_2')
                .setLabel(riddle.options[2])
                .setStyle(ButtonStyle.Secondary)
        );

    try {
        await interaction.editReply({ embeds: [embed], components: [row] });
    } catch (error) {
        if (error.code === 10062) {
            // Interaction expired, send a new message instead
            await interaction.followUp({ embeds: [embed], components: [row] });
        } else {
            console.error('Error editing reply:', error);
            throw error;
        }
    }

    const filter = (i) => i.user.id === userId;
    const collector = interaction.message.createMessageComponentCollector({ filter, time: 1800000 });

    collector.on('collect', async (i) => {
        await handleRiddleAnswer(i, userId, collector);
    });
}

async function handleRiddleAnswer(interaction, userId, collector) {
    const quest = activeQuests.get(userId);
    if (!quest) return;

    const answerIndex = parseInt(interaction.customId.replace('riddle_', ''));
    const riddle = riddles[quest.data.riddleIndex];

    if (answerIndex === riddle.correct) {
        quest.data.solved++;

        if (quest.data.solved >= quest.data.required) {
            // Riddle quest complete!
            await completeQuest(interaction, userId);
            collector.stop();
            return;
        }

        // Next riddle
        let newRiddleIndex;
        do {
            newRiddleIndex = Math.floor(Math.random() * riddles.length);
        } while (newRiddleIndex === quest.data.riddleIndex);

        quest.data.riddleIndex = newRiddleIndex;
        const newRiddle = riddles[newRiddleIndex];

        const embed = new EmbedBuilder()
            .setTitle("🧩 ANCIENT RIDDLE - 2/2")
            .setColor("#4B0082")
            .setDescription(`**Correct!** The sphinx nods approvingly.\n\n*"One more riddle remains: ${newRiddle.question}"*`)
            .addFields(
                { name: "Progress", value: `${quest.data.solved}/${quest.data.required} riddles solved`, inline: false }
            );

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('riddle_0')
                    .setLabel(newRiddle.options[0])
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('riddle_1')
                    .setLabel(newRiddle.options[1])
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('riddle_2')
                    .setLabel(newRiddle.options[2])
                    .setStyle(ButtonStyle.Secondary)
            );

        try {
            await interaction.update({ embeds: [embed], components: [row] });
        } catch (error) {
            if (error.code === 10062) {
                // Interaction expired, send a new message instead
                await interaction.followUp({ embeds: [embed], components: [row] });
            } else {
                console.error('Error updating interaction:', error);
                throw error;
            }
        }
    } else {
        // Wrong answer - sphinx devours the player
        await db.set(`death_cooldown_${userId}`, Date.now());
        await endQuest(interaction, userId, false, `Wrong answer! The ancient sphinx's eyes glow with fury. "Your ignorance has sealed your fate!" it roars before devouring you whole. You are now dead for 24 hours.`);
        collector.stop();
    }
}

async function startMazeQuest(interaction, userId) {
    const quest = activeQuests.get(userId);
    quest.data = {
        stage: 1,
        maxStage: 2
    };

    const embed = new EmbedBuilder()
        .setTitle("🌿 HEDGE MAZE - Stage 1/2")
        .setColor("#228B22")
        .setDescription("You enter a mysterious hedge maze. Ancient magic crackles in the air.\n\nThree paths stretch before you:")
        .addFields(
            { name: "🚪 Path 1", value: "A narrow passage with strange sounds", inline: true },
            { name: "🚪 Path 2", value: "A wide path with glinting objects", inline: true },
            { name: "🚪 Path 3", value: "A winding path with fresh air", inline: true },
            { name: "⚠️ Warning", value: "Choose wisely - one leads forward, one leads to danger, one leads to traps!", inline: false }
        );

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('maze_1')
                .setLabel('🚪 Path 1')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('maze_2')
                .setLabel('🚪 Path 2')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('maze_3')
                .setLabel('🚪 Path 3')
                .setStyle(ButtonStyle.Secondary)
        );

    try {
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ embeds: [embed], components: [row] });
        } else {
            await interaction.editReply({ embeds: [embed], components: [row] });
        }
    } catch (error) {
        if (error.code === 10062 || error.code === 'InteractionNotReplied') {
            // Interaction expired, send a new message instead
            await interaction.followUp({ embeds: [embed], components: [row] });
        } else {
            console.error('Error with interaction:', error);
            throw error;
        }
    }

    const filter = (i) => i.user.id === userId;
    const collector = interaction.message.createMessageComponentCollector({ filter, time: 1800000 });

    collector.on('collect', async (i) => {
        await handleMazeChoice(i, userId, collector);
    });
}

async function handleMazeChoice(interaction, userId, collector) {
    const quest = activeQuests.get(userId);
    if (!quest) return;

    const pathChoice = parseInt(interaction.customId.replace('maze_', ''));
    const outcomes = [1, 2, 3]; // 1=forward, 2=trap, 3=combat
    const shuffled = outcomes.sort(() => Math.random() - 0.5);
    const result = shuffled[pathChoice - 1];

    if (quest.data.stage === 1) {
        // First stage
        if (result === 1) {
            // Forward
            quest.data.stage = 2;
            const embed = new EmbedBuilder()
                .setTitle("🌿 HEDGE MAZE - Stage 2/2")
                .setColor("#228B22")
                .setDescription("You found the correct path! You advance deeper into the maze.\n\n⚠️ **FINAL STAGE** - Choose very carefully:")
                .addFields(
                    { name: "🚪 Path 1", value: "A golden archway beckoning", inline: true },
                    { name: "🚪 Path 2", value: "A dark tunnel with echoes", inline: true },
                    { name: "🚪 Path 3", value: "A bright exit with sunlight", inline: true },
                    { name: "💀 DANGER", value: "Wrong choice here means death!", inline: false }
                );

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('maze_1')
                        .setLabel('🚪 Path 1')
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId('maze_2')
                        .setLabel('🚪 Path 2')
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId('maze_3')
                        .setLabel('🚪 Path 3')
                        .setStyle(ButtonStyle.Secondary)
                );

            try {
                await interaction.update({ embeds: [embed], components: [row] });
            } catch (error) {
                if (error.code === 10062) {
                    // Interaction expired, send a new message instead
                    await interaction.followUp({ embeds: [embed], components: [row] });
                } else {
                    console.error('Error updating interaction:', error);
                    throw error;
                }
            }
        } else if (result === 2) {
            // Trap - lose money
            const loss = Math.floor(Math.random() * 500) + 200;
            const currentMoney = await db.get(`money_${userId}`) || 0;
            if (currentMoney >= loss) {await db.sub(`money_${userId}`, loss);
            }
            await endQuest(interaction, userId, false, `You triggered a trap! Spikes shoot from the ground, and you lose ${loss} kopeks before escaping.`);
            collector.stop();
        } else {
            // Combat - fight a vine beast
            quest.data.mazeCombat = true;
            await startMazeCombat(interaction, userId, collector);
        }
    } else {
        // Final stage
        if (result === 1) {
            // Success!
            await completeQuest(interaction, userId);
            collector.stop();
        } else {
            // Death
            await db.set(`death_cooldown_${userId}`, Date.now());
            await endQuest(interaction, userId, false, `You chose poorly. The maze's deadly trap claims your life. You are now dead for 24 hours.`);
            collector.stop();
        }
    }
}

async function startMazeCombat(interaction, userId, parentCollector) {
    const quest = activeQuests.get(userId);
    const combatLevel = await db.get(`combatlevel_${userId}`) || 0;

    quest.data.mazeCombatData = {
        playerHealth: 5 + (combatLevel * 2),
        playerMaxHealth: 5 + (combatLevel * 2),
        playerWeapon: await getBestWeapon(userId),
        playerArmor: await getBestArmor(userId),
        combatLevel: combatLevel,
        monsterHealth: 15 + (combatLevel * 3), // Vine beast is stronger
        monsterMaxHealth: 15 + (combatLevel * 3),
        monsterDamage: 3 + combatLevel,
        monsterDefense: Math.floor(combatLevel * 0.5),
        round: 0
    };

    const embed = new EmbedBuilder()
        .setTitle("🌿 HEDGE MAZE - VINE BEAST COMBAT")
        .setColor("#FF0000")
        .setDescription("A massive vine beast blocks your path!")
        .addFields(
            { name: "Your Health", value: `${quest.data.mazeCombatData.playerHealth}/${quest.data.mazeCombatData.playerMaxHealth} HP`, inline: true },
            { name: "Your Weapon", value: quest.data.mazeCombatData.playerWeapon.name, inline: true },
            { name: "Your Armor", value: quest.data.mazeCombatData.playerArmor.name, inline: true },
            { name: "Vine Beast Health", value: `${quest.data.mazeCombatData.monsterHealth}/${quest.data.mazeCombatData.monsterMaxHealth} HP`, inline: true },
            { name: "Enemy", value: "Vine Beast", inline: true }
        );

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('maze_combat_attack')
                .setLabel('⚔️ Attack')
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId('maze_combat_run')
                .setLabel('🏃 Run Away')
                .setStyle(ButtonStyle.Secondary)
        );

    try {
        await interaction.update({ embeds: [embed], components: [row] });
    } catch (error) {
        if (error.code === 10062) {
            // Interaction expired, send a new message instead
            await interaction.followUp({ embeds: [embed], components: [row] });
        } else {
            console.error('Error updating interaction:', error);
            throw error;
        }
    }

    // Set up maze combat collector
    const filter = (i) => i.user.id === userId;
    const collector = interaction.message.createMessageComponentCollector({ filter, time: 1800000 });

    collector.on('collect', async (i) => {
        await handleMazeCombatAttack(i, userId, collector, parentCollector);
    });
}

async function handleMazeCombatAttack(interaction, userId, collector, parentCollector) {
    const quest = activeQuests.get(userId);
    if (!quest || !quest.data.mazeCombatData) return;

    if (interaction.customId === 'maze_combat_run') {
        await endQuest(interaction, userId, false, "You fled from the vine beast! Your quest ends in cowardly retreat.");
        collector.stop();
        parentCollector.stop();
        return;
    }

    quest.data.mazeCombatData.round++;

    // Player attacks first
    const playerCombatDamage = quest.data.mazeCombatData.combatLevel + 1;
    const playerWeaponDamage = Math.floor(Math.random() * (quest.data.mazeCombatData.playerWeapon.maxDamage - quest.data.mazeCombatData.playerWeapon.minDamage + 1)) + quest.data.mazeCombatData.playerWeapon.minDamage;
    const playerTotalDamage = playerCombatDamage + playerWeaponDamage;
    const playerFinalDamage = Math.max(1, playerTotalDamage - quest.data.mazeCombatData.monsterDefense);

    quest.data.mazeCombatData.monsterHealth -= playerFinalDamage;
    quest.data.mazeCombatData.monsterHealth = Math.max(0, quest.data.mazeCombatData.monsterHealth);

    let battleText = `You attack the vine beast for ${playerFinalDamage} damage!`;

    // Check if vine beast is defeated
    if (quest.data.mazeCombatData.monsterHealth <= 0) {
        // Player wins - show victory message first with continue button
        const embed = new EmbedBuilder()
            .setTitle("🌿 HEDGE MAZE - VICTORY!")
            .setColor("#00FF00")
            .setDescription(`${battleText}\n\n**Vine beast defeated!** The massive creature falls with a thunderous crash, clearing your path forward.`)
            .addFields(
                { name: "Victory", value: "You stand victorious over the defeated beast!", inline: false }
            );

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('maze_victory_continue')
                    .setLabel('➡️ Continue Deeper')
                    .setStyle(ButtonStyle.Primary)
            );

        await interaction.update({ embeds: [embed], components: [row] });

        // Set up collector for continue button
        const filter = (i) => i.user.id === userId;
        const continueCollector = interaction.message.createMessageComponentCollector({ filter, time: 1800000 });

        continueCollector.on('collect', async (i) => {
            if (i.customId === 'maze_victory_continue') {
                quest.data.stage = 2;

                const nextEmbed = new EmbedBuilder()
                    .setTitle("🌿 HEDGE MAZE - Stage 2/2")
                    .setColor("#228B22")
                    .setDescription("You advance deeper into the maze. The air grows thick with ancient magic.\n\n⚠️ **FINAL STAGE** - Choose very carefully:")
                    .addFields(
                        { name: "🚪 Path 1", value: "A golden archway beckoning", inline: true },
                        { name: "🚪 Path 2", value: "A dark tunnel with echoes", inline: true },
                        { name: "🚪 Path 3", value: "A bright exit with sunlight", inline: true },
                        { name: "💀 DANGER", value: "Wrong choice here means death!", inline: false }
                    );

                const nextRow = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('maze_1')
                            .setLabel('🚪 Path 1')
                            .setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder()
                            .setCustomId('maze_2')
                            .setLabel('🚪 Path 2')
                            .setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder()
                            .setCustomId('maze_3')
                            .setLabel('🚪 Path 3')
                            .setStyle(ButtonStyle.Secondary)
                    );

                await i.update({ embeds: [nextEmbed], components: [nextRow] });
                continueCollector.stop();
            }
        });

        collector.stop();
        return;
    }

    // Monster attacks back
    const monsterFinalDamage = Math.max(1, quest.data.mazeCombatData.monsterDamage - quest.data.mazeCombatData.playerArmor.defense);
    quest.data.mazeCombatData.playerHealth -= monsterFinalDamage;
    quest.data.mazeCombatData.playerHealth = Math.max(0, quest.data.mazeCombatData.playerHealth);

    battleText += `\nThe vine beast lashes back for ${monsterFinalDamage} damage!`;

    // Check if player died
    if (quest.data.mazeCombatData.playerHealth <= 0) {
        // Player dies in quest
        await endQuest(interaction, userId, false, "You were defeated by the vine beast! Your quest ends in failure.");
        collector.stop();
        parentCollector.stop();
        return;
    }

    // Combat continues
    const embed = new EmbedBuilder()
        .setTitle(`🌿 HEDGE MAZE - VINE BEAST COMBAT - Round ${quest.data.mazeCombatData.round}`)
        .setColor("#FF0000")
        .setDescription(`${battleText}\n\nThe battle continues!`)
        .addFields(
            { name: "Your Health", value: `${quest.data.mazeCombatData.playerHealth}/${quest.data.mazeCombatData.playerMaxHealth} HP`, inline: true },
            { name: "Your Weapon", value: quest.data.mazeCombatData.playerWeapon.name, inline: true },
            { name: "Your Armor", value: quest.data.mazeCombatData.playerArmor.name, inline: true },
            { name: "Vine Beast Health", value: `${quest.data.mazeCombatData.monsterHealth}/${quest.data.mazeCombatData.monsterMaxHealth} HP`, inline: true },
            { name: "Enemy", value: "Vine Beast", inline: true }
        );

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('maze_combat_attack')
                .setLabel('⚔️ Attack')
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId('maze_combat_run')
                .setLabel('🏃 Run Away')
                .setStyle(ButtonStyle.Secondary)
        );

    await interaction.update({ embeds: [embed], components: [row] });
}

async function startTrolleyQuest(interaction, userId) {
    const scenario = trolleyScenarios[Math.floor(Math.random() * trolleyScenarios.length)];

    const quest = activeQuests.get(userId);
    quest.data = {
        scenario: scenario,
        choice: null
    };

    const embed = new EmbedBuilder()
        .setTitle("🚃 THE TROLLEY PROBLEM")
        .setColor("#696969")
        .setDescription(`You come upon a runaway trolley heading toward **${scenario.many}** tied to the tracks.\n\nYou can pull a lever to divert it to another track... but there's **${scenario.one}** tied to that track.\n\n**Do you pull the lever to save ${scenario.many} by sacrificing ${scenario.one}?**`)
        .addFields(
            { name: "The Choice", value: "There is no right answer. You must live with whatever you choose.", inline: false }
        );

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('trolley_pull')
                .setLabel('🔄 Pull the Lever')
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId('trolley_walk')
                .setLabel('🚶 Walk Away')
                .setStyle(ButtonStyle.Secondary)
        );

    try {
        await interaction.editReply({ embeds: [embed], components: [row] });
    } catch (error) {
        if (error.code === 10062) {
            // Interaction expired, send a new message instead
            await interaction.followUp({ embeds: [embed], components: [row] });
        } else {
            console.error('Error editing reply:', error);
            throw error;
        }
    }

    const filter = (i) => i.user.id === userId;
    const collector = interaction.message.createMessageComponentCollector({ filter, time: 1800000 });

    collector.on('collect', async (i) => {
        if (i.customId === 'trolley_continue') {
            await completeQuest(i, userId);
            collector.stop();
            return;
        }

        if (i.customId === 'trolley_vengeance_continue') {
            await completeQuest(i, userId);
            collector.stop();
            return;
        }

        let choice;
        let shouldTriggerVengeance = false;

        if (i.customId === 'trolley_pull') {
            choice = `You pulled the lever. ${scenario.one} died to save ${scenario.many}. The weight of this choice will stay with you forever.`;
            quest.data.choice = 'pull';

            // 50% chance of vengeance
            if (Math.random() < 0.5) {
                shouldTriggerVengeance = true;
            }
        } else {
            choice = `You walked away. ${scenario.many} died while you did nothing. Sometimes inaction is also a choice.`;
            quest.data.choice = 'walk';
        }

        if (shouldTriggerVengeance) {
            // Start vengeance combat
            const embed = new EmbedBuilder()
                .setTitle("🚃 THE TROLLEY PROBLEM - VENGEANCE")
                .setColor("#8B0000")
                .setDescription(`${choice}\n\n**Suddenly, a relative of the deceased appears!**\n\n*"You killed my family! I will have my revenge!"*\n\nThey draw a pistol and attack you!`)
                .addFields(
                    { name: "⚔️ Combat", value: "You must fight for your life!", inline: false }
                );

            try {
                 await i.update({ embeds: [embed], components: [] });
            } catch (error) {
                if (error.code === 10062) {
                    // Interaction expired, send a new message instead
                    await i.followUp({ embeds: [embed], components: [] });
                } else {
                    console.error('Error updating interaction:', error);
                    throw error;
                }
            }

            // Set up vengeance combat after a delay
            setTimeout(() => {
                startVengeanceCombat(i, userId, collector);
            }, 3000);
        } else {
            // Normal continue
            const embed = new EmbedBuilder()
                .setTitle("🚃 THE TROLLEY PROBLEM - CHOICE MADE")
                .setColor("#696969")
                .setDescription(choice)
                .addFields(
                    { name: "Reflection", value: "In life, we must live with the consequences of our choices... or our refusal to choose.", inline: false }
                );

            const continueRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('trolley_continue')
                        .setLabel('➡️ Continue Quest')
                        .setStyle(ButtonStyle.Primary)
                );

            try {
                await i.update({ embeds: [embed], components: [continueRow] });
            } catch (error) {
                if (error.code === 10062) {
                    // Interaction expired, send a new message instead
                    await i.followUp({ embeds: [embed], components: [continueRow] });
                } else {
                    console.error('Error updating interaction:', error);
                    throw error;
                }
            }
        }
    });
}

async function startVengeanceCombat(interaction, userId, parentCollector) {
    const quest = activeQuests.get(userId);
    const combatLevel = await db.get(`combatlevel_${userId}`) || 0;

    quest.data.combat = {
        playerHealth: 5 + (combatLevel * 2),
        playerMaxHealth: 5 + (combatLevel * 2),
        playerWeapon: await getBestWeapon(userId),
        playerArmor: await getBestArmor(userId),
        combatLevel: combatLevel,
        vengeanceHealth: 7,
        vengeanceMaxHealth: 7,
        round: 0
    };

    const embed = new EmbedBuilder()
        .setTitle("⚔️ VENGEANCE COMBAT")
        .setColor("#FF0000")
        .setDescription("A grief-stricken relative seeks revenge!")
        .addFields(
            { name: "Your Health", value: `${quest.data.combat.playerHealth}/${quest.data.combat.playerMaxHealth} HP`, inline: true },
            { name: "Your Weapon", value: quest.data.combat.playerWeapon.name, inline: true },
            { name: "Your Armor", value: quest.data.combat.playerArmor.name, inline: true },
            { name: "Enemy Health", value: `${quest.data.combat.vengeanceHealth}/${quest.data.combat.vengeanceMaxHealth} HP`, inline: true },
            { name: "Enemy Weapon", value: "Pistol", inline: true }
        );

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('vengeance_attack')
                .setLabel('⚔️ Attack')
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId('vengeance_run')
                .setLabel('🏃 Run Away')
                .setStyle(ButtonStyle.Secondary)
        );

    try {
        await interaction.editReply({ embeds: [embed], components: [row] });
    } catch (error) {
        if (error.code === 10062) {
            // Interaction expired, send a new message instead
            await interaction.followUp({ embeds: [embed], components: [row] });
        } else {
            console.error('Error editing reply:', error);
            throw error;
        }
    }

    // Set up vengeance combat collector
    const filter = (i) => i.user.id === userId;
    const collector = interaction.message.createMessageComponentCollector({ filter, time: 1800000 });

    collector.on('collect', async (i) => {
        await handleVengeanceCombat(i, userId, collector, parentCollector);
    });
}

async function handleVengeanceCombat(interaction, userId, collector, parentCollector) {
    const quest = activeQuests.get(userId);
    if (!quest || !quest.data.combat) return;

    if (interaction.customId === 'vengeance_run') {
        await endQuest(interaction, userId, false, "You fled from the vengeful attacker! Your quest ends in cowardly retreat.");
        collector.stop();
        parentCollector.stop();
        return;
    }

    quest.data.combat.round++;

    // Player attacks first
    const playerCombatDamage = quest.data.combat.combatLevel + 1;
    const playerWeaponDamage = Math.floor(Math.random() * (quest.data.combat.playerWeapon.maxDamage - quest.data.combat.playerWeapon.minDamage + 1)) + quest.data.combat.playerWeapon.minDamage;
    const playerTotalDamage = playerCombatDamage + playerWeaponDamage;
    const playerFinalDamage = Math.max(1, playerTotalDamage); // No armor for vengeance enemy

    quest.data.combat.vengeanceHealth -= playerFinalDamage;
    quest.data.combat.vengeanceHealth = Math.max(0, quest.data.combat.vengeanceHealth);

    let battleText = `You attack for ${playerFinalDamage} damage!`;

    // Check if vengeance enemy is defeated
    if (quest.data.combat.vengeanceHealth <= 0) {
        // Player wins - give rewards
        await db.add(`money_${userId}`, 25);
        await db.add(`weapon_pistol_${userId}`, 1);

        const embed = new EmbedBuilder()
            .setTitle("🏆 VENGEANCE DEFEATED")
            .setColor("#00FF00")
            .setDescription(`${battleText}\n\nYou have defeated your attacker in self-defense!\n\n**Rewards:**\n💰 +25 kopeks\n🔫 +1 pistol`)
            .addFields(
                { name: "Victory", value: "You continue your quest with a heavy heart.", inline: false }
            );

        const continueRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('trolley_vengeance_continue')
                    .setLabel('➡️ Continue Quest')
                    .setStyle(ButtonStyle.Primary)
            );

        await interaction.update({ embeds: [embed], components: [continueRow] });
        collector.stop();
        return;
    }

    // Enemy attacks back (pistol damage: 3-5)
    const enemyDamage = Math.floor(Math.random() * 3) + 3; // 3-5 damage
    const enemyFinalDamage = Math.max(1, enemyDamage - quest.data.combat.playerArmor.defense);
    quest.data.combat.playerHealth -= enemyFinalDamage;
    quest.data.combat.playerHealth = Math.max(0, quest.data.combat.playerHealth);

    battleText += `\nThe attacker shoots back for ${enemyFinalDamage} damage!`;

    // Check if player died
    if (quest.data.combat.playerHealth <= 0) {
        // Player dies in quest - this ends the quest in failure
        await endQuest(interaction, userId, false, "You were killed by the vengeful relative! Your quest ends in tragedy.");
        collector.stop();
        parentCollector.stop();
        return;
    }

    // Combat continues
    const embed = new EmbedBuilder()
        .setTitle(`⚔️ VENGEANCE COMBAT - Round ${quest.data.combat.round}`)
        .setColor("#FF0000")
        .setDescription(`${battleText}\n\nThe fight continues!`)
        .addFields(
            { name: "Your Health", value: `${quest.data.combat.playerHealth}/${quest.data.combat.playerMaxHealth} HP`, inline: true },
            { name: "Your Weapon", value: quest.data.combat.playerWeapon.name, inline: true },
            { name: "Your Armor", value: quest.data.combat.playerArmor.name, inline: true },
            { name: "Enemy Health", value: `${quest.data.combat.vengeanceHealth}/${quest.data.combat.vengeanceMaxHealth} HP`, inline: true },
            { name: "Enemy Weapon", value: "Pistol", inline: true }
        );

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('vengeance_attack')
                .setLabel('⚔️ Attack')
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId('vengeance_run')
                .setLabel('🏃 Run Away')
                .setStyle(ButtonStyle.Secondary)
        );

    await interaction.update({ embeds: [embed], components: [row] });
}

async function completeQuest(interaction, userId, trolleyMessage = null) {
    const quest = activeQuests.get(userId);
    if (!quest) return;

    // Handle debug mode - complete immediately
    if (quest.isDebug) {
        let rewardText = "🔧 **DEBUG QUEST COMPLETED!**\n\nThis was a test quest - no rewards given.";
        if (trolleyMessage) {
            rewardText = `${trolleyMessage}\n\n${rewardText}`;
        }
        await endQuest(interaction, userId, true, rewardText);
        return;
    }

    quest.questsCompleted++;

    if (quest.questsCompleted >= 2) {
        // Both quests completed - give final reward
        let totalReward = 250; // Base reward
        let rewardText = "You have completed both quests and earned 250 kopeks!";

        if (quest.totalMonsterValue > 0) {
            const monsterBonus = Math.floor(quest.totalMonsterValue / 2);
            totalReward += monsterBonus;
            rewardText = `You have completed both quests and earned 250 kopeks + ${monsterBonus} kopeks bonus from slaying monsters (total: ${totalReward} kopeks)!`;
        }

        if (trolleyMessage) {
            rewardText = `${trolleyMessage}\n\n${rewardText}`;
        }

        await db.add(`money_${userId}`, totalReward);
        await endQuest(interaction, userId, true, rewardText);
    } else {
        // First quest completed, move to second location
        const location = locations[quest.location];

        let completionMessage = "Quest completed!";
        if (trolleyMessage) {
            completionMessage = trolleyMessage;
        }

        // Randomly select second quest type
        const questTypeNames = Object.keys(questTypes);
        const randomQuest = questTypeNames[Math.floor(Math.random() * questTypeNames.length)];

        const embed = new EmbedBuilder()
            .setTitle(`${location.second} - Quest 2/2`)
            .setColor("#4169E1")
            .setDescription(`${completionMessage}\n\nYou advance to ${location.second}. ${location.secondDescription}.\n\nA ${questTypes[randomQuest].name} awaits you!`)
            .addFields(
                { name: "Progress", value: "1/2 quests completed", inline: false }
            );

        try {
            await interaction.update({ embeds: [embed], components: [] });
        } catch (error) {
            if (error.code === 10062) {
                // Interaction expired, send a new message instead
                await interaction.followUp({ embeds: [embed], components: [] });
            } else {
                console.error('Error updating interaction:', error);
                throw error;
            }
        }

        // Add a continue button for better pacing
        setTimeout(() => {
            const continueEmbed = new EmbedBuilder()
                .setTitle(`${location.second} - Ready for Final Challenge`)
                .setColor("#4169E1")
                .setDescription(`You prepare for the final challenge. A ${questTypes[randomQuest].name} awaits!`)
                .addFields(
                    { name: "Progress", value: "1/2 quests completed", inline: false },
                    { name: "Final Quest Type", value: questTypes[randomQuest].description, inline: false }
                );

            const continueRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('quest_start_second')
                        .setLabel('⚔️ Begin Final Quest')
                        .setStyle(ButtonStyle.Primary)
                );

            interaction.editReply({ embeds: [continueEmbed], components: [continueRow] }).catch(() => {
                interaction.followUp({ embeds: [continueEmbed], components: [continueRow] });
            });

            // Set up collector for start button
            const filter = (i) => i.user.id === userId;
            const startCollector = interaction.message.createMessageComponentCollector({ filter, time: 1800000 });

            startCollector.on('collect', async (i) => {
                if (i.customId === 'quest_start_second') {
                    quest.currentQuest = randomQuest;

                    switch (randomQuest) {
                        case 'monster':
                            await startMonsterQuest(i, userId);
                            break;
                        case 'riddle':
                            await startRiddleQuest(i, userId);
                            break;
                        case 'maze':
                            await startMazeQuest(i, userId);
                            break;
                        case 'trolley':
                            await startTrolleyQuest(i, userId);
                            break;
                    }
                    startCollector.stop();
                }
            });
        }, 2000);
    }
}

async function endQuest(interaction, userId, success, message) {
    activeQuests.delete(userId);
    await db.delete(`on_quest_${userId}`);

    const embed = new EmbedBuilder()
        .setTitle(success ? "✅ Quest Complete!" : "❌ Quest Failed")
        .setColor(success ? "#00FF00" : "#FF0000")
        .setDescription(message);

    try {
        await interaction.update({ embeds: [embed], components: [] });
    } catch (error) {
        if (error.code === 10062) {
            // Interaction expired, send a new message instead
            await interaction.followUp({ embeds: [embed], components: [] });
        } else {
            console.error('Error updating interaction:', error);
            throw error;
        }
    }
}

// Function to check if user is on quest (for use in other commands)
async function isOnQuest(userId) {
    return activeQuests.has(userId) || await db.get(`on_quest_${userId}`);
}

async function startDebugQuest(message, userId, questType) {
    // Mark user as on debug quest
    const questData = {
        location: 'debug',
        startTime: Date.now(),
        questsCompleted: 0,
        totalMonsterValue: 0,
        currentQuest: questType,
        isDebug: true
    };

    activeQuests.set(userId, questData);
    await db.set(`on_quest_${userId}`, true);

    // Set 30 minute timeout
    setTimeout(async () => {
        if (activeQuests.has(userId)) {
            activeQuests.delete(userId);
            await db.delete(`on_quest_${userId}`);

            const timeoutEmbed = new EmbedBuilder()
                .setTitle("⏰ Debug Quest Timeout")
                .setColor("#FF0000")
                .setDescription("Your debug quest has timed out after 30 minutes.");

            try {
                await message.channel.send({ embeds: [timeoutEmbed] });
            } catch (err) {
                console.log("Failed to send timeout message:", err);
            }
        }
    }, 1800000); // 30 minutes

    const embed = new EmbedBuilder()
        .setTitle(`🔧 DEBUG QUEST - ${questTypes[questType].name}`)
        .setColor("#FFA500")
        .setDescription(`**Debug Mode Activated**\n\nTesting: ${questTypes[questType].description}\n\nStarting in 2 seconds...`)
        .addFields(
            { name: "Quest Type", value: questType, inline: false }
        );

    const debugMessage = await message.channel.send({ embeds: [embed] });

    // Start the specific quest after delay
    setTimeout(() => {
        // Create a fake interaction object for compatibility
        const fakeInteraction = {
            update: async (options) => await debugMessage.edit(options),
            editReply: async (options) => await debugMessage.edit(options),
            message: debugMessage,
            user: message.author
        };

        switch (questType) {
            case 'monster':
                startMonsterQuest(fakeInteraction, userId);
                break;
            case 'riddle':
                startRiddleQuest(fakeInteraction, userId);
                break;
            case 'maze':
                startMazeQuest(fakeInteraction, userId);
                break;
            case 'trolley':
                startTrolleyQuest(fakeInteraction, userId);
                break;
        }
    }, 2000);
}

module.exports.help = {
    name: "quest",
    aliases: ["q", "adventure"]
};

// Helper function to get monster stats scaled to player combat level
function getMonsterStats(monsterName, playerCombatLevel) {
    const basePlayerHealth = 5 + (playerCombatLevel * 2);
    const basePlayerDamage = 1 + playerCombatLevel;

    const monsterConfigs = {
        "Goblin Scout": {
            healthMultiplier: 0.8,
            damageMultiplier: 0.7,
            defense: Math.floor(playerCombatLevel * 0.5),
            value: 25
        },
        "Orc Raider": {
            healthMultiplier: 1.2,
            damageMultiplier: 1.0,
            defense: Math.floor(playerCombatLevel * 0.8),
            value: 40
        }
    };

    const config = monsterConfigs[monsterName] || monsterConfigs["Goblin Scout"];

    return {
        health: Math.floor(basePlayerHealth * config.healthMultiplier) + 5,
        damage: Math.floor(basePlayerDamage * config.damageMultiplier) + 2,
        defense: config.defense,
        value: config.value
    };
}

async function getBestWeapon(userId) {
    const weapons = [
        { type: "rifle", name: "Rifle", minDamage: 6, maxDamage: 12 },
        { type: "shotgun", name: "Shotgun", minDamage: 4, maxDamage: 10 },
        { type: "pistol", name: "Pistol", minDamage: 3, maxDamage: 5 },
        { type: "sword", name: "Sword", minDamage: 2, maxDamage: 4 },
        { type: "knife", name: "Knife", minDamage: 1, maxDamage: 3 }
    ];

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

module.exports.isOnQuest = isOnQuest;