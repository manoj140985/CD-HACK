import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import {
  FirstFollowResult,
  Grammar,
  GrammarExample,
  GrammarValidationResult,
  ParseSimulationResult,
  ParsingTableResult,
} from '../types/compiler.ts';
import { compilerService } from '../services/compilerService.ts';
import { getDefaultInputForGrammar } from '../utils/benchmarkInputs.ts';

interface GrammarContextType {
  grammarText: string;
  setGrammarText: React.Dispatch<React.SetStateAction<string>>;
  activeGrammar: Grammar | null;
  validation: GrammarValidationResult | null;
  firstFollowResult: FirstFollowResult | null;
  tableResult: ParsingTableResult | null;
  simulationResult: ParseSimulationResult | null;
  activeInputString: string;
  setActiveInputString: (val: string) => void;
  examples: GrammarExample[];
  activeExampleId: string | null;
  isLoading: boolean;
  error: string | null;
  loadExample: (id: string) => void;
  applyTransformedGrammar: (newGrammar: Grammar) => void;
  recomputeAll: (customText?: string) => Promise<void>;
  runSimulation: (customInput?: string) => Promise<ParseSimulationResult | null>;
}

const GrammarContext = createContext<GrammarContextType | undefined>(undefined);

const DEFAULT_GRAMMAR_TEXT = `E -> T E'
E' -> + T E' | ε
T -> F T'
T' -> * F T' | ε
F -> ( E ) | id`;

export const GrammarProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [grammarText, setGrammarText] = useState<string>(DEFAULT_GRAMMAR_TEXT);
  const [activeGrammar, setActiveGrammar] = useState<Grammar | null>(null);
  const [validation, setValidation] = useState<GrammarValidationResult | null>(null);
  const [firstFollowResult, setFirstFollowResult] = useState<FirstFollowResult | null>(null);
  const [tableResult, setTableResult] = useState<ParsingTableResult | null>(null);
  const [simulationResult, setSimulationResult] = useState<ParseSimulationResult | null>(null);
  const [activeInputString, setActiveInputString] = useState<string>('id + id * id');
  const [examples, setExamples] = useState<GrammarExample[]>(compilerService.getExamples());
  const [activeExampleId, setActiveExampleId] = useState<string | null>('arithmetic');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Load examples list on mount
  useEffect(() => {
    compilerService.fetchExamples().then((list) => {
      setExamples(list);
    });
  }, []);

  const recomputeAll = useCallback(async (textToUse?: string, inputToUseParam?: string) => {
    const text = textToUse !== undefined ? textToUse : grammarText;
    setIsLoading(true);
    setError(null);

    try {
      // 1. Validate and Parse
      const valRes = await compilerService.validateGrammar(text);
      setActiveGrammar(valRes.grammar);
      setValidation(valRes.validation);

      if (valRes.grammar.productions.length > 0) {
        // 2. FIRST & FOLLOW
        const ffRes = await compilerService.calculateFirstAndFollow(text, valRes.grammar);
        setFirstFollowResult(ffRes.result);

        // 3. LL(1) Table
        const tabRes = await compilerService.generateParsingTable(text, valRes.grammar);
        setTableResult(tabRes.tableResult);

        // 4. Determine synchronized input string
        let targetInput: string;
        if (inputToUseParam !== undefined) {
          targetInput = inputToUseParam;
        } else {
          // Check if activeInputString contains invalid terminals for this grammar
          const validTerms = new Set(valRes.grammar.terminals.filter((t) => t !== 'ε' && t !== '$'));
          const currentTokens = activeInputString.trim().split(/\s+/).filter(Boolean);
          const hasInvalid = currentTokens.length > 0 && currentTokens.some((tok) => !validTerms.has(tok));

          if (hasInvalid || !activeInputString) {
            targetInput = getDefaultInputForGrammar(valRes.grammar, activeExampleId);
            setActiveInputString(targetInput);
          } else {
            targetInput = activeInputString;
          }
        }

        // 5. Initial predictive parse simulation
        const simRes = await compilerService.simulateParsing(text, targetInput, valRes.grammar);
        setSimulationResult(simRes.simulation);
      } else {
        setFirstFollowResult(null);
        setTableResult(null);
        setSimulationResult(null);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error analyzing grammar';
      setError(msg);
      setSimulationResult(null);
    } finally {
      setIsLoading(false);
    }
  }, [grammarText, activeInputString, activeExampleId]);

  // Initial computation on mount
  useEffect(() => {
    recomputeAll(DEFAULT_GRAMMAR_TEXT, 'id + id * id');
  }, [recomputeAll]);

  const loadExample = (id: string) => {
    const ex = examples.find((e) => e.id === id);
    if (!ex) return;
    setActiveExampleId(id);
    setGrammarText(ex.grammarText);
    setSimulationResult(null); // Invalidate previous result immediately

    const matchedInput = getDefaultInputForGrammar(null, id) || (ex.sampleInputs[0]?.input ?? '');
    setActiveInputString(matchedInput);
    recomputeAll(ex.grammarText, matchedInput);
  };

  const applyTransformedGrammar = (newGrammar: Grammar) => {
    const formatted = compilerService.formatGrammarToString(newGrammar);
    setGrammarText(formatted);
    setActiveExampleId(null);
    setSimulationResult(null);
    const defaultInput = getDefaultInputForGrammar(newGrammar, null);
    setActiveInputString(defaultInput);
    recomputeAll(formatted, defaultInput);
  };

  const runSimulation = async (customInput?: string): Promise<ParseSimulationResult | null> => {
    const input = customInput !== undefined ? customInput : activeInputString;
    if (!activeGrammar) return null;
    setIsLoading(true);
    try {
      const res = await compilerService.simulateParsing(grammarText, input, activeGrammar);
      setSimulationResult(res.simulation);
      return res.simulation;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Simulation failed';
      setError(msg);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <GrammarContext.Provider
      value={{
        grammarText,
        setGrammarText,
        activeGrammar,
        validation,
        firstFollowResult,
        tableResult,
        simulationResult,
        activeInputString,
        setActiveInputString,
        examples,
        activeExampleId,
        isLoading,
        error,
        loadExample,
        applyTransformedGrammar,
        recomputeAll,
        runSimulation,
      }}
    >
      {children}
    </GrammarContext.Provider>
  );
};

export const useGrammar = (): GrammarContextType => {
  const context = useContext(GrammarContext);
  if (!context) {
    throw new Error('useGrammar must be used within a GrammarProvider');
  }
  return context;
};
