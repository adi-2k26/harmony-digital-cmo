import OpenAI from "openai";
import { config } from "./config";

let client: OpenAI | null = null;

export function getOpenAIClient() {
  if (!config.openaiApiKey) return null;
  if (!client) {
    client = new OpenAI({ apiKey: config.openaiApiKey });
  }
  return client;
}
