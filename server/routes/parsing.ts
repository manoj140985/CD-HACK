import { Router, Request, Response } from 'express';
import { parseGrammar } from '../compiler/grammar_parser.ts';
import { buildLL1ParsingTable } from '../compiler/ll1_table.ts';
import { simulatePredictiveParsing } from '../compiler/predictive_parser.ts';
import { Grammar } from '../compiler/grammar_model.ts';

export const parsingRouter = Router();

function resolveGrammar(body: Record<string, unknown>): Grammar {
  if (body.grammar && typeof body.grammar === 'object' && Array.isArray((body.grammar as Grammar).productions)) {
    return body.grammar as Grammar;
  }
  if (typeof body.grammarText === 'string') {
    return parseGrammar(body.grammarText);
  }
  throw new Error('Either grammarText or grammar object must be provided');
}

parsingRouter.post('/table', (req: Request, res: Response) => {
  try {
    const grammar = resolveGrammar(req.body);
    const tableResult = buildLL1ParsingTable(grammar);
    res.json({
      grammar,
      tableResult,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'LL(1) table construction failed';
    res.status(400).json({ error: message });
  }
});

parsingRouter.post('/simulate', (req: Request, res: Response) => {
  try {
    const grammar = resolveGrammar(req.body);
    const inputString = typeof req.body.inputString === 'string' ? req.body.inputString : '';
    const simulation = simulatePredictiveParsing(grammar, inputString);
    res.json({
      grammar,
      inputString,
      simulation,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Predictive parse simulation failed';
    res.status(400).json({ error: message });
  }
});
