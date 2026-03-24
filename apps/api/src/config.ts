import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: Number(process.env.PORT ?? 4000),
  databaseUrl:
    process.env.DATABASE_URL ??
    "postgresql://harmony:harmony@localhost:5432/harmony_cmo",
  redisUrl: process.env.REDIS_URL ?? "redis://localhost:6379",
  openaiApiKey: process.env.OPENAI_API_KEY ?? "",
  openaiModel: process.env.OPENAI_MODEL ?? "gpt-4o-mini"
};
