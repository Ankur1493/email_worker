import passport from "passport";
import { Strategy as GoogleStrategy, Profile } from "passport-google-oauth20";

passport.use(new GoogleStrategy({
  clientID: process.env.CLIENT_ID as string,
  clientSecret: process.env.CLIENT_SECRET as string,
  callbackURL: 'http://localhost:3000/auth/google/callback'
},
  (accessToken, refreshToken, profile, cb) => {
    // Here, you would ideally match the Google user with your user database
    // For this example, we'll just pass the profile through
    console.log(process.env.CALLBACK_URL)
    console.log(profile)
    return cb(null, profile);
  }
));

passport.serializeUser((user, done) => {
  done(null, user);
});
passport.deserializeUser((obj: any, done) => {
  done(null, obj);
});

export default passport;
