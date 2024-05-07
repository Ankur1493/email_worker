import { Router, Response } from "express";
import passport from "../config/passport";

const router = Router();
router.get('/',
  passport.authenticate('google', {
    scope: ['profile', 'email', 'https://www.googleapis.com/auth/gmail.modify'],
    accessType: 'offline',
    prompt: 'consent'
  }));

router.get('/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (_, res: Response) => {
    res.redirect('/');
  });

export { router as GoogleRoutes }
