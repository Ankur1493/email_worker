import { Router, Request, Response } from "express";
import passport from "../config/passport";

const router = Router();
router.get('/',
  passport.authenticate('google', { scope: ['profile', 'email', 'https://www.googleapis.com/auth/gmail.modify'] }));

router.get('/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req: Request, res: Response) => {
    // Successful authentication, redirect home.
    res.redirect('/');
  });

export { router as GoogleRoutes }
