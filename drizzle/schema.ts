import { int, json, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/** Core user table backing Manus authentication. */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const strategyScenarios = mysqlTable("strategyScenarios", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 180 }).notNull(),
  companyName: varchar("companyName", { length: 180 }).notNull(),
  homeCountry: varchar("homeCountry", { length: 120 }).notNull(),
  industry: varchar("industry", { length: 180 }).notNull(),
  businessModel: varchar("businessModel", { length: 120 }).notNull(),
  objective: mysqlEnum("objective", ["market", "resources", "learning", "coordination"]).notNull(),
  horizonYears: int("horizonYears").notNull(),
  inputJson: json("inputJson").notNull(),
  resultJson: json("resultJson").notNull(),
  sourceRefreshAt: timestamp("sourceRefreshAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type StrategyScenario = typeof strategyScenarios.$inferSelect;
export type InsertStrategyScenario = typeof strategyScenarios.$inferInsert;
