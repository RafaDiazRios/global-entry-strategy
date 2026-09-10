import { defineConfig } from "drizzle-kit";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required to run drizzle commands");
}

export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  // Las tablas no viven en `public`: la base puede alojar otras aplicaciones.
  schemaFilter: ["entry_strategy"],
  dbCredentials: {
    url: connectionString,
  },
});
