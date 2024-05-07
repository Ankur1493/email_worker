import passport from "passport";
import { Strategy as GoogleStrategy, Profile } from "passport-google-oauth20";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

passport.use(new GoogleStrategy({
  clientID: process.env.CLIENT_ID as string,
  clientSecret: process.env.CLIENT_SECRET as string,
  callbackURL: 'http://localhost:3000/auth/google/callback'
},
  async (accessToken, refreshToken, profile, cb) => {
    const email = profile.emails?.[0]?.value;
    if (!email) {
      return cb(new Error('Google account has no email'));
    }
    try {
      let user = await prisma.user.findUnique({
        where: {
          email: email,
        },
      });

      if (user) {
        user = await prisma.user.update({
          where: { email: email },
          data: { accessToken: accessToken },
        });
      } else {
        user = await prisma.user.create({
          data: {
            email: email,
            name: profile.displayName,
            accessToken: accessToken,
            refreshToken: refreshToken,
          },
        });
      }
      return cb(null, user);
    } catch (error: any) {
      return cb(error);
    }
  }));

passport.serializeUser((user: any, done) => {
  done(null, user.id); // Serialize user by ID
});

passport.deserializeUser(async (id: any, done) => {
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;

