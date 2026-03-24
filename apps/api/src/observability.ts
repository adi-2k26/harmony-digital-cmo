const startedAt = Date.now();
let requests = 0;
let agentRuns = 0;

export function trackRequest() {
  requests += 1;
}

export function trackAgentRun() {
  agentRuns += 1;
}

export function getMetrics() {
  return {
    uptime_seconds: Math.floor((Date.now() - startedAt) / 1000),
    requests_total: requests,
    agent_runs_total: agentRuns
  };
}
