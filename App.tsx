// src/App.tsx
import React, { useMemo, useState } from "react";
import "./App.css";
import { members, votes, memberVotes, CURRENT_CONGRESS } from "./sampleData";
import { computeMemberAFScore, CategoryId, Member } from "./afScorecard";

type ChamberFilter = "All" | "House" | "Senate";

const CATEGORY_LABELS: Record<CategoryId, string> = {
  IMMIGRATION: "Immigration",
  FOREIGN_AID: "Foreign Aid",
  TAXES_TRADE: "Taxes & Trade",
  HEALTHCARE: "Healthcare",
  INSURANCE: "Insurance",
};

function formatScore(score: number | null): string {
  if (score === null || Number.isNaN(score)) return "—";
  return `${score.toFixed(1)}%`;
}

const App: React.FC = () => {
  const [query, setQuery] = useState("");
  const [chamberFilter, setChamberFilter] = useState<ChamberFilter>("All");
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  const memberScores = useMemo(() => {
    const map = new Map<
      string,
      { lifetime: number | null; current: number | null; perCategory: Record<CategoryId, number | null> }
    >();

    for (const m of members) {
      const lifetime = computeMemberAFScore(m.id, votes, memberVotes);
      const current = computeMemberAFScore(
        m.id,
        votes,
        memberVotes,
        CURRENT_CONGRESS
      );
      map.set(m.id, {
        lifetime: lifetime.overall,
        current: current.overall,
        perCategory: lifetime.perCategory,
      });
    }

    return map;
  }, []);

  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      if (chamberFilter !== "All" && m.chamber !== chamberFilter) {
        return false;
      }

      const q = query.trim().toLowerCase();
      if (!q) return true;

      const text =
        `${m.name} ${m.state} ${m.district ?? ""} ${m.party} ${
          m.chamber
        }`.toLowerCase();

      return text.includes(q);
    });
  }, [query, chamberFilter]);

  const selectedMember: Member | undefined = useMemo(() => {
    if (!selectedMemberId) return undefined;
    return members.find((m) => m.id === selectedMemberId);
  }, [selectedMemberId]);

  const selectedScores =
    selectedMember && memberScores.get(selectedMember.id);

  return (
    <div className="app-root">
      <header className="app-header">
        <div>
          <h1>AFScorecard</h1>
          <p className="subtitle">
            America First alignment scores for members of Congress
          </p>
        </div>
        <div className="brand-dot">AF</div>
      </header>

      <main className="app-main">
        <section className="controls-card">
          <div className="controls-row">
            <input
              type="text"
              placeholder="Search by name, state, party..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="search-input"
            />
            <select
              value={chamberFilter}
              onChange={(e) =>
                setChamberFilter(e.target.value as ChamberFilter)
              }
              className="select-input"
            >
              <option value="All">All chambers</option>
              <option value="House">House</option>
              <option value="Senate">Senate</option>
            </select>
          </div>
          <p className="hint">
            Scores reflect all AF-tagged votes, with a small penalty for
            absences and weighted categories (Immigration, Foreign Aid, etc.).
          </p>
        </section>

        <section className="layout">
          <div className="table-card">
            <div className="table-header-row">
              <span>Member</span>
              <span>Party</span>
              <span>State</span>
              <span>Lifetime AF</span>
              <span>Current Congress</span>
            </div>
            <div className="table-body">
              {filteredMembers.map((m) => {
                const scores = memberScores.get(m.id);
                const isSelected = m.id === selectedMemberId;

                return (
                  <button
                    key={m.id}
                    className={`table-row ${isSelected ? "selected" : ""}`}
                    onClick={() =>
                      setSelectedMemberId((prev) =>
                        prev === m.id ? null : m.id
                      )
                    }
                  >
                    <div className="member-col">
                      <div className="member-name">{m.name}</div>
                      <div className="member-meta">
                        {m.chamber} ·{" "}
                        {m.chamber === "House"
                          ? `${m.state}-${m.district ?? "At-Large"}`
                          : m.state}
                      </div>
                    </div>
                    <span className={`pill pill-${m.party}`}>
                      {m.party}
                    </span>
                    <span>{m.state}</span>
                    <span>{formatScore(scores?.lifetime ?? null)}</span>
                    <span>{formatScore(scores?.current ?? null)}</span>
                  </button>
                );
              })}

              {filteredMembers.length === 0 && (
                <div className="empty-state">
                  No members match your search.
                </div>
              )}
            </div>
          </div>

          <div className="detail-card">
            {selectedMember && selectedScores ? (
              <>
                <h2>{selectedMember.name}</h2>
                <p className="detail-meta">
                  {selectedMember.chamber} ·{" "}
                  {selectedMember.chamber === "House"
                    ? `${selectedMember.state}-${
                        selectedMember.district ?? "At-Large"
                      }`
                    : selectedMember.state}{" "}
                  · {selectedMember.party}
                </p>

                <div className="score-summary">
                  <div>
                    <div className="score-label">Lifetime AF Score</div>
                    <div className="score-value">
                      {formatScore(selectedScores.lifetime)}
                    </div>
                  </div>
                  <div>
                    <div className="score-label">
                      Current Congress ({CURRENT_CONGRESS})
                    </div>
                    <div className="score-value">
                      {formatScore(selectedScores.current)}
                    </div>
                  </div>
                </div>

                <h3>By Policy Category (Lifetime)</h3>
                <div className="category-grid">
                  {(Object.keys(
                    selectedScores.perCategory
                  ) as CategoryId[]).map((cat) => (
                    <div key={cat} className="category-card">
                      <div className="category-name">
                        {CATEGORY_LABELS[cat]}
                      </div>
                      <div className="category-score">
                        {formatScore(selectedScores.perCategory[cat])}
                      </div>
                    </div>
                  ))}
                </div>

                <p className="detail-footnote">
                  Scores are calculated from all AF-tagged votes, weighted by
                  issue importance and category. Absences receive a small
                  penalty instead of a full deduction.
                </p>
              </>
            ) : (
              <div className="detail-placeholder">
                <h2>Select a member</h2>
                <p>
                  Click on any row in the table to see their detailed America
                  First alignment breakdown.
                </p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default App;
