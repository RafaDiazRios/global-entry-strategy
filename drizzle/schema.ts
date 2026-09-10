import { boolean, int, json, mediumtext, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

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
  /** Caso de estudio del que procede el escenario, cuando lo hay. */
  caseId: int("caseId"),
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

/**
 * Caso de estudio: la unidad de análisis del copiloto.
 *
 * Un caso agrupa los documentos que lo describen y el libro de evidencias que se extrae
 * de ellos. Un escenario de comparación de países puede colgar de un caso, pero sigue
 * funcionando sin él para no romper los escenarios existentes.
 */
export const strategyCases = mysqlTable("strategyCases", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  /** El mandato en una frase: qué hay que decidir. */
  decisionQuestion: text("decisionQuestion"),
  companyName: varchar("companyName", { length: 180 }),
  homeCountry: varchar("homeCountry", { length: 120 }),
  industry: varchar("industry", { length: 180 }),
  subIndustry: varchar("subIndustry", { length: 180 }),
  caseYear: int("caseYear"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/** Documento asociado a un caso: el PDF del caso, un anexo o texto pegado. */
export const strategyCaseDocuments = mysqlTable("strategyCaseDocuments", {
  id: int("id").autoincrement().primaryKey(),
  caseId: int("caseId").notNull(),
  userId: int("userId").notNull(),
  filename: varchar("filename", { length: 260 }).notNull(),
  mimeType: varchar("mimeType", { length: 120 }).notNull(),
  /** Clave en almacenamiento cuando el documento es un fichero binario. */
  storageKey: varchar("storageKey", { length: 500 }),
  /** Texto plano cuando el documento se pega directamente. */
  textContent: mediumtext("textContent"),
  bytes: int("bytes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/**
 * Libro de evidencias.
 *
 * Cada afirmación que sostiene un juicio vive aquí con su fuente y su localizador. Una
 * evidencia propuesta por la IA entra como `suggested` y no alimenta ningún cálculo hasta
 * que una persona la acepta.
 */
export const strategyEvidence = mysqlTable("strategyEvidence", {
  id: int("id").autoincrement().primaryKey(),
  caseId: int("caseId").notNull(),
  userId: int("userId").notNull(),
  kind: mysqlEnum("kind", ["document", "public_data", "interview", "assumption", "ai_extraction"]).notNull(),
  claim: text("claim").notNull(),
  sourceLabel: varchar("sourceLabel", { length: 300 }).notNull(),
  documentId: int("documentId"),
  /** Página, párrafo o celda dentro de la fuente. */
  locator: varchar("locator", { length: 160 }),
  quote: text("quote"),
  url: varchar("url", { length: 1000 }),
  retrievedAt: varchar("retrievedAt", { length: 80 }),
  /** 5 = dato oficial verificable; 1 = supuesto no contrastado. */
  reliability: int("reliability").default(3).notNull(),
  /** Ítem del marco al que da soporte, con la forma `bloque.grupo.item`. */
  targetPath: varchar("targetPath", { length: 160 }),
  countryCode: varchar("countryCode", { length: 3 }),
  createdBy: mysqlEnum("createdBy", ["user", "ai"]).default("user").notNull(),
  status: mysqlEnum("status", ["accepted", "suggested", "rejected"]).default("accepted").notNull(),
  /** La cita literal se localizó en el texto de origen. */
  quoteVerified: boolean("quoteVerified").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
