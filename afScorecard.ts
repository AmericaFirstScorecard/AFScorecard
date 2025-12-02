// src/afScorecard.ts

export type CategoryId =
  | "IMMIGRATION"
  | "FOREIGN_AID"
  | "TAXES_TRADE"
  | "HEALTHCARE"
  | "INSURANCE";

export type Chamber = "House" | "Senate";

export type VoteChoice = "YES" | "NO" | "ABSENT";

export interface Member {
  id: string;
  name: string;
  chamber: Chamber;
  state: string;
  district?: string;
  party: "R" | "D" | "I" | "Other";
}

export interface Vote {
  id: string;
  congress: number;
  chamber: Chamber;
  date: string; // ISO date
  category: CategoryId;
  afPosition: VoteChoice; // YES or NO (ABSENT never used here)
  importanceWeight: number; // 1.0 normal, 1.5 high, 2.0 critical, etc.
}

export interface MemberVote {
  voteId: string;
  memberId: string;
  vote: VoteChoice; // YES / NO / ABSENT
}

export interface CategoryScoreResult {
  category: CategoryId;
  score: number | null; // 0–100 or null if no votes
}

export interface MemberScoreResult {
  memberId: string;
  perCategory: Record<CategoryId, number | null>;
  overall: number | null; // 0–100 or null
}

const CATEGORY_WEIGHTS: Record<CategoryId, number> = {
  IMMIGRATION: 0.3,
  FOREIGN_AID: 0.3,
  TAXES_TRADE: 0.2,
  HEALTHCARE: 0.1,
  INSURANCE: 0.1,
};

// Rubric points
const ALIGN_POINTS = 1.0;
const OPPOSE_POINTS = 0.0;
const ABSENCE_POINTS = 0.25;

function getPoints(afPosition: VoteChoice, vote: VoteChoice): number {
  if (vote === "ABSENT") return ABSENCE_POINTS;
  if (vote === afPosition) return ALIGN_POINTS;
  return OPPOSE_POINTS;
}

export function computeCategoryScore(
  memberId: string,
  category: CategoryId,
  allVotes: Vote[],
  allMemberVotes: MemberVote[],
  congressFilter?: number
): number | null {
  const votes = allVotes.filter((v) => {
    if (v.category !== category) return false;
    if (congressFilter && v.congress !== congressFilter) return false;
    return true;
  });

  if (votes.length === 0) {
    return null;
  }

  let numerator = 0;
  let denominator = 0;

  for (const vote of votes) {
    const mv =
      allMemberVotes.find(
        (m) => m.voteId === vote.id && m.memberId === memberId
      ) ?? {
        // If no record, treat as absent
        voteId: vote.id,
        memberId,
        vote: "ABSENT" as VoteChoice,
      };

    const points = getPoints(vote.afPosition, mv.vote);
    numerator += points * vote.importanceWeight;
    denominator += 1.0 * vote.importanceWeight;
  }

  if (denominator === 0) return null;

  const score0to1 = numerator / denominator;
  return score0to1 * 100;
}

export function computeMemberAFScore(
  memberId: string,
  allVotes: Vote[],
  allMemberVotes: MemberVote[],
  congressFilter?: number
): MemberScoreResult {
  const categories: CategoryId[] = [
    "IMMIGRATION",
    "FOREIGN_AID",
    "TAXES_TRADE",
    "HEALTHCARE",
    "INSURANCE",
  ];

  const perCategory: Record<CategoryId, number | null> = {
    IMMIGRATION: null,
    FOREIGN_AID: null,
    TAXES_TRADE: null,
    HEALTHCARE: null,
    INSURANCE: null,
  };

  for (const cat of categories) {
    perCategory[cat] = computeCategoryScore(
      memberId,
      cat,
      allVotes,
      allMemberVotes,
      congressFilter
    );
  }

  // Overall score: weighted by category, renormalized to only categories with data
  const categoriesWithScore = categories.filter(
    (c) => perCategory[c] !== null
  );

  if (categoriesWithScore.length === 0) {
    return {
      memberId,
      perCategory,
      overall: null,
    };
  }

  let weightedSum = 0;
  let totalWeight = 0;

  for (const cat of categoriesWithScore) {
    const score = perCategory[cat] as number; // not null here
    const weight = CATEGORY_WEIGHTS[cat];
    weightedSum += (score / 100) * weight;
    totalWeight += weight;
  }

  const overall0to1 = weightedSum / totalWeight;
  const overall = overall0to1 * 100;

  return {
    memberId,
    perCategory,
    overall,
  };
}
