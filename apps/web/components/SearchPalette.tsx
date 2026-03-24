"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { SearchItem } from "../lib/nav";

export function SearchPalette({
  open,
  onClose,
  items
}: {
  open: boolean;
  onClose: () => void;
  items: SearchItem[];
}) {
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!open) setQ("");
  }, [open]);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return items.slice(0, 14);
    return items
      .filter(
        (i) =>
          i.label.toLowerCase().includes(t) ||
          i.keywords.toLowerCase().includes(t) ||
          i.href.toLowerCase().includes(t)
      )
      .slice(0, 24);
  }, [items, q]);

  useEffect(() => {
    if (!open) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="searchOverlay" role="dialog" aria-modal="true" aria-label="Search">
      <div className="searchBackdrop" onClick={onClose} role="presentation" />
      <div className="searchPanel">
        <input
          className="searchInput"
          autoFocus
          placeholder="Search pages…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <ul className="searchResults">
          {filtered.map((i) => (
            <li key={i.id}>
              <Link href={i.href} className="searchResultRow" onClick={onClose}>
                <span className="searchResultLabel">{i.label}</span>
                <span className="searchGroup">{i.group}</span>
              </Link>
            </li>
          ))}
        </ul>
        {filtered.length === 0 ? <p className="searchEmpty">No matches</p> : null}
      </div>
    </div>
  );
}
