// src/sampleData.ts
import { Member, Vote, MemberVote, CategoryId } from "./afScorecard";

export const CURRENT_CONGRESS = 119; // example

export const members: Member[] = [
  {
    id: "M001",
    name: "John Example",
    chamber: "Senate",
    state: "TX",
    party: "R",
  },
  {
    id: "M002",
    name: "Sarah Sample",
    chamber: "House",
    state: "FL",
    district: "12",
    party: "R",
  },
  {
    id: "M003",
    name: "Chris Demo",
    chamber: "House",
    state: "CA",
    district: "07",
    party: "D",
  },
];

function vote(
  id: string,
  congress: number,
  chamber: "House" | "Senate",
  date: string,
  category: CategoryId,
  afPosition: "YES" | "NO",
  importanceWeight = 1.0
): Vote {
  return { id, congress, chamber, date, category, afPosition, importanceWeight };
}

export const votes: Vote[] = [
  // Immigration
  vote(
    "V001",
    119,
    "Senate",
    "2025-03-12",
    "IMMIGRATION",
    "YES",
    1.5 // high importance
  ),
  vote("V002", 119, "House", "2025-03-15", "IMMIGRATION", "NO", 1.0),

  // Foreign Aid
  vote("V003", 119, "Senate", "2025-04-02", "FOREIGN_AID", "NO", 2.0), // critical
  vote("V004", 118, "House", "2023-05-10", "FOREIGN_AID", "NO", 1.0),

  // Taxes & Trade
  vote("V005", 119, "House", "2025-02-01", "TAXES_TRADE", "YES", 1.0),

  // Healthcare
  vote("V006", 119, "Senate", "2025-06-20", "HEALTHCARE", "YES", 1.0),

  // Insurance
  vote("V007", 119, "House", "2025-07-11", "INSURANCE", "YES", 1.0),
];

export const memberVotes: MemberVote[] = [
  // John Example (Senate)
  { voteId: "V001", memberId: "M001", vote: "YES" },
  { voteId: "V003", memberId: "M001", vote: "YES" }, // AF wants NO → oppose
  { voteId: "V006", memberId: "M001", vote: "YES" },

  // Sarah Sample (House)
  { voteId: "V002", memberId: "M002", vote: "NO" },
  { voteId: "V004", memberId: "M002", vote: "NO" },
  { voteId: "V005", memberId: "M002", vote: "YES" },
  { voteId: "V007", memberId: "M002", vote: "ABSENT" },

  // Chris Demo (House, D)
  { voteId: "V002", memberId: "M003", vote: "YES" }, // opposite AF
  { voteId: "V004", memberId: "M003", vote: "YES" },
  { voteId: "V005", memberId: "M003", vote: "NO" },
  { voteId: "V007", memberId: "M003", vote: "NO" },
  // no votes on immigration/foreign aid senate votes (treated as ABSENT)
];
