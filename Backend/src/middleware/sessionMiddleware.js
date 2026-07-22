import session from "express-session";
import MongoStore from "connect-mongo";
import { env } from "../config/env.js";

const sessionOptions = {
  secret: env.sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: env.cookieSecure,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    sameSite: env.isProduction ? "lax" : "lax",
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
