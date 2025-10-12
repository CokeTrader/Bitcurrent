// Passport configuration for Google OAuth
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { query } = require('./database');
const { v4: uuidv4 } = require('uuid');

// Configure Google OAuth strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${process.env.BACKEND_URL || 'https://bitcurrent-production.up.railway.app'}/api/v1/auth/google/callback`,
    passReqToCallback: true
  },
  async function(request, accessToken, refreshToken, profile, done) {
    try {
      // Check if user exists with this Google ID
      let user = await query(
        'SELECT * FROM users WHERE google_id = $1',
        [profile.id]
      );

      if (user.rows.length > 0) {
        // User exists, return user
        return done(null, user.rows[0]);
      }

      // Check if user exists with this email
      const email = profile.emails[0].value;
      user = await query(
        'SELECT * FROM users WHERE email = $1',
        [email.toLowerCase()]
      );

      if (user.rows.length > 0) {
        // Link Google account to existing user
        await query(
          'UPDATE users SET google_id = $1, auth_provider = $2 WHERE id = $3',
          [profile.id, 'google', user.rows[0].id]
        );
        return done(null, user.rows[0]);
      }

      // Create new user
      const userId = uuidv4();
      const newUser = await query(
        `INSERT INTO users (id, email, google_id, auth_provider, first_name, last_name, email_verified)
         VALUES ($1, $2, $3, $4, $5, $6, true)
         RETURNING *`,
        [
          userId,
          email.toLowerCase(),
          profile.id,
          'google',
          profile.name?.givenName || profile.displayName,
          profile.name?.familyName || null
        ]
      );

      return done(null, newUser.rows[0]);
      
    } catch (error) {
      return done(error, null);
    }
  }
));

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await query('SELECT * FROM users WHERE id = $1', [id]);
    done(null, user.rows[0]);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;

