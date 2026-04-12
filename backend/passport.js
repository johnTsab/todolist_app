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

    console.log('OAuth attempt for:', email); // ← ΝΕΟ

    const [existingUser] = await db.query('SELECT * FROM users WHERE email = ?', [email]);

    if (existingUser.length > 0) {
      console.log('Existing user found:', existingUser[0].id); // ← ΝΕΟ
      return done(null, existingUser[0]);
    }

    console.log('Creating new user...'); // ← ΝΕΟ

    const randomPassword = await bcrypt.hash(Math.random().toString(36), 10);

    const [result] = await db.query(
      'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
      [username, email, randomPassword, 'USER']
    );

    console.log('User created with id:', result.insertId); // ← ΝΕΟ

    await db.query(
      'INSERT INTO logs (user_id, action, activity_type) VALUES (?, ?, ?)',
      [result.insertId, `User registered via Google OAuth`, 'AUTH']
    );

    const [newUser] = await db.query('SELECT * FROM users WHERE id = ?', [result.insertId]);

    console.log('New user fetched:', newUser[0]); // ← ΝΕΟ

    try {
      const { subject, html } = templates.welcomeEmail(username);
      sendEmail(email, subject, html);
    } catch (err) {
      console.error('Welcome email error:', err.message);
    }

    return done(null, newUser[0]);
  } catch (err) {
    console.error('OAuth Strategy error:', err); // ← ΝΕΟ
    return done(err, null);
  }
}
  )
);

module.exports = passport;