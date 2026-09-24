import { Pool, types, type PoolClient } from "pg";
import { pendingMigrations } from "../../scripts/migration-plan.mjs";
import { envGet, resolveDatabaseUrl } from "./db-url";

export type DbSource = "neon" | "pglite";

const databaseUrl = resolveDatabaseUrl();
const onVercel = Boolean(envGet("VERCEL") || envGet("VERCEL_ENV"));

export const dbSource: DbSource = databaseUrl ? "neon" : "pglite";

export interface Sql {
  <T = Record<string, unknown>>(
    strings: TemplateStringsArray,
    ...values: unknown[]
  ): Promise<T[]>;
  query<T = Record<string, unknown>>(
    text: string,
    params?: unknown[],
  ): Promise<T[]>;
}

const globalRef = globalThis as typeof globalThis & {
  __dateosPgPool__?: Pool;
  __pgSqlPromise__?: Promise<Sql>;
  __pgliteInstance__?: Promise<import("@electric-sql/pglite").PGlite>;
  __pgliteMigrateChain__?: Promise<void>;
  __neonMigratePromise__?: Promise<void>;
};

const OID_INT8 = 20;
const OID_DATE = 1082;
const OID_INTERVAL = 1186;
const identity = (v: string) => v;

types.setTypeParser(OID_INT8, Number);
types.setTypeParser(OID_DATE, identity);
types.setTypeParser(OID_INTERVAL, identity);

type Run = <T>(text: string, params: unknown[]) => Promise<T[]>;

function toSql(run: Run): Sql {
  const sql = (async <T = Record<string, unknown>>(
    strings: TemplateStringsArray,
    ...values: unknown[]
  ): Promise<T[]> => {
    let text = strings[0];
    for (let i = 0; i < values.length; i += 1) text += `$${i + 1}${strings[i + 1]}`;
    return run<T>(text, values);
  }) as unknown as Sql;
  sql.query = <T = Record<string, unknown>>(text: string, params: unknown[] = []) =>
    run<T>(text, params);
  return sql;
}

function withSsl(url: string) {
  return url;
}

export function getSharedPool(): Pool {
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required");
  }
  if (!globalRef.__dateosPgPool__) {
    globalRef.__dateosPgPool__ = new Pool({
      connectionString: withSsl(databaseUrl),
      max: onVercel ? 1 : 5,
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 8_000,
    });
  }
  return globalRef.__dateosPgPool__;
}

export async function ensureNeonReady(): Promise<void> {
  if (!databaseUrl) return;
  globalRef.__neonMigratePromise__ ??= (async () => {
    const pool = getSharedPool();
    const client = await pool.connect();
    try {
      await client.query(
        "create table if not exists _migrations (name text primary key, applied_at timestamptz not null default now())",
      );
      const doneRows = await client.query<{ name: string }>("select name from _migrations");
      const done = doneRows.rows.map((r) => r.name);
      const migrations = import.meta.glob("/migrations/*.sql", {
        query: "?raw",
        import: "default",
        eager: true,
      }) as Record<string, string>;
      for (const { name, path } of pendingMigrations(Object.keys(migrations), done)) {
        await client.query("BEGIN");
        try {
          await client.query(migrations[path]);
          await client.query("insert into _migrations (name) values ($1)", [name]);
          await client.query("COMMIT");
        } catch (err) {
          await client.query("ROLLBACK");
          throw err;
        }
      }
    } finally {
      client.release();
    }
  })().catch((err) => {
    globalRef.__neonMigratePromise__ = undefined;
    throw err;
  });
  return globalRef.__neonMigratePromise__;
}

function createNeonSql(): Promise<Sql> {
  globalRef.__pgSqlPromise__ ??= (async () => {
    await ensureNeonReady();
    const pool = getSharedPool();
    return toSql(async <T>(text: string, params: unknown[]) => {
      const res = await pool.query(text, params);
      return res.rows as T[];
    });
  })().catch((err) => {
    globalRef.__pgSqlPromise__ = undefined;
    throw err;
  });
  return globalRef.__pgSqlPromise__;
}

async function openPglite(): Promise<import("@electric-sql/pglite").PGlite> {
  const { PGlite } = await import("@electric-sql/pglite");
  const parsers = {
    [OID_INT8]: Number,
    [OID_DATE]: identity,
    [OID_INTERVAL]: identity,
  };
  const onRailway = Boolean(envGet("RAILWAY_ENVIRONMENT") || envGet("RAILWAY_PROJECT_ID"));
  if (onRailway) {
    try {
      const { mkdirSync } = await import("node:fs");
      const { join } = await import("node:path");
      const dataDir = envGet("DATEOS_DATA_DIR") ?? join(process.cwd(), ".data", "pglite");
      mkdirSync(dataDir, { recursive: true });
      const fileDb = new PGlite(dataDir, { parsers });
      await fileDb.waitReady;
      return fileDb;
    } catch (err) {
      console.error("[db] PGLite en disco falló, uso memoria", err);
    }
  }
  const memoryDb = new PGlite({ parsers });
  await memoryDb.waitReady;
  return memoryDb;
}

async function createPgliteSql(): Promise<Sql> {
  globalRef.__pgliteInstance__ ??= openPglite()
    .then(async (pg) => {
      await pg.exec(
        "create table if not exists _migrations (name text primary key, applied_at timestamptz not null default now())",
      );
      return pg;
    })
    .catch((err) => {
      globalRef.__pgliteInstance__ = undefined;
      throw err;
    });
  const pg = await globalRef.__pgliteInstance__;

  const migrate = async (): Promise<void> => {
    const migrations = import.meta.glob("/migrations/*.sql", {
      query: "?raw",
      import: "default",
      eager: true,
    }) as Record<string, string>;
    const doneRows = await pg.query<{ name: string }>("select name from _migrations");
    const done = doneRows.rows.map((r) => r.name);
    for (const { name, path } of pendingMigrations(Object.keys(migrations), done)) {
      await pg.transaction(async (tx) => {
        await tx.exec(migrations[path]);
        await tx.query("insert into _migrations (name) values ($1)", [name]);
      });
    }
  };
  const pass = (globalRef.__pgliteMigrateChain__ ?? Promise.resolve())
    .catch(() => undefined)
    .then(migrate);
  globalRef.__pgliteMigrateChain__ = pass;
  await pass;

  return toSql(async <T>(text: string, params: unknown[]) => {
    const result = await pg.query<T>(text, params);
    return result.rows;
  });
}

async function createSql(): Promise<Sql> {
  if (typeof window !== "undefined") {
    throw new Error("@/lib/db is server-only");
  }
  if (onVercel && !databaseUrl) {
    throw new Error(
      "DATABASE_URL is required on Vercel. Use the Neon pooled endpoint (-pooler).",
    );
  }
  return dbSource === "neon" ? createNeonSql() : createPgliteSql();
}

let sqlPromise: Promise<Sql> | null = null;

export function getSql(): Promise<Sql> {
  sqlPromise ??= createSql().catch((err) => {
    sqlPromise = null;
    throw err;
  });
  return sqlPromise;
}

export async function withTransaction<T>(fn: (sql: Sql) => Promise<T>): Promise<T> {
  if (onVercel && !databaseUrl) {
    throw new Error("DATABASE_URL is required on Vercel");
  }
  if (dbSource === "neon") {
    const client: PoolClient = await getSharedPool().connect();
    const sql = toSql(async <TRow>(text: string, params: unknown[]) => {
      const res = await client.query(text, params);
      return res.rows as TRow[];
    });
    try {
      await client.query("BEGIN");
      const result = await fn(sql);
      await client.query("COMMIT");
      return result;
    } catch (err) {
      try {
        await client.query("ROLLBACK");
      } catch {
        /* keep original */
      }
      throw err;
    } finally {
      client.release();
    }
  }

  const pg = await getPglite();
  return pg.transaction(async (tx) => {
    const sql = toSql(async <TRow>(text: string, params: unknown[]) => {
      const result = await tx.query<TRow>(text, params);
      return result.rows;
    });
    return fn(sql);
  }) as Promise<T>;
}

export async function getPglite(): Promise<import("@electric-sql/pglite").PGlite> {
  if (dbSource !== "pglite") {
    throw new Error("getPglite() is only available without DATABASE_URL");
  }
  await getSql();
  const pg = await globalRef.__pgliteInstance__;
  if (!pg) throw new Error("PGLite instance failed to initialize");
  return pg;
}

export function ensureDbReady(): Promise<void> {
  if (dbSource !== "pglite") return Promise.resolve();
  return getSql().then(() => undefined);
}

const globalBoot = globalThis as typeof globalThis & {
  __pgBootstrapPromise__?: Promise<void>;
};
if (typeof window === "undefined" && dbSource === "pglite" && !onVercel) {
  globalBoot.__pgBootstrapPromise__ ??= ensureDbReady().catch((err) => {
    globalBoot.__pgBootstrapPromise__ = undefined;
    console.error("[db] PGLite bootstrap failed:", err);
    throw err;
  });
}
