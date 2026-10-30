import React from 'react';
import { RefreshCw, BookCheck, AlertCircle, CheckCircle } from 'lucide-react';
import { useGrammar } from '../context/GrammarContext.tsx';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle }) => {
  const {
    examples,
    activeExampleId,
    loadExample,
    recomputeAll,
    isLoading,
    tableResult,
    activeGrammar,
  } = useGrammar();

  return (
    <header className="h-16 px-6 bg-[#090d16] border-b border-slate-800/80 flex items-center justify-between sticky top-0 z-20">
      {/* Title & Subtitle */}
      <div>
        <h1 className="text-lg font-bold text-slate-100 tracking-tight flex items-center gap-2.5">
          {title}
          {tableResult && (
            tableResult.isLL1 ? (
              <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-emerald-950/70 text-emerald-400 border border-emerald-800/60 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> Valid LL(1)
              </span>
            ) : (
              <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-amber-950/70 text-amber-300 border border-amber-800/60 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Non-LL(1) ({tableResult.conflicts.length} conflicts)
              </span>
            )
          )}
        </h1>
        {subtitle && <p className="text-xs text-slate-400 hidden sm:block">{subtitle}</p>}
      </div>

      {/* Action Controls */}
      <div className="flex items-center space-x-3">
        {/* Preset Selector */}
        <div className="flex items-center space-x-1.5 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5">
          <BookCheck className="w-4 h-4 text-slate-400" />
          <select
            value={activeExampleId || ''}
            onChange={(e) => {
              if (e.target.value) loadExample(e.target.value);
            }}
            className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer pr-1"
          >
            <option value="" disabled className="bg-slate-900 text-slate-400">
              Select Preset...
            </option>
            {examples.map((ex) => (
              <option key={ex.id} value={ex.id} className="bg-slate-900 text-slate-200">
                {ex.name} ({ex.category})
              </option>
            ))}
          </select>
        </div>

        {/* Recompute / Refresh Button */}
        <button
          onClick={() => recomputeAll()}
          disabled={isLoading}
          className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-sm shadow-indigo-600/20 disabled:opacity-50 cursor-pointer"
          title="Recalculate FIRST/FOLLOW, table, and simulate"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">{isLoading ? 'Computing...' : 'Recompute'}</span>
        </button>

        {/* Quick Symbol Count Badge */}
        {activeGrammar && (
          <div className="hidden lg:flex items-center space-x-2 text-[11px] font-mono text-slate-400 bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-800">
            <span>S: <strong className="text-indigo-400">{activeGrammar.startSymbol}</strong></span>
            <span className="text-slate-600">|</span>
            <span>NT: <strong className="text-violet-300">{activeGrammar.nonTerminals.length}</strong></span>
            <span className="text-slate-600">|</span>
            <span>T: <strong className="text-emerald-300">{activeGrammar.terminals.length}</strong></span>
          </div>
        )}
      </div>
    </header>
  );
};
