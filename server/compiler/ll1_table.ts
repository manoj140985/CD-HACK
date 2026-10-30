import { computeFirstAndFollow, computeFirstOfSequence } from './first_follow.ts';
import { END_MARKER, EPSILON, Grammar, ParsingTableResult, Production, TableConflict } from './grammar_model.ts';

export function buildLL1ParsingTable(grammar: Grammar): ParsingTableResult {
  const { firstSets, followSets } = computeFirstAndFollow(grammar);

  // Terminals for table include all grammar terminals plus $
  const sortedTerminals = Array.from(new Set(grammar.terminals.filter((t) => t !== EPSILON))).sort();
  const tableColumns = [...sortedTerminals, END_MARKER];
  const tableRows = [...grammar.nonTerminals];

  // Initialize empty table
  const table: Record<string, Record<string, Production[]>> = {};
  for (const nt of tableRows) {
    table[nt] = {};
    for (const term of tableColumns) {
      table[nt][term] = [];
    }
  }

  // Convert firstSets string arrays to Set for fast lookup in computeFirstOfSequence
  const firstSetsMap: Record<string, Set<string>> = {};
  for (const key of Object.keys(firstSets)) {
    firstSetsMap[key] = new Set(firstSets[key]);
  }
  for (const term of sortedTerminals) {
    firstSetsMap[term] = new Set([term]);
  }
  firstSetsMap[END_MARKER] = new Set([END_MARKER]);
  firstSetsMap[EPSILON] = new Set([EPSILON]);

  // Track how each production was placed in a cell to detect conflict types
  const placementSource: Record<string, Record<string, Array<{ prod: Production; reason: 'FIRST' | 'FOLLOW' }>>> = {};
  for (const nt of tableRows) {
    placementSource[nt] = {};
    for (const term of tableColumns) {
      placementSource[nt][term] = [];
    }
  }

  for (const prod of grammar.productions) {
    const A = prod.lhs;
    const rhsFirst = computeFirstOfSequence(prod.rhs, firstSetsMap);

    // Rule 1: For each terminal 'a' in FIRST(alpha), add A -> alpha to M[A, a]
    for (const a of rhsFirst) {
      if (a !== EPSILON && table[A] && table[A][a] !== undefined) {
        // Only add if not already present
        if (!table[A][a].some((p) => p.id === prod.id)) {
          table[A][a].push(prod);
          placementSource[A][a].push({ prod, reason: 'FIRST' });
        }
      }
    }

    // Rule 2: If ε in FIRST(alpha), for each 'b' in FOLLOW(A), add A -> alpha to M[A, b]
    if (rhsFirst.has(EPSILON)) {
      const followA = followSets[A] || [];
      for (const b of followA) {
        if (table[A] && table[A][b] !== undefined) {
          if (!table[A][b].some((p) => p.id === prod.id)) {
            table[A][b].push(prod);
            placementSource[A][b].push({ prod, reason: 'FOLLOW' });
          }
        }
      }
    }
  }

  // Detect conflicts
  const conflicts: TableConflict[] = [];
  let filledCells = 0;
  let emptyCells = 0;
  let conflictCells = 0;
  const totalCells = tableRows.length * tableColumns.length;

  for (const nt of tableRows) {
    for (const term of tableColumns) {
      const prods = table[nt][term];
      if (prods.length === 0) {
        emptyCells++;
      } else if (prods.length === 1) {
        filledCells++;
      } else {
        filledCells++;
        conflictCells++;
        
        const sources = placementSource[nt][term] || [];
        const hasFollow = sources.some((s) => s.reason === 'FOLLOW');
        const conflictType: 'FIRST/FIRST' | 'FIRST/FOLLOW' = hasFollow
          ? 'FIRST/FOLLOW'
          : 'FIRST/FIRST';

        const prodListStr = prods.map((p) => `${p.lhs} -> ${p.rhs.join(' ')}`).join(' AND ');
        const explanation =
          conflictType === 'FIRST/FIRST'
            ? `FIRST/FIRST Conflict at M[${nt}, '${term}']: Multiple productions can expand '${nt}' when seeing '${term}' because '${term}' is in the FIRST set of both alternatives: ${prodListStr}.`
            : `FIRST/FOLLOW Conflict at M[${nt}, '${term}']: One production derives '${term}' via FIRST, while a nullable production places itself because '${term}' is in FOLLOW(${nt}): ${prodListStr}.`;

        conflicts.push({
          nonTerminal: nt,
          terminal: term,
          productions: prods,
          conflictType,
          explanation,
        });
      }
    }
  }

  return {
    isLL1: conflicts.length === 0,
    table,
    terminals: tableColumns,
    nonTerminals: tableRows,
    conflicts,
    summary: {
      totalCells,
      filledCells,
      emptyCells,
      conflictCells,
    },
  };
}
