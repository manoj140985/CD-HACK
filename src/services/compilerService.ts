import {
  FirstFollowResult,
  Grammar,
  GrammarExample,
  GrammarValidationResult,
  ParseSimulationResult,
  ParsingTableResult,
  TransformationResult,
} from '../types/compiler.ts';
import { SAMPLE_GRAMMARS } from '../../server/compiler/examples.ts';
import { parseGrammar as localParseGrammar, formatGrammar } from '../../server/compiler/grammar_parser.ts';
import { validateGrammar as localValidateGrammar } from '../../server/compiler/grammar_validator.ts';
import { eliminateImmediateLeftRecursion } from '../../server/compiler/left_recursion.ts';
import { performLeftFactoring } from '../../server/compiler/left_factoring.ts';
import { computeFirstAndFollow } from '../../server/compiler/first_follow.ts';
import { buildLL1ParsingTable } from '../../server/compiler/ll1_table.ts';
import { simulatePredictiveParsing } from '../../server/compiler/predictive_parser.ts';

export const compilerService = {
  getExamples(): GrammarExample[] {
    return SAMPLE_GRAMMARS;
  },

  async fetchExamples(): Promise<GrammarExample[]> {
    try {
      const res = await fetch('/api/grammar/examples');
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      return data.examples || SAMPLE_GRAMMARS;
    } catch {
      return SAMPLE_GRAMMARS;
    }
  },

  async validateGrammar(grammarText: string, grammar?: Grammar): Promise<{ grammar: Grammar; validation: GrammarValidationResult }> {
    try {
      const res = await fetch('/api/grammar/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grammarText, grammar }),
      });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      return await res.json();
    } catch {
      const parsed = grammar || localParseGrammar(grammarText);
      const validation = localValidateGrammar(parsed);
      return { grammar: parsed, validation };
    }
  },

  async eliminateLeftRecursion(grammarText: string, grammar?: Grammar): Promise<TransformationResult> {
    try {
      const res = await fetch('/api/transformations/left-recursion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grammarText, grammar }),
      });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      return await res.json();
    } catch {
      const parsed = grammar || localParseGrammar(grammarText);
      return eliminateImmediateLeftRecursion(parsed);
    }
  },

  async performLeftFactoring(grammarText: string, grammar?: Grammar): Promise<TransformationResult> {
    try {
      const res = await fetch('/api/transformations/left-factoring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grammarText, grammar }),
      });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      return await res.json();
    } catch {
      const parsed = grammar || localParseGrammar(grammarText);
      return performLeftFactoring(parsed);
    }
  },

  async calculateFirstAndFollow(grammarText: string, grammar?: Grammar): Promise<{ grammar: Grammar; result: FirstFollowResult }> {
    try {
      const res = await fetch('/api/first-follow/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grammarText, grammar }),
      });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      return await res.json();
    } catch {
      const parsed = grammar || localParseGrammar(grammarText);
      const result = computeFirstAndFollow(parsed);
      return { grammar: parsed, result };
    }
  },

  async generateParsingTable(grammarText: string, grammar?: Grammar): Promise<{ grammar: Grammar; tableResult: ParsingTableResult }> {
    try {
      const res = await fetch('/api/parsing/table', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grammarText, grammar }),
      });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      return await res.json();
    } catch {
      const parsed = grammar || localParseGrammar(grammarText);
      const tableResult = buildLL1ParsingTable(parsed);
      return { grammar: parsed, tableResult };
    }
  },

  async simulateParsing(
    grammarText: string,
    inputString: string,
    grammar?: Grammar
  ): Promise<{ grammar: Grammar; inputString: string; simulation: ParseSimulationResult }> {
    try {
      const res = await fetch('/api/parsing/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grammarText, inputString, grammar }),
      });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      return await res.json();
    } catch {
      const parsed = grammar || localParseGrammar(grammarText);
      const simulation = simulatePredictiveParsing(parsed, inputString);
      return { grammar: parsed, inputString, simulation };
    }
  },

  formatGrammarToString(grammar: Grammar): string {
    return formatGrammar(grammar);
  },
};
