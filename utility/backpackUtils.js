
const { QuickDB } = require("quick.db");
const db = new QuickDB();

async function getBackpackCount(userId) {
    const allItems = await db.all();
    
    // Filter user's weapons and armor
    const userWeapons = allItems.filter(item => 
        item.id.startsWith("weapon_") && item.id.endsWith(`_${userId}`) && item.value > 0
    );
    const userArmor = allItems.filter(item => 
        item.id.startsWith("armor_") && item.id.endsWith(`_${userId}`) && item.value > 0
    );
    const userCrystals = allItems.filter(item => 
        item.id.startsWith("crystal_") && item.id.endsWith(`_${userId}`) && item.value > 0
    );

    let totalItems = 0;
    for (const weapon of userWeapons) {
        totalItems += weapon.value;
    }
    for (const armor of userArmor) {
        totalItems += armor.value;
    }
    for (const crystal of userCrystals) {
        totalItems += crystal.value;
    }

    return totalItems;
}

async function canAddToBackpack(userId, itemCount = 1) {
    const currentCount = await getBackpackCount(userId);
    return currentCount + itemCount <= 5;
}

function getBackpackFullMessage() {
    return "🎒 Your backpack is full! You can only carry 5 items. Use `=shop sell [item]` to make space.";
}

module.exports = {
    getBackpackCount,
    canAddToBackpack,
    getBackpackFullMessage
};
