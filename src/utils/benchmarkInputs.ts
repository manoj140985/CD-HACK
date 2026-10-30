import { Grammar, EPSILON } from '../types/compiler.ts';

export interface BenchmarkItem {
  input: string;
  label: string;
  notes?: string;
  expectedStatus?: 'accept' | 'reject';
}

/**
 * Normalizes grammar production text to detect known benchmark patterns regardless of spacing.
 */
function normalizeGrammarSnippet(text: string): string {
  return text.replace(/\s+/g, '').toLowerCase();
}

export function getBenchmarkInputs(
  grammar: Grammar | null,
  activeExampleId?: string | null
): BenchmarkItem[] {
  if (!grammar || grammar.productions.length === 0) {
    return [];
  }

  // Detect S -> A B C pattern
  const hasABC =
    grammar.nonTerminals.includes('A') &&
    grammar.nonTerminals.includes('B') &&
    grammar.nonTerminals.includes('C') &&
    grammar.terminals.includes('a') &&
    grammar.terminals.includes('b') &&
    grammar.terminals.includes('c');

  if (activeExampleId === 'epsilon' || hasABC) {
    return [
      { input: 'a b c', label: 'a b c', notes: 'All A, B, C derive terminals (ACCEPT)' },
      { input: 'a b', label: 'a b', notes: 'C derives ε (ACCEPT)' },
      { input: 'a', label: 'a', notes: 'B and C derive ε (ACCEPT)' },
      { input: 'b c', label: 'b c', notes: 'A derives ε (ACCEPT)' },
      { input: 'c', label: 'c', notes: 'A and B derive ε (ACCEPT)' },
      { input: '', label: 'Empty input', notes: 'All non-terminals derive ε (ACCEPT)' },
      { input: 'a c b', label: 'a c b', notes: 'Invalid sequence order (REJECT)' },
      { input: 'd', label: 'd', notes: 'Undefined terminal (REJECT)' },
    ];
  }

  // Detect Arithmetic Grammar E -> T E' ...
  const hasArithmetic =
    grammar.startSymbol === 'E' &&
    grammar.terminals.includes('+') &&
    grammar.terminals.includes('*') &&
    grammar.terminals.includes('id');

  if (activeExampleId === 'arithmetic' || hasArithmetic) {
    return [
      { input: 'id + id * id', label: 'id + id * id', notes: 'Arithmetic expression with mixed operators' },
      { input: '( id + id ) * id', label: '( id + id ) * id', notes: 'Parenthesized sub-expression' },
      { input: 'id', label: 'id', notes: 'Single identifier terminal' },
      { input: 'id * + id', label: 'id * + id', notes: 'Consecutive operators (REJECT)' },
      { input: '( id + id', label: '( id + id', notes: 'Unclosed opening parenthesis (REJECT)' },
    ];
  }

  // Detect Immediate Left Recursion A -> A a | ...
  const hasLeftRec =
    grammar.startSymbol === 'A' &&
    grammar.terminals.includes('c') &&
    grammar.terminals.includes('d');

  if (activeExampleId === 'left_recursion' || hasLeftRec) {
    return [
      { input: 'c a b', label: 'c a b', notes: 'Valid sequence with base terminal c' },
      { input: 'd b a a', label: 'd b a a', notes: 'Valid sequence with base terminal d' },
      { input: 'a b c', label: 'a b c', notes: 'Does not start with base terminal (REJECT)' },
    ];
  }

  // Detect Left Factoring S -> i E t S ...
  const hasLeftFac =
    grammar.startSymbol === 'S' &&
    grammar.terminals.includes('i') &&
    grammar.terminals.includes('t');

  if (activeExampleId === 'left_factoring' || hasLeftFac) {
    return [
      { input: 'i b t a', label: 'i b t a', notes: 'Simple if-then statement' },
      { input: 'i b t a e a', label: 'i b t a e a', notes: 'If-then-else statement' },
      { input: 'i b t', label: 'i b t', notes: 'Incomplete statement missing body (REJECT)' },
    ];
  }

  // Detect Ambiguous Grammar E -> E + E | ...
  const hasAmbiguous =
    grammar.startSymbol === 'E' &&
    grammar.terminals.includes('+') &&
    grammar.terminals.includes('id') &&
    grammar.productions.some((p) => p.rhs.join(' ') === 'E + E');

  if (activeExampleId === 'ambiguous' || hasAmbiguous) {
    return [
      { input: 'id + id * id', label: 'id + id * id', notes: 'Ambiguous arithmetic test' },
      { input: 'id', label: 'id', notes: 'Single identifier' },
      { input: 'id +', label: 'id +', notes: 'Missing right-hand operand (REJECT)' },
    ];
  }

  // Generic dynamic benchmark inputs for custom user CFG
  const validTerminals = grammar.terminals.filter((t) => t !== EPSILON && t !== '$');
  const items: BenchmarkItem[] = [];

  // 1. Try to form a valid terminal derivation from productions
  const startProds = grammar.productions.filter((p) => p.lhs === grammar.startSymbol);
  for (const prod of startProds) {
    const isEps = prod.rhs.length === 1 && prod.rhs[0] === EPSILON;
    if (isEps) {
      items.push({ input: '', label: 'Empty input', notes: 'Epsilon production from start symbol' });
    } else {
      const onlyTerms = prod.rhs.every((s) => validTerminals.includes(s));
      if (onlyTerms) {
        items.push({
          input: prod.rhs.join(' '),
          label: prod.rhs.join(' '),
          notes: `Direct production ${prod.lhs} -> ${prod.rhs.join(' ')}`,
        });
      }
    }
  }

  if (validTerminals.length > 0 && items.length === 0) {
    items.push({
      input: validTerminals[0],
      label: validTerminals[0],
      notes: 'First terminal of grammar',
    });
  }

  // Add an invalid terminal test if available
  const unusedChar = ['z', '#', 'invalid'].find((c) => !validTerminals.includes(c)) || 'z';
  items.push({
    input: unusedChar,
    label: unusedChar,
    notes: 'Out-of-alphabet symbol (REJECT)',
  });

  return items;
}

export function getDefaultInputForGrammar(
  grammar: Grammar | null,
  activeExampleId?: string | null
): string {
  const benchmarks = getBenchmarkInputs(grammar, activeExampleId);
  return benchmarks[0]?.input ?? '';
}
