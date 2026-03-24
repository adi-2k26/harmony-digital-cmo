import pino from "pino";

export const logger = pino({
  name: "harmony-api",
  level: process.env.LOG_LEVEL ?? "info",
  base: undefined
});
