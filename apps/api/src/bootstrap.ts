import fs from "node:fs/promises";
import path from "node:path";
import { db } from "./db";

export async function bootstrapDatabase() {
  const sqlPath = path.join(process.cwd(), "src", "sql", "init.sql");
  const sql = await fs.readFile(sqlPath, "utf-8");
  await db.query(sql);
}
