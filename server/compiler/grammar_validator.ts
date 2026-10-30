import { EPSILON, Grammar, GrammarValidationResult } from './grammar_model.ts';

export function validateGrammar(grammar: Grammar): GrammarValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!grammar.startSymbol || grammar.productions.length === 0) {
    return {
      isValid: false,
      errors: ['Grammar is empty. Please define at least one production rule.'],
      warnings: [],
      stats: {
        nonTerminalsCount: 0,
        terminalsCount: 0,
        productionsCount: 0,
        hasEpsilon: false,
        startSymbol: '',
      },
    };
  }

  const ntSet = new Set(grammar.nonTerminals);
  let hasEpsilon = false;

  // Check each production
  for (const prod of grammar.productions) {
    if (!prod.lhs) {
      errors.push(`Production ${prod.id} has an empty left-hand side.`);
    }

    if (!prod.rhs || prod.rhs.length === 0) {
      errors.push(`Production ${prod.lhs} has an empty right-hand side. Use ε for epsilon.`);
    }

    if (prod.rhs.includes(EPSILON)) {
      hasEpsilon = true;
      if (prod.rhs.length > 1) {
        warnings.push(
          `Production ${prod.lhs} -> ${prod.rhs.join(' ')} mixes epsilon 'ε' with other symbols.`
        );
      }
    }

    // Direct loop detection
    if (prod.rhs.length === 1 && prod.rhs[0] === prod.lhs) {
      warnings.push(`Trivial circular unit production detected: ${prod.lhs} -> ${prod.lhs}`);
    }
  }

  // Reachability analysis from startSymbol
  const reachable = new Set<string>();
  const queue = [grammar.startSymbol];
  reachable.add(grammar.startSymbol);

  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const prod of grammar.productions) {
      if (prod.lhs === current) {
        for (const sym of prod.rhs) {
          if (ntSet.has(sym) && !reachable.has(sym)) {
            reachable.add(sym);
            queue.push(sym);
          }
        }
      }
    }
  }

  // Unreachable non-terminals
  for (const nt of grammar.nonTerminals) {
    if (!reachable.has(nt)) {
      warnings.push(
        `Non-terminal '${nt}' is unreachable from start symbol '${grammar.startSymbol}'.`
      );
    }
  }

  // Productivity / Generating symbols analysis (can derive terminals)
  const generating = new Set<string>();
  let changed = true;

  while (changed) {
    changed = false;
    for (const prod of grammar.productions) {
      if (generating.has(prod.lhs)) continue;

      const allGeneratingOrTerminals = prod.rhs.every(
        (sym) => sym === EPSILON || !ntSet.has(sym) || generating.has(sym)
      );

      if (allGeneratingOrTerminals) {
        generating.add(prod.lhs);
        changed = true;
      }
    }
  }

  for (const nt of grammar.nonTerminals) {
    if (!generating.has(nt)) {
      errors.push(
        `Non-terminal '${nt}' is non-terminating (cannot derive any sequence of terminals).`
      );
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    stats: {
      nonTerminalsCount: grammar.nonTerminals.length,
      terminalsCount: grammar.terminals.length,
      productionsCount: grammar.productions.length,
      hasEpsilon,
      startSymbol: grammar.startSymbol,
    },
  };
}
