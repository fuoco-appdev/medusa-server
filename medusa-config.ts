import { loadEnv, defineConfig, Modules } from "@medusajs/framework/utils";

loadEnv(process.env.NODE_ENV || "production", process.cwd());

// CORS when consuming Medusa from admin
const ADMIN_CORS = process.env.ADMIN_CORS || "http://localhost:9000";

// CORS to avoid issues when consuming Medusa from a client
const STORE_CORS = process.env.STORE_CORS || "http://localhost:8000";

const DATABASE_URL =
  process.env.DATABASE_URL || "postgres://localhost/medusa-starter-default";

const plugins = [];

const modules = [
  {
    resolve: "@medusajs/notification",
    options: {
      providers: [
        {
          resolve: "./src/modules/resend-notification",
          id: "resend",
          options: {
            api_key: process.env.RESEND_API_KEY,
            from: process.env.RESEND_FROM,
          },
        },
      ],
    },
  },
  {
    resolve: "./src/modules/resend-notification",
  },
];

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: DATABASE_URL,
    http: {
      storeCors: STORE_CORS!,
      adminCors: ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
    },
  },
  admin: {
    backendUrl: process.env.MEDUSA_BACKEND_URL || "http://localhost:9000",
  },
  plugins,
  modules,
});
