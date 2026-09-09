import { desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertStrategyScenario, InsertUser, strategyScenarios, users } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
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
    if (user[field] !== undefined) {
      const value = user[field] ?? null;
      values[field] = value;
      updateSet[field] = value;
    }
  });
  values.lastSignedIn = user.lastSignedIn ?? new Date();
  updateSet.lastSignedIn = values.lastSignedIn;
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
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
  return db
    .select({
      id: strategyScenarios.id,
      name: strategyScenarios.name,
      companyName: strategyScenarios.companyName,
      homeCountry: strategyScenarios.homeCountry,
      industry: strategyScenarios.industry,
      businessModel: strategyScenarios.businessModel,
      objective: strategyScenarios.objective,
      horizonYears: strategyScenarios.horizonYears,
      sourceRefreshAt: strategyScenarios.sourceRefreshAt,
      createdAt: strategyScenarios.createdAt,
      updatedAt: strategyScenarios.updatedAt,
    })
    .from(strategyScenarios)
    .where(eq(strategyScenarios.userId, userId))
    .orderBy(desc(strategyScenarios.updatedAt));
}

export async function listStrategyScenariosForRefresh() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: strategyScenarios.id,
      inputJson: strategyScenarios.inputJson,
    })
    .from(strategyScenarios);
}

export async function refreshStrategyScenario(
  id: number,
  inputJson: unknown,
  resultJson: unknown,
) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db
    .update(strategyScenarios)
    .set({ inputJson, resultJson, sourceRefreshAt: new Date() })
    .where(eq(strategyScenarios.id, id));
}
