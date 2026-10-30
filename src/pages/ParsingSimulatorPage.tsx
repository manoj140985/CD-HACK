import React, { useState, useEffect, useRef } from 'react';
import {
  PlayCircle,
  SkipForward,
  SkipBack,
  RotateCcw,
  Play,
  Pause,
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
import { ParseStep } from '../types/compiler.ts';
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
      <div className="p-8 text-center text-[#A0ADA4] bg-[#0D1410] rounded-xl border border-[#1B3326]">
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
        <div className="p-4 rounded-xl bg-[#FFD740]/10 border border-[#FFD740]/30 text-[#FFD740] text-xs flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-[#FFD740] flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <strong className="block text-sm text-[#FFD740]">
              Non-LL(1) Grammar Warning
            </strong>
            <p className="text-[#A0ADA4]">
              The active grammar contains {tableResult.conflicts.length} multiply-defined cells in its parsing table.
              Predictive LL(1) parsing requires exactly one rule per cell. The parser will proceed using first-alternative tie breaking, but deterministic parsing cannot be guaranteed without eliminating conflicts.
            </p>
          </div>
        </div>
      )}

      {/* Input String Editor & Controls */}
      <div className="p-5 rounded-xl bg-[#0D1410] border border-[#1B3326] space-y-4 shadow-sm">
        <div>
          <h2 className="text-base font-bold text-[#F5F7F5] flex items-center gap-2">
            <PlayCircle className="w-4 h-4 text-[#00E676]" />
            Stack-Based LL(1) Predictive Parsing Simulator
          </h2>
          <p className="text-xs text-[#A0ADA4] mt-0.5">
            Synchronized with active grammar (<strong className="text-[#69F0AE]">{activeGrammar.startSymbol}</strong> start symbol, {activeGrammar.terminals.length} terminals).
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
              className="w-full bg-[#050807] border border-[#1B3326] rounded-lg px-3.5 py-2.5 text-xs font-mono text-[#F5F7F5] placeholder-[#68776D] focus:outline-none focus:border-[#00E676]"
            />
            {inputVal === '' && (
              <span className="absolute right-3 top-2.5 text-[11px] font-mono text-[#68776D] pointer-events-none">
                [empty input ε]
              </span>
            )}
          </div>

          <button
            onClick={() => handleRunParsing(inputVal)}
            disabled={isParsing}
            className="px-5 py-2.5 bg-[#00E676] hover:bg-[#00C853] text-[#050807] rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
          >
            <Zap className={`w-4 h-4 ${isParsing ? 'animate-spin' : ''}`} />
            <span>{isParsing ? 'Parsing...' : 'Run Parsing'}</span>
          </button>
        </div>

        {/* Grammar-Synchronized Benchmark Input Buttons */}
        {benchmarks.length > 0 && (
          <div className="space-y-2 pt-1 border-t border-[#1B3326]">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#A0ADA4] font-semibold uppercase tracking-wider text-[11px]">
                Active Grammar Benchmark Inputs:
              </span>
              <button
                onClick={handleEvaluateAllBenchmarks}
                disabled={isEvaluatingAll}
                className="text-[11px] text-[#00E676] hover:text-[#69F0AE] transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
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
                        ? 'bg-[#15231A] border-[#00E676] text-[#00E676] font-bold'
                        : 'bg-[#111B15] border-[#1B3326] text-[#A0ADA4] hover:border-[#1B3326] hover:text-[#F5F7F5] hover:bg-[#15231A]'
                    }`}
                    title={sample.notes || sample.input}
                  >
                    <span>{sample.label}</span>

                    {/* Dynamic live badge only after actual parsing */}
                    {evalResult ? (
                      evalResult.accepted ? (
                        <span className="inline-flex items-center text-[10px] px-1.5 py-0.2 rounded bg-[#00E676]/10 text-[#00E676] border border-[#00E676]/30 font-sans font-semibold">
                          <Check className="w-3 h-3 mr-0.5" /> ACCEPT
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-[10px] px-1.5 py-0.2 rounded bg-[#FF5252]/10 text-[#FF5252] border border-[#FF5252]/30 font-sans font-semibold">
                          <X className="w-3 h-3 mr-0.5" /> REJECT
                        </span>
                      )
                    ) : (
                      <span className="text-[9px] text-[#68776D] font-sans">
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
      <div className="p-5 rounded-xl bg-[#0D1410] border border-[#1B3326] space-y-4">
        {/* Clearly Visible Controls Toolbar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Status & Step Counter */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs font-semibold text-[#A0ADA4] uppercase tracking-wider">
              Parsing Controls:
            </span>

            {parsingTrace.length > 0 && (
              <span className="px-2.5 py-1 rounded-md bg-[#111B15] border border-[#1B3326] font-mono text-xs text-[#00E676] font-bold">
                Step {currentStep + 1} of {parsingTrace.length}
              </span>
            )}

            {/* Parsing Status Badge */}
            {parsingStatus === 'accepted' && (
              <span className="px-2.5 py-1 rounded-md bg-[#00E676]/10 text-[#00E676] border border-[#00E676]/30 text-xs font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#00E676]" /> ACCEPTED
              </span>
            )}
            {parsingStatus === 'rejected' && (
              <span className="px-2.5 py-1 rounded-md bg-[#FF5252]/10 text-[#FF5252] border border-[#FF5252]/30 text-xs font-bold flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 text-[#FF5252]" /> REJECTED
              </span>
            )}
            {parsingStatus === 'parsing' && (
              <span className="px-2.5 py-1 rounded-md bg-[#111B15] text-[#69F0AE] border border-[#1B3326] text-xs font-bold">
                PARSING...
              </span>
            )}
            {parsingStatus === 'idle' && (
              <span className="px-2.5 py-1 rounded-md bg-[#111B15] text-[#68776D] text-xs">
                Awaiting Run
              </span>
            )}
          </div>

          {/* Action Buttons: Run Parsing, Next Step, Previous Step, Run All, Reset */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => handleRunParsing(inputVal)}
              disabled={isParsing}
              className="px-3.5 py-2 rounded-lg bg-[#00E676] hover:bg-[#00C853] text-[#050807] font-bold text-xs flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
              title="Execute backend predictive parser"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Run Parsing</span>
            </button>

            <button
              onClick={handlePrevStep}
              disabled={currentStep === 0 || parsingTrace.length === 0}
              className="px-3 py-2 rounded-lg bg-[#111B15] hover:bg-[#15231A] text-[#F5F7F5] font-medium text-xs flex items-center gap-1.5 border border-[#1B3326] transition disabled:opacity-40 cursor-pointer"
              title="Previous Step"
            >
              <SkipBack className="w-3.5 h-3.5 text-[#A0ADA4]" />
              <span>Previous Step</span>
            </button>

            <button
              onClick={handleNextStep}
              disabled={currentStep >= parsingTrace.length - 1 || parsingTrace.length === 0}
              className="px-3 py-2 rounded-lg bg-[#111B15] hover:bg-[#15231A] text-[#F5F7F5] font-medium text-xs flex items-center gap-1.5 border border-[#1B3326] transition disabled:opacity-40 cursor-pointer"
              title="Next Step"
            >
              <span>Next Step</span>
              <SkipForward className="w-3.5 h-3.5 text-[#A0ADA4]" />
            </button>

            <button
              onClick={isPlaying ? () => setIsPlaying(false) : handleRunAll}
              disabled={parsingTrace.length === 0}
              className="px-3 py-2 rounded-lg bg-[#15231A] hover:bg-[#1a2d21] border border-[#00E676]/40 text-[#00E676] font-medium text-xs flex items-center gap-1.5 transition disabled:opacity-40 cursor-pointer"
              title={isPlaying ? 'Pause Animation' : 'Auto-Play Animation'}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isPlaying ? 'Pause' : 'Run All'}</span>
            </button>

            <button
              onClick={handleReset}
              disabled={parsingTrace.length === 0}
              className="px-3 py-2 rounded-lg bg-[#111B15] hover:bg-[#15231A] text-[#A0ADA4] hover:text-[#F5F7F5] font-medium text-xs flex items-center gap-1.5 border border-[#1B3326] transition disabled:opacity-40 cursor-pointer"
              title="Reset to Step 1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>

            {/* Animation Speed Selector */}
            <select
              value={playbackSpeed}
              onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
              className="bg-[#050807] border border-[#1B3326] text-[#A0ADA4] text-xs px-2.5 py-2 rounded-lg focus:outline-none focus:border-[#00E676] cursor-pointer"
            >
              <option value={1000}>Speed: 1.0s</option>
              <option value={600}>Speed: 0.6s</option>
              <option value={250}>Speed: 0.25s</option>
            </select>
          </div>
        </div>

        {/* Current Step HUD (Stack, Remaining Input, Action) */}
        {activeStepObj && parsingTrace.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 rounded-xl bg-[#050807] border border-[#1B3326] font-mono text-xs">
            <div className="p-3 rounded-lg bg-[#0D1410] border border-[#1B3326]">
              <span className="text-[10px] text-[#68776D] block mb-1">
                Current Stack (Bottom $ → Top):
              </span>
              <span className="text-[#69F0AE] font-bold text-sm block truncate">
                {activeStepObj.stackDisplay}
              </span>
              <span className="text-[10px] text-[#A0ADA4] mt-0.5 block">
                Top of Stack: <strong className="text-[#00E676]">{activeStepObj.stack[activeStepObj.stack.length - 1]}</strong>
              </span>
            </div>

            <div className="p-3 rounded-lg bg-[#0D1410] border border-[#1B3326]">
              <span className="text-[10px] text-[#68776D] block mb-1">
                Remaining Input (Lookahead first):
              </span>
              <span className="text-[#00E676] font-bold text-sm block truncate">
                {activeStepObj.inputDisplay}
              </span>
              <span className="text-[10px] text-[#A0ADA4] mt-0.5 block">
                Lookahead: <strong className="text-[#00E676]">{activeStepObj.remainingInput[0]}</strong>
              </span>
            </div>

            <div className="p-3 rounded-lg bg-[#0D1410] border border-[#1B3326]">
              <span className="text-[10px] text-[#68776D] block mb-1">
                Action / Operation:
              </span>
              <span
                className={`font-bold text-sm block truncate ${
                  activeStepObj.status === 'accepted'
                    ? 'text-[#00E676]'
                    : activeStepObj.status === 'error'
                    ? 'text-[#FF5252]'
                    : 'text-[#F5F7F5]'
                }`}
              >
                {activeStepObj.action}
              </span>
              <span className="text-[10px] text-[#68776D] mt-0.5 block uppercase">
                Type: {activeStepObj.status}
              </span>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-[#050807] border border-[#1B3326] text-center text-xs text-[#A0ADA4]">
            Click <strong className="text-[#00E676]">Run Parsing</strong> or select any benchmark button above to initialize the predictive parsing execution trace.
          </div>
        )}

        {/* Error / Result Banner */}
        {parsingError && (
          <div className="p-4 rounded-xl bg-[#FF5252]/10 border border-[#FF5252]/30 text-[#FF5252] flex items-start gap-2.5 text-xs">
            <AlertCircle className="w-5 h-5 text-[#FF5252] flex-shrink-0 mt-0.5" />
            <div>
              <strong className="block text-sm">Parsing Diagnostic Alert (REJECT):</strong>
              <span className="text-[#A0ADA4]">{parsingError}</span>
            </div>
          </div>
        )}

        {parsingStatus === 'accepted' && currentStep === parsingTrace.length - 1 && (
          <div className="p-4 rounded-xl bg-[#00E676]/10 border border-[#00E676]/30 text-[#00E676] flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-xs">
              <CheckCircle2 className="w-5 h-5 text-[#00E676] flex-shrink-0" />
              <div>
                <strong className="block text-sm text-[#00E676]">String Accepted!</strong>
                <span className="text-[#A0ADA4]">Derived in {parsingTrace.length} steps without error.</span>
              </div>
            </div>
            <button
              onClick={() => navigate('/tree')}
              className="px-3.5 py-1.5 rounded-lg bg-[#00E676] hover:bg-[#00C853] text-[#050807] font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <Network className="w-3.5 h-3.5" /> View Parse Tree
            </button>
          </div>
        )}
      </div>

      {/* Step-by-Step Predictive Parsing Execution Trace Table */}
      <div className="p-5 rounded-xl bg-[#0D1410] border border-[#1B3326] space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#F5F7F5]">
              Step-by-Step Predictive Parsing Execution Trace
            </h3>
            <p className="text-xs text-[#A0ADA4]">
              Columns: Step | Stack | Remaining Input | Action. Highlighted row indicates current simulation position.
            </p>
          </div>
          {parsingTrace.length > 0 && (
            <span className="text-xs font-mono text-[#00E676]">
              {parsingTrace.length} Total Operations
            </span>
          )}
        </div>

        <div className="rounded-xl border border-[#1B3326] bg-[#050807] shadow-xl overflow-hidden">
          <div className="overflow-x-auto max-h-[500px]">
            <table className="w-full text-left text-xs font-mono">
              <thead className="sticky top-0 bg-[#111B15] border-b border-[#1B3326] text-[#A0ADA4] z-10">
                <tr>
                  <th className="py-2.5 px-3 w-16">Step</th>
                  <th className="py-2.5 px-3 min-w-[160px]">Stack</th>
                  <th className="py-2.5 px-3 min-w-[160px]">Remaining Input</th>
                  <th className="py-2.5 px-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1B3326]/60">
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
                            ? 'bg-[#15231A] border-l-4 border-l-[#00E676] font-bold text-[#F5F7F5]'
                            : isAcceptRow
                            ? 'bg-[#00E676]/10 text-[#00E676] hover:bg-[#00E676]/15'
                            : isErrorRow
                            ? 'bg-[#FF5252]/10 text-[#FF5252] hover:bg-[#FF5252]/15'
                            : 'hover:bg-[#15231A]/40 text-[#F5F7F5]'
                        }`}
                      >
                        <td className="py-2.5 px-3 font-bold text-[#68776D]">
                          {isCurrent && <span className="text-[#00E676] mr-1.5">▶</span>}
                          {st.step}
                        </td>
                        <td className="py-2.5 px-3 text-[#69F0AE] font-semibold">
                          {st.stackDisplay}
                        </td>
                        <td className="py-2.5 px-3 text-[#00E676]">
                          {st.inputDisplay}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={
                              isAcceptRow
                                ? 'text-[#00E676] font-bold'
                                : isErrorRow
                                ? 'text-[#FF5252] font-bold'
                                : 'text-[#F5F7F5]'
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
                    <td colSpan={4} className="py-8 text-center text-[#68776D]">
                      No parsing steps yet. Click <strong className="text-[#00E676]">Run Parsing</strong> above to populate the trace table.
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
