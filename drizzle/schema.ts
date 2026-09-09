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

/** Internal decision gates. They document review work and do not authorize financial transactions. */
export const strategyApprovals = mysqlTable("strategyApprovals", {
  id: int("id").autoincrement().primaryKey(),
  scenarioId: int("scenarioId").notNull(),
  userId: int("userId").notNull(),
  countryCode: varchar("countryCode", { length: 3 }).notNull(),
  countryName: varchar("countryName", { length: 120 }).notNull(),
  recommendation: mysqlEnum("recommendation", ["advance", "test"]).notNull(),
  status: mysqlEnum("status", ["not_started", "in_review", "approved", "changes_requested", "on_hold", "closed"]).default("not_started").notNull(),
  responsible: varchar("responsible", { length: 160 }).notNull(),
  reviewer: varchar("reviewer", { length: 160 }),
  reviewAt: timestamp("reviewAt").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const strategyApprovalMilestones = mysqlTable("strategyApprovalMilestones", {
  id: int("id").autoincrement().primaryKey(),
  approvalId: int("approvalId").notNull(),
  title: varchar("title", { length: 220 }).notNull(),
  responsible: varchar("responsible", { length: 160 }),
  dueAt: timestamp("dueAt"),
  status: mysqlEnum("status", ["pending", "in_progress", "blocked", "complete", "not_applicable"]).default("pending").notNull(),
  evidence: text("evidence"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type StrategyScenario = typeof strategyScenarios.$inferSelect;
export type InsertStrategyScenario = typeof strategyScenarios.$inferInsert;
export type StrategyApproval = typeof strategyApprovals.$inferSelect;
export type StrategyApprovalMilestone = typeof strategyApprovalMilestones.$inferSelect;
