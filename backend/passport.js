const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const db = require('./src/config/database');
const bcrypt = require('bcrypt');

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const [rows] = await db.query('SELECT id, username, email, role FROM users WHERE id = ?', [id]);
    done(null, rows[0]);
  } catch (err) {
    done(err, null);
  }
});

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;
        const username = profile.displayName || email.split('@')[0];
        const [existingUser] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (existingUser.length > 0) {
          return done(null, existingUser[0]);
        }
        const randomPassword = await bcrypt.hash(Math.random().toString(36), 10);
        const [result] = await db.query(
          'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
          [username, email, randomPassword, 'USER']
        );
        await db.query(
          'INSERT INTO logs (user_id, action, activity_type) VALUES (?, ?, ?)',
          [result.insertId, `User registered via Google OAuth`, 'AUTH']
        );
        const [newUser] = await db.query('SELECT * FROM users WHERE id = ?', [result.insertId]);
        
        const { subject, html } = templates.welcomeEmail(username);
        await sendEmail(email, subject, html);

        return done(null, newUser[0]);
      } catch (err) {
        console.error('OAuth error:', err);
        return done(err, null);
      }
    }
  )
);

module.exports = passport;