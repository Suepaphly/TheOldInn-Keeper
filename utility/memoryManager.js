
const { QuickDB } = require("quick.db");
const db = new QuickDB();

class MemoryManager {
    constructor() {
        this.cleanupInterval = null;
        this.lastCleanup = 0;
        this.cleanupThreshold = 15 * 60 * 1000; // 15 minutes
    }

    // Start automated cleanup
    startCleanupScheduler() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }

        // Run cleanup every 15 minutes
        this.cleanupInterval = setInterval(async () => {
            await this.performCleanup();
        }, this.cleanupThreshold);

        console.log("🧹 Memory manager started - cleanup every 15 minutes");
    }

    // Main cleanup orchestrator
    async performCleanup() {
        try {
            const startTime = Date.now();
            console.log("🧹 Starting memory cleanup...");

            const results = await Promise.all([
                this.cleanupExpiredCooldowns(),
                this.cleanupQuestStates(),
                this.cleanupCombatStates(),
                this.cleanupTemporaryData(),
                this.cleanupInteractionData(),
                this.syncActiveQuests()
            ]);

            const totalCleaned = results.reduce((sum, result) => sum + result, 0);
            const duration = Date.now() - startTime;

            if (totalCleaned > 0) {
                console.log(`✅ Cleaned ${totalCleaned} entries in ${duration}ms`);
            }

            this.lastCleanup = Date.now();
            return totalCleaned;

        } catch (error) {
            console.error("❌ Memory cleanup error:", error);
            return 0;
        }
    }

    // Clean expired cooldowns
    async cleanupExpiredCooldowns() {
        const allEntries = await db.all();
        const now = Date.now();
        let cleaned = 0;

        const cooldownDurations = {
            'death_cooldown_': 86400000,     // 24 hours
            'snoop_cooldown_': 3600000,      // 1 hour
            'prank_cooldown_': 3600000,      // 1 hour
            'attack_cooldown_': 3600000,     // 1 hour
            'steal_cooldown_': 3600000,      // 1 hour
            'green_crystal_revive_': 86400000, // 24 hours
            'tiamat_cooldown_': 86400000,    // 24 hours
            'daily_': 46000000,              // ~12.77 hours
            'fish_': 1800000,                // 30 minutes
            'craft_': 9000000,               // 2.5 hours
            'gather_': 900000,               // 15 minutes
            'hunt_': 3600000,                // 1 hour
            'work_': 18000000,               // 5 hours
            'rob_': 3600000,                 // 1 hour
            'deposit_': 21600000             // 6 hours
        };

        for (const entry of allEntries) {
            for (const [prefix, duration] of Object.entries(cooldownDurations)) {
                if (entry.id.startsWith(prefix)) {
                    const age = now - (entry.value || 0);
                    if (age >= duration) {
                        await db.delete(entry.id);
                        cleaned++;
                    }
                    break;
                }
            }
        }

        return cleaned;
    }

    // Clean quest-related states
    async cleanupQuestStates() {
        const allEntries = await db.all();
        let cleaned = 0;

        const questPrefixes = [
            'maze_', 'chest_', 'riddle_', 'mystery_', 'trolley_',
            'quest_progress_', 'quest_state_', 'quest_data_',
            'dragon_', 'monster_quest_'
        ];

        for (const entry of allEntries) {
            for (const prefix of questPrefixes) {
                if (entry.id.startsWith(prefix)) {
                    await db.delete(entry.id);
                    cleaned++;
                    break;
                }
            }
        }

        return cleaned;
    }

    // Clean combat-related states
    async cleanupCombatStates() {
        const allEntries = await db.all();
        let cleaned = 0;

        const combatPrefixes = [
            'combat_', 'battle_', 'turn_attack_', 'monster_damage_',
            'user_freeze_used_', 'monster_health_', 'currentMonsters',
            'currentMonsterHealth', 'monsters_frozen_this_turn',
            'freeze_used_this_combat', 'in_battle_', 'battle_turn_',
            'last_attack_', 'combat_state_', 'prank_battle_',
            'violate_session_', 'prank_state_'
        ];

        for (const entry of allEntries) {
            for (const prefix of combatPrefixes) {
                if (entry.id.startsWith(prefix) || entry.id === prefix) {
                    await db.delete(entry.id);
                    cleaned++;
                    break;
                }
            }
        }

        return cleaned;
    }

    // Clean temporary/session data
    async cleanupTemporaryData() {
        const allEntries = await db.all();
        let cleaned = 0;

        const tempPrefixes = [
            'temp_', 'debug_', 'test_', 'ui_state_', 'menu_state_',
            'dialog_', 'msg_', 'embed_', 'reply_', 'shop_cart_',
            'shop_session_', 'transaction_temp_', 'feature_flag_',
            'config_override_', 'setting_temp_'
        ];

        for (const entry of allEntries) {
            for (const prefix of tempPrefixes) {
                if (entry.id.startsWith(prefix) || entry.id.includes('_debug') || entry.id.includes('_test')) {
                    await db.delete(entry.id);
                    cleaned++;
                    break;
                }
            }
        }

        return cleaned;
    }

    // Clean interaction/collector data
    async cleanupInteractionData() {
        const allEntries = await db.all();
        let cleaned = 0;

        const interactionPrefixes = [
            'interaction_', 'collector_', 'button_state_'
        ];

        for (const entry of allEntries) {
            for (const prefix of interactionPrefixes) {
                if (entry.id.startsWith(prefix)) {
                    await db.delete(entry.id);
                    cleaned++;
                    break;
                }
            }
        }

        return cleaned;
    }

    // Sync activeQuests Map with database
    async syncActiveQuests() {
        try {
            const { activeQuests } = require('../commands/quest.js');
            const allEntries = await db.all();
            let cleaned = 0;

            // Get all on_quest entries from database
            const dbQuests = allEntries
                .filter(entry => entry.id.startsWith('on_quest_'))
                .map(entry => entry.id.replace('on_quest_', ''));

            // Get all active quests from memory
            const memoryQuests = Array.from(activeQuests.keys());

            // Remove memory quests that aren't in database
            for (const userId of memoryQuests) {
                if (!dbQuests.includes(userId)) {
                    activeQuests.delete(userId);
                    cleaned++;
                }
            }

            // Remove database quests that aren't in memory
            for (const userId of dbQuests) {
                if (!activeQuests.has(userId)) {
                    await db.delete(`on_quest_${userId}`);
                    cleaned++;
                }
            }

            return cleaned;

        } catch (error) {
            console.error("Error syncing active quests:", error);
            return 0;
        }
    }

    // Emergency cleanup - removes ALL temporary data
    async emergencyCleanup() {
        try {
            console.log("🚨 Performing emergency cleanup...");
            
            const allEntries = await db.all();
            let cleaned = 0;

            // Keep only essential player data
            const protectedPrefixes = [
                'money_', 'bank_', 'skill_', 'feat_', 'weapon_', 'armor_',
                'crystal_', 'backpack_', 'user_', 'player_'
            ];

            for (const entry of allEntries) {
                let isProtected = false;
                
                for (const prefix of protectedPrefixes) {
                    if (entry.id.startsWith(prefix)) {
                        isProtected = true;
                        break;
                    }
                }

                if (!isProtected) {
                    await db.delete(entry.id);
                    cleaned++;
                }
            }

            // Clear memory maps
            const { activeQuests } = require('../commands/quest.js');
            activeQuests.clear();

            console.log(`🚨 Emergency cleanup completed - removed ${cleaned} entries`);
            return cleaned;

        } catch (error) {
            console.error("❌ Emergency cleanup failed:", error);
            return 0;
        }
    }

    // Get memory usage statistics
    async getMemoryStats() {
        try {
            const allEntries = await db.all();
            const { activeQuests } = require('../commands/quest.js');

            const stats = {
                totalEntries: allEntries.length,
                activeQuestsMemory: activeQuests.size,
                questStates: allEntries.filter(e => e.id.startsWith('on_quest_')).length,
                combatStates: allEntries.filter(e => e.id.startsWith('combat_') || e.id.startsWith('battle_')).length,
                cooldowns: allEntries.filter(e => e.id.includes('_cooldown_')).length,
                tempData: allEntries.filter(e => e.id.startsWith('temp_') || e.id.startsWith('debug_')).length,
                lastCleanup: new Date(this.lastCleanup).toISOString()
            };

            return stats;

        } catch (error) {
            console.error("Error getting memory stats:", error);
            return null;
        }
    }

    // Stop cleanup scheduler
    stopCleanupScheduler() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
            console.log("🛑 Memory manager stopped");
        }
    }
}

module.exports = new MemoryManager();
