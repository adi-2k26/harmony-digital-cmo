"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import useSWR from "swr";
import { apiFetch } from "../../lib/api";

type AgentRow = {
  id: string;
  name: string;
  tagline?: string;
  purpose: string;
  inputs: string[];
  outputs: string[];
  dependencies: string[];
  cadence: string;
  failure_handling: string;
  owner: string;
  sla: string;
};

export default function AgentsPage() {
  const [q, setQ] = useState("");
  const { data, error } = useSWR<{ agents: AgentRow[] }>("/agents/catalog", apiFetch, {
    refreshInterval: 300000,
  });

  const filtered = useMemo(() => {
    const agents = data?.agents ?? [];
    const t = q.trim().toLowerCase();
    if (!t) return agents;
    return agents.filter(
      (a) =>
        a.name.toLowerCase().includes(t) ||
        a.id.toLowerCase().includes(t) ||
        a.purpose.toLowerCase().includes(t) ||
        a.outputs.some((o) => o.toLowerCase().includes(t)),
    );
  }, [data?.agents, q]);

  return (
    <main className="container">
      <h1>Your specialist team</h1>
      <p className="muted" style={{ maxWidth: 720 }}>
        These roles support your team from trend tracking to content planning. Open any role to see what it helps with. Press{" "}
        <kbd className="kbd" style={{ marginLeft: 4 }}>
          ⌘K
        </kbd>{" "}
        to search the site.
      </p>

      <section className="card" style={{ marginBottom: 16 }}>
        <label style={{ display: "flex", flexDirection: "column", gap: 6, maxWidth: 420 }}>
          <span className="muted">Search</span>
          <input
            className="searchInput"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name or topic"
          />
        </label>
      </section>

      {error ? <p>We couldn&apos;t load this list. Check your connection and try again.</p> : null}

      <section className="grid" style={{ gridTemplateColumns: "1fr" }}>
        {filtered.map((agent) => (
          <article className="card" key={agent.id}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div>
                <h3 style={{ margin: "0 0 6px" }}>{agent.name}</h3>
                {agent.tagline ? (
                  <p className="muted" style={{ marginTop: 0 }}>
                    {agent.tagline}
                  </p>
                ) : null}
              </div>
              <Link
                href={`/agents/${agent.id}`}
                className="appNavLink"
                style={{ border: "1px solid var(--border)", height: "fit-content" }}
              >
                View details
              </Link>
            </div>
            <p style={{ marginBottom: 0 }}>{agent.purpose}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
