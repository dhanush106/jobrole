// backend/auth/google.js
const { OAuth2Client } = require("google-auth-library");
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

async function verifyGoogleToken(token) {
  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    // payload contains user info
    // e.g., email, name, picture, sub (user ID)
    return payload;
  } catch (err) {
    console.error("Google token verification failed:", err.message);
    throw err;
  }
}

module.exports = verifyGoogleToken;
