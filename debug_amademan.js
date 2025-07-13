
const { QuickDB } = require("quick.db");
const db = new QuickDB();

async function debugAmademan() {
    console.log("=== DEBUGGING AMADEMAN DATABASE ENTRIES ===\n");
    
    // Get all database entries
    const allEntries = await db.all();
    
    // Search for any entries containing "amademan" (case-insensitive)
    const amademanEntries = allEntries.filter(entry => 
        entry.id.toLowerCase().includes("amademan")
    );
    
    console.log("All entries for amademan:");
    if (amademanEntries.length === 0) {
        console.log("No entries found for amademan");
    } else {
        amademanEntries.forEach(entry => {
            console.log(`${entry.id}: ${entry.value}`);
        });
    }
    
    console.log("\n=== BANK LEADERBOARD ANALYSIS ===");
    
    // Get bank entries specifically
    const bankEntries = allEntries
        .filter(entry => entry.id.startsWith("bank_") && entry.value > 0)
        .map(entry => [entry.id, entry.value])
        .sort((a, b) => b[1] - a[1]);
    
    console.log("Top 10 bank entries:");
    for (let i = 0; i < Math.min(bankEntries.length, 10); i++) {
        const [key, amount] = bankEntries[i];
        const userId = key.split('_')[1];
        console.log(`${i + 1}. User ID: ${userId}, Bank: ${amount}`);
    }
    
    // Check if amademan has a bank entry
    const amademanBankEntry = bankEntries.find(([key, value]) => 
        key.toLowerCase().includes("amademan")
    );
    
    if (amademanBankEntry) {
        console.log(`\nAmademan bank entry found: ${amademanBankEntry[0]} = ${amademanBankEntry[1]}`);
        const position = bankEntries.findIndex(([key, value]) => key === amademanBankEntry[0]) + 1;
        console.log(`Amademan's position in bank leaderboard: ${position}`);
    } else {
        console.log("\nNo bank entry found for amademan");
    }
    
    // Also check for partial matches in user IDs
    console.log("\n=== CHECKING FOR SIMILAR USER IDs ===");
    const allUserIds = new Set();
    allEntries.forEach(entry => {
        if (entry.id.includes('_')) {
            const parts = entry.id.split('_');
            if (parts.length >= 2) {
                allUserIds.add(parts[parts.length - 1]); // Get the user ID part
            }
        }
    });
    
    const similarIds = Array.from(allUserIds).filter(id => 
        id.toLowerCase().includes("amade") || 
        id.toLowerCase().includes("man") ||
        id.includes("amade")
    );
    
    console.log("User IDs that might be related to amademan:");
    similarIds.forEach(id => console.log(id));
    
    console.log("\n=== COMPLETE AMADEMAN SEARCH ===");
    // Search all entries for any that might contain parts of the name
    const possibleMatches = allEntries.filter(entry => {
        const lowerEntry = entry.id.toLowerCase();
        return lowerEntry.includes("amade") || lowerEntry.includes("deman");
    });
    
    console.log("Possible matches for amademan:");
    possibleMatches.forEach(entry => {
        console.log(`${entry.id}: ${entry.value}`);
    });
}

debugAmademan().catch(console.error);
