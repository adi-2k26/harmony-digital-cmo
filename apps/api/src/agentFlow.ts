import { runCmoAgent } from "./cmoEngine";

export async function runLangGraphLikeFlow(input: Record<string, unknown>) {
  return runCmoAgent(input);
}
