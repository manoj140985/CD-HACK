import { Router, Request, Response } from 'express';
import { parseGrammar } from '../compiler/grammar_parser.ts';
import { computeFirstAndFollow } from '../compiler/first_follow.ts';
import { Grammar } from '../compiler/grammar_model.ts';

export const firstFollowRouter = Router();

function resolveGrammar(body: Record<string, unknown>): Grammar {
  if (body.grammar && typeof body.grammar === 'object' && Array.isArray((body.grammar as Grammar).productions)) {
    return body.grammar as Grammar;
  }
  if (typeof body.grammarText === 'string') {
    return parseGrammar(body.grammarText);
  }
  throw new Error('Either grammarText or grammar object must be provided');
}

firstFollowRouter.post('/calculate', (req: Request, res: Response) => {
  try {
    const grammar = resolveGrammar(req.body);
    const result = computeFirstAndFollow(grammar);
    res.json({
      grammar,
      result,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'FIRST & FOLLOW calculation failed';
    res.status(400).json({ error: message });
  }
});
