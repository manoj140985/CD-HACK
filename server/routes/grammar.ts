import { Router, Request, Response } from 'express';
import { parseGrammar } from '../compiler/grammar_parser.ts';
import { validateGrammar } from '../compiler/grammar_validator.ts';
import { SAMPLE_GRAMMARS } from '../compiler/examples.ts';
import { Grammar } from '../compiler/grammar_model.ts';

export const grammarRouter = Router();

grammarRouter.get('/examples', (_req: Request, res: Response) => {
  res.json({ examples: SAMPLE_GRAMMARS });
});

grammarRouter.post('/parse', (req: Request, res: Response) => {
  try {
    const { grammarText } = req.body;
    if (typeof grammarText !== 'string') {
      res.status(400).json({ error: 'grammarText string is required' });
      return;
    }

    const grammar = parseGrammar(grammarText);
    res.json({ grammar });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to parse grammar';
    res.status(500).json({ error: message });
  }
});

grammarRouter.post('/validate', (req: Request, res: Response) => {
  try {
    const { grammarText, grammar: providedGrammar } = req.body;
    let grammar: Grammar;

    if (providedGrammar && Array.isArray(providedGrammar.productions)) {
      grammar = providedGrammar;
    } else if (typeof grammarText === 'string') {
      grammar = parseGrammar(grammarText);
    } else {
      res.status(400).json({ error: 'Either grammarText or grammar object must be provided' });
      return;
    }

    const validation = validateGrammar(grammar);
    res.json({ grammar, validation });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Validation failed';
    res.status(500).json({ error: message });
  }
});
