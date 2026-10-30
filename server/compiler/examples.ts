export interface GrammarExample {
  id: string;
  name: string;
  category: 'LL(1)' | 'Left Recursion' | 'Left Factoring' | 'Epsilon' | 'Non-LL(1)';
  description: string;
  grammarText: string;
  sampleInputs: Array<{ input: string; shouldAccept: boolean; notes: string }>;
}

export const SAMPLE_GRAMMARS: GrammarExample[] = [
  {
    id: 'arithmetic',
    name: 'Arithmetic Expressions',
    category: 'LL(1)',
    description: 'Standard unambiguous LL(1) grammar for arithmetic expressions with addition, multiplication, parentheses, and identifiers.',
    grammarText: `E -> T E'
E' -> + T E' | ε
T -> F T'
T' -> * F T' | ε
F -> ( E ) | id`,
    sampleInputs: [
      { input: 'id + id * id', shouldAccept: true, notes: 'Valid expression with mixed precedence' },
      { input: '( id + id ) * id', shouldAccept: true, notes: 'Parenthesized sub-expression' },
      { input: 'id * + id', shouldAccept: false, notes: 'Invalid consecutive operators' },
      { input: '( id + id', shouldAccept: false, notes: 'Unbalanced opening parenthesis' },
    ],
  },
  {
    id: 'left_recursion',
    name: 'Immediate Left Recursion',
    category: 'Left Recursion',
    description: 'Classic direct left-recursive grammar demonstrating the A -> A α | β pattern.',
    grammarText: `A -> A a | A b | c | d`,
    sampleInputs: [
      { input: 'c a b', shouldAccept: true, notes: 'Left-to-right chain after elimination' },
      { input: 'd b a a', shouldAccept: true, notes: 'Starts with d followed by recursive symbols' },
      { input: 'a b c', shouldAccept: false, notes: 'Does not start with base terminal beta' },
    ],
  },
  {
    id: 'left_factoring',
    name: 'Dangling-Else / Left Factoring',
    category: 'Left Factoring',
    description: 'Classic conditional grammar showing common prefix (if-then vs if-then-else) requiring left factoring.',
    grammarText: `S -> i E t S | i E t S e S | a
E -> b`,
    sampleInputs: [
      { input: 'i b t a', shouldAccept: true, notes: 'Simple if-then statement' },
      { input: 'i b t a e a', shouldAccept: true, notes: 'If-then-else statement' },
      { input: 'i b t', shouldAccept: false, notes: 'Incomplete statement missing body' },
    ],
  },
  {
    id: 'epsilon',
    name: 'Nullable & Epsilon (S -> A B C)',
    category: 'Epsilon',
    description: 'Grammar with multiple nullable non-terminals testing FIRST/FOLLOW fixed-point propagation and epsilon expansions.',
    grammarText: `S -> A B C
A -> a | ε
B -> b | ε
C -> c | ε`,
    sampleInputs: [
      { input: 'a b c', shouldAccept: true, notes: 'All non-terminals derive terminals' },
      { input: 'a b', shouldAccept: true, notes: 'C derives epsilon' },
      { input: 'a', shouldAccept: true, notes: 'B and C derive epsilon' },
      { input: 'b c', shouldAccept: true, notes: 'A derives epsilon' },
      { input: 'c', shouldAccept: true, notes: 'A and B derive epsilon' },
      { input: 'a c b', shouldAccept: false, notes: 'Out of order sequence' },
      { input: 'd', shouldAccept: false, notes: 'Undefined terminal' },
      { input: '', shouldAccept: true, notes: 'Empty input (all derive epsilon)' },
    ],
  },
  {
    id: 'ambiguous',
    name: 'Ambiguous / Non-LL(1)',
    category: 'Non-LL(1)',
    description: 'Ambiguous arithmetic grammar that causes multiple FIRST/FIRST and FIRST/FOLLOW conflicts in the LL(1) parsing table.',
    grammarText: `E -> E + E | E * E | id`,
    sampleInputs: [
      { input: 'id + id * id', shouldAccept: true, notes: 'Can parse with conflict resolution' },
      { input: 'id +', shouldAccept: false, notes: 'Missing operand' },
    ],
  },
];
