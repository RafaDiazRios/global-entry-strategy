import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { InsertStrategyScenario, InsertUser, strategyApprovalMilestones, strategyApprovals, strategyCaseDocuments, strategyCaseModules, strategyCases, strategyEvidence, strategyScenarios, users } from "../drizzle/schema";
import { ENV } from "./_core/env";
import { localizedError } from "@shared/localizedError";

let _db: ReturnType<typeof drizzle> | null = null;

export type ApprovalStatus = "not_started" | "in_review" | "approved" | "changes_requested" | "on_hold" | "closed";
export type MilestoneStatus = "pending" | "in_progress" | "blocked" | "complete" | "not_applicable";
export type ApprovalMilestoneInput = { title: string; responsible?: string | null; dueAt?: Date | null; status?: MilestoneStatus; evidence?: string | null };
export type ApprovalWorkflow = {
  id: number;
  scenarioId: number;
  userId: number;
  countryCode: string;
  countryName: string;
  recommendation: "advance" | "test";
  status: ApprovalStatus;
  responsible: string;
  reviewer: string | null;
  reviewAt: Date;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  milestones: { id: number; approvalId: number; title: string; responsible: string | null; dueAt: Date | null; status: MilestoneStatus; evidence: string | null; createdAt: Date; updatedAt: Date }[];
};

/**
 * Conexión a PostgreSQL.
 *
 * `prepare: false` es obligatorio a través del pooler en modo transacción de Supabase, que
 * no admite sentencias preparadas. Con conexión directa solo cuesta un poco de rendimiento,
 * así que se deja puesto siempre y una variable menos que equivocar al desplegar.
 */
function createClient(url: string) {
  const local = /@(localhost|127\.0\.0\.1)[:/]/.test(url);
  return postgres(url, {
    prepare: false,
    max: 5,
    ssl: local || /sslmode=/.test(url) ? undefined : "require",
  });
}

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try { _db = drizzle(createClient(process.env.DATABASE_URL)); }
    catch (error) { console.warn("[Database] Failed to connect:", error); _db = null; }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  textFields.forEach((field) => {
    if (user[field] !== undefined) { const value = user[field] ?? null; values[field] = value; updateSet[field] = value; }
  });
  values.lastSignedIn = user.lastSignedIn ?? new Date();
  updateSet.lastSignedIn = values.lastSignedIn;
  if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }

  await db.insert(users).values(values).onConflictDoUpdate({ target: users.openId, set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function saveStrategyScenario(values: InsertStrategyScenario) {
  const db = await getDb();
  if (!db) throw localizedError("Base de datos no disponible.", "Database unavailable.");
  const result = await db.insert(strategyScenarios).values(values).returning({ id: strategyScenarios.id });
  return result[0].id;
}

export async function listStrategyScenarios(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({ id: strategyScenarios.id, name: strategyScenarios.name, companyName: strategyScenarios.companyName, homeCountry: strategyScenarios.homeCountry, industry: strategyScenarios.industry, businessModel: strategyScenarios.businessModel, objective: strategyScenarios.objective, horizonYears: strategyScenarios.horizonYears, caseId: strategyScenarios.caseId, sourceRefreshAt: strategyScenarios.sourceRefreshAt, createdAt: strategyScenarios.createdAt, updatedAt: strategyScenarios.updatedAt }).from(strategyScenarios).where(eq(strategyScenarios.userId, userId)).orderBy(desc(strategyScenarios.updatedAt));
}

/* ------------------------------------------------------------------------------------ */
/* Archivo de escenarios: abrir, actualizar, duplicar y borrar                           */
/* ------------------------------------------------------------------------------------ */

async function ensureScenarioRow(userId: number, scenarioId: number) {
  const db = await getDb();
  if (!db) throw localizedError("Base de datos no disponible.", "Database unavailable.");
  const rows = await db.select().from(strategyScenarios).where(and(eq(strategyScenarios.id, scenarioId), eq(strategyScenarios.userId, userId))).limit(1);
  const row = rows[0];
  if (!row) throw localizedError("Escenario no encontrado o sin acceso.", "Scenario not found, or no access to it.");
  return { db, row };
}

/** Devuelve el escenario entero, con los dos documentos JSON, para volver a abrirlo. */
export async function getStrategyScenario(userId: number, scenarioId: number) {
  const { row } = await ensureScenarioRow(userId, scenarioId);
  return row;
}

export async function updateStrategyScenario(
  userId: number,
  scenarioId: number,
  values: Partial<{ name: string; companyName: string; homeCountry: string; industry: string; businessModel: string; objective: InsertStrategyScenario["objective"]; horizonYears: number; caseId: number | null; inputJson: unknown; resultJson: unknown; sourceRefreshAt: Date }>
) {
  const { db } = await ensureScenarioRow(userId, scenarioId);
  await db.update(strategyScenarios).set({ ...values, updatedAt: new Date() }).where(eq(strategyScenarios.id, scenarioId));
  return getStrategyScenario(userId, scenarioId);
}

/**
 * Duplicar copia el análisis pero no sus puertas de decisión: una revisión aprobada lo fue
 * sobre unos supuestos concretos y no se hereda al clonarlos.
 */
export async function duplicateStrategyScenario(userId: number, scenarioId: number, name: string) {
  const { db, row } = await ensureScenarioRow(userId, scenarioId);
  const inserted = await db.insert(strategyScenarios).values({
    userId,
    name,
    companyName: row.companyName,
    homeCountry: row.homeCountry,
    industry: row.industry,
    businessModel: row.businessModel,
    objective: row.objective,
    horizonYears: row.horizonYears,
    caseId: row.caseId,
    inputJson: row.inputJson,
    resultJson: row.resultJson,
    sourceRefreshAt: row.sourceRefreshAt,
  }).returning({ id: strategyScenarios.id });
  return inserted[0].id;
}

/** Al borrar un escenario se van con él sus puertas de decisión y los hitos de estas. */
export async function deleteStrategyScenario(userId: number, scenarioId: number) {
  const { db } = await ensureScenarioRow(userId, scenarioId);
  const approvals = await db.select({ id: strategyApprovals.id }).from(strategyApprovals).where(eq(strategyApprovals.scenarioId, scenarioId));
  const approvalIds = approvals.map((approval) => approval.id);
  if (approvalIds.length) {
    await db.delete(strategyApprovalMilestones).where(inArray(strategyApprovalMilestones.approvalId, approvalIds));
    await db.delete(strategyApprovals).where(eq(strategyApprovals.scenarioId, scenarioId));
  }
  await db.delete(strategyScenarios).where(eq(strategyScenarios.id, scenarioId));
  return { deletedApprovals: approvalIds.length };
}

export async function listStrategyScenariosForRefresh() {
  const db = await getDb();
  if (!db) return [];
  return db.select({ id: strategyScenarios.id, inputJson: strategyScenarios.inputJson }).from(strategyScenarios);
}

export async function refreshStrategyScenario(id: number, inputJson: unknown, resultJson: unknown) {
  const db = await getDb();
  if (!db) throw localizedError("Base de datos no disponible.", "Database unavailable.");
  await db.update(strategyScenarios).set({ inputJson, resultJson, sourceRefreshAt: new Date() }).where(eq(strategyScenarios.id, id));
}

async function ensureScenarioOwnership(userId: number, scenarioId: number) {
  const db = await getDb();
  if (!db) throw localizedError("Base de datos no disponible.", "Database unavailable.");
  const scenario = await db.select({ id: strategyScenarios.id }).from(strategyScenarios).where(and(eq(strategyScenarios.id, scenarioId), eq(strategyScenarios.userId, userId))).limit(1);
  if (!scenario[0]) throw localizedError("Escenario no encontrado o sin acceso.", "Scenario not found, or no access to it.");
  return db;
}

async function loadApprovalWorkflow(userId: number, approvalId: number): Promise<ApprovalWorkflow | null> {
  const db = await getDb();
  if (!db) throw localizedError("Base de datos no disponible.", "Database unavailable.");
  const approvals = await db.select().from(strategyApprovals).where(and(eq(strategyApprovals.id, approvalId), eq(strategyApprovals.userId, userId))).limit(1);
  const approval = approvals[0];
  if (!approval) return null;
  const milestones = await db.select().from(strategyApprovalMilestones).where(eq(strategyApprovalMilestones.approvalId, approval.id)).orderBy(asc(strategyApprovalMilestones.dueAt), asc(strategyApprovalMilestones.id));
  return { ...approval, recommendation: approval.recommendation as ApprovalWorkflow["recommendation"], status: approval.status as ApprovalStatus, milestones: milestones.map((milestone) => ({ ...milestone, status: milestone.status as MilestoneStatus })) };
}

export async function listApprovalWorkflows(userId: number, scenarioId: number) {
  await ensureScenarioOwnership(userId, scenarioId);
  const db = await getDb();
  if (!db) return [];
  const approvals = await db.select().from(strategyApprovals).where(and(eq(strategyApprovals.userId, userId), eq(strategyApprovals.scenarioId, scenarioId))).orderBy(desc(strategyApprovals.updatedAt));
  if (!approvals.length) return [];
  const approvalIds = approvals.map((approval) => approval.id);
  const milestones = await db.select().from(strategyApprovalMilestones).where(inArray(strategyApprovalMilestones.approvalId, approvalIds)).orderBy(asc(strategyApprovalMilestones.dueAt), asc(strategyApprovalMilestones.id));
  return approvals.map((approval) => ({ ...approval, recommendation: approval.recommendation as ApprovalWorkflow["recommendation"], status: approval.status as ApprovalStatus, milestones: milestones.filter((milestone) => milestone.approvalId === approval.id).map((milestone) => ({ ...milestone, status: milestone.status as MilestoneStatus })) } satisfies ApprovalWorkflow));
}

export async function createApprovalWorkflow(input: {
  userId: number; scenarioId: number; countryCode: string; countryName: string; recommendation: "advance" | "test"; responsible: string; reviewer?: string | null; reviewAt: Date; notes?: string | null; milestones: ApprovalMilestoneInput[];
}) {
  const db = await ensureScenarioOwnership(input.userId, input.scenarioId);
  const existing = await db.select({ id: strategyApprovals.id }).from(strategyApprovals).where(and(eq(strategyApprovals.userId, input.userId), eq(strategyApprovals.scenarioId, input.scenarioId), eq(strategyApprovals.countryCode, input.countryCode))).limit(1);
  if (existing[0]) return loadApprovalWorkflow(input.userId, existing[0].id);
  const inserted = await db.insert(strategyApprovals).values({ userId: input.userId, scenarioId: input.scenarioId, countryCode: input.countryCode, countryName: input.countryName, recommendation: input.recommendation, responsible: input.responsible, reviewer: input.reviewer ?? null, reviewAt: input.reviewAt, notes: input.notes ?? null }).returning({ id: strategyApprovals.id });
  const approvalId = inserted[0].id;
  if (input.milestones.length) await db.insert(strategyApprovalMilestones).values(input.milestones.map((milestone) => ({ approvalId, title: milestone.title, responsible: milestone.responsible ?? null, dueAt: milestone.dueAt ?? null, status: milestone.status ?? "pending", evidence: milestone.evidence ?? null })));
  const created = await loadApprovalWorkflow(input.userId, approvalId);
  if (!created) throw localizedError("No se pudo crear el flujo de aprobación.", "The approval flow could not be created.");
  return created;
}

export async function updateApprovalWorkflow(userId: number, approvalId: number, input: { status?: ApprovalStatus; responsible?: string; reviewer?: string | null; reviewAt?: Date; notes?: string | null }) {
  const db = await getDb();
  if (!db) throw localizedError("Base de datos no disponible.", "Database unavailable.");
  const existing = await loadApprovalWorkflow(userId, approvalId);
  if (!existing) throw localizedError("Flujo de aprobación no encontrado o sin acceso.", "Approval flow not found, or no access to it.");
  const changes: Record<string, unknown> = {};
  if (input.status !== undefined) changes.status = input.status;
  if (input.responsible !== undefined) changes.responsible = input.responsible;
  if (input.reviewer !== undefined) changes.reviewer = input.reviewer;
  if (input.reviewAt !== undefined) changes.reviewAt = input.reviewAt;
  if (input.notes !== undefined) changes.notes = input.notes;
  if (Object.keys(changes).length) await db.update(strategyApprovals).set(changes).where(eq(strategyApprovals.id, approvalId));
  const updated = await loadApprovalWorkflow(userId, approvalId);
  if (!updated) throw localizedError("No se pudo actualizar el flujo de aprobación.", "The approval flow could not be updated.");
  return updated;
}

export async function updateApprovalMilestone(userId: number, milestoneId: number, input: { status?: MilestoneStatus; responsible?: string | null; dueAt?: Date | null; evidence?: string | null }) {
  const db = await getDb();
  if (!db) throw localizedError("Base de datos no disponible.", "Database unavailable.");
  const milestone = await db.select({ id: strategyApprovalMilestones.id, approvalId: strategyApprovalMilestones.approvalId }).from(strategyApprovalMilestones).where(eq(strategyApprovalMilestones.id, milestoneId)).limit(1);
  if (!milestone[0]) throw localizedError("Hito no encontrado.", "Milestone not found.");
  const approval = await loadApprovalWorkflow(userId, milestone[0].approvalId);
  if (!approval) throw localizedError("Sin acceso al hito solicitado.", "No access to the milestone requested.");
  const changes: Record<string, unknown> = {};
  if (input.status !== undefined) changes.status = input.status;
  if (input.responsible !== undefined) changes.responsible = input.responsible;
  if (input.dueAt !== undefined) changes.dueAt = input.dueAt;
  if (input.evidence !== undefined) changes.evidence = input.evidence;
  if (Object.keys(changes).length) await db.update(strategyApprovalMilestones).set(changes).where(eq(strategyApprovalMilestones.id, milestoneId));
  const updated = await loadApprovalWorkflow(userId, approval.id);
  if (!updated) throw localizedError("No se pudo actualizar el hito.", "The milestone could not be updated.");
  return updated;
}

// ---------------------------------------------------------------------------
// Casos de estudio, documentos y libro de evidencias
// ---------------------------------------------------------------------------

export type EvidenceKind = "document" | "public_data" | "interview" | "assumption" | "ai_extraction";
export type EvidenceStatus = "accepted" | "suggested" | "rejected";

export type EvidenceInput = {
  kind: EvidenceKind;
  claim: string;
  sourceLabel: string;
  documentId?: number | null;
  locator?: string | null;
  quote?: string | null;
  url?: string | null;
  retrievedAt?: string | null;
  reliability?: number;
  targetPath?: string | null;
  countryCode?: string | null;
  createdBy?: "user" | "ai";
  status?: EvidenceStatus;
  quoteVerified?: boolean;
};

async function ensureCaseOwnership(userId: number, caseId: number) {
  const db = await getDb();
  if (!db) throw localizedError("Base de datos no disponible.", "Database unavailable.");
  const found = await db.select({ id: strategyCases.id }).from(strategyCases).where(and(eq(strategyCases.id, caseId), eq(strategyCases.userId, userId))).limit(1);
  if (!found[0]) throw localizedError("Caso no encontrado o sin acceso.", "Case not found, or no access to it.");
  return db;
}

export async function createCase(input: { userId: number; title: string; decisionQuestion?: string | null; companyName?: string | null; homeCountry?: string | null; industry?: string | null; subIndustry?: string | null; caseYear?: number | null }) {
  const db = await getDb();
  if (!db) throw localizedError("Base de datos no disponible.", "Database unavailable.");
  const inserted = await db.insert(strategyCases).values({
    userId: input.userId,
    title: input.title,
    decisionQuestion: input.decisionQuestion ?? null,
    companyName: input.companyName ?? null,
    homeCountry: input.homeCountry ?? null,
    industry: input.industry ?? null,
    subIndustry: input.subIndustry ?? null,
    caseYear: input.caseYear ?? null,
  }).returning({ id: strategyCases.id });
  return inserted[0].id;
}

export async function updateCase(userId: number, caseId: number, values: Partial<{ title: string; decisionQuestion: string | null; companyName: string | null; homeCountry: string | null; industry: string | null; subIndustry: string | null; caseYear: number | null }>) {
  const db = await ensureCaseOwnership(userId, caseId);
  await db.update(strategyCases).set(values).where(eq(strategyCases.id, caseId));
}

export async function listCases(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(strategyCases).where(eq(strategyCases.userId, userId)).orderBy(desc(strategyCases.updatedAt));
}

export async function getCase(userId: number, caseId: number) {
  const db = await ensureCaseOwnership(userId, caseId);
  const rows = await db.select().from(strategyCases).where(eq(strategyCases.id, caseId)).limit(1);
  const documents = await db.select({ id: strategyCaseDocuments.id, filename: strategyCaseDocuments.filename, mimeType: strategyCaseDocuments.mimeType, storageKey: strategyCaseDocuments.storageKey, bytes: strategyCaseDocuments.bytes, createdAt: strategyCaseDocuments.createdAt }).from(strategyCaseDocuments).where(eq(strategyCaseDocuments.caseId, caseId)).orderBy(asc(strategyCaseDocuments.id));
  return rows[0] ? { ...rows[0], documents } : null;
}

export async function addCaseDocument(input: { userId: number; caseId: number; filename: string; mimeType: string; storageKey?: string | null; textContent?: string | null; bytes?: number | null }) {
  const db = await ensureCaseOwnership(input.userId, input.caseId);
  const inserted = await db.insert(strategyCaseDocuments).values({
    caseId: input.caseId,
    userId: input.userId,
    filename: input.filename,
    mimeType: input.mimeType,
    storageKey: input.storageKey ?? null,
    textContent: input.textContent ?? null,
    bytes: input.bytes ?? null,
  }).returning({ id: strategyCaseDocuments.id });
  return inserted[0].id;
}

export async function getCaseDocument(userId: number, documentId: number) {
  const db = await getDb();
  if (!db) throw localizedError("Base de datos no disponible.", "Database unavailable.");
  const rows = await db.select().from(strategyCaseDocuments).where(and(eq(strategyCaseDocuments.id, documentId), eq(strategyCaseDocuments.userId, userId))).limit(1);
  return rows[0] ?? null;
}

export async function addEvidence(userId: number, caseId: number, entries: EvidenceInput[]) {
  const db = await ensureCaseOwnership(userId, caseId);
  if (!entries.length) return [];
  await db.insert(strategyEvidence).values(entries.map((entry) => ({
    caseId,
    userId,
    kind: entry.kind,
    claim: entry.claim,
    sourceLabel: entry.sourceLabel,
    documentId: entry.documentId ?? null,
    locator: entry.locator ?? null,
    quote: entry.quote ?? null,
    url: entry.url ?? null,
    retrievedAt: entry.retrievedAt ?? null,
    reliability: entry.reliability ?? 3,
    targetPath: entry.targetPath ?? null,
    countryCode: entry.countryCode ?? null,
    createdBy: entry.createdBy ?? "user",
    status: entry.status ?? "accepted",
    quoteVerified: entry.quoteVerified ?? false,
  })));
  return listEvidence(userId, caseId);
}

export async function listEvidence(userId: number, caseId: number) {
  const db = await ensureCaseOwnership(userId, caseId);
  return db.select().from(strategyEvidence).where(eq(strategyEvidence.caseId, caseId)).orderBy(desc(strategyEvidence.id));
}

export async function setEvidenceStatus(userId: number, evidenceId: number, status: EvidenceStatus) {
  const db = await getDb();
  if (!db) throw localizedError("Base de datos no disponible.", "Database unavailable.");
  await db.update(strategyEvidence).set({ status }).where(and(eq(strategyEvidence.id, evidenceId), eq(strategyEvidence.userId, userId)));
}

export async function updateEvidence(userId: number, evidenceId: number, values: Partial<{ claim: string; sourceLabel: string; locator: string | null; targetPath: string | null; reliability: number; countryCode: string | null }>) {
  const db = await getDb();
  if (!db) throw localizedError("Base de datos no disponible.", "Database unavailable.");
  await db.update(strategyEvidence).set(values).where(and(eq(strategyEvidence.id, evidenceId), eq(strategyEvidence.userId, userId)));
}

export async function deleteEvidence(userId: number, evidenceId: number) {
  const db = await getDb();
  if (!db) throw localizedError("Base de datos no disponible.", "Database unavailable.");
  await db.delete(strategyEvidence).where(and(eq(strategyEvidence.id, evidenceId), eq(strategyEvidence.userId, userId)));
}

/* ------------------------------------------------------------------------------------ */
/* Módulos de análisis del caso                                                          */
/* ------------------------------------------------------------------------------------ */

export type CaseModuleKey = "ambition" | "positioning" | "entry" | "partnering" | "route" | "thesis";

export async function getCaseModule(userId: number, caseId: number, moduleKey: CaseModuleKey) {
  const db = await ensureCaseOwnership(userId, caseId);
  const rows = await db
    .select()
    .from(strategyCaseModules)
    .where(and(eq(strategyCaseModules.caseId, caseId), eq(strategyCaseModules.moduleKey, moduleKey)))
    .limit(1);
  return rows[0] ?? null;
}

/**
 * Un módulo por caso: el índice único de la base lo garantiza, así que dos pestañas
 * abiertas sobre el mismo caso no pueden dejar dos filas contradictorias.
 */
export async function saveCaseModule(userId: number, caseId: number, moduleKey: CaseModuleKey, payload: unknown) {
  const db = await ensureCaseOwnership(userId, caseId);
  await db
    .insert(strategyCaseModules)
    .values({ caseId, userId, moduleKey, payload })
    .onConflictDoUpdate({
      target: [strategyCaseModules.caseId, strategyCaseModules.moduleKey],
      set: { payload, updatedAt: new Date() },
    });
  return getCaseModule(userId, caseId, moduleKey);
}
