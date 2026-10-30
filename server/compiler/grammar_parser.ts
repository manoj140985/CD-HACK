import { EPSILON, Grammar, Production } from './grammar_model.ts';

/**
 * Normalizes epsilon representations to standard 'ε'
 */
export function normalizeEpsilon(token: string): string {
  const trimmed = token.trim();
  const lower = trimmed.toLowerCase();
  if (
    trimmed === 'ε' ||
    lower === 'epsilon' ||
    lower === 'eps' ||
    trimmed === '^' ||
    trimmed === '@' ||
    trimmed === 'λ' ||
    lower === 'lambda'
  ) {
    return EPSILON;
  }
  return trimmed;
}

/**
 * Tokenizes a single RHS alternative into symbols.
 * Handles space-separated tokens as well as dense strings with known non-terminals.
 */
export function tokenizeRhs(
  rhsString: string,
  knownNonTerminals: string[]
): string[] {
  const trimmed = rhsString.trim();
  if (!trimmed || trimmed === EPSILON || normalizeEpsilon(trimmed) === EPSILON) {
    return [EPSILON];
  }

  // If input is explicitly space-separated (contains spaces)
  if (trimmed.includes(' ')) {
    const rawTokens = trimmed
      .split(/\s+/)
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const tokens: string[] = [];
    for (const token of rawTokens) {
      const norm = normalizeEpsilon(token);
      tokens.push(norm);
    }
    return tokens.length > 0 ? tokens : [EPSILON];
  }

  // If no spaces, perform greedy tokenization using known non-terminals and common tokens
  // Sort knownNonTerminals by length descending so "E'" matches before "E"
  const sortedNTs = [...knownNonTerminals].sort((a, b) => b.length - a.length);

  const tokens: string[] = [];
  let i = 0;
  const len = trimmed.length;

  while (i < len) {
    // Check for whitespace
    if (/\s/.test(trimmed[i])) {
      i++;
      continue;
    }

    // Check if starts with any known non-terminal
    let matchedNT: string | null = null;
    for (const nt of sortedNTs) {
      if (trimmed.startsWith(nt, i)) {
        matchedNT = nt;
        break;
      }
    }

    if (matchedNT) {
      tokens.push(matchedNT);
      i += matchedNT.length;
      continue;
    }

    // Check for standard multi-char tokens: id, num, int, float, bool, etc.
    const remaining = trimmed.slice(i);
    const multiMatch = remaining.match(/^(id|num|int|float|bool|true|false|if|then|else|while|do)\b/i);
    if (multiMatch) {
      tokens.push(multiMatch[0]);
      i += multiMatch[0].length;
      continue;
    }

    // Check for epsilon symbols
    if (trimmed[i] === 'ε' || trimmed[i] === '^' || trimmed[i] === 'λ') {
      tokens.push(EPSILON);
      i++;
      continue;
    }

    // Check for alphanumeric word (like identifier)
    const wordMatch = remaining.match(/^[a-zA-Z][a-zA-Z0-9_]*'* /);
    if (wordMatch) {
      const word = wordMatch[0].trim();
      tokens.push(normalizeEpsilon(word));
      i += wordMatch[0].length;
      continue;
    }

    // Otherwise single character (punctuation, operator, or letter)
    tokens.push(trimmed[i]);
    i++;
  }

  return tokens.length > 0 ? tokens : [EPSILON];
}

/**
 * Parses raw CFG text into a structured Grammar object.
 * Format:
 *   E -> T E'
 *   E' -> + T E' | ε
 * Or:
 *   E ::= T E'
 */
export function parseGrammar(rawText: string): Grammar {
  const lines = rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#') && !line.startsWith('//'));

  if (lines.length === 0) {
    return {
      startSymbol: '',
      nonTerminals: [],
      terminals: [],
      productions: [],
    };
  }

  // First pass: identify non-terminals (LHS of each production)
  const nonTerminalSet = new Set<string>();
  const lhsList: string[] = [];

  for (const line of lines) {
    const sepMatch = line.match(/^([^->:=]+)\s*(?:->|::=)\s*(.*)$/);
    if (sepMatch) {
      const lhs = sepMatch[1].trim();
      if (lhs) {
        if (!nonTerminalSet.has(lhs)) {
          nonTerminalSet.add(lhs);
          lhsList.push(lhs);
        }
      }
    }
  }

  const startSymbol = lhsList[0] || '';
  const productions: Production[] = [];
  const terminalSet = new Set<string>();
  let prodCounter = 1;

  // Second pass: parse alternatives
  for (const line of lines) {
    const sepMatch = line.match(/^([^->:=]+)\s*(?:->|::=)\s*(.*)$/);
    if (!sepMatch) continue;

    const lhs = sepMatch[1].trim();
    const rhsAll = sepMatch[2].trim();

    // Split alternatives by pipe |
    // Be mindful if | is escaped or alone
    const alternatives = rhsAll.split('|').map((alt) => alt.trim());

    for (const alt of alternatives) {
      const rhsTokens = tokenizeRhs(alt, lhsList);
      
      productions.push({
        id: `P${prodCounter++}`,
        lhs,
        rhs: rhsTokens,
        rawText: `${lhs} -> ${rhsTokens.join(' ')}`,
      });

      for (const token of rhsTokens) {
        if (token !== EPSILON && !nonTerminalSet.has(token)) {
          terminalSet.add(token);
        }
      }
    }
  }

  return {
    startSymbol,
    nonTerminals: lhsList,
    terminals: Array.from(terminalSet).sort(),
    productions,
  };
}

/**
 * Converts a Grammar object back into formatted CFG text.
 * Groups productions by LHS with | alternatives.
 */
export function formatGrammar(grammar: Grammar): string {
  const grouped: Record<string, string[][]> = {};
  for (const nt of grammar.nonTerminals) {
    grouped[nt] = [];
  }

  for (const prod of grammar.productions) {
    if (!grouped[prod.lhs]) {
      grouped[prod.lhs] = [];
    }
    grouped[prod.lhs].push(prod.rhs);
  }

  const lines: string[] = [];
  for (const nt of grammar.nonTerminals) {
    const alts = grouped[nt] || [];
    if (alts.length === 0) continue;
    const formattedAlts = alts.map((rhs) => rhs.join(' ')).join(' | ');
    lines.push(`${nt} -> ${formattedAlts}`);
  }

  return lines.join('\n');
}
