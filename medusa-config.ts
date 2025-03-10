import { loadEnv, defineConfig, Modules } from "@medusajs/framework/utils";

loadEnv(process.env.NODE_ENV || "production", process.cwd());

// CORS when consuming Medusa from admin
const ADMIN_CORS = process.env.ADMIN_CORS || "http://localhost:9000";

// CORS to avoid issues when consuming Medusa from a client
const STORE_CORS = process.env.STORE_CORS || "http://localhost:8000";

const DATABASE_URL =
  process.env.DATABASE_URL || "postgres://localhost/medusa-starter-default";

const REDIS_PASSWORD = process.env.REDIS_PASSWORD || "";
const REDIS_URL =
  process.env.REDIS_URL || `redis://:${REDIS_PASSWORD}@localhost:6379`;
const REDIS_TLS = process.env.REDIS_TLS || "false";

const plugins = [
  // {
  //   resolve: `medusa-plugin-sendgrid`,
  //   options: {
  //     api_key: process.env.SENDGRID_API_KEY,
  //     from: process.env.SENDGRID_FROM,
  //     order_placed_template: process.env.SENDGRID_ORDER_PLACED_ID,
  //     order_canceled_template: process.env.SENDGRID_ORDER_CANCELED_ID,
  //     order_shipped_template: process.env.SENDGRID_ORDER_SHIPPED_ID,
  //     order_return_requested_template: process.env.SENDGRID_ORDER_RETURN_REQUESTED_ID,
  //     order_items_returned_template: process.env.SENDGRID_ORDER_ITEMS_RETURNED_ID,
  //     claim_shipment_created_template: process.env.SENDGRID_CLAIM_SHIPMENT_CREATED_ID,
  //     swap_created_template: process.env.SENDGRID_SWAP_CREATED_ID,
  //     swap_shipment_created_template: process.env.SENDGRID_SWAP_SHIPMENT_CREATED_ID,
  //     swap_received_template: process.env.SENDGRID_SWAP_RECEIVED_ID,
  //     gift_card_created_template: process.env.SENDGRID_GIFT_CARD_CREATED_ID,
  //     customer_password_reset_template: process.env.SENDGRID_CUSTOMER_PASSWORD_RESET_ID,
  //     user_password_reset_template: process.env.SENDGRID_USER_PASSWORD_RESET_ID,
  //     medusa_restock_template: process.env.SENDGRID_MEDUSA_RESTOCK_ID
  //   }
  // },
  // {
  //   resolve: `medusa-file-spaces`,
  //   options: {
  //       spaces_url: process.env.SPACE_URL,
  //       bucket: process.env.SPACE_BUCKET,
  //       endpoint: process.env.SPACE_ENDPOINT,
  //       access_key_id: process.env.SPACE_ACCESS_KEY_ID,
  //       secret_access_key: process.env.SPACE_SECRET_ACCESS_KEY,
  //   },
  // },
  // {
  //   resolve: `medusa-plugin-meilisearch`,
  //   options: {
  //     config: {
  //       host: process.env.MEILISEARCH_HOST,
  //       apiKey: process.env.MEILISEARCH_API_KEY,
  //     },
  //     settings: {
  //       products_custom: {
  //         indexSettings: {
  //           searchableAttributes: process.env.MEILI_PRODUCTS_SEARCHABLE_ATTRIBUTES.split(' ') ?? [],
  //           displayedAttributes: process.env.MEILI_PRODUCTS_DISPLAYED_ATTRIBUTES.split(' ') ?? [],
  //           filterableAttributes: process.env.MEILI_PRODUCTS_FILTERABLE_ATTRIBUTES.split(' ') ?? [],
  //           sortableAttributes: process.env.MEILI_PRODUCTS_SORTABLE_ATTRIBUTES.split(' ') ?? [],
  //         },
  //       },
  //       stock_locations: {
  //         indexSettings: {
  //           searchableAttributes: process.env.MEILI_STOCK_LOCATIONS_SEARCHABLE_ATTRIBUTES.split(' ') ?? [],
  //           displayedAttributes: process.env.MEILI_STOCK_LOCATIONS_DISPLAYED_ATTRIBUTES.split(' ') ?? [],
  //           filterableAttributes: process.env.MEILI_STOCK_LOCATIONS_FILTERABLE_ATTRIBUTES.split(' ') ?? [],
  //           sortableAttributes: process.env.MEILI_STOCK_LOCATIONS_SORTABLE_ATTRIBUTES.split(' ') ?? [],
  //         },
  //         transformer: (location) => {
  //           return location
  //         }
  //       },
  //     },
  //   },
  // },
];

const modules = [
  {
    resolve: "@medusajs/event-bus-redis",
    key: Modules.EVENT_BUS,
    options: {
      redisUrl: REDIS_URL,
      // redisOptions: {
      //   password: REDIS_PASSWORD,
      //   tls: REDIS_TLS
      // }
    },
  },
  {
    resolve: "@medusajs/cache-redis",
    key: Modules.CACHE,
    options: {
      redisUrl: REDIS_URL,
      // redisOptions: {
      //   password: REDIS_PASSWORD,
      //   tls: REDIS_TLS
      // }
    },
  },
  {
    resolve: "@medusajs/workflow-engine-redis",
    key: Modules.WORKFLOW_ENGINE,
    options: {
      redis: {
        url: REDIS_URL,
      },
    },
  },
  {
    resolve: "@medusajs/medusa/payment",
    key: Modules.PAYMENT,
    options: {
      providers: [
        {
          resolve: "@medusajs/medusa/payment-stripe",
          id: "stripe",
          options: {
            apiKey: process.env.STRIPE_API_KEY,
          },
        },
      ],
    },
  },
];

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: DATABASE_URL,
    redisUrl: REDIS_URL,
    // redisOptions: {
    //   password: REDIS_PASSWORD,
    // },
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
