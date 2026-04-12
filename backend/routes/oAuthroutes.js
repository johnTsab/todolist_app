// backend/routes/oauthRoutes.js
const express = require('express');
const router = express.Router();
const passport = require('../passport')
const { googleCallbackController } = require('../controllers/oAuthcontroller');

// Initiate Google OAuth
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    prompt: 'select_account', 
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