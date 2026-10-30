import React, { useState, useEffect, useCallback } from 'react';
import {
  GitFork,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Layers,
  ArrowDownRight,
} from 'lucide-react';
import { useGrammar } from '../context/GrammarContext.tsx';
import { compilerService } from '../services/compilerService.ts';
import { TransformationResult } from '../types/compiler.ts';

export const TransformationsPage: React.FC = () => {
  const { grammarText, activeGrammar, applyTransformedGrammar } = useGrammar();

  const [activeTab, setActiveTab] = useState<'left-recursion' | 'left-factoring'>('left-recursion');
  const [recursionResult, setRecursionResult] = useState<TransformationResult | null>(null);
  const [factoringResult, setFactoringResult] = useState<TransformationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [appliedNotice, setAppliedNotice] = useState<string | null>(null);

  const computeTransformations = useCallback(async () => {
    setLoading(true);
    try {
      const [rec, fac] = await Promise.all([
        compilerService.eliminateLeftRecursion(grammarText, activeGrammar || undefined),
        compilerService.performLeftFactoring(grammarText, activeGrammar || undefined),
      ]);
      setRecursionResult(rec);
      setFactoringResult(fac);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [grammarText, activeGrammar]);

  useEffect(() => {
    computeTransformations();
  }, [computeTransformations]);

  const handleApply = (result: TransformationResult, label: string) => {
    applyTransformedGrammar(result.transformedGrammar);
    setAppliedNotice(`Successfully applied ${label} grammar to Studio!`);
    setTimeout(() => setAppliedNotice(null), 3000);
  };

  const currentResult = activeTab === 'left-recursion' ? recursionResult : factoringResult;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Notice Banner */}
      {appliedNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs flex items-center justify-between">
          <span className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" /> {appliedNotice}
          </span>
        </div>
      )}

      {/* Tabs & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/80 border border-slate-800">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('left-recursion')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'left-recursion'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <GitFork className="w-3.5 h-3.5" /> Immediate Left Recursion
            {recursionResult?.hasChanged && (
              <span className="w-2 h-2 rounded-full bg-amber-400" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('left-factoring')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'left-factoring'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> Left Factoring
            {factoringResult?.hasChanged && (
              <span className="w-2 h-2 rounded-full bg-amber-400" />
            )}
          </button>
        </div>

        {currentResult && currentResult.hasChanged && (
          <button
            onClick={() =>
              handleApply(
                currentResult,
                activeTab === 'left-recursion' ? 'Left-Recursion Eliminated' : 'Left-Factored'
              )
            }
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-2 transition shadow-md shadow-emerald-600/20 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" /> Apply Transformed Grammar
          </button>
        )}
      </div>

      {/* Theory Card */}
      <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
          {activeTab === 'left-recursion'
            ? 'Theoretical Principle: Immediate Left Recursion'
            : 'Theoretical Principle: Left Factoring'}
        </h3>
        {activeTab === 'left-recursion' ? (
          <div className="text-xs text-slate-300 space-y-2 leading-relaxed">
            <p>
              A grammar rule has immediate left recursion if it is of the form{' '}
              <code className="text-indigo-300 bg-slate-800 px-1 py-0.5 rounded font-mono">
                A -&gt; A α₁ | A α₂ | ... | β₁ | β₂
              </code>
              , where no <code className="text-indigo-300 font-mono">β</code> begins with{' '}
              <code className="text-indigo-300 font-mono">A</code>. Top-down predictive parsers enter an infinite loop when encountering left-recursive rules.
            </p>
            <div className="p-3 bg-[#070a12] rounded-lg border border-slate-800 font-mono text-slate-200">
              <span className="text-slate-400">// Elimination Formula:</span>
              <br />
              <span className="text-violet-400">A</span> -&gt; β₁ <span className="text-indigo-300">A&apos;</span> | β₂ <span className="text-indigo-300">A&apos;</span> | ...
              <br />
              <span className="text-indigo-300">A&apos;</span> -&gt; α₁ <span className="text-indigo-300">A&apos;</span> | α₂ <span className="text-indigo-300">A&apos;</span> | ... | ε
            </div>
          </div>
        ) : (
          <div className="text-xs text-slate-300 space-y-2 leading-relaxed">
            <p>
              Left factoring is applied when two or more alternatives of a non-terminal share a common prefix{' '}
              <code className="text-indigo-300 bg-slate-800 px-1 py-0.5 rounded font-mono">
                A -&gt; α β₁ | α β₂ | ... | γ
              </code>
              . A predictive parser cannot decide which production to pick based on looking ahead at the prefix.
            </p>
            <div className="p-3 bg-[#070a12] rounded-lg border border-slate-800 font-mono text-slate-200">
              <span className="text-slate-400">// Factoring Formula:</span>
              <br />
              <span className="text-violet-400">A</span> -&gt; α <span className="text-indigo-300">A&apos;</span> | γ
              <br />
              <span className="text-indigo-300">A&apos;</span> -&gt; β₁ | β₂ | ... (empty suffixes become ε)
            </div>
          </div>
        )}
      </div>

      {/* Side-by-Side Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Original Grammar */}
        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Original Input Grammar
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                {activeGrammar?.productions.length || 0} rules
              </span>
            </div>
            <pre className="p-4 rounded-lg bg-[#070a12] border border-slate-800/80 font-mono text-xs text-slate-300 max-h-72 overflow-y-auto leading-relaxed">
              {activeGrammar?.productions.map((p) => (
                <div key={p.id}>
                  <span className="text-violet-400">{p.lhs}</span>
                  <span className="text-slate-500"> -&gt; </span>
                  <span className="text-emerald-300">{p.rhs.join(' ')}</span>
                </div>
              ))}
            </pre>
          </div>
        </div>

        {/* Transformed Grammar */}
        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                Transformed Output Grammar
                {currentResult?.hasChanged ? (
                  <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
                    Modified
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400">
                    No Change Needed
                  </span>
                )}
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                {currentResult?.transformedGrammar.productions.length || 0} rules
              </span>
            </div>
            <pre className="p-4 rounded-lg bg-[#070a12] border border-slate-800/80 font-mono text-xs text-slate-300 max-h-72 overflow-y-auto leading-relaxed">
              {currentResult?.transformedGrammar.productions.map((p) => (
                <div key={p.id}>
                  <span className="text-indigo-400">{p.lhs}</span>
                  <span className="text-slate-500"> -&gt; </span>
                  <span className="text-emerald-300">{p.rhs.join(' ')}</span>
                </div>
              ))}
            </pre>
          </div>
        </div>
      </div>

      {/* Step-by-Step Derivation Breakdown */}
      <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
          <ArrowDownRight className="w-4 h-4 text-indigo-400" />
          Step-by-Step Mathematical Derivations ({currentResult?.steps.length ?? 0} Steps)
        </h3>

        {currentResult?.steps && currentResult.steps.length > 0 ? (
          <div className="space-y-3">
            {currentResult.steps.map((step) => (
              <div
                key={step.stepNumber}
                className="p-4 rounded-xl bg-[#070a12] border border-slate-800 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-300 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-950 text-indigo-400 border border-indigo-800/60 flex items-center justify-center text-[11px]">
                      {step.stepNumber}
                    </span>
                    {step.title}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    Symbol: {step.nonTerminal}
                  </span>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  {step.description}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono pt-1">
                  <div className="p-2.5 rounded bg-slate-900/90 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block mb-1">Before:</span>
                    {step.originalProductions.map((p, i) => (
                      <div key={i} className="text-slate-300">{p}</div>
                    ))}
                  </div>
                  <div className="p-2.5 rounded bg-indigo-950/30 border border-indigo-900/40">
                    <span className="text-[10px] text-indigo-400 block mb-1">After:</span>
                    {step.transformedProductions.map((p, i) => (
                      <div key={i} className="text-indigo-200">{p}</div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 rounded-xl bg-[#070a12] border border-slate-800 text-center text-xs text-slate-400">
            {activeTab === 'left-recursion'
              ? 'No immediate left recursion was detected in the active grammar.'
              : 'No common prefixes requiring left factoring were detected in the active grammar.'}
          </div>
        )}
      </div>
    </div>
  );
};
