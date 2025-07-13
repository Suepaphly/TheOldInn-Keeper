
const { QuickDB } = require("quick.db");
const db = new QuickDB();

async function hasCrystal(userId, color) {
    const crystalKey = `crystal_${color}_${userId}`;
    const count = await db.get(crystalKey) || 0;
    return count > 0;
}

async function getCrystals(userId) {
    const crystals = {
        white: await db.get(`crystal_white_${userId}`) || 0,
        black: await db.get(`crystal_black_${userId}`) || 0,
        red: await db.get(`crystal_red_${userId}`) || 0,
        blue: await db.get(`crystal_blue_${userId}`) || 0,
        green: await db.get(`crystal_green_${userId}`) || 0
    };
    return crystals;
}

module.exports = {
    hasCrystal,
    getCrystals
};
