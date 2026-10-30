/**
 * Core Grammar Data Models
 */

export const EPSILON = 'ε';
export const END_MARKER = '$';

export interface Production {
  id: string; // e.g. "P1", "P2"
  lhs: string; // Non-terminal symbol
  rhs: string[]; // Sequence of symbols (terminals, non-terminals, or [EPSILON])
  rawText?: string;
}

export interface Grammar {
  startSymbol: string;
  nonTerminals: string[];
  terminals: string[];
  productions: Production[];
}

export interface GrammarValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  stats: {
    nonTerminalsCount: number;
    terminalsCount: number;
    productionsCount: number;
    hasEpsilon: boolean;
    startSymbol: string;
  };
}

export interface TransformationStep {
  stepNumber: number;
  title: string;
  nonTerminal: string;
  description: string;
  originalProductions: string[];
  transformedProductions: string[];
}

export interface TransformationResult {
  originalGrammar: Grammar;
  transformedGrammar: Grammar;
  steps: TransformationStep[];
  hasChanged: boolean;
}

export interface FirstFollowRound {
  round: number;
  sets: Record<string, string[]>;
  changed: boolean;
}

export interface FirstFollowResult {
  firstSets: Record<string, string[]>;
  followSets: Record<string, string[]>;
  firstRounds: FirstFollowRound[];
  followRounds: FirstFollowRound[];
  nullableNonTerminals: string[];
  firstOfRhs: Record<string, string[]>; // productionId -> FIRST(rhs)
}

export interface TableConflict {
  nonTerminal: string;
  terminal: string;
  productions: Production[];
  conflictType: 'FIRST/FIRST' | 'FIRST/FOLLOW';
  explanation: string;
}

export interface ParsingTableResult {
  isLL1: boolean;
  table: Record<string, Record<string, Production[]>>;
  terminals: string[];
  nonTerminals: string[];
  conflicts: TableConflict[];
  summary: {
    totalCells: number;
    filledCells: number;
    emptyCells: number;
    conflictCells: number;
  };
}

export interface ParseStep {
  step: number;
  stack: string[];
  stackDisplay: string;
  remainingInput: string[];
  inputDisplay: string;
  action: string;
  production?: Production;
  status: 'running' | 'matched' | 'applied' | 'accepted' | 'error';
  errorDetail?: string;
  nodeId?: string;
}

export interface ParseTreeNode {
  id: string;
  symbol: string;
  isTerminal: boolean;
  isEpsilon: boolean;
  productionId?: string;
  ruleDisplay?: string;
  children: ParseTreeNode[];
  depth: number;
  matchedToken?: string;
  tokenIndex?: number;
  x?: number;
  y?: number;
}

export interface ParseSimulationResult {
  accepted: boolean;
  steps: ParseStep[];
  totalSteps: number;
  tokens: string[];
  error?: {
    step: number;
    tokenIndex: number;
    token: string;
    expected: string[];
    message: string;
  };
  parseTree?: ParseTreeNode;
}
