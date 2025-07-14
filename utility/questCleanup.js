
const { QuickDB } = require("quick.db");
const db = new QuickDB();

/**
 * Comprehensive quest system cleanup utility
 * Clears lingering quest states, button interactions, and database inconsistencies
 */
class QuestCleanup {
    static async clearAllQuestStates() {
        try {
            console.log("🧹 Starting quest system cleanup...");
            
            const allEntries = await db.all();
            let cleanedCount = 0;
            
            // 1. Clear all quest states
            const questEntries = allEntries.filter(entry => 
                entry.id.startsWith("on_quest_") ||
                entry.id.startsWith("quest_") ||
                entry.id.startsWith("maze_") ||
                entry.id.startsWith("chest_") ||
                entry.id.startsWith("riddle_") ||
                entry.id.startsWith("mystery_") ||
                entry.id.startsWith("trolley_")
            );
            
            for (const entry of questEntries) {
                await db.delete(entry.id);
                cleanedCount++;
            }
            
            // 2. Clear combat system states
            const combatEntries = allEntries.filter(entry =>
                entry.id.startsWith("combat_") ||
                entry.id.startsWith("player_combat_") ||
                entry.id.startsWith("enemy_")
            );
            
            for (const entry of combatEntries) {
                await db.delete(entry.id);
                cleanedCount++;
            }
            
            // 3. Clear temporary interaction data
            const tempEntries = allEntries.filter(entry =>
                entry.id.startsWith("temp_") ||
                entry.id.startsWith("interaction_") ||
                entry.id.startsWith("collector_")
            );
            
            for (const entry of tempEntries) {
                await db.delete(entry.id);
                cleanedCount++;
            }
            
            // 4. Clear protection system button states (the lingering location purchase issue)
            const protectionEntries = allEntries.filter(entry =>
                entry.id.startsWith("location_") ||
                entry.id.startsWith("protection_") ||
                entry.id.startsWith("button_state_")
            );
            
            for (const entry of protectionEntries) {
                await db.delete(entry.id);
                cleanedCount++;
            }
            
            console.log(`✅ Quest cleanup completed. Cleared ${cleanedCount} entries.`);
            return { success: true, cleanedCount };
            
        } catch (error) {
            console.error("❌ Error during quest cleanup:", error);
            return { success: false, error: error.message };
        }
    }
    
    static async clearUserQuest(userId) {
        try {
            console.log(`🧹 Clearing quest state for user ${userId}...`);
            
            const allEntries = await db.all();
            let cleanedCount = 0;
            
            // Clear all user-specific quest data
            const userEntries = allEntries.filter(entry =>
                entry.id.includes(`_${userId}`) && (
                    entry.id.startsWith("on_quest_") ||
                    entry.id.startsWith("quest_") ||
                    entry.id.startsWith("combat_") ||
                    entry.id.startsWith("maze_") ||
                    entry.id.startsWith("chest_") ||
                    entry.id.startsWith("riddle_") ||
                    entry.id.startsWith("mystery_") ||
                    entry.id.startsWith("trolley_") ||
                    entry.id.startsWith("temp_") ||
                    entry.id.startsWith("interaction_")
                )
            );
            
            for (const entry of userEntries) {
                await db.delete(entry.id);
                cleanedCount++;
            }
            
            console.log(`✅ Cleared ${cleanedCount} entries for user ${userId}.`);
            return { success: true, cleanedCount };
            
        } catch (error) {
            console.error(`❌ Error clearing quest for user ${userId}:`, error);
            return { success: false, error: error.message };
        }
    }
    
    static async diagnosticReport() {
        try {
            console.log("📊 Generating quest system diagnostic report...");
            
            const allEntries = await db.all();
            
            const report = {
                activeQuests: allEntries.filter(entry => entry.id.startsWith("on_quest_")).length,
                combatStates: allEntries.filter(entry => entry.id.startsWith("combat_")).length,
                tempStates: allEntries.filter(entry => entry.id.startsWith("temp_")).length,
                protectionStates: allEntries.filter(entry => entry.id.startsWith("location_")).length,
                questData: allEntries.filter(entry => 
                    entry.id.startsWith("maze_") ||
                    entry.id.startsWith("chest_") ||
                    entry.id.startsWith("riddle_") ||
                    entry.id.startsWith("mystery_") ||
                    entry.id.startsWith("trolley_")
                ).length,
                deathCooldowns: allEntries.filter(entry => entry.id.startsWith("death_cooldown_")).length,
                totalPotentialCleanup: 0
            };
            
            report.totalPotentialCleanup = report.combatStates + report.tempStates + 
                                         report.protectionStates + report.questData;
            
            console.log("📊 Diagnostic Report:");
            console.log(`   Active Quests: ${report.activeQuests}`);
            console.log(`   Combat States: ${report.combatStates}`);
            console.log(`   Temp States: ${report.tempStates}`);
            console.log(`   Protection States: ${report.protectionStates}`);
            console.log(`   Quest Data: ${report.questData}`);
            console.log(`   Death Cooldowns: ${report.deathCooldowns}`);
            console.log(`   Total Cleanup Candidates: ${report.totalPotentialCleanup}`);
            
            return report;
            
        } catch (error) {
            console.error("❌ Error generating diagnostic report:", error);
            return null;
        }
    }
    
    static async clearExpiredDeathCooldowns() {
        try {
            console.log("💀 Clearing expired death cooldowns...");
            
            const allEntries = await db.all();
            const currentTime = Date.now();
            let cleanedCount = 0;
            
            const deathCooldowns = allEntries.filter(entry => 
                entry.id.startsWith("death_cooldown_")
            );
            
            for (const entry of deathCooldowns) {
                if (entry.value && currentTime >= entry.value) {
                    await db.delete(entry.id);
                    cleanedCount++;
                }
            }
            
            console.log(`✅ Cleared ${cleanedCount} expired death cooldowns.`);
            return { success: true, cleanedCount };
            
        } catch (error) {
            console.error("❌ Error clearing death cooldowns:", error);
            return { success: false, error: error.message };
        }
    }
}

module.exports = QuestCleanup;
