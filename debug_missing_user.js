
const { QuickDB } = require("quick.db");
const db = new QuickDB();

async function debugMissingUsers() {
    console.log("=== DEBUGGING MISSING BANK USERS ===\n");
    
    // Get all database entries
    const allEntries = await db.all();
    
    // Get bank entries specifically
    const bankEntries = allEntries
        .filter(entry => entry.id.startsWith("bank_") && entry.value > 0)
        .map(entry => [entry.id, entry.value])
        .sort((a, b) => b[1] - a[1]);
    
    console.log("ALL BANK ENTRIES (sorted by amount):");
    for (let i = 0; i < bankEntries.length; i++) {
        const [key, amount] = bankEntries[i];
        const userId = key.split('_')[1];
        console.log(`${i + 1}. User ID: ${userId}, Bank: ${amount} kopeks`);
    }
    
    console.log(`\nTotal bank accounts with money: ${bankEntries.length}`);
    
    if (bankEntries.length > 0) {
        const topUser = bankEntries[0];
        const topUserId = topUser[0].split('_')[1];
        const topAmount = topUser[1];
        
        console.log(`\nTop user should be: User ID ${topUserId} with ${topAmount} kopeks`);
        
        // Check if this matches rumbler_channel
        if (topAmount === 82) {
            console.log("This matches the current leaderboard showing 82 kopeks for rumbler_channel");
        } else {
            console.log(`*** MISMATCH: Expected ${topAmount} but leaderboard shows 82 for rumbler_channel ***`);
        }
    }
    
    // Look for any user with significantly more than 82 kopeks
    const richUsers = bankEntries.filter(([key, amount]) => amount > 82);
    
    if (richUsers.length > 0) {
        console.log("\n=== USERS WITH MORE THAN 82 KOPEKS ===");
        richUsers.forEach(([key, amount]) => {
            const userId = key.split('_')[1];
            console.log(`User ID: ${userId}, Bank: ${amount} kopeks`);
        });
    } else {
        console.log("\nNo users found with more than 82 kopeks in bank");
    }
}

debugMissingUsers().catch(console.error);
