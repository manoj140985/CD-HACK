import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  PlayCircle,
  SkipForward,
  SkipBack,
  RotateCcw,
  Play,
  Pause,
  FastForward,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Network,
  Zap,
  Check,
  X,
  Sparkles,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useGrammar } from '../context/GrammarContext.tsx';
import { ParseStep, EPSILON } from '../types/compiler.ts';
import { compilerService } from '../services/compilerService.ts';
import { getBenchmarkInputs, BenchmarkItem } from '../utils/benchmarkInputs.ts';

export const ParsingSimulatorPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    grammarText,
    activeGrammar,
    tableResult,
    activeInputString,
    setActiveInputString,
    simulationResult,
    activeExampleId,
  } = useGrammar();

  // Required frontend states
  const [parsingTrace, setParsingTrace] = useState<ParseStep[]>([]);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [parsingStatus, setParsingStatus] = useState<
    'idle' | 'parsing' | 'running' | 'accepted' | 'rejected'
  >('idle');
  const [parsingError, setParsingError] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState<boolean>(false);

  // Input & animation states
  const [inputVal, setInputVal] = useState<string>(activeInputString);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(600); // ms per step
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Live evaluated benchmarks
  const [benchmarkEvaluations, setBenchmarkEvaluations] = useState<
    Record<string, { accepted: boolean; steps: number }>
  >({});
  const [isEvaluatingAll, setIsEvaluatingAll] = useState<boolean>(false);

  // Grammar benchmarks
  const benchmarks: BenchmarkItem[] = getBenchmarkInputs(activeGrammar, activeExampleId);

  // Synchronize input string and invalidate previous parsing results when active grammar changes
  useEffect(() => {
    setInputVal(activeInputString);
    setBenchmarkEvaluations({});
    setIsPlaying(false);

    if (simulationResult && simulationResult.steps && simulationResult.steps.length > 0) {
      setParsingTrace(simulationResult.steps);
      setCurrentStep(0);
      setParsingStatus(simulationResult.accepted ? 'accepted' : 'rejected');
      setParsingError(simulationResult.error?.message || null);
    } else if (activeGrammar && activeGrammar.productions.length > 0) {
      // Automatically run parser on the synchronized initial input
      handleRunParsing(activeInputString);
    } else {
      setParsingTrace([]);
      setCurrentStep(0);
      setParsingStatus('idle');
      setParsingError(null);
    }
  }, [grammarText, activeGrammar, activeInputString]);

  // Auto-play animation timer
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev >= parsingTrace.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, playbackSpeed);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, parsingTrace.length, playbackSpeed]);

  // Invokes the backend predictive parser
  const handleRunParsing = async (inputToParse: string) => {
    if (!activeGrammar || activeGrammar.productions.length === 0) return;

    setIsPlaying(false);
    setIsParsing(true);
    setParsingStatus('parsing');
    setParsingError(null);

    try {
      const res = await compilerService.simulateParsing(
        grammarText,
        inputToParse,
        activeGrammar
      );

      const sim = res.simulation;
      setParsingTrace(sim.steps);
      setCurrentStep(0);
      setParsingStatus(sim.accepted ? 'accepted' : 'rejected');
      setParsingError(sim.error?.message || null);

      // Record live evaluation for this benchmark
      setBenchmarkEvaluations((prev) => ({
        ...prev,
        [inputToParse]: { accepted: sim.accepted, steps: sim.totalSteps },
      }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Predictive parse simulation failed';
      setParsingError(msg);
      setParsingStatus('rejected');
    } finally {
      setIsParsing(false);
    }
  };

  // Button handlers
  const handleNextStep = () => {
    if (currentStep < parsingTrace.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleRunAll = () => {
    setIsPlaying(true);
  };

  const handleJumpToEnd = () => {
    setIsPlaying(false);
    if (parsingTrace.length > 0) {
      setCurrentStep(parsingTrace.length - 1);
    }
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentStep(0);
  };

  const handleBenchmarkClick = (sampleInput: string) => {
    setInputVal(sampleInput);
    setActiveInputString(sampleInput);
    handleRunParsing(sampleInput);
  };

  // Evaluate all benchmarks through actual backend predictive parser
  const handleEvaluateAllBenchmarks = async () => {
    if (!activeGrammar || benchmarks.length === 0) return;
    setIsEvaluatingAll(true);
    const results: Record<string, { accepted: boolean; steps: number }> = {};

    for (const b of benchmarks) {
      try {
        const res = await compilerService.simulateParsing(grammarText, b.input, activeGrammar);
        results[b.input] = {
          accepted: res.simulation.accepted,
          steps: res.simulation.totalSteps,
        };
      } catch {
        results[b.input] = { accepted: false, steps: 0 };
      }
    }

    setBenchmarkEvaluations(results);
    setIsEvaluatingAll(false);
  };

  if (!activeGrammar) {
    return (
      <div className="p-8 text-center text-slate-400 bg-slate-900/60 rounded-xl border border-slate-800">
        Please define or load a valid grammar in the Editor to start simulation.
      </div>
    );
  }

  const activeStepObj = parsingTrace[currentStep] || parsingTrace[0];
  const isLL1 = tableResult ? tableResult.isLL1 : true;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Non-LL(1) Warning Banner */}
      {!isLL1 && tableResult && (
        <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-800/60 text-amber-200 text-xs flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <strong className="block text-sm text-amber-300">
              Non-LL(1) Grammar Warning
            </strong>
            <p className="text-slate-300">
              The active grammar contains {tableResult.conflicts.length} multiply-defined cells in its parsing table.
              Predictive LL(1) parsing requires exactly one rule per cell. The parser will proceed using first-alternative tie breaking, but deterministic parsing cannot be guaranteed without eliminating conflicts.
            </p>
          </div>
        </div>
      )}

      {/* Input String Editor & Controls */}
      <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4 shadow-sm">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <PlayCircle className="w-4 h-4 text-indigo-400" />
            Stack-Based LL(1) Predictive Parsing Simulator
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Synchronized with active grammar (<strong className="text-indigo-300">{activeGrammar.startSymbol}</strong> start symbol, {activeGrammar.terminals.length} terminals).
          </p>
        </div>

        {/* Input Bar & Run Parsing Button */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="e.g. a b c or id + id * id (leave blank for empty input ε)"
              className="w-full bg-[#070a12] border border-slate-800 rounded-lg px-3.5 py-2.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
            />
            {inputVal === '' && (
              <span className="absolute right-3 top-2.5 text-[11px] font-mono text-slate-500 pointer-events-none">
                [empty input ε]
              </span>
            )}
          </div>

          <button
            onClick={() => handleRunParsing(inputVal)}
            disabled={isParsing}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition shadow-md shadow-indigo-600/25 disabled:opacity-50 cursor-pointer"
          >
            <Zap className={`w-4 h-4 ${isParsing ? 'animate-spin' : ''}`} />
            <span>{isParsing ? 'Parsing...' : 'Run Parsing'}</span>
          </button>
        </div>

        {/* Grammar-Synchronized Benchmark Input Buttons */}
        {benchmarks.length > 0 && (
          <div className="space-y-2 pt-1 border-t border-slate-800/60">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                Active Grammar Benchmark Inputs:
              </span>
              <button
                onClick={handleEvaluateAllBenchmarks}
                disabled={isEvaluatingAll}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-3 h-3" />
                {isEvaluatingAll ? 'Evaluating All...' : 'Run All Benchmarks'}
              </button>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {benchmarks.map((sample) => {
                const evalResult = benchmarkEvaluations[sample.input];
                const isCurrentInput = inputVal === sample.input;

                return (
                  <button
                    key={sample.input || 'EMPTY'}
                    type="button"
                    onClick={() => handleBenchmarkClick(sample.input)}
                    className={`text-xs font-mono px-3 py-1.5 rounded-lg transition border flex items-center gap-1.5 cursor-pointer ${
                      isCurrentInput
                        ? 'bg-indigo-950/80 border-indigo-500 text-indigo-200 font-bold shadow-sm'
                        : 'bg-[#070a12] border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/40'
                    }`}
                    title={sample.notes || sample.input}
                  >
                    <span>{sample.label}</span>

                    {/* Dynamic live badge only after actual parsing */}
                    {evalResult ? (
                      evalResult.accepted ? (
                        <span className="inline-flex items-center text-[10px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-sans font-semibold">
                          <Check className="w-3 h-3 mr-0.5" /> ACCEPT
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-[10px] px-1.5 py-0.2 rounded bg-rose-950 text-rose-400 border border-rose-800 font-sans font-semibold">
                          <X className="w-3 h-3 mr-0.5" /> REJECT
                        </span>
                      )
                    ) : (
                      <span className="text-[9px] text-slate-400 font-sans">
                        Test
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Parsing Controls & Playback HUD */}
      <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
        {/* Clearly Visible Controls Toolbar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Status & Step Counter */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Parsing Controls:
            </span>

            {parsingTrace.length > 0 && (
              <span className="px-2.5 py-1 rounded-md bg-indigo-950/80 border border-indigo-800/60 font-mono text-xs text-indigo-300 font-bold">
                Step {currentStep + 1} of {parsingTrace.length}
              </span>
            )}

            {/* Parsing Status Badge */}
            {parsingStatus === 'accepted' && (
              <span className="px-2.5 py-1 rounded-md bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 text-xs font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> ACCEPTED
              </span>
            )}
            {parsingStatus === 'rejected' && (
              <span className="px-2.5 py-1 rounded-md bg-rose-950/80 text-rose-300 border border-rose-800/60 text-xs font-bold flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 text-rose-400" /> REJECTED
              </span>
            )}
            {parsingStatus === 'parsing' && (
              <span className="px-2.5 py-1 rounded-md bg-blue-950/80 text-blue-300 border border-blue-800/60 text-xs font-bold">
                PARSING...
              </span>
            )}
            {parsingStatus === 'idle' && (
              <span className="px-2.5 py-1 rounded-md bg-slate-800 text-slate-400 text-xs">
                Awaiting Run
              </span>
            )}
          </div>

          {/* Action Buttons: Run Parsing, Next Step, Previous Step, Run All, Reset */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => handleRunParsing(inputVal)}
              disabled={isParsing}
              className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5 transition shadow-sm cursor-pointer disabled:opacity-50"
              title="Execute backend predictive parser"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Run Parsing</span>
            </button>

            <button
              onClick={handlePrevStep}
              disabled={currentStep === 0 || parsingTrace.length === 0}
              className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs flex items-center gap-1.5 border border-slate-700 transition disabled:opacity-40 cursor-pointer"
              title="Previous Step"
            >
              <SkipBack className="w-3.5 h-3.5" />
              <span>Previous Step</span>
            </button>

            <button
              onClick={handleNextStep}
              disabled={currentStep >= parsingTrace.length - 1 || parsingTrace.length === 0}
              className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs flex items-center gap-1.5 border border-slate-700 transition disabled:opacity-40 cursor-pointer"
              title="Next Step"
            >
              <span>Next Step</span>
              <SkipForward className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={isPlaying ? () => setIsPlaying(false) : handleRunAll}
              disabled={parsingTrace.length === 0}
              className="px-3 py-2 rounded-lg bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-700 text-indigo-300 font-medium text-xs flex items-center gap-1.5 transition disabled:opacity-40 cursor-pointer"
              title={isPlaying ? 'Pause Animation' : 'Auto-Play Animation'}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isPlaying ? 'Pause' : 'Run All'}</span>
            </button>

            <button
              onClick={handleReset}
              disabled={parsingTrace.length === 0}
              className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs flex items-center gap-1.5 border border-slate-700 transition disabled:opacity-40 cursor-pointer"
              title="Reset to Step 1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>

            {/* Animation Speed Selector */}
            <select
              value={playbackSpeed}
              onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
              className="bg-slate-900 border border-slate-800 text-slate-300 text-xs px-2.5 py-2 rounded-lg focus:outline-none cursor-pointer"
            >
              <option value={1000}>Speed: 1.0s</option>
              <option value={600}>Speed: 0.6s</option>
              <option value={250}>Speed: 0.25s</option>
            </select>
          </div>
        </div>

        {/* Current Step HUD (Stack, Remaining Input, Action) */}
        {activeStepObj && parsingTrace.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 rounded-xl bg-[#070a12] border border-slate-800 font-mono text-xs">
            <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800">
              <span className="text-[10px] text-slate-400 block mb-1">
                Current Stack (Bottom $ → Top):
              </span>
              <span className="text-indigo-300 font-bold text-sm block truncate">
                {activeStepObj.stackDisplay}
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Top of Stack: <strong className="text-indigo-400">{activeStepObj.stack[activeStepObj.stack.length - 1]}</strong>
              </span>
            </div>

            <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800">
              <span className="text-[10px] text-slate-400 block mb-1">
                Remaining Input (Lookahead first):
              </span>
              <span className="text-emerald-300 font-bold text-sm block truncate">
                {activeStepObj.inputDisplay}
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Lookahead: <strong className="text-emerald-400">{activeStepObj.remainingInput[0]}</strong>
              </span>
            </div>

            <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800">
              <span className="text-[10px] text-slate-400 block mb-1">
                Action / Operation:
              </span>
              <span
                className={`font-bold text-sm block truncate ${
                  activeStepObj.status === 'accepted'
                    ? 'text-emerald-400'
                    : activeStepObj.status === 'error'
                    ? 'text-rose-400'
                    : 'text-violet-300'
                }`}
              >
                {activeStepObj.action}
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5 block uppercase">
                Type: {activeStepObj.status}
              </span>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-[#070a12] border border-slate-800 text-center text-xs text-slate-400">
            Click <strong className="text-indigo-400">Run Parsing</strong> or select any benchmark button above to initialize the predictive parsing execution trace.
          </div>
        )}

        {/* Error / Result Banner */}
        {parsingError && (
          <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 flex items-start gap-2.5 text-xs">
            <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="block text-sm">Parsing Diagnostic Alert (REJECT):</strong>
              <span>{parsingError}</span>
            </div>
          </div>
        )}

        {parsingStatus === 'accepted' && currentStep === parsingTrace.length - 1 && (
          <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-xs">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <div>
                <strong className="block text-sm">String Accepted!</strong>
                <span>Derived in {parsingTrace.length} steps without error.</span>
              </div>
            </div>
            <button
              onClick={() => navigate('/tree')}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <Network className="w-3.5 h-3.5" /> View Parse Tree
            </button>
          </div>
        )}
      </div>

      {/* Step-by-Step Predictive Parsing Execution Trace Table */}
      <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-200">
              Step-by-Step Predictive Parsing Execution Trace
            </h3>
            <p className="text-xs text-slate-400">
              Columns: Step | Stack | Remaining Input | Action. Highlighted row indicates current simulation position.
            </p>
          </div>
          {parsingTrace.length > 0 && (
            <span className="text-xs font-mono text-slate-400">
              {parsingTrace.length} Total Operations
            </span>
          )}
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#070a12] shadow-xl overflow-hidden">
          <div className="overflow-x-auto max-h-[500px]">
            <table className="w-full text-left text-xs font-mono">
              <thead className="sticky top-0 bg-[#090d16] border-b border-slate-800 text-slate-400 z-10">
                <tr>
                  <th className="py-2.5 px-3 w-16">Step</th>
                  <th className="py-2.5 px-3 min-w-[160px]">Stack</th>
                  <th className="py-2.5 px-3 min-w-[160px]">Remaining Input</th>
                  <th className="py-2.5 px-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {parsingTrace.length > 0 ? (
                  parsingTrace.map((st, idx) => {
                    const isCurrent = idx === currentStep;
                    const isAcceptRow = st.status === 'accepted';
                    const isErrorRow = st.status === 'error';

                    return (
                      <tr
                        key={st.step}
                        onClick={() => {
                          setIsPlaying(false);
                          setCurrentStep(idx);
                        }}
                        className={`cursor-pointer transition-colors ${
                          isCurrent
                            ? 'bg-indigo-950/70 border-l-4 border-l-indigo-500 font-bold text-white'
                            : isAcceptRow
                            ? 'bg-emerald-950/20 text-emerald-200 hover:bg-emerald-950/40'
                            : isErrorRow
                            ? 'bg-rose-950/20 text-rose-200 hover:bg-rose-950/40'
                            : 'hover:bg-slate-800/40 text-slate-300'
                        }`}
                      >
                        <td className="py-2.5 px-3 font-bold text-slate-400">
                          {isCurrent && <span className="text-indigo-400 mr-1.5">▶</span>}
                          {st.step}
                        </td>
                        <td className="py-2.5 px-3 text-indigo-300 font-semibold">
                          {st.stackDisplay}
                        </td>
                        <td className="py-2.5 px-3 text-emerald-300">
                          {st.inputDisplay}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={
                              isAcceptRow
                                ? 'text-emerald-400 font-bold'
                                : isErrorRow
                                ? 'text-rose-400 font-bold'
                                : 'text-slate-200'
                            }
                          >
                            {st.action}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400">
                      No parsing steps yet. Click <strong className="text-indigo-400">Run Parsing</strong> above to populate the trace table.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
