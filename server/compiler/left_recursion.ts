import { EPSILON, Grammar, Production, TransformationResult, TransformationStep } from './grammar_model.ts';

function generateNewNonTerminalName(base: string, existingNames: Set<string>): string {
  let candidate = `${base}'`;
  let counter = 1;
  while (existingNames.has(candidate)) {
    counter++;
    candidate = `${base}${counter}`;
  }
  return candidate;
}

export function eliminateImmediateLeftRecursion(grammar: Grammar): TransformationResult {
  const steps: TransformationStep[] = [];
  const existingNames = new Set(grammar.nonTerminals);
  let hasChanged = false;

  // Group productions by LHS
  const prodsByLhs = new Map<string, Production[]>();
  for (const nt of grammar.nonTerminals) {
    prodsByLhs.set(nt, []);
  }
  for (const prod of grammar.productions) {
    const list = prodsByLhs.get(prod.lhs) || [];
    list.push(prod);
    prodsByLhs.set(prod.lhs, list);
  }

  const newProductions: Production[] = [];
  const newNonTerminals: string[] = [];
  let prodCounter = 1;

  for (const nt of grammar.nonTerminals) {
    const currentProds = prodsByLhs.get(nt) || [];
    const recursiveAlts: string[][] = []; // alphas
    const nonRecursiveAlts: string[][] = []; // betas

    for (const prod of currentProds) {
      if (prod.rhs.length > 0 && prod.rhs[0] === nt) {
        // Left recursive: A -> A alpha
        const alpha = prod.rhs.slice(1);
        recursiveAlts.push(alpha.length > 0 ? alpha : [EPSILON]);
      } else {
        // Non-recursive: A -> beta
        nonRecursiveAlts.push(prod.rhs);
      }
    }

    if (recursiveAlts.length === 0) {
      // Not left recursive, keep original productions
      newNonTerminals.push(nt);
      for (const prod of currentProds) {
        newProductions.push({
          id: `P${prodCounter++}`,
          lhs: prod.lhs,
          rhs: [...prod.rhs],
          rawText: `${prod.lhs} -> ${prod.rhs.join(' ')}`,
        });
      }
      continue;
    }

    // Has left recursion!
    hasChanged = true;
    const primeNT = generateNewNonTerminalName(nt, existingNames);
    existingNames.add(primeNT);

    newNonTerminals.push(nt);
    newNonTerminals.push(primeNT);

    // If there are no beta productions, introduce epsilon so it can terminate
    const effectiveBetas =
      nonRecursiveAlts.length > 0 ? nonRecursiveAlts : [[EPSILON]];

    const stepOriginalProds: string[] = currentProds.map(
      (p) => `${p.lhs} -> ${p.rhs.join(' ')}`
    );
    const stepTransformedProds: string[] = [];

    // 1. A -> beta_i A'
    for (const beta of effectiveBetas) {
      const rhs =
        beta.length === 1 && beta[0] === EPSILON ? [primeNT] : [...beta, primeNT];
      const prodText = `${nt} -> ${rhs.join(' ')}`;
      stepTransformedProds.push(prodText);
      newProductions.push({
        id: `P${prodCounter++}`,
        lhs: nt,
        rhs,
        rawText: prodText,
      });
    }

    // 2. A' -> alpha_i A' | ε
    for (const alpha of recursiveAlts) {
      const rhs =
        alpha.length === 1 && alpha[0] === EPSILON ? [primeNT] : [...alpha, primeNT];
      const prodText = `${primeNT} -> ${rhs.join(' ')}`;
      stepTransformedProds.push(prodText);
      newProductions.push({
        id: `P${prodCounter++}`,
        lhs: primeNT,
        rhs,
        rawText: prodText,
      });
    }

    // Epsilon production for A'
    const epsText = `${primeNT} -> ${EPSILON}`;
    stepTransformedProds.push(epsText);
    newProductions.push({
      id: `P${prodCounter++}`,
      lhs: primeNT,
      rhs: [EPSILON],
      rawText: epsText,
    });

    const alphaDisplay = recursiveAlts.map((a) => a.join(' ')).join(', ');
    const betaDisplay = effectiveBetas.map((b) => b.join(' ')).join(', ');

    steps.push({
      stepNumber: steps.length + 1,
      title: `Eliminate Immediate Left Recursion for '${nt}'`,
      nonTerminal: nt,
      description: `Identified left-recursive rules for '${nt}'. α = { ${alphaDisplay} }, β = { ${betaDisplay} }. Replaced with ${nt} -> β ${primeNT} and ${primeNT} -> α ${primeNT} | ε.`,
      originalProductions: stepOriginalProds,
      transformedProductions: stepTransformedProds,
    });
  }

  // Recalculate terminals
  const ntSet = new Set(newNonTerminals);
  const terminalSet = new Set<string>();
  for (const prod of newProductions) {
    for (const sym of prod.rhs) {
      if (sym !== EPSILON && !ntSet.has(sym)) {
        terminalSet.add(sym);
      }
    }
  }

  const transformedGrammar: Grammar = {
    startSymbol: grammar.startSymbol,
    nonTerminals: newNonTerminals,
    terminals: Array.from(terminalSet).sort(),
    productions: newProductions,
  };

  return {
    originalGrammar: grammar,
    transformedGrammar,
    steps,
    hasChanged,
  };
}
