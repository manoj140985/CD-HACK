import { EPSILON, Grammar, Production, TransformationResult, TransformationStep } from './grammar_model.ts';

function findLongestCommonPrefix(arrays: string[][]): string[] {
  if (arrays.length === 0) return [];
  let prefix = arrays[0];
  for (let i = 1; i < arrays.length; i++) {
    const current = arrays[i];
    let j = 0;
    while (j < prefix.length && j < current.length && prefix[j] === current[j]) {
      j++;
    }
    prefix = prefix.slice(0, j);
    if (prefix.length === 0) break;
  }
  return prefix;
}

function generateFactoredNonTerminalName(base: string, existingNames: Set<string>): string {
  let candidate = `${base}'`;
  let counter = 1;
  while (existingNames.has(candidate)) {
    counter++;
    candidate = `${base}${counter}`;
  }
  return candidate;
}

export function performLeftFactoring(grammar: Grammar): TransformationResult {
  const steps: TransformationStep[] = [];
  const existingNames = new Set(grammar.nonTerminals);
  let currentGrammar: Grammar = {
    startSymbol: grammar.startSymbol,
    nonTerminals: [...grammar.nonTerminals],
    terminals: [...grammar.terminals],
    productions: grammar.productions.map((p) => ({ ...p, rhs: [...p.rhs] })),
  };

  let hasChangedOverall = false;
  let changedInPass = true;
  const MAX_PASSES = 10;
  let passCount = 0;

  while (changedInPass && passCount < MAX_PASSES) {
    changedInPass = false;
    passCount++;

    // Group productions by LHS
    const prodsByLhs = new Map<string, Production[]>();
    for (const nt of currentGrammar.nonTerminals) {
      prodsByLhs.set(nt, []);
    }
    for (const prod of currentGrammar.productions) {
      const list = prodsByLhs.get(prod.lhs) || [];
      list.push(prod);
      prodsByLhs.set(prod.lhs, list);
    }

    const nextProductions: Production[] = [];
    const nextNonTerminals: string[] = [];
    let prodCounter = 1;

    for (const nt of currentGrammar.nonTerminals) {
      const prods = prodsByLhs.get(nt) || [];
      if (prods.length <= 1) {
        nextNonTerminals.push(nt);
        for (const p of prods) {
          nextProductions.push({
            id: `P${prodCounter++}`,
            lhs: p.lhs,
            rhs: [...p.rhs],
            rawText: `${p.lhs} -> ${p.rhs.join(' ')}`,
          });
        }
        continue;
      }

      // Check for common prefixes among alternatives
      // Find pairs that share at least 1 symbol prefix
      let bestPrefix: string[] = [];
      let bestIndices: number[] = [];

      for (let i = 0; i < prods.length; i++) {
        for (let j = i + 1; j < prods.length; j++) {
          const lcp = findLongestCommonPrefix([prods[i].rhs, prods[j].rhs]);
          if (lcp.length > 0 && lcp[0] !== EPSILON) {
            // Find all productions starting with this prefix
            const matched: number[] = [];
            for (let k = 0; k < prods.length; k++) {
              if (
                prods[k].rhs.length >= lcp.length &&
                lcp.every((sym, idx) => prods[k].rhs[idx] === sym)
              ) {
                matched.push(k);
              }
            }

            // Prefer longer prefix, then more matched rules
            if (
              lcp.length > bestPrefix.length ||
              (lcp.length === bestPrefix.length && matched.length > bestIndices.length)
            ) {
              bestPrefix = lcp;
              bestIndices = matched;
            }
          }
        }
      }

      if (bestPrefix.length === 0) {
        // No common prefix for this non-terminal
        nextNonTerminals.push(nt);
        for (const p of prods) {
          nextProductions.push({
            id: `P${prodCounter++}`,
            lhs: p.lhs,
            rhs: [...p.rhs],
            rawText: `${p.lhs} -> ${p.rhs.join(' ')}`,
          });
        }
        continue;
      }

      // Found common prefix to factor!
      changedInPass = true;
      hasChangedOverall = true;

      const primeNT = generateFactoredNonTerminalName(nt, existingNames);
      existingNames.add(primeNT);

      nextNonTerminals.push(nt);
      nextNonTerminals.push(primeNT);

      const matchedSet = new Set(bestIndices);
      const stepOriginalProds: string[] = prods.map(
        (p) => `${p.lhs} -> ${p.rhs.join(' ')}`
      );
      const stepTransformedProds: string[] = [];

      // 1. Factored rule: A -> alpha A'
      const factoredRhs = [...bestPrefix, primeNT];
      const factoredText = `${nt} -> ${factoredRhs.join(' ')}`;
      stepTransformedProds.push(factoredText);
      nextProductions.push({
        id: `P${prodCounter++}`,
        lhs: nt,
        rhs: factoredRhs,
        rawText: factoredText,
      });

      // Untouched alternatives for A
      for (let i = 0; i < prods.length; i++) {
        if (!matchedSet.has(i)) {
          const ruleText = `${nt} -> ${prods[i].rhs.join(' ')}`;
          stepTransformedProds.push(ruleText);
          nextProductions.push({
            id: `P${prodCounter++}`,
            lhs: nt,
            rhs: [...prods[i].rhs],
            rawText: ruleText,
          });
        }
      }

      // 2. New rules for A': A' -> beta_i
      for (const idx of bestIndices) {
        const fullRhs = prods[idx].rhs;
        const remainder = fullRhs.slice(bestPrefix.length);
        const primeRhs = remainder.length === 0 ? [EPSILON] : remainder;
        const primeRuleText = `${primeNT} -> ${primeRhs.join(' ')}`;
        stepTransformedProds.push(primeRuleText);
        nextProductions.push({
          id: `P${prodCounter++}`,
          lhs: primeNT,
          rhs: primeRhs,
          rawText: primeRuleText,
        });
      }

      steps.push({
        stepNumber: steps.length + 1,
        title: `Left Factor '${nt}' with Common Prefix [${bestPrefix.join(' ')}]`,
        nonTerminal: nt,
        description: `Found common prefix '${bestPrefix.join(' ')}' in ${bestIndices.length} alternatives of '${nt}'. Created new non-terminal '${primeNT}'.`,
        originalProductions: stepOriginalProds,
        transformedProductions: stepTransformedProds,
      });
    }

    // Update currentGrammar for subsequent passes
    const ntSet = new Set(nextNonTerminals);
    const terminalSet = new Set<string>();
    for (const prod of nextProductions) {
      for (const sym of prod.rhs) {
        if (sym !== EPSILON && !ntSet.has(sym)) {
          terminalSet.add(sym);
        }
      }
    }

    currentGrammar = {
      startSymbol: currentGrammar.startSymbol,
      nonTerminals: nextNonTerminals,
      terminals: Array.from(terminalSet).sort(),
      productions: nextProductions,
    };
  }

  return {
    originalGrammar: grammar,
    transformedGrammar: currentGrammar,
    steps,
    hasChanged: hasChangedOverall,
  };
}
