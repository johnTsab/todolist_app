const jwt = require('jsonwebtoken');
const db = require('../src/config/database');

const googleCallbackController = async (req, res) => {
  try {
    const user = req.user;

    if (!user) {
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
    }

    const accessToken = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: '1h' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: '1d' }
    );

    await db.query('UPDATE users SET refreshToken = ? WHERE id = ?', [refreshToken, user.id]);

    await db.query(
      'INSERT INTO logs (user_id, action, activity_type) VALUES (?, ?, ?)',
      [user.id, `User logged in via Google OAuth`, 'AUTH']
    );

  res.cookie('refreshToken', refreshToken, {
  httpOnly: true,
  secure: true,
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: 24 * 60 * 60 * 1000,
});

    // Redirect to frontend with access token in URL
    // Frontend will grab it and store in localStorage
    res.redirect(`${process.env.FRONTEND_URL}/oauth-callback?token=${accessToken}`);
  } catch (err) {
    console.error('OAuth callback error:', err);
    res.redirect(`${process.env.FRONTEND_URL}/login?error=server_error`);
  }
};

module.exports = { googleCallbackController };