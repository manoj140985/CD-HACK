import React, { useState, useEffect, useCallback } from 'react';
import {
  GitFork,
  CheckCircle2,
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
        <div className="p-3.5 rounded-xl bg-[#00E676]/10 border border-[#00E676]/40 text-[#69F0AE] text-xs flex items-center justify-between">
          <span className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-[#00E676]" /> {appliedNotice}
          </span>
        </div>
      )}

      {/* Tabs & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-[#0D1410] border border-[#1B3326]">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('left-recursion')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'left-recursion'
                ? 'bg-[#00E676] text-[#050807]'
                : 'bg-[#111B15] text-[#A0ADA4] hover:text-[#F5F7F5] border border-[#1B3326]'
            }`}
          >
            <GitFork className="w-3.5 h-3.5" /> Immediate Left Recursion
            {recursionResult?.hasChanged && (
              <span className="w-2 h-2 rounded-full bg-[#FFD740]" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('left-factoring')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'left-factoring'
                ? 'bg-[#00E676] text-[#050807]'
                : 'bg-[#111B15] text-[#A0ADA4] hover:text-[#F5F7F5] border border-[#1B3326]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> Left Factoring
            {factoringResult?.hasChanged && (
              <span className="w-2 h-2 rounded-full bg-[#FFD740]" />
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
            className="px-4 py-2 rounded-lg bg-[#00E676] hover:bg-[#00C853] text-[#050807] text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" /> Apply Transformed Grammar
          </button>
        )}
      </div>

      {/* Theory Card */}
      <div className="p-5 rounded-xl bg-[#0D1410] border border-[#1B3326] space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#00E676]">
          {activeTab === 'left-recursion'
            ? 'Theoretical Principle: Immediate Left Recursion'
            : 'Theoretical Principle: Left Factoring'}
        </h3>
        {activeTab === 'left-recursion' ? (
          <div className="text-xs text-[#A0ADA4] space-y-2 leading-relaxed">
            <p>
              A grammar rule has immediate left recursion if it is of the form{' '}
              <code className="text-[#69F0AE] bg-[#050807] px-1.5 py-0.5 rounded border border-[#1B3326] font-mono">
                A -&gt; A α₁ | A α₂ | ... | β₁ | β₂
              </code>
              , where no <code className="text-[#69F0AE] font-mono">β</code> begins with{' '}
              <code className="text-[#69F0AE] font-mono">A</code>. Top-down predictive parsers enter an infinite loop when encountering left-recursive rules.
            </p>
            <div className="p-3 bg-[#050807] rounded-lg border border-[#1B3326] font-mono text-[#F5F7F5]">
              <span className="text-[#68776D]">// Elimination Formula:</span>
              <br />
              <span className="text-[#69F0AE]">A</span> -&gt; β₁ <span className="text-[#00E676]">A&apos;</span> | β₂ <span className="text-[#00E676]">A&apos;</span> | ...
              <br />
              <span className="text-[#00E676]">A&apos;</span> -&gt; α₁ <span className="text-[#00E676]">A&apos;</span> | α₂ <span className="text-[#00E676]">A&apos;</span> | ... | ε
            </div>
          </div>
        ) : (
          <div className="text-xs text-[#A0ADA4] space-y-2 leading-relaxed">
            <p>
              Left factoring is applied when two or more alternatives of a non-terminal share a common prefix{' '}
              <code className="text-[#69F0AE] bg-[#050807] px-1.5 py-0.5 rounded border border-[#1B3326] font-mono">
                A -&gt; α β₁ | α β₂ | ... | γ
              </code>
              . A predictive parser cannot decide which production to pick based on looking ahead at the prefix.
            </p>
            <div className="p-3 bg-[#050807] rounded-lg border border-[#1B3326] font-mono text-[#F5F7F5]">
              <span className="text-[#68776D]">// Factoring Formula:</span>
              <br />
              <span className="text-[#69F0AE]">A</span> -&gt; α <span className="text-[#00E676]">A&apos;</span> | γ
              <br />
              <span className="text-[#00E676]">A&apos;</span> -&gt; β₁ | β₂ | ... (empty suffixes become ε)
            </div>
          </div>
        )}
      </div>

      {/* Side-by-Side Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Original Grammar */}
        <div className="p-5 rounded-xl bg-[#0D1410] border border-[#1B3326] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-[#68776D] uppercase tracking-wider">
                Original Input Grammar
              </span>
              <span className="text-[11px] font-mono text-[#A0ADA4]">
                {activeGrammar?.productions.length || 0} rules
              </span>
            </div>
            <pre className="p-4 rounded-lg bg-[#050807] border border-[#1B3326] font-mono text-xs text-[#F5F7F5] max-h-72 overflow-y-auto leading-relaxed">
              {activeGrammar?.productions.map((p) => (
                <div key={p.id}>
                  <span className="text-[#69F0AE]">{p.lhs}</span>
                  <span className="text-[#68776D]"> -&gt; </span>
                  <span className="text-[#F5F7F5]">{p.rhs.join(' ')}</span>
                </div>
              ))}
            </pre>
          </div>
        </div>

        {/* Transformed Grammar */}
        <div className="p-5 rounded-xl bg-[#0D1410] border border-[#1B3326] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-[#68776D] uppercase tracking-wider flex items-center gap-1.5">
                Transformed Output Grammar
                {currentResult?.hasChanged ? (
                  <span className="px-2 py-0.5 rounded text-[10px] bg-[#00E676]/10 text-[#00E676] border border-[#00E676]/30 font-semibold">
                    Modified
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[10px] bg-[#111B15] text-[#A0ADA4] border border-[#1B3326]">
                    No Change Needed
                  </span>
                )}
              </span>
              <span className="text-[11px] font-mono text-[#A0ADA4]">
                {currentResult?.transformedGrammar.productions.length || 0} rules
              </span>
            </div>
            <pre className="p-4 rounded-lg bg-[#050807] border border-[#1B3326] font-mono text-xs text-[#F5F7F5] max-h-72 overflow-y-auto leading-relaxed">
              {currentResult?.transformedGrammar.productions.map((p) => (
                <div key={p.id}>
                  <span className="text-[#00E676]">{p.lhs}</span>
                  <span className="text-[#68776D]"> -&gt; </span>
                  <span className="text-[#F5F7F5]">{p.rhs.join(' ')}</span>
                </div>
              ))}
            </pre>
          </div>
        </div>
      </div>

      {/* Step-by-Step Derivation Breakdown */}
      <div className="p-5 rounded-xl bg-[#0D1410] border border-[#1B3326] space-y-4">
        <h3 className="text-sm font-bold text-[#F5F7F5] flex items-center gap-2">
          <ArrowDownRight className="w-4 h-4 text-[#00E676]" />
          Step-by-Step Mathematical Derivations ({currentResult?.steps.length ?? 0} Steps)
        </h3>

        {currentResult?.steps && currentResult.steps.length > 0 ? (
          <div className="space-y-3">
            {currentResult.steps.map((step) => (
              <div
                key={step.stepNumber}
                className="p-4 rounded-xl bg-[#050807] border border-[#1B3326] space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#F5F7F5] flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-[#111B15] text-[#00E676] border border-[#1B3326] flex items-center justify-center text-[11px] font-mono">
                      {step.stepNumber}
                    </span>
                    {step.title}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#111B15] text-[#A0ADA4] border border-[#1B3326]">
                    Symbol: {step.nonTerminal}
                  </span>
                </div>

                <p className="text-xs text-[#A0ADA4] leading-relaxed">
                  {step.description}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono pt-1">
                  <div className="p-2.5 rounded bg-[#111B15] border border-[#1B3326]">
                    <span className="text-[10px] text-[#68776D] block mb-1">Before:</span>
                    {step.originalProductions.map((p, i) => (
                      <div key={i} className="text-[#A0ADA4]">{p}</div>
                    ))}
                  </div>
                  <div className="p-2.5 rounded bg-[#15231A] border border-[#00E676]/40">
                    <span className="text-[10px] text-[#00E676] block mb-1">After:</span>
                    {step.transformedProductions.map((p, i) => (
                      <div key={i} className="text-[#69F0AE] font-semibold">{p}</div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 rounded-xl bg-[#050807] border border-[#1B3326] text-center text-xs text-[#A0ADA4]">
            {activeTab === 'left-recursion'
              ? 'No immediate left recursion was detected in the active grammar.'
              : 'No common prefixes requiring left factoring were detected in the active grammar.'}
          </div>
        )}
      </div>
    </div>
  );
};
