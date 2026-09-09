import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertStrategyScenario, InsertUser, strategyApprovalMilestones, strategyApprovals, strategyScenarios, users } from "../drizzle/schema";
import { ENV } from "./_core/env";

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

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try { _db = drizzle(process.env.DATABASE_URL); }
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
  else if (user.openId === ENV.ownerOpenId) { values.role = "admin"; updateSet.role = "admin"; }
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function saveStrategyScenario(values: InsertStrategyScenario) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const result = await db.insert(strategyScenarios).values(values);
  return result[0].insertId;
}

export async function listStrategyScenarios(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({ id: strategyScenarios.id, name: strategyScenarios.name, companyName: strategyScenarios.companyName, homeCountry: strategyScenarios.homeCountry, industry: strategyScenarios.industry, businessModel: strategyScenarios.businessModel, objective: strategyScenarios.objective, horizonYears: strategyScenarios.horizonYears, sourceRefreshAt: strategyScenarios.sourceRefreshAt, createdAt: strategyScenarios.createdAt, updatedAt: strategyScenarios.updatedAt }).from(strategyScenarios).where(eq(strategyScenarios.userId, userId)).orderBy(desc(strategyScenarios.updatedAt));
}

export async function listStrategyScenariosForRefresh() {
  const db = await getDb();
  if (!db) return [];
  return db.select({ id: strategyScenarios.id, inputJson: strategyScenarios.inputJson }).from(strategyScenarios);
}

export async function refreshStrategyScenario(id: number, inputJson: unknown, resultJson: unknown) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(strategyScenarios).set({ inputJson, resultJson, sourceRefreshAt: new Date() }).where(eq(strategyScenarios.id, id));
}

async function ensureScenarioOwnership(userId: number, scenarioId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const scenario = await db.select({ id: strategyScenarios.id }).from(strategyScenarios).where(and(eq(strategyScenarios.id, scenarioId), eq(strategyScenarios.userId, userId))).limit(1);
  if (!scenario[0]) throw new Error("Escenario no encontrado o sin acceso.");
  return db;
}

async function loadApprovalWorkflow(userId: number, approvalId: number): Promise<ApprovalWorkflow | null> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
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
  const inserted = await db.insert(strategyApprovals).values({ userId: input.userId, scenarioId: input.scenarioId, countryCode: input.countryCode, countryName: input.countryName, recommendation: input.recommendation, responsible: input.responsible, reviewer: input.reviewer ?? null, reviewAt: input.reviewAt, notes: input.notes ?? null });
  const approvalId = inserted[0].insertId;
  if (input.milestones.length) await db.insert(strategyApprovalMilestones).values(input.milestones.map((milestone) => ({ approvalId, title: milestone.title, responsible: milestone.responsible ?? null, dueAt: milestone.dueAt ?? null, status: milestone.status ?? "pending", evidence: milestone.evidence ?? null })));
  const created = await loadApprovalWorkflow(input.userId, approvalId);
  if (!created) throw new Error("No se pudo crear el flujo de aprobación.");
  return created;
}

export async function updateApprovalWorkflow(userId: number, approvalId: number, input: { status?: ApprovalStatus; responsible?: string; reviewer?: string | null; reviewAt?: Date; notes?: string | null }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const existing = await loadApprovalWorkflow(userId, approvalId);
  if (!existing) throw new Error("Flujo de aprobación no encontrado o sin acceso.");
  const changes: Record<string, unknown> = {};
  if (input.status !== undefined) changes.status = input.status;
  if (input.responsible !== undefined) changes.responsible = input.responsible;
  if (input.reviewer !== undefined) changes.reviewer = input.reviewer;
  if (input.reviewAt !== undefined) changes.reviewAt = input.reviewAt;
  if (input.notes !== undefined) changes.notes = input.notes;
  if (Object.keys(changes).length) await db.update(strategyApprovals).set(changes).where(eq(strategyApprovals.id, approvalId));
  const updated = await loadApprovalWorkflow(userId, approvalId);
  if (!updated) throw new Error("No se pudo actualizar el flujo de aprobación.");
  return updated;
}

export async function updateApprovalMilestone(userId: number, milestoneId: number, input: { status?: MilestoneStatus; responsible?: string | null; dueAt?: Date | null; evidence?: string | null }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const milestone = await db.select({ id: strategyApprovalMilestones.id, approvalId: strategyApprovalMilestones.approvalId }).from(strategyApprovalMilestones).where(eq(strategyApprovalMilestones.id, milestoneId)).limit(1);
  if (!milestone[0]) throw new Error("Hito no encontrado.");
  const approval = await loadApprovalWorkflow(userId, milestone[0].approvalId);
  if (!approval) throw new Error("Sin acceso al hito solicitado.");
  const changes: Record<string, unknown> = {};
  if (input.status !== undefined) changes.status = input.status;
  if (input.responsible !== undefined) changes.responsible = input.responsible;
  if (input.dueAt !== undefined) changes.dueAt = input.dueAt;
  if (input.evidence !== undefined) changes.evidence = input.evidence;
  if (Object.keys(changes).length) await db.update(strategyApprovalMilestones).set(changes).where(eq(strategyApprovalMilestones.id, milestoneId));
  const updated = await loadApprovalWorkflow(userId, approval.id);
  if (!updated) throw new Error("No se pudo actualizar el hito.");
  return updated;
}
