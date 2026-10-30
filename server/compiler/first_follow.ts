import { END_MARKER, EPSILON, FirstFollowResult, FirstFollowRound, Grammar } from './grammar_model.ts';

/**
 * Computes FIRST of a sequence of grammar symbols (RHS of a production or suffix)
 */
export function computeFirstOfSequence(
  sequence: string[],
  firstSets: Record<string, Set<string>>
): Set<string> {
  const result = new Set<string>();

  if (sequence.length === 0) {
    result.add(EPSILON);
    return result;
  }

  let allNullable = true;

  for (const sym of sequence) {
    if (sym === EPSILON) {
      continue;
    }

    const symFirst = firstSets[sym] || new Set([sym]); // If terminal, FIRST(sym) = {sym}
    for (const item of symFirst) {
      if (item !== EPSILON) {
        result.add(item);
      }
    }

    if (!symFirst.has(EPSILON)) {
      allNullable = false;
      break;
    }
  }

  if (allNullable) {
    result.add(EPSILON);
  }

  return result;
}

export function computeFirstAndFollow(grammar: Grammar): FirstFollowResult {
  const ntSet = new Set(grammar.nonTerminals);
  const termSet = new Set(grammar.terminals);

  // Initialize FIRST sets
  const firstSets: Record<string, Set<string>> = {};

  // Terminals: FIRST(a) = {a}
  for (const term of grammar.terminals) {
    firstSets[term] = new Set([term]);
  }
  firstSets[EPSILON] = new Set([EPSILON]);
  firstSets[END_MARKER] = new Set([END_MARKER]);

  // Non-terminals: initial empty
  for (const nt of grammar.nonTerminals) {
    firstSets[nt] = new Set();
  }

  const firstRounds: FirstFollowRound[] = [];
  let firstChanged = true;
  let firstRoundNum = 1;

  while (firstChanged) {
    firstChanged = false;

    // Snapshot before round
    const roundSnapshot: Record<string, string[]> = {};
    for (const nt of grammar.nonTerminals) {
      roundSnapshot[nt] = Array.from(firstSets[nt]).sort();
    }

    for (const prod of grammar.productions) {
      const A = prod.lhs;
      if (!firstSets[A]) firstSets[A] = new Set();

      if (prod.rhs.length === 1 && prod.rhs[0] === EPSILON) {
        if (!firstSets[A].has(EPSILON)) {
          firstSets[A].add(EPSILON);
          firstChanged = true;
        }
        continue;
      }

      let allNullable = true;
      for (const sym of prod.rhs) {
        const symFirst = firstSets[sym] || (termSet.has(sym) ? new Set([sym]) : new Set());

        for (const f of symFirst) {
          if (f !== EPSILON && !firstSets[A].has(f)) {
            firstSets[A].add(f);
            firstChanged = true;
          }
        }

        if (!symFirst.has(EPSILON)) {
          allNullable = false;
          break;
        }
      }

      if (allNullable) {
        if (!firstSets[A].has(EPSILON)) {
          firstSets[A].add(EPSILON);
          firstChanged = true;
        }
      }
    }

    const roundAfter: Record<string, string[]> = {};
    for (const nt of grammar.nonTerminals) {
      roundAfter[nt] = Array.from(firstSets[nt]).sort();
    }

    firstRounds.push({
      round: firstRoundNum++,
      sets: roundAfter,
      changed: firstChanged,
    });
  }

  // Identify nullable non-terminals
  const nullableNonTerminals = grammar.nonTerminals.filter((nt) =>
    firstSets[nt]?.has(EPSILON)
  );

  // Initialize FOLLOW sets
  const followSets: Record<string, Set<string>> = {};
  for (const nt of grammar.nonTerminals) {
    followSets[nt] = new Set();
  }

  // Rule 1: Add $ to FOLLOW(startSymbol)
  if (grammar.startSymbol && followSets[grammar.startSymbol]) {
    followSets[grammar.startSymbol].add(END_MARKER);
  }

  const followRounds: FirstFollowRound[] = [];
  let followChanged = true;
  let followRoundNum = 1;

  while (followChanged) {
    followChanged = false;

    for (const prod of grammar.productions) {
      const A = prod.lhs;
      const rhs = prod.rhs;

      for (let i = 0; i < rhs.length; i++) {
        const B = rhs[i];
        if (!ntSet.has(B)) continue;

        // Substring after B: beta
        const beta = rhs.slice(i + 1);
        const firstBeta = computeFirstOfSequence(beta, firstSets);

        // Rule 2: add FIRST(beta) \ {ε} to FOLLOW(B)
        for (const item of firstBeta) {
          if (item !== EPSILON && !followSets[B].has(item)) {
            followSets[B].add(item);
            followChanged = true;
          }
        }

        // Rule 3: if ε in FIRST(beta) (or beta is empty), add FOLLOW(A) to FOLLOW(B)
        if (firstBeta.has(EPSILON)) {
          const followA = followSets[A] || new Set();
          for (const item of followA) {
            if (!followSets[B].has(item)) {
              followSets[B].add(item);
              followChanged = true;
            }
          }
        }
      }
    }

    const roundAfter: Record<string, string[]> = {};
    for (const nt of grammar.nonTerminals) {
      roundAfter[nt] = Array.from(followSets[nt]).sort();
    }

    followRounds.push({
      round: followRoundNum++,
      sets: roundAfter,
      changed: followChanged,
    });
  }

  // Compute FIRST of each production RHS for convenient table construction & display
  const firstOfRhs: Record<string, string[]> = {};
  for (const prod of grammar.productions) {
    const fSeq = computeFirstOfSequence(prod.rhs, firstSets);
    firstOfRhs[prod.id] = Array.from(fSeq).sort();
  }

  // Convert sets to sorted string arrays for clean serialization
  const finalFirst: Record<string, string[]> = {};
  for (const nt of grammar.nonTerminals) {
    finalFirst[nt] = Array.from(firstSets[nt] || []).sort();
  }

  const finalFollow: Record<string, string[]> = {};
  for (const nt of grammar.nonTerminals) {
    finalFollow[nt] = Array.from(followSets[nt] || []).sort();
  }

  return {
    firstSets: finalFirst,
    followSets: finalFollow,
    firstRounds,
    followRounds,
    nullableNonTerminals,
    firstOfRhs,
  };
}
