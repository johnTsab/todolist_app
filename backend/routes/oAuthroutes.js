// backend/routes/oauthRoutes.js
const express = require('express');
const router = express.Router();
const passport = require('../src/config/passport');
const { googleCallbackController } = require('../controllers/oAuthcontroller');

// Initiate Google OAuth
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
  })
);

// Google OAuth callback
router.get(
  '/google/callback',
  passport.authenticate('google', {
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=oauth_failed`,
    session: false, 
  }),
  googleCallbackController
);

module.exports = router;