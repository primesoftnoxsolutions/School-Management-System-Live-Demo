import session from "express-session";
import MongoStore from "connect-mongo";
import { env } from "../config/env.js";

const isCrossSite =
  env.isProduction &&
  Boolean(env.frontendUrl) &&
  !/localhost|127\.0\.0\.1/i.test(env.frontendUrl);

const sessionOptions = {
  secret: env.sessionSecret,
  resave: false,
  saveUninitialized: false,
  name: "connect.sid",
  cookie: {
    httpOnly: true,
    // Cross-site (Vercel UI + Railway API) needs SameSite=None; Secure.
    secure: isCrossSite ? true : env.cookieSecure,
    sameSite: isCrossSite ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  },
};

if (env.isProduction && env.mongodbUri) {
  sessionOptions.store = MongoStore.create({
    mongoUrl: env.mongodbUri,
    ttl: 7 * 24 * 60 * 60,
    touchAfter: 24 * 3600,
  });
}

export const sessionMiddleware = session(sessionOptions);
