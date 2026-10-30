import React, { useState } from 'react';
import {
  Binary,
  Layers,
  Sparkles,
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
      <div className="p-8 text-center text-[#A0ADA4] bg-[#0D1410] rounded-xl border border-[#1B3326]">
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
      <div className="p-5 rounded-xl bg-[#0D1410] border border-[#1B3326] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-[#F5F7F5] flex items-center gap-2">
            <Binary className="w-4 h-4 text-[#00E676]" /> Fixed-Point Iterative FIRST &amp; FOLLOW Engine
          </h2>
          <p className="text-xs text-[#A0ADA4] mt-0.5">
            Iterates through production rules until mathematical convergence (no further sets change).
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs flex-wrap">
          <span className="px-2.5 py-1 rounded-md bg-[#111B15] text-[#00E676] border border-[#1B3326] font-mono">
            FIRST Converged in {firstRounds.length} Rounds
          </span>
          <span className="px-2.5 py-1 rounded-md bg-[#111B15] text-[#69F0AE] border border-[#1B3326] font-mono">
            FOLLOW Converged in {followRounds.length} Rounds
          </span>
        </div>
      </div>

      {/* Main FIRST & FOLLOW Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* FIRST Sets Card */}
        <div className="p-5 rounded-xl bg-[#0D1410] border border-[#1B3326] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#F5F7F5] flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#00E676]" />
              FIRST Sets of Non-Terminals
            </h3>
            <span className="text-[11px] text-[#68776D] font-mono">
              FIRST(A) = &#123; a | A ⇒* aα &#125;
            </span>
          </div>

          <div className="overflow-x-auto rounded-lg border border-[#1B3326]">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-[#1B3326] text-[#A0ADA4] bg-[#111B15]">
                  <th className="py-2.5 px-3">Non-Terminal</th>
                  <th className="py-2.5 px-3">FIRST Set</th>
                  <th className="py-2.5 px-3 text-right">Nullable (ε)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1B3326]/60 bg-[#0D1410]">
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
                          ? 'bg-[#15231A] text-[#00E676]'
                          : 'hover:bg-[#15231A]/40 text-[#F5F7F5]'
                      }`}
                    >
                      <td className="py-2.5 px-3 font-bold text-[#69F0AE] flex items-center gap-1.5">
                        {nt}
                        {isSelected && <span className="text-[#00E676] text-[10px]">●</span>}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="text-[#68776D]">&#123; </span>
                        {set.map((sym, i) => (
                          <React.Fragment key={sym}>
                            <span
                              className={`px-1 rounded ${
                                sym === EPSILON
                                  ? 'text-[#FFD740] font-bold'
                                  : 'text-[#00E676]'
                              }`}
                            >
                              {sym}
                            </span>
                            {i < set.length - 1 && <span className="text-[#68776D]">, </span>}
                          </React.Fragment>
                        ))}
                        <span className="text-[#68776D]"> &#125;</span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {isNullable ? (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#FFD740]/10 text-[#FFD740] border border-[#FFD740]/30">
                            Yes (ε ∈ FIRST)
                          </span>
                        ) : (
                          <span className="text-[10px] text-[#68776D]">No</span>
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
        <div className="p-5 rounded-xl bg-[#0D1410] border border-[#1B3326] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#F5F7F5] flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#00C853]" />
              FOLLOW Sets of Non-Terminals
            </h3>
            <span className="text-[11px] text-[#68776D] font-mono">
              FOLLOW(A) = &#123; a | S ⇒* αAaβ &#125;
            </span>
          </div>

          <div className="overflow-x-auto rounded-lg border border-[#1B3326]">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-[#1B3326] text-[#A0ADA4] bg-[#111B15]">
                  <th className="py-2.5 px-3">Non-Terminal</th>
                  <th className="py-2.5 px-3">FOLLOW Set</th>
                  <th className="py-2.5 px-3 text-right">Contains $</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1B3326]/60 bg-[#0D1410]">
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
                          ? 'bg-[#15231A] text-[#00E676]'
                          : 'hover:bg-[#15231A]/40 text-[#F5F7F5]'
                      }`}
                    >
                      <td className="py-2.5 px-3 font-bold text-[#69F0AE] flex items-center gap-1.5">
                        {nt}
                        {isSelected && <span className="text-[#00E676] text-[10px]">●</span>}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="text-[#68776D]">&#123; </span>
                        {set.map((sym, i) => (
                          <React.Fragment key={sym}>
                            <span
                              className={`px-1 rounded ${
                                sym === END_MARKER
                                  ? 'text-[#69F0AE] font-bold'
                                  : 'text-[#00E676]'
                              }`}
                            >
                              {sym}
                            </span>
                            {i < set.length - 1 && <span className="text-[#68776D]">, </span>}
                          </React.Fragment>
                        ))}
                        <span className="text-[#68776D]"> &#125;</span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {containsEnd ? (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#00E676]/10 text-[#00E676] border border-[#00E676]/30 font-semibold">
                            $ Included
                          </span>
                        ) : (
                          <span className="text-[10px] text-[#68776D]">—</span>
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
      <div className="p-5 rounded-xl bg-[#0D1410] border border-[#1B3326] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-[#F5F7F5] flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#00E676]" />
              Round-by-Round Fixed-Point Convergence Stepper
            </h3>
            <p className="text-xs text-[#A0ADA4] mt-0.5">
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
                  ? 'bg-[#00E676] text-[#050807] font-bold'
                  : 'bg-[#111B15] text-[#A0ADA4] hover:bg-[#15231A] border border-[#1B3326]'
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
                  ? 'bg-[#00E676] text-[#050807] font-bold'
                  : 'bg-[#111B15] text-[#A0ADA4] hover:bg-[#15231A] border border-[#1B3326]'
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
                  ? 'bg-[#15231A] border border-[#00E676] text-[#00E676]'
                  : 'bg-[#111B15] border border-[#1B3326] text-[#A0ADA4] hover:text-[#F5F7F5] hover:border-[#1B3326]'
              }`}
            >
              <span>Round {r.round}</span>
              {idx === currentRounds.length - 1 ? (
                <span className="text-[10px] text-[#00E676] font-sans">Converged ✓</span>
              ) : (
                <span className="text-[10px] text-[#FFD740] font-sans">Updated</span>
              )}
            </button>
          ))}
        </div>

        {/* Current Round State Display */}
        {currentRound && (
          <div className="p-4 rounded-xl bg-[#050807] border border-[#1B3326] space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#F5F7F5]">
                Round {currentRound.round} State Snapshot:
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] ${
                  currentRound.changed
                    ? 'bg-[#FFD740]/10 text-[#FFD740] border border-[#FFD740]/30'
                    : 'bg-[#00E676]/10 text-[#00E676] border border-[#00E676]/30'
                }`}
              >
                {currentRound.changed ? 'Sets updated in this round' : 'Fixed-point reached (No change)'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
              {Object.entries(currentRound.sets).map(([sym, items]) => (
                <div
                  key={sym}
                  className="p-2.5 rounded-lg bg-[#0D1410] border border-[#1B3326] font-mono text-xs"
                >
                  <span className="font-bold text-[#69F0AE]">{roundView}({sym})</span>
                  <div className="text-[#F5F7F5] mt-1">
                    &#123; {items.length > 0 ? items.join(', ') : '∅'} &#125;
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* FIRST of Production RHS (Lookaheads) */}
      <div className="p-5 rounded-xl bg-[#0D1410] border border-[#1B3326] space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#F5F7F5] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#00E676]" />
            FIRST Sets of Production Right-Hand Sides (RHS)
          </h3>
          <span className="text-xs text-[#A0ADA4]">
            Crucial for LL(1) Table row-column placement
          </span>
        </div>

        <div className="overflow-x-auto rounded-lg border border-[#1B3326]">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-[#1B3326] text-[#A0ADA4] bg-[#111B15]">
                <th className="py-2.5 px-3">Production ID</th>
                <th className="py-2.5 px-3">Production Rule</th>
                <th className="py-2.5 px-3">FIRST(RHS)</th>
                <th className="py-2.5 px-3">Table Placement Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1B3326]/60 bg-[#0D1410]">
              {activeGrammar.productions.map((p) => {
                const rhsFirst = firstOfRhs[p.id] || [];
                const containsEps = rhsFirst.includes(EPSILON);
                const followLhs = followSets[p.lhs] || [];

                return (
                  <tr key={p.id} className="hover:bg-[#15231A]/40 text-[#F5F7F5]">
                    <td className="py-2.5 px-3 font-bold text-[#68776D]">{p.id}</td>
                    <td className="py-2.5 px-3">
                      <span className="text-[#69F0AE] font-bold">{p.lhs}</span>
                      <span className="text-[#68776D]"> -&gt; </span>
                      <span className="text-[#00E676]">{p.rhs.join(' ')}</span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="text-[#68776D]">&#123; </span>
                      {rhsFirst.map((sym, idx) => (
                        <React.Fragment key={sym}>
                          <span
                            className={sym === EPSILON ? 'text-[#FFD740] font-bold' : 'text-[#00E676]'}
                          >
                            {sym}
                          </span>
                          {idx < rhsFirst.length - 1 && <span className="text-[#68776D]">, </span>}
                        </React.Fragment>
                      ))}
                      <span className="text-[#68776D]"> &#125;</span>
                    </td>
                    <td className="py-2.5 px-3 text-[#A0ADA4]">
                      Placed in M[{p.lhs}, a] for each a in FIRST
                      {containsEps && (
                        <span className="text-[#FFD740] ml-1">
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
