
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
        name: "🐲 Monster Hunt",
        description: "Battle through monsters"
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
    
    await interaction.update({ embeds: [embed], components: [] });
    
    // Start the specific quest
    questData.currentQuest = randomQuest;
    setTimeout(() => {
        switch (randomQuest) {
            case 'monster':
                startMonsterQuest(interaction, userId);
                break;
            case 'riddle':
                startRiddleQuest(interaction, userId);
                break;
            case 'maze':
                startMazeQuest(interaction, userId);
                break;
            case 'trolley':
                startTrolleyQuest(interaction, userId);
                break;
        }
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
        .setTitle(`🐲 MONSTER HUNT - ${currentMonster} (${quest.data.round}/2)`)
        .setColor("#FF0000")
        .setDescription(`You encounter a **${currentMonster}**!`)
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
                .setStyle(ButtonStyle.Danger)
        );
    
    await interaction.editReply({ embeds: [embed], components: [row] });
    
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
        
        // Next monster
        const nextMonster = quest.data.monsters[quest.data.round - 1];
        const nextMonsterStats = getMonsterStats(nextMonster, quest.data.combatLevel);
        quest.data.currentMonsterHealth = nextMonsterStats.health;
        quest.data.currentMonsterMaxHealth = nextMonsterStats.health;
        
        const embed = new EmbedBuilder()
            .setTitle(`🐲 MONSTER HUNT - ${nextMonster} (${quest.data.round}/2)`)
            .setColor("#FF0000")
            .setDescription(`${battleText}\n\n**${currentMonster} defeated!** You advance to the next monster.\n\nA **${nextMonster}** appears!`)
            .addFields(
                { name: "Your Health", value: `${quest.data.playerHealth}/${quest.data.playerMaxHealth} HP`, inline: true },
                { name: "Your Weapon", value: quest.data.playerWeapon.name, inline: true },
                { name: "Your Armor", value: quest.data.playerArmor.name, inline: true },
                { name: "Enemy Health", value: `${quest.data.currentMonsterHealth}/${quest.data.currentMonsterMaxHealth} HP`, inline: true },
                { name: "Enemy", value: nextMonster, inline: true }
            );
        
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('monster_attack')
                    .setLabel('⚔️ Attack')
                    .setStyle(ButtonStyle.Danger)
            );
        
        await interaction.update({ embeds: [embed], components: [row] });
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
        .setTitle(`🐲 MONSTER HUNT - ${currentMonster} (${quest.data.round}/2)`)
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
                .setStyle(ButtonStyle.Danger)
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
    
    await interaction.editReply({ embeds: [embed], components: [row] });
    
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
        
        await interaction.update({ embeds: [embed], components: [row] });
    } else {
        // Wrong answer
        await endQuest(interaction, userId, false, `Wrong answer! The sphinx looks disappointed and you flee empty-handed.`);
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
    
    await interaction.editReply({ embeds: [embed], components: [row] });
    
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
            
            await interaction.update({ embeds: [embed], components: [row] });
        } else if (result === 2) {
            // Trap - lose money
            const loss = Math.floor(Math.random() * 500) + 200;
            const currentMoney = await db.get(`money_${userId}`) || 0;
            if (currentMoney >= loss) {
                await db.sub(`money_${userId}`, loss);
            }
            await endQuest(interaction, userId, false, `You triggered a trap! Spikes shoot from the ground, and you lose ${loss} kopeks before escaping.`);
            collector.stop();
        } else {
            // Combat - lose some health but continue
            const damage = Math.floor(Math.random() * 30) + 20;
            quest.data.stage = 2;
            
            const embed = new EmbedBuilder()
                .setTitle("🌿 HEDGE MAZE - Stage 2/2")
                .setColor("#228B22")
                .setDescription(`A vine beast attacks! You take ${damage} damage but defeat it and advance.\n\n⚠️ **FINAL STAGE** - Choose very carefully:`)
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
            
            await interaction.update({ embeds: [embed], components: [row] });
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

async function startTrolleyQuest(interaction, userId) {
    const scenario = trolleyScenarios[Math.floor(Math.random() * trolleyScenarios.length)];
    
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
    
    await interaction.editReply({ embeds: [embed], components: [row] });
    
    const filter = (i) => i.user.id === userId;
    const collector = interaction.message.createMessageComponentCollector({ filter, time: 1800000 });
    
    collector.on('collect', async (i) => {
        if (i.customId === 'trolley_continue') {
            await completeQuest(i, userId);
            collector.stop();
            return;
        }
        
        let choice;
        if (i.customId === 'trolley_pull') {
            choice = `You pulled the lever. ${scenario.one} died to save ${scenario.many}. The weight of this choice will stay with you forever.`;
        } else {
            choice = `You walked away. ${scenario.many} died while you did nothing. Sometimes inaction is also a choice.`;
        }
        
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
        
        await i.update({ embeds: [embed], components: [continueRow] });
    });
}

async function completeQuest(interaction, userId, trolleyMessage = null) {
    const quest = activeQuests.get(userId);
    if (!quest) return;
    
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
        
        await interaction.update({ embeds: [embed], components: [] });
        
        // Start the second quest
        quest.currentQuest = randomQuest;
        setTimeout(() => {
            switch (randomQuest) {
                case 'monster':
                    startMonsterQuest(interaction, userId);
                    break;
                case 'riddle':
                    startRiddleQuest(interaction, userId);
                    break;
                case 'maze':
                    startMazeQuest(interaction, userId);
                    break;
                case 'trolley':
                    startTrolleyQuest(interaction, userId);
                    break;
            }
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
    
    await interaction.update({ embeds: [embed], components: [] });
}

// Function to check if user is on quest (for use in other commands)
async function isOnQuest(userId) {
    return activeQuests.has(userId) || await db.get(`on_quest_${userId}`);
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
