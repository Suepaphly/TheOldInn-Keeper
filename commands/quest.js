
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { QuickDB } = require("quick.db");
const db = new QuickDB();

// Active quests storage
const activeQuests = new Map();

// Quest data
const questTypes = {
    monster: {
        name: "🐲 Monster Hunt",
        description: "Battle through 4 rounds of monsters",
        reward: "1000-3000 kopeks + possible item"
    },
    riddle: {
        name: "🧩 Ancient Riddle",
        description: "Solve mysterious riddles to claim treasure",
        reward: "800-2000 kopeks"
    },
    maze: {
        name: "🌿 Hedge Maze",
        description: "Navigate through a dangerous maze",
        reward: "1200-2500 kopeks"
    },
    trolley: {
        name: "🚃 Moral Dilemma",
        description: "Face an impossible choice",
        reward: "500 kopeks (for your time)"
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
    }
];

module.exports.run = async (client, message, args) => {
    const userId = message.author.id;
    
    // Check if user is already on a quest
    if (activeQuests.has(userId)) {
        return message.channel.send("❌ You are already on a quest! Complete it first before starting another.");
    }
    
    // Check if user is dead
    const isDead = await db.get(`dead_${userId}`);
    if (isDead) {
        return message.channel.send("💀 You cannot go on quests while dead! Use `=revive` first.");
    }
    
    // Check cooldown (optional - 10 minute cooldown between quests)
    const lastQuest = await db.get(`quest_cooldown_${userId}`) || 0;
    const now = Date.now();
    if (now - lastQuest < 600000) { // 10 minutes
        const timeLeft = Math.ceil((600000 - (now - lastQuest)) / 60000);
        return message.channel.send(`⏰ You must wait ${timeLeft} more minutes before starting another quest.`);
    }
    
    // Create quest selection embed
    const embed = new EmbedBuilder()
        .setTitle("🗡️ CHOOSE YOUR QUEST")
        .setColor("#FFD700")
        .setDescription("Select a quest to embark upon. Once started, you cannot engage in combat, gambling, or economic activities until completed!")
        .addFields(
            { name: questTypes.monster.name, value: `${questTypes.monster.description}\n**Reward:** ${questTypes.monster.reward}`, inline: false },
            { name: questTypes.riddle.name, value: `${questTypes.riddle.description}\n**Reward:** ${questTypes.riddle.reward}`, inline: false },
            { name: questTypes.maze.name, value: `${questTypes.maze.description}\n**Reward:** ${questTypes.maze.reward}`, inline: false },
            { name: questTypes.trolley.name, value: `${questTypes.trolley.description}\n**Reward:** ${questTypes.trolley.reward}`, inline: false }
        )
        .setFooter({ text: "⚠️ You have 30 minutes to complete once started!" });
    
    // Create buttons
    const row1 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('quest_monster')
                .setLabel('🐲 Monster Hunt')
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId('quest_riddle')
                .setLabel('🧩 Ancient Riddle')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('quest_maze')
                .setLabel('🌿 Hedge Maze')
                .setStyle(ButtonStyle.Success)
        );
    
    const row2 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('quest_trolley')
                .setLabel('🚃 Moral Dilemma')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('quest_cancel')
                .setLabel('❌ Cancel')
                .setStyle(ButtonStyle.Secondary)
        );
    
    const questMessage = await message.channel.send({ 
        embeds: [embed], 
        components: [row1, row2] 
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
        
        // Start the selected quest
        const questType = interaction.customId.replace('quest_', '');
        await startQuest(interaction, questType, userId);
        collector.stop();
    });
    
    collector.on('end', (collected, reason) => {
        if (reason === 'time' && !collected.size) {
            questMessage.edit({
                embeds: [new EmbedBuilder()
                    .setTitle("⏰ Quest Selection Timeout")
                    .setColor("#FF0000")
                    .setDescription("You took too long to choose a quest.")],
                components: []
            });
        }
    });
};

async function startQuest(interaction, questType, userId) {
    // Mark user as on quest
    const questData = {
        type: questType,
        startTime: Date.now(),
        stage: 0,
        data: {}
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
    
    // Start the specific quest
    switch (questType) {
        case 'monster':
            await startMonsterQuest(interaction, userId);
            break;
        case 'riddle':
            await startRiddleQuest(interaction, userId);
            break;
        case 'maze':
            await startMazeQuest(interaction, userId);
            break;
        case 'trolley':
            await startTrolleyQuest(interaction, userId);
            break;
    }
}

async function startMonsterQuest(interaction, userId) {
    const quest = activeQuests.get(userId);
    quest.data.round = 1;
    quest.data.health = 100;
    quest.data.maxHealth = 100;
    
    const embed = new EmbedBuilder()
        .setTitle("🐲 MONSTER HUNT - Round 1/4")
        .setColor("#FF0000")
        .setDescription("You enter a dark cave and encounter a **Goblin Warrior**!")
        .addFields(
            { name: "Your Health", value: `${quest.data.health}/${quest.data.maxHealth} HP`, inline: true },
            { name: "Enemy", value: "Goblin Warrior", inline: true }
        );
    
    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('monster_attack')
                .setLabel('⚔️ Attack')
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId('monster_defend')
                .setLabel('🛡️ Defend')
                .setStyle(ButtonStyle.Primary)
        );
    
    await interaction.update({ embeds: [embed], components: [row] });
    
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
    
    const action = interaction.customId.replace('monster_', '');
    const enemies = ['Goblin Warrior', 'Orc Brute', 'Skeleton Mage', 'Shadow Beast'];
    const currentEnemy = enemies[quest.data.round - 1];
    
    let playerDamage = 0;
    let enemyDamage = 0;
    let actionText = "";
    
    if (action === 'attack') {
        playerDamage = Math.floor(Math.random() * 30) + 20; // 20-49 damage
        enemyDamage = Math.floor(Math.random() * 20) + 10; // 10-29 damage
        actionText = `You strike the ${currentEnemy} for ${playerDamage} damage!\nThe ${currentEnemy} retaliates for ${enemyDamage} damage!`;
    } else if (action === 'defend') {
        playerDamage = Math.floor(Math.random() * 15) + 10; // 10-24 damage
        enemyDamage = Math.floor(Math.random() * 10) + 5; // 5-14 damage
        actionText = `You defend and counter-attack for ${playerDamage} damage!\nThe ${currentEnemy} attacks for reduced ${enemyDamage} damage!`;
    }
    
    quest.data.health -= enemyDamage;
    
    // Check if player died
    if (quest.data.health <= 0) {
        await endQuest(interaction, userId, false, "You were defeated in combat!");
        collector.stop();
        return;
    }
    
    // Check if enemy defeated
    if (playerDamage >= 50 || Math.random() < 0.4) { // Enemy defeated
        quest.data.round++;
        quest.data.health = Math.min(quest.data.health + 20, quest.data.maxHealth); // Heal a bit
        
        if (quest.data.round > 4) {
            // Quest complete!
            const reward = Math.floor(Math.random() * 2001) + 1000; // 1000-3000
            await db.add(`money_${userId}`, reward);
            
            // Chance for item
            if (Math.random() < 0.3) {
                await db.add(`weapon_sword_${userId}`, 1);
                await endQuest(interaction, userId, true, `Congratulations! You defeated all monsters and earned ${reward} kopeks + a sword!`);
            } else {
                await endQuest(interaction, userId, true, `Congratulations! You defeated all monsters and earned ${reward} kopeks!`);
            }
            collector.stop();
            return;
        }
        
        const embed = new EmbedBuilder()
            .setTitle(`🐲 MONSTER HUNT - Round ${quest.data.round}/4`)
            .setColor("#FF0000")
            .setDescription(`${actionText}\n\n**${currentEnemy} defeated!** You advance to the next round.\n\nA **${enemies[quest.data.round - 1]}** appears!`)
            .addFields(
                { name: "Your Health", value: `${quest.data.health}/${quest.data.maxHealth} HP`, inline: true },
                { name: "Enemy", value: enemies[quest.data.round - 1], inline: true }
            );
        
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('monster_attack')
                    .setLabel('⚔️ Attack')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('monster_defend')
                    .setLabel('🛡️ Defend')
                    .setStyle(ButtonStyle.Primary)
            );
        
        await interaction.update({ embeds: [embed], components: [row] });
    } else {
        // Combat continues
        const embed = new EmbedBuilder()
            .setTitle(`🐲 MONSTER HUNT - Round ${quest.data.round}/4`)
            .setColor("#FF0000")
            .setDescription(`${actionText}\n\nThe battle continues!`)
            .addFields(
                { name: "Your Health", value: `${quest.data.health}/${quest.data.maxHealth} HP`, inline: true },
                { name: "Enemy", value: currentEnemy, inline: true }
            );
        
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('monster_attack')
                    .setLabel('⚔️ Attack')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('monster_defend')
                    .setLabel('🛡️ Defend')
                    .setStyle(ButtonStyle.Primary)
            );
        
        await interaction.update({ embeds: [embed], components: [row] });
    }
}

async function startRiddleQuest(interaction, userId) {
    const quest = activeQuests.get(userId);
    quest.data.riddleIndex = Math.floor(Math.random() * riddles.length);
    quest.data.solved = 0;
    quest.data.required = 2;
    
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
    
    await interaction.update({ embeds: [embed], components: [row] });
    
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
            // Quest complete!
            const reward = Math.floor(Math.random() * 1201) + 800; // 800-2000
            await db.add(`money_${userId}`, reward);
            await endQuest(interaction, userId, true, `Correct! You have solved both riddles and earned ${reward} kopeks!`);
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
    quest.data.stage = 1;
    quest.data.maxStage = 2;
    
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
    
    await interaction.update({ embeds: [embed], components: [row] });
    
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
            const reward = Math.floor(Math.random() * 1301) + 1200; // 1200-2500
            await db.add(`money_${userId}`, reward);
            await endQuest(interaction, userId, true, `You found the exit! The maze rewards your perseverance with ${reward} kopeks!`);
            collector.stop();
        } else {
            // Death
            await db.set(`dead_${userId}`, true);
            await endQuest(interaction, userId, false, `You chose poorly. The maze's deadly trap claims your life. You are now dead for 24 hours.`);
            collector.stop();
        }
    }
}

async function startTrolleyQuest(interaction, userId) {
    const embed = new EmbedBuilder()
        .setTitle("🚃 THE TROLLEY PROBLEM")
        .setColor("#696969")
        .setDescription("You come upon a runaway trolley heading toward five people tied to the tracks.\n\nYou can pull a lever to divert it to another track... but there's one person tied to that track.\n\n**Do you pull the lever to save five lives by sacrificing one?**")
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
    
    await interaction.update({ embeds: [embed], components: [row] });
    
    const filter = (i) => i.user.id === userId;
    const collector = interaction.message.createMessageComponentCollector({ filter, time: 1800000 });
    
    collector.on('collect', async (i) => {
        let choice;
        if (i.customId === 'trolley_pull') {
            choice = "You pulled the lever. One person died to save five. The weight of this choice will stay with you forever.";
        } else {
            choice = "You walked away. Five people died while you did nothing. Sometimes inaction is also a choice.";
        }
        
        await db.add(`money_${userId}`, 500); // Small reward for participating
        await endQuest(i, userId, true, `${choice}\n\nThe universe grants you 500 kopeks for facing this impossible choice.`);
        collector.stop();
    });
}

async function endQuest(interaction, userId, success, message) {
    activeQuests.delete(userId);
    await db.delete(`on_quest_${userId}`);
    await db.set(`quest_cooldown_${userId}`, Date.now());
    
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

module.exports.isOnQuest = isOnQuest;
