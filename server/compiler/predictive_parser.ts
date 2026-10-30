import { buildLL1ParsingTable } from './ll1_table.ts';
import {
  END_MARKER,
  EPSILON,
  Grammar,
  ParseSimulationResult,
  ParseStep,
  ParseTreeNode,
  Production,
} from './grammar_model.ts';
import { layoutParseTree } from './parse_tree.ts';

/**
 * Tokenizes input string according to grammar terminals.
 */
export function tokenizeInput(
  rawInput: string,
  terminals: string[]
): { tokens: string[]; error?: string; invalidToken?: string; charPosition?: number } {
  const trimmed = rawInput.trim();
  if (!trimmed) {
    return { tokens: [] };
  }

  // Filter out EPSILON from terminal matching
  const validTerminals = terminals.filter((t) => t !== EPSILON && t !== END_MARKER);
  // Sort descending by length for greedy match
  const sortedTerminals = [...validTerminals].sort((a, b) => b.length - a.length);

  // If input has spaces, try splitting by whitespace first
  const spaceTokens = trimmed.split(/\s+/).filter(Boolean);
  const allSpaceTokensValid = spaceTokens.every((st) => validTerminals.includes(st));

  if (allSpaceTokensValid) {
    return { tokens: spaceTokens };
  }

  // Greedy character stream tokenizer
  const tokens: string[] = [];
  let i = 0;
  const len = rawInput.length;

  while (i < len) {
    if (/\s/.test(rawInput[i])) {
      i++;
      continue;
    }

    let matched: string | null = null;
    for (const term of sortedTerminals) {
      if (rawInput.startsWith(term, i)) {
        matched = term;
        break;
      }
    }

    if (matched) {
      tokens.push(matched);
      i += matched.length;
    } else {
      // Unrecognized character or token
      const snippet = rawInput.slice(i, i + 10);
      return {
        tokens,
        error: `Unrecognized symbol '${rawInput[i]}' at position ${i} (near '${snippet}'). Expected one of: ${validTerminals.join(', ')}`,
        invalidToken: rawInput[i],
        charPosition: i,
      };
    }
  }

  return { tokens };
}

interface StackElement {
  symbol: string;
  node?: ParseTreeNode;
}

export function simulatePredictiveParsing(
  grammar: Grammar,
  inputString: string
): ParseSimulationResult {
  const { table } = buildLL1ParsingTable(grammar);
  const tokenization = tokenizeInput(inputString, grammar.terminals);

  if (tokenization.error) {
    const initialStackSymbols = [END_MARKER, grammar.startSymbol];
    const invalidToken = tokenization.invalidToken || inputString.trim() || '?';
    const errorStep: ParseStep = {
      step: 1,
      stack: initialStackSymbols,
      stackDisplay: initialStackSymbols.join(' '),
      remainingInput: [invalidToken, END_MARKER],
      inputDisplay: `${invalidToken} ${END_MARKER}`,
      action: `Error: ${tokenization.error}`,
      status: 'error',
      errorDetail: tokenization.error,
    };

    return {
      accepted: false,
      steps: [errorStep],
      totalSteps: 1,
      tokens: tokenization.tokens,
      error: {
        step: 1,
        tokenIndex: tokenization.charPosition ?? 0,
        token: tokenization.invalidToken ?? '',
        expected: grammar.terminals,
        message: tokenization.error,
      },
    };
  }

  const inputTokens = [...tokenization.tokens, END_MARKER];
  let inputIdx = 0;

  // Initialize Parse Tree Root
  let nodeCounter = 0;
  const rootNode: ParseTreeNode = {
    id: `node_${nodeCounter++}`,
    symbol: grammar.startSymbol,
    isTerminal: false,
    isEpsilon: false,
    children: [],
    depth: 0,
  };

  // Initialize Stack: Bottom is $, Top is startSymbol
  const stack: StackElement[] = [
    { symbol: END_MARKER },
    { symbol: grammar.startSymbol, node: rootNode },
  ];

  const steps: ParseStep[] = [];
  let stepNumber = 1;
  const MAX_STEPS = 500;
  const ntSet = new Set(grammar.nonTerminals);

  while (stack.length > 0 && stepNumber <= MAX_STEPS) {
    const top = stack[stack.length - 1];
    const currentInputToken = inputTokens[inputIdx];
    const remainingTokens = inputTokens.slice(inputIdx);

    // Snapshot current state BEFORE applying action
    const currentStackSymbols = stack.map((s) => s.symbol);
    const currentStackDisplay = currentStackSymbols.join(' ');
    const currentRemainingTokens = inputTokens.slice(inputIdx);
    const currentInputDisplay = currentRemainingTokens.join(' ');

    // Check Case 1: Stack top is END_MARKER
    if (top.symbol === END_MARKER) {
      if (currentInputToken === END_MARKER) {
        steps.push({
          step: stepNumber++,
          stack: currentStackSymbols,
          stackDisplay: currentStackDisplay,
          remainingInput: currentRemainingTokens,
          inputDisplay: currentInputDisplay,
          action: 'Accept (Input successfully parsed!)',
          status: 'accepted',
        });
        layoutParseTree(rootNode);
        return {
          accepted: true,
          steps,
          totalSteps: steps.length,
          tokens: tokenization.tokens,
          parseTree: rootNode,
        };
      } else {
        steps.push({
          step: stepNumber++,
          stack: currentStackSymbols,
          stackDisplay: currentStackDisplay,
          remainingInput: currentRemainingTokens,
          inputDisplay: currentInputDisplay,
          action: `Error: Stack empty ($) but input contains trailing tokens '${currentInputDisplay}' (REJECT)`,
          status: 'error',
          errorDetail: `Trailing tokens found after full parse. Stack reached $, input has '${currentInputDisplay}'.`,
        });
        return {
          accepted: false,
          steps,
          totalSteps: steps.length,
          tokens: tokenization.tokens,
          error: {
            step: stepNumber - 1,
            tokenIndex: inputIdx,
            token: currentInputToken,
            expected: [END_MARKER],
            message: `Unexpected extra tokens '${currentInputDisplay}' at end of valid prefix.`,
          },
        };
      }
    }

    // Check Case 2: Top of stack is a Terminal
    if (!ntSet.has(top.symbol)) {
      if (top.symbol === currentInputToken) {
        // MATCH!
        const matchedSymbol = top.symbol;
        if (top.node) {
          top.node.isTerminal = true;
          top.node.matchedToken = matchedSymbol;
          top.node.tokenIndex = inputIdx;
        }

        steps.push({
          step: stepNumber++,
          stack: currentStackSymbols,
          stackDisplay: currentStackDisplay,
          remainingInput: currentRemainingTokens,
          inputDisplay: currentInputDisplay,
          action: `Match terminal '${matchedSymbol}' (pop stack, advance input)`,
          status: 'matched',
          nodeId: top.node?.id,
        });

        stack.pop();
        inputIdx++;
        continue;
      } else {
        // Mismatch Terminal Error
        steps.push({
          step: stepNumber++,
          stack: currentStackSymbols,
          stackDisplay: currentStackDisplay,
          remainingInput: currentRemainingTokens,
          inputDisplay: currentInputDisplay,
          action: `Error: Expected terminal '${top.symbol}', but found token '${currentInputToken}' (REJECT)`,
          status: 'error',
          errorDetail: `Mismatched terminal on stack. Top is '${top.symbol}', input token is '${currentInputToken}'.`,
        });

        return {
          accepted: false,
          steps,
          totalSteps: steps.length,
          tokens: tokenization.tokens,
          error: {
            step: stepNumber - 1,
            tokenIndex: inputIdx,
            token: currentInputToken,
            expected: [top.symbol],
            message: `Expected '${top.symbol}' but found '${currentInputToken}' at position ${inputIdx + 1}.`,
          },
        };
      }
    }

    // Check Case 3: Top of stack is a Non-Terminal
    const A = top.symbol;
    const parentNode = top.node!;
    const cellProds = table[A]?.[currentInputToken] || [];

    if (cellProds.length === 0) {
      // Empty cell in LL(1) table -> Syntax Error!
      const validLookaheads = Object.keys(table[A] || {}).filter(
        (t) => (table[A][t] || []).length > 0
      );

      steps.push({
        step: stepNumber++,
        stack: currentStackSymbols,
        stackDisplay: currentStackDisplay,
        remainingInput: currentRemainingTokens,
        inputDisplay: currentInputDisplay,
        action: `Error: No entry in parse table M[${A}, '${currentInputToken}']. Expected one of: ${validLookaheads.join(', ') || 'none'} (REJECT)`,
        status: 'error',
        errorDetail: `Parsing table cell M[${A}, '${currentInputToken}'] is empty.`,
      });

      return {
        accepted: false,
        steps,
        totalSteps: steps.length,
        tokens: tokenization.tokens,
        error: {
          step: stepNumber - 1,
          tokenIndex: inputIdx,
          token: currentInputToken,
          expected: validLookaheads,
          message: `Unexpected token '${currentInputToken}' when expanding '${A}'. Expected one of: ${validLookaheads.join(', ')}`,
        },
      };
    }

    // Pick production (if conflict, choose first and add note)
    const chosenProd: Production = cellProds[0];
    const isConflict = cellProds.length > 1;

    let actionText =
      chosenProd.rhs.length === 1 && chosenProd.rhs[0] === EPSILON
        ? `Apply ${chosenProd.lhs} -> ${EPSILON} (epsilon production)`
        : `Apply ${chosenProd.lhs} -> ${chosenProd.rhs.join(' ')}`;
    if (isConflict) {
      actionText += ` [Note: Conflict in M[${A}, '${currentInputToken}'] - chosen ${chosenProd.id}]`;
    }

    // Record step with state BEFORE pop and push
    steps.push({
      step: stepNumber++,
      stack: currentStackSymbols,
      stackDisplay: currentStackDisplay,
      remainingInput: currentRemainingTokens,
      inputDisplay: currentInputDisplay,
      action: actionText,
      production: chosenProd,
      status: 'applied',
      nodeId: parentNode.id,
    });

    // Pop non-terminal A
    stack.pop();
    parentNode.productionId = chosenProd.id;
    parentNode.ruleDisplay = `${chosenProd.lhs} -> ${chosenProd.rhs.join(' ')}`;

    // Handle Epsilon production: A -> ε
    if (chosenProd.rhs.length === 1 && chosenProd.rhs[0] === EPSILON) {
      const epsNode: ParseTreeNode = {
        id: `node_${nodeCounter++}`,
        symbol: EPSILON,
        isTerminal: false,
        isEpsilon: true,
        children: [],
        depth: parentNode.depth + 1,
      };
      parentNode.children.push(epsNode);
      continue;
    }

    // Handle standard production: A -> X1 X2 ... Xk
    const childNodes: ParseTreeNode[] = [];
    for (const sym of chosenProd.rhs) {
      const isTerm = !ntSet.has(sym);
      const child: ParseTreeNode = {
        id: `node_${nodeCounter++}`,
        symbol: sym,
        isTerminal: isTerm,
        isEpsilon: false,
        children: [],
        depth: parentNode.depth + 1,
      };
      childNodes.push(child);
      parentNode.children.push(child);
    }

    // Push children onto stack in REVERSE order so X1 is at top
    for (let k = childNodes.length - 1; k >= 0; k--) {
      stack.push({
        symbol: childNodes[k].symbol,
        node: childNodes[k],
      });
    }
  }

  // If exceeded max steps
  layoutParseTree(rootNode);
  return {
    accepted: false,
    steps,
    totalSteps: steps.length,
    tokens: tokenization.tokens,
    error: {
      step: stepNumber,
      tokenIndex: inputIdx,
      token: inputTokens[inputIdx] || '',
      expected: [],
      message: 'Maximum step count exceeded (500 steps). Grammar may contain non-terminating recursion or cycle.',
    },
    parseTree: rootNode,
  };
}
