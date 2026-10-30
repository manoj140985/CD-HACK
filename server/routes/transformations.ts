import { Router, Request, Response } from 'express';
import { parseGrammar } from '../compiler/grammar_parser.ts';
import { eliminateImmediateLeftRecursion } from '../compiler/left_recursion.ts';
import { performLeftFactoring } from '../compiler/left_factoring.ts';
import { Grammar } from '../compiler/grammar_model.ts';

export const transformationsRouter = Router();

function resolveGrammar(body: Record<string, unknown>): Grammar {
  if (body.grammar && typeof body.grammar === 'object' && Array.isArray((body.grammar as Grammar).productions)) {
    return body.grammar as Grammar;
  }
  if (typeof body.grammarText === 'string') {
    return parseGrammar(body.grammarText);
  }
  throw new Error('Either grammarText or grammar object must be provided');
}

transformationsRouter.post('/left-recursion', (req: Request, res: Response) => {
  try {
    const grammar = resolveGrammar(req.body);
    const result = eliminateImmediateLeftRecursion(grammar);
    res.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Left recursion elimination failed';
    res.status(400).json({ error: message });
  }
});

transformationsRouter.post('/left-factoring', (req: Request, res: Response) => {
  try {
    const grammar = resolveGrammar(req.body);
    const result = performLeftFactoring(grammar);
    res.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Left factoring failed';
    res.status(400).json({ error: message });
  }
});
