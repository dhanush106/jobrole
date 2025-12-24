const User = require("./models/User");

async function clearExpiredTokens() {
    const now = new Date();

    await User.updateMany(
        { tokenExpiresAt: { $lt: now } },
        { $set: { token: "", tokenExpiresAt: null } }
    );
}

module.exports = clearExpiredTokens;
