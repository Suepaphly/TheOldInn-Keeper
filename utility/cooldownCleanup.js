
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
    tiamat: 86400000       // 24 hours (boss cooldown)
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
