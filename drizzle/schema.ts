import { boolean, index, integer, jsonb, pgSchema, serial, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/pg-core";

/**
 * Todo vive en un esquema propio, no en `public`.
 *
 * La base es un PostgreSQL de Supabase que puede alojar más de una aplicación. Un esquema
 * dedicado evita colisiones de nombres y permite conceder o revocar el acceso de golpe.
 */
export const entryStrategy = pgSchema("entry_strategy");

export const userRole = entryStrategy.enum("userRole", ["user", "admin"]);
export const scenarioObjective = entryStrategy.enum("scenarioObjective", ["market", "resources", "learning", "coordination"]);
export const approvalRecommendation = entryStrategy.enum("approvalRecommendation", ["advance", "test"]);
export const approvalStatus = entryStrategy.enum("approvalStatus", ["not_started", "in_review", "approved", "changes_requested", "on_hold", "closed"]);
export const milestoneStatus = entryStrategy.enum("milestoneStatus", ["pending", "in_progress", "blocked", "complete", "not_applicable"]);
export const evidenceKind = entryStrategy.enum("evidenceKind", ["document", "public_data", "interview", "assumption", "ai_extraction"]);
export const evidenceAuthor = entryStrategy.enum("evidenceAuthor", ["user", "ai"]);
export const evidenceStatus = entryStrategy.enum("evidenceStatus", ["accepted", "suggested", "rejected"]);
export const caseModuleKey = entryStrategy.enum("caseModuleKey", ["ambition", "positioning", "entry", "partnering", "route"]);

/** Usuario de la aplicación. `openId` es el identificador estable del proveedor de acceso. */
export const users = entryStrategy.table("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: userRole("role").default("user").notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
  lastSignedIn: timestamp("lastSignedIn", { withTimezone: true }).defaultNow().notNull(),
});

export const strategyScenarios = entryStrategy.table("strategyScenarios", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  name: varchar("name", { length: 180 }).notNull(),
  companyName: varchar("companyName", { length: 180 }).notNull(),
  homeCountry: varchar("homeCountry", { length: 120 }).notNull(),
  industry: varchar("industry", { length: 180 }).notNull(),
  businessModel: varchar("businessModel", { length: 120 }).notNull(),
  objective: scenarioObjective("objective").notNull(),
  horizonYears: integer("horizonYears").notNull(),
  /** Caso de estudio del que procede el escenario, cuando lo hay. */
  caseId: integer("caseId"),
  inputJson: jsonb("inputJson").notNull(),
  resultJson: jsonb("resultJson").notNull(),
  sourceRefreshAt: timestamp("sourceRefreshAt", { withTimezone: true }),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
}, (table) => [index("strategyScenarios_userId_idx").on(table.userId), index("strategyScenarios_caseId_idx").on(table.caseId)]);

/** Internal decision gates. They document review work and do not authorize financial transactions. */
export const strategyApprovals = entryStrategy.table("strategyApprovals", {
  id: serial("id").primaryKey(),
  scenarioId: integer("scenarioId").notNull(),
  userId: integer("userId").notNull(),
  countryCode: varchar("countryCode", { length: 3 }).notNull(),
  countryName: varchar("countryName", { length: 120 }).notNull(),
  recommendation: approvalRecommendation("recommendation").notNull(),
  status: approvalStatus("status").default("not_started").notNull(),
  responsible: varchar("responsible", { length: 160 }).notNull(),
  reviewer: varchar("reviewer", { length: 160 }),
  reviewAt: timestamp("reviewAt", { withTimezone: true }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
}, (table) => [
  index("strategyApprovals_userId_scenarioId_idx").on(table.userId, table.scenarioId),
  // Un país solo puede tener una puerta de decisión abierta por escenario: lo garantiza la base,
  // no solo la comprobación previa de `createApprovalWorkflow`.
  uniqueIndex("strategyApprovals_scenario_country_uq").on(table.scenarioId, table.countryCode),
]);

export const strategyApprovalMilestones = entryStrategy.table("strategyApprovalMilestones", {
  id: serial("id").primaryKey(),
  approvalId: integer("approvalId").notNull(),
  title: varchar("title", { length: 220 }).notNull(),
  responsible: varchar("responsible", { length: 160 }),
  dueAt: timestamp("dueAt", { withTimezone: true }),
  status: milestoneStatus("status").default("pending").notNull(),
  evidence: text("evidence"),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
}, (table) => [index("strategyApprovalMilestones_approvalId_idx").on(table.approvalId)]);

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
export const strategyCases = entryStrategy.table("strategyCases", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  /** El mandato en una frase: qué hay que decidir. */
  decisionQuestion: text("decisionQuestion"),
  companyName: varchar("companyName", { length: 180 }),
  homeCountry: varchar("homeCountry", { length: 120 }),
  industry: varchar("industry", { length: 180 }),
  subIndustry: varchar("subIndustry", { length: 180 }),
  caseYear: integer("caseYear"),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
}, (table) => [index("strategyCases_userId_idx").on(table.userId)]);

/** Documento asociado a un caso: el PDF del caso, un anexo o texto pegado. */
export const strategyCaseDocuments = entryStrategy.table("strategyCaseDocuments", {
  id: serial("id").primaryKey(),
  caseId: integer("caseId").notNull(),
  userId: integer("userId").notNull(),
  filename: varchar("filename", { length: 260 }).notNull(),
  mimeType: varchar("mimeType", { length: 120 }).notNull(),
  /** Clave en almacenamiento cuando el documento es un fichero binario. */
  storageKey: varchar("storageKey", { length: 500 }),
  /** Texto plano cuando el documento se pega directamente. */
  textContent: text("textContent"),
  bytes: integer("bytes"),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [index("strategyCaseDocuments_caseId_idx").on(table.caseId)]);

/**
 * Libro de evidencias.
 *
 * Cada afirmación que sostiene un juicio vive aquí con su fuente y su localizador. Una
 * evidencia propuesta por la IA entra como `suggested` y no alimenta ningún cálculo hasta
 * que una persona la acepta.
 */
export const strategyEvidence = entryStrategy.table("strategyEvidence", {
  id: serial("id").primaryKey(),
  caseId: integer("caseId").notNull(),
  userId: integer("userId").notNull(),
  kind: evidenceKind("kind").notNull(),
  claim: text("claim").notNull(),
  sourceLabel: varchar("sourceLabel", { length: 300 }).notNull(),
  documentId: integer("documentId"),
  /** Página, párrafo o celda dentro de la fuente. */
  locator: varchar("locator", { length: 160 }),
  quote: text("quote"),
  url: varchar("url", { length: 1000 }),
  retrievedAt: varchar("retrievedAt", { length: 80 }),
  /** 5 = dato oficial verificable; 1 = supuesto no contrastado. */
  reliability: integer("reliability").default(3).notNull(),
  /** Ítem del marco al que da soporte, con la forma `bloque.grupo.item`. */
  targetPath: varchar("targetPath", { length: 160 }),
  countryCode: varchar("countryCode", { length: 3 }),
  createdBy: evidenceAuthor("createdBy").default("user").notNull(),
  status: evidenceStatus("status").default("accepted").notNull(),
  /** La cita literal se localizó en el texto de origen. */
  quoteVerified: boolean("quoteVerified").default(false).notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
}, (table) => [index("strategyEvidence_caseId_status_idx").on(table.caseId, table.status)]);

/**
 * Bloques de análisis de un caso, uno por módulo del blueprint.
 *
 * Cada módulo guarda su propio documento JSON en lugar de repartirse en columnas: la forma
 * de cada bloque la fija `shared/domain`, cambia con cada fase y se valida con zod al
 * entrar. Una tabla por módulo obligaría a una migración por cada campo nuevo.
 */
export const strategyCaseModules = entryStrategy.table("strategyCaseModules", {
  id: serial("id").primaryKey(),
  caseId: integer("caseId").notNull(),
  userId: integer("userId").notNull(),
  moduleKey: caseModuleKey("moduleKey").notNull(),
  payload: jsonb("payload").notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
}, (table) => [uniqueIndex("strategyCaseModules_case_module_uq").on(table.caseId, table.moduleKey)]);

export type StrategyCaseModule = typeof strategyCaseModules.$inferSelect;
