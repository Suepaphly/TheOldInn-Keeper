const { QuickDB } = require("quick.db");
const db = new QuickDB();

// Cooldown durations in milliseconds
const COOLDOWN_DURATIONS = {
    snoop: 3600000,        // 1 hour
    prank: 3600000,        // 1 hour  
    attack: 3600000,       // 1 hour (typical PvP cooldown)
    daily: 46000000,       // ~12.77 hours
    fish: 1800000,         // 30 minutes
    craft: 9000000,        // 2.5 hours
    gather: 900000,        // 15 minutes
    hunt: 3600000,         // 1 hour
    work: 18000000,        // 5 hours
    rob: 3600000,          // 1 hour
    deposit: 21600000,     // 6 hours
    death: 86400000,       // 24 hours
    green_crystal_revive: 86400000, // 24 hours
    tiamat: 86400000,      // 24 hours (boss cooldown)
    steal: 3600000,        // 1 hour
    gambling: 3600000,     // 1 hour (gambling sessions)
    quest: 86400000        // 24 hours (quest data)
};

async function cleanupExpiredCooldowns() {
    try {
        const allData = await db.all();
        const now = Date.now();
        let cleanedCount = 0;

        // Filter for cooldown-related keys
        const cooldownKeys = allData.filter(item => {
            return (
                item.id.includes("_cooldown_") ||
                item.id.includes("snoop_cooldown_") ||
                item.id.includes("prank_cooldown_") ||
                item.id.includes("attack_cooldown_") ||
                item.id.includes("steal_cooldown_") ||
                item.id.includes("green_crystal_revive_") ||
                item.id.includes("tiamat_cooldown_") ||
                item.id.includes("daily_") ||
                item.id.includes("fish_") ||
                item.id.includes("craft_") ||
                item.id.includes("gather_") ||
                item.id.includes("hunt_") ||
                item.id.includes("work_") ||
                item.id.includes("rob_") ||
                item.id.includes("deposit_") ||
                item.id.includes("death_cooldown_")
            );
        });

        for (const entry of cooldownKeys) {
            const timestamp = entry.value;
            let cooldownDuration;

            // Determine cooldown duration based on key type
            if (entry.id.includes("snoop_cooldown_")) {
                cooldownDuration = COOLDOWN_DURATIONS.snoop;
            } else if (entry.id.includes("prank_cooldown_")) {
                cooldownDuration = COOLDOWN_DURATIONS.prank;
            } else if (entry.id.includes("attack_cooldown_")) {
                cooldownDuration = COOLDOWN_DURATIONS.attack;
            } else if (entry.id.includes("steal_cooldown_")) {
                cooldownDuration = COOLDOWN_DURATIONS.steal;
            } else if (entry.id.includes("green_crystal_revive_")) {
                cooldownDuration = COOLDOWN_DURATIONS.green_crystal_revive;
            } else if (entry.id.includes("tiamat_cooldown_")) {
                cooldownDuration = COOLDOWN_DURATIONS.tiamat;
            } else if (entry.id.includes("death_cooldown_")) {
                cooldownDuration = COOLDOWN_DURATIONS.death;
            } else if (entry.id.includes("daily_")) {
                cooldownDuration = COOLDOWN_DURATIONS.daily;
            } else if (entry.id.includes("fish_")) {
                cooldownDuration = COOLDOWN_DURATIONS.fish;
            } else if (entry.id.includes("craft_")) {
                cooldownDuration = COOLDOWN_DURATIONS.craft;
            } else if (entry.id.includes("gather_")) {
                cooldownDuration = COOLDOWN_DURATIONS.gather;
            } else if (entry.id.includes("hunt_")) {
                cooldownDuration = COOLDOWN_DURATIONS.hunt;
            } else if (entry.id.includes("work_")) {
                cooldownDuration = COOLDOWN_DURATIONS.work;
            } else if (entry.id.includes("rob_")) {
                cooldownDuration = COOLDOWN_DURATIONS.rob;
            } else if (entry.id.includes("deposit_")) {
                cooldownDuration = COOLDOWN_DURATIONS.deposit;
            } else {
                // Default to 1 hour for unknown cooldown types
                cooldownDuration = 3600000;
            }

            // Check if cooldown has expired
            if (now - timestamp >= cooldownDuration) {
                await db.delete(entry.id);
                cleanedCount++;
            }
        }

        console.log(`🧹 Cooldown cleanup: Removed ${cleanedCount} expired cooldown entries`);
        return cleanedCount;

    } catch (error) {
        console.error("Error during cooldown cleanup:", error);
        return 0;
    }
}

// Run cleanup every 15 minutes
function startCooldownCleanup() {
    setInterval(async () => {
        await cleanupExpiredCooldowns();
    }, 900000); // 15 minutes

    console.log("🧹 Cooldown cleanup scheduler started (runs every 15 minutes)");
}

module.exports = {
    cleanupExpiredCooldowns,
    startCooldownCleanup,
    COOLDOWN_DURATIONS
};
const cron = require('node-cron');

cron.schedule('0 0 * * *', async () => {
    try {
        console.log('🧹 Running cooldown cleanup...');

        const allEntries = await db.all();
        let cleanedCount = 0;
        const now = Date.now();

        // Clean expired cooldowns (older than 24 hours)
        const expiredEntries = allEntries.filter(entry => {
            if (entry.id.includes('_cooldown_') || 
                entry.id.startsWith('death_cooldown_') ||
                entry.id.startsWith('prank_cooldown_')) {

                const age = now - (entry.value || 0);
                return age > 24 * 60 * 60 * 1000; // 24 hours
            }
            return false;
        });

        for (const entry of expiredEntries) {
            await db.delete(entry.id);
            cleanedCount++;
        }

        // Additional garbage collection for battle-related stray entries
        const battleStrayEntries = allEntries.filter(entry => {
            return entry.id.startsWith("turn_attack_") ||
                   entry.id.startsWith("monster_damage_") ||
                   entry.id.startsWith("user_freeze_used_") ||
                   entry.id === "freeze_used_this_combat" ||
                   entry.id === "monsters_frozen_this_turn" ||
                   entry.id === "currentMonsters" ||
                   entry.id === "currentMonsterHealth" ||
                   entry.id.startsWith("monster_health_") ||
                   entry.id.startsWith("battle_") ||
                   (entry.id.startsWith("player_troops_") && entry.value <= 0) ||
                   (entry.id.startsWith("player_traps_") && entry.value <= 0);
        });
        
        // Quest system garbage collection
        const questStrayEntries = allEntries.filter(entry => {
            return entry.id.startsWith("quest_progress_") ||
                   entry.id.startsWith("quest_state_") ||
                   entry.id.startsWith("quest_data_") ||
                   entry.id.startsWith("maze_") ||
                   entry.id.startsWith("chest_") ||
                   entry.id.startsWith("mystery_") ||
                   entry.id.startsWith("riddle_") ||
                   entry.id.startsWith("trolley_") ||
                   entry.id.startsWith("dragon_") ||
                   entry.id.startsWith("combat_") ||
                   entry.id.startsWith("monster_quest_");
        });

        for (const entry of battleStrayEntries) {
            await db.delete(entry.id);
            cleanedCount++;
        }
        
        for (const entry of questStrayEntries) {
            await db.delete(entry.id);
            cleanedCount++;
        }
        
        // Gambling session garbage collection (sessions older than 1 hour)
        const gamblingStrayEntries = allEntries.filter(entry => {
            const age = now - (entry.value || 0);
            return (entry.id.startsWith("blackjack_") ||
                   entry.id.startsWith("poker_") ||
                   entry.id.startsWith("roulette_") ||
                   entry.id.startsWith("slots_") ||
                   entry.id.startsWith("craps_")) && 
                   age > 3600000; // 1 hour
        });
        
        for (const entry of gamblingStrayEntries) {
            await db.delete(entry.id);
            cleanedCount++;
        }
        
        // Empty item cleanup - remove items with 0 or negative quantities (but preserve player data structure)
        const emptyItemEntries = allEntries.filter(entry => {
            return (entry.id.startsWith("weapon_") ||
                   entry.id.startsWith("armor_") ||
                   entry.id.startsWith("crystal_")) &&
                   entry.value <= 0;
        });
        
        for (const entry of emptyItemEntries) {
            await db.delete(entry.id);
            cleanedCount++;
        }
        
        // NOTE: Player skills, feats, items, wallet, and bank balances are NEVER cleaned up
        // Only temporary/stray data gets removed to preserve all player progression
        
        // PvP tracking cleanup - remove old attack/battle tracking
        const pvpTrackingEntries = allEntries.filter(entry => {
            return entry.id.startsWith("in_battle_") ||
                   entry.id.startsWith("battle_turn_") ||
                   entry.id.startsWith("last_attack_") ||
                   entry.id.startsWith("combat_state_") ||
                   entry.id.includes("_vs_");
        });
        
        for (const entry of pvpTrackingEntries) {
            await db.delete(entry.id);
            cleanedCount++;
        }

        // Violate/prank tracking cleanup - old prank battle data
        const prankTrackingEntries = allEntries.filter(entry => {
            return entry.id.startsWith("prank_battle_") ||
                   entry.id.startsWith("violate_session_") ||
                   entry.id.startsWith("prank_state_");
        });
        
        for (const entry of prankTrackingEntries) {
            await db.delete(entry.id);
            cleanedCount++;
        }

        // Debug/testing entries cleanup 
        const debugEntries = allEntries.filter(entry => {
            return entry.id.startsWith("debug_") ||
                   entry.id.startsWith("test_") ||
                   entry.id.startsWith("temp_") ||
                   entry.id.includes("_debug") ||
                   entry.id.includes("_test");
        });
        
        for (const entry of debugEntries) {
            await db.delete(entry.id);
            cleanedCount++;
        }

        // Shop transaction logs cleanup (if any temporary shop data exists)
        const shopTempEntries = allEntries.filter(entry => {
            return entry.id.startsWith("shop_cart_") ||
                   entry.id.startsWith("shop_session_") ||
                   entry.id.startsWith("transaction_temp_");
        });
        
        for (const entry of shopTempEntries) {
            await db.delete(entry.id);
            cleanedCount++;
        }

        // UI state/session cleanup 
        const uiStateEntries = allEntries.filter(entry => {
            return entry.id.startsWith("ui_state_") ||
                   entry.id.startsWith("menu_state_") ||
                   entry.id.startsWith("dialog_") ||
                   entry.id.startsWith("interaction_");
        });
        
        for (const entry of uiStateEntries) {
            await db.delete(entry.id);
            cleanedCount++;
        }

        // Message/chat temporary data cleanup
        const messageDataEntries = allEntries.filter(entry => {
            return entry.id.startsWith("msg_") ||
                   entry.id.startsWith("embed_") ||
                   entry.id.startsWith("reply_");
        });
        
        for (const entry of messageDataEntries) {
            await db.delete(entry.id);
            cleanedCount++;
        }

        // Old feature flags or config overrides cleanup
        const configTempEntries = allEntries.filter(entry => {
            return entry.id.startsWith("feature_flag_") ||
                   entry.id.startsWith("config_override_") ||
                   entry.id.startsWith("setting_temp_");
        });
        
        for (const entry of configTempEntries) {
            await db.delete(entry.id);
            cleanedCount++;
        }

        if (cleanedCount > 0) {
            console.log(`🧹 Cleaned up ${cleanedCount} expired entries (cooldowns + battle debris)`);
        }

    } catch (error) {
        console.error('Error during cooldown cleanup:', error);
    }
});