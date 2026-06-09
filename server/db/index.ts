import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const pool = new pg.Pool({
  connectionString:
    process.env.DATABASE_URL ??
    "postgresql://lotgo:lotgo@localhost:5432/lotgo",
});

export const db = drizzle(pool, { schema });
export { pool };
