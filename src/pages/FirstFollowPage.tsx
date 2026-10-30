import React, { useState } from 'react';
import {
  Binary,
  Layers,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';
import { useGrammar } from '../context/GrammarContext.tsx';
import { EPSILON, END_MARKER } from '../types/compiler.ts';

export const FirstFollowPage: React.FC = () => {
  const { firstFollowResult, activeGrammar } = useGrammar();

  const [selectedNt, setSelectedNt] = useState<string | null>(
    activeGrammar?.startSymbol || null
  );
  const [roundView, setRoundView] = useState<'FIRST' | 'FOLLOW'>('FIRST');
  const [activeRoundIdx, setActiveRoundIdx] = useState<number>(0);

  if (!firstFollowResult || !activeGrammar) {
    return (
      <div className="p-8 text-center text-slate-400 bg-slate-900/60 rounded-xl border border-slate-800">
        Please define or load a valid grammar in the Editor to compute FIRST and FOLLOW sets.
      </div>
    );
  }

  const {
    firstSets,
    followSets,
    firstRounds,
    followRounds,
    nullableNonTerminals,
    firstOfRhs,
  } = firstFollowResult;

  const currentRounds = roundView === 'FIRST' ? firstRounds : followRounds;
  const currentRound = currentRounds[Math.min(activeRoundIdx, currentRounds.length - 1)];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Binary className="w-4 h-4 text-indigo-400" /> Fixed-Point Iterative FIRST & FOLLOW Engine
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Iterates through production rules until mathematical convergence (no further sets change).
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-2.5 py-1 rounded-md bg-indigo-950/70 text-indigo-300 border border-indigo-800/60 font-mono">
            FIRST Converged in {firstRounds.length} Rounds
          </span>
          <span className="px-2.5 py-1 rounded-md bg-violet-950/70 text-violet-300 border border-violet-800/60 font-mono">
            FOLLOW Converged in {followRounds.length} Rounds
          </span>
        </div>
      </div>

      {/* Main FIRST & FOLLOW Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* FIRST Sets Card */}
        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
              FIRST Sets of Non-Terminals
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">
              FIRST(A) = &#123; a | A ⇒* aα &#125;
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 bg-[#090d16]">
                  <th className="py-2.5 px-3">Non-Terminal</th>
                  <th className="py-2.5 px-3">FIRST Set</th>
                  <th className="py-2.5 px-3 text-right">Nullable (ε)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {activeGrammar.nonTerminals.map((nt) => {
                  const set = firstSets[nt] || [];
                  const isNullable = nullableNonTerminals.includes(nt);
                  const isSelected = selectedNt === nt;

                  return (
                    <tr
                      key={nt}
                      onClick={() => setSelectedNt(nt)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-indigo-950/40 text-indigo-200'
                          : 'hover:bg-slate-800/40 text-slate-300'
                      }`}
                    >
                      <td className="py-2.5 px-3 font-bold text-violet-400 flex items-center gap-1.5">
                        {nt}
                        {isSelected && <span className="text-indigo-400 text-[10px]">●</span>}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="text-slate-400">&#123; </span>
                        {set.map((sym, i) => (
                          <React.Fragment key={sym}>
                            <span
                              className={`px-1 rounded ${
                                sym === EPSILON
                                  ? 'text-amber-300 font-bold'
                                  : 'text-emerald-300'
                              }`}
                            >
                              {sym}
                            </span>
                            {i < set.length - 1 && <span className="text-slate-500">, </span>}
                          </React.Fragment>
                        ))}
                        <span className="text-slate-400"> &#125;</span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {isNullable ? (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950/70 text-amber-400 border border-amber-800/50">
                            Yes (ε ∈ FIRST)
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">No</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* FOLLOW Sets Card */}
        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-violet-500" />
              FOLLOW Sets of Non-Terminals
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">
              FOLLOW(A) = &#123; a | S ⇒* αAaβ &#125;
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 bg-[#090d16]">
                  <th className="py-2.5 px-3">Non-Terminal</th>
                  <th className="py-2.5 px-3">FOLLOW Set</th>
                  <th className="py-2.5 px-3 text-right">Contains $</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {activeGrammar.nonTerminals.map((nt) => {
                  const set = followSets[nt] || [];
                  const containsEnd = set.includes(END_MARKER);
                  const isSelected = selectedNt === nt;

                  return (
                    <tr
                      key={nt}
                      onClick={() => setSelectedNt(nt)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-violet-950/40 text-violet-200'
                          : 'hover:bg-slate-800/40 text-slate-300'
                      }`}
                    >
                      <td className="py-2.5 px-3 font-bold text-violet-400 flex items-center gap-1.5">
                        {nt}
                        {isSelected && <span className="text-violet-400 text-[10px]">●</span>}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="text-slate-400">&#123; </span>
                        {set.map((sym, i) => (
                          <React.Fragment key={sym}>
                            <span
                              className={`px-1 rounded ${
                                sym === END_MARKER
                                  ? 'text-cyan-300 font-bold'
                                  : 'text-emerald-300'
                              }`}
                            >
                              {sym}
                            </span>
                            {i < set.length - 1 && <span className="text-slate-500">, </span>}
                          </React.Fragment>
                        ))}
                        <span className="text-slate-400"> &#125;</span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {containsEnd ? (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950/70 text-cyan-300 border border-cyan-800/50">
                            $ Included
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Round-by-Round Fixed-Point Convergence Inspector */}
      <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              Round-by-Round Fixed-Point Convergence Stepper
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Watch sets expand until fixed-point condition is satisfied (zero changes in final iteration).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setRoundView('FIRST');
                setActiveRoundIdx(0);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition ${
                roundView === 'FIRST'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              FIRST Rounds ({firstRounds.length})
            </button>
            <button
              onClick={() => {
                setRoundView('FOLLOW');
                setActiveRoundIdx(0);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition ${
                roundView === 'FOLLOW'
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              FOLLOW Rounds ({followRounds.length})
            </button>
          </div>
        </div>

        {/* Round Navigation Buttons */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {currentRounds.map((r, idx) => (
            <button
              key={r.round}
              onClick={() => setActiveRoundIdx(idx)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 transition cursor-pointer flex-shrink-0 ${
                activeRoundIdx === idx
                  ? 'bg-indigo-600/30 border border-indigo-500/60 text-indigo-200'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>Round {r.round}</span>
              {idx === currentRounds.length - 1 ? (
                <span className="text-[10px] text-emerald-400 font-sans">Converged ✓</span>
              ) : (
                <span className="text-[10px] text-amber-400 font-sans">Updated</span>
              )}
            </button>
          ))}
        </div>

        {/* Current Round State Display */}
        {currentRound && (
          <div className="p-4 rounded-xl bg-[#070a12] border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-200">
                Round {currentRound.round} State Snapshot:
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] ${
                  currentRound.changed
                    ? 'bg-amber-950/70 text-amber-400 border border-amber-800/50'
                    : 'bg-emerald-950/70 text-emerald-400 border border-emerald-800/50'
                }`}
              >
                {currentRound.changed ? 'Sets updated in this round' : 'Fixed-point reached (No change)'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
              {Object.entries(currentRound.sets).map(([sym, items]) => (
                <div
                  key={sym}
                  className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800/80 font-mono text-xs"
                >
                  <span className="font-bold text-violet-400">{roundView}({sym})</span>
                  <div className="text-slate-300 mt-1">
                    &#123; {items.length > 0 ? items.join(', ') : '∅'} &#125;
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* FIRST of Production RHS (Lookaheads) */}
      <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            FIRST Sets of Production Right-Hand Sides (RHS)
          </h3>
          <span className="text-xs text-slate-400">
            Crucial for LL(1) Table row-column placement
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 bg-[#090d16]">
                <th className="py-2.5 px-3">Production ID</th>
                <th className="py-2.5 px-3">Production Rule</th>
                <th className="py-2.5 px-3">FIRST(RHS)</th>
                <th className="py-2.5 px-3">Table Placement Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {activeGrammar.productions.map((p) => {
                const rhsFirst = firstOfRhs[p.id] || [];
                const containsEps = rhsFirst.includes(EPSILON);
                const followLhs = followSets[p.lhs] || [];

                return (
                  <tr key={p.id} className="hover:bg-slate-800/30 text-slate-300">
                    <td className="py-2.5 px-3 font-bold text-slate-400">{p.id}</td>
                    <td className="py-2.5 px-3">
                      <span className="text-violet-400 font-bold">{p.lhs}</span>
                      <span className="text-slate-500"> -&gt; </span>
                      <span className="text-emerald-300">{p.rhs.join(' ')}</span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="text-slate-400">&#123; </span>
                      {rhsFirst.map((sym, idx) => (
                        <React.Fragment key={sym}>
                          <span
                            className={sym === EPSILON ? 'text-amber-400 font-bold' : 'text-emerald-300'}
                          >
                            {sym}
                          </span>
                          {idx < rhsFirst.length - 1 && <span className="text-slate-500">, </span>}
                        </React.Fragment>
                      ))}
                      <span className="text-slate-400"> &#125;</span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-400">
                      Placed in M[{p.lhs}, a] for each a in FIRST
                      {containsEps && (
                        <span className="text-amber-300 ml-1">
                          + M[{p.lhs}, b] for b in FOLLOW({p.lhs}) = &#123;{followLhs.join(',')}&#125;
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
