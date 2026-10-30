import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RefreshCw,
  BookCheck,
  AlertCircle,
  CheckCircle,
  Search,
  HelpCircle,
  Activity,
  Layers,
} from 'lucide-react';
import { useGrammar } from '../context/GrammarContext.tsx';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle }) => {
  const navigate = useNavigate();
  const {
    examples,
    activeExampleId,
    loadExample,
    recomputeAll,
    isLoading,
    tableResult,
    activeGrammar,
  } = useGrammar();

  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const q = searchQuery.toLowerCase().trim();

    // Check if query matches any example
    const matchedEx = examples.find(
      (ex) =>
        ex.name.toLowerCase().includes(q) ||
        ex.category.toLowerCase().includes(q) ||
        ex.id.toLowerCase().includes(q)
    );

    if (matchedEx) {
      loadExample(matchedEx.id);
      setSearchQuery('');
      return;
    }

    // Default: navigate to docs or editor with query
    if (q.includes('rule') || q.includes('grammar') || q.includes('symbol')) {
      navigate('/editor');
    } else if (q.includes('table') || q.includes('conflict') || q.includes('ll1')) {
      navigate('/table');
    } else if (q.includes('parse') || q.includes('sim') || q.includes('trace')) {
      navigate('/simulator');
    } else if (q.includes('arena') || q.includes('quiz') || q.includes('score')) {
      navigate('/practice');
    } else {
      navigate('/docs');
    }
  };

  return (
    <header className="h-16 px-4 md:px-6 bg-[#080D0A] border-b border-[#1B3326] flex items-center justify-between sticky top-0 z-20">
      {/* Title & Subtitle */}
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-base sm:text-lg font-bold text-[#F5F7F5] tracking-tight flex items-center gap-2">
            {title}
            {tableResult && (
              tableResult.isLL1 ? (
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#00E676]/10 text-[#00E676] border border-[#00E676]/30 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-[#00E676]" /> LL(1)
                </span>
              ) : (
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#FF5252]/10 text-[#FF5252] border border-[#FF5252]/30 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 text-[#FF5252]" /> {tableResult.conflicts.length} Conflicts
                </span>
              )
            )}
          </h1>
          {subtitle && (
            <p className="text-xs text-[#A0ADA4] hidden lg:block truncate max-w-md">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Top Navigation Controls */}
      <div className="flex items-center space-x-2.5">
        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative hidden md:block">
          <Search className="w-3.5 h-3.5 text-[#68776D] absolute left-2.5 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search symbols, presets, docs..."
            className="w-48 lg:w-60 bg-[#0D1410] border border-[#1B3326] rounded-lg pl-8 pr-3 py-1.5 text-xs text-[#F5F7F5] placeholder-[#68776D] focus:outline-none focus:border-[#00E676] transition"
          />
        </form>

        {/* Current Project / Grammar Preset Selector */}
        <div className="flex items-center space-x-1.5 bg-[#0D1410] border border-[#1B3326] rounded-lg px-2.5 py-1.5">
          <BookCheck className="w-3.5 h-3.5 text-[#68776D]" />
          <select
            value={activeExampleId || ''}
            onChange={(e) => {
              if (e.target.value) loadExample(e.target.value);
            }}
            className="bg-transparent text-xs text-[#F5F7F5] focus:outline-none cursor-pointer pr-1"
          >
            <option value="" disabled className="bg-[#080D0A] text-[#68776D]">
              Select Grammar...
            </option>
            {examples.map((ex) => (
              <option key={ex.id} value={ex.id} className="bg-[#080D0A] text-[#F5F7F5]">
                {ex.name} ({ex.category})
              </option>
            ))}
          </select>
        </div>

        {/* Backend Connection Status Indicator */}
        <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-[#0D1410] border border-[#1B3326] text-[11px] font-mono text-[#A0ADA4]">
          <span className="w-2 h-2 rounded-full bg-[#00E676] animate-pulse inline-block" />
          <span className="hidden xl:inline text-[#68776D]">API:</span>
          <span className="text-[#00E676] font-medium">Online</span>
        </div>

        {/* Recompute Button */}
        <button
          onClick={() => recomputeAll()}
          disabled={isLoading}
          className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#00E676] hover:bg-[#00C853] text-[#050807] transition shadow-sm disabled:opacity-50 cursor-pointer"
          title="Recalculate FIRST/FOLLOW, LL(1) Table, and simulate parsing"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">{isLoading ? 'Computing...' : 'Recompute'}</span>
        </button>

        {/* Help Icon */}
        <button
          onClick={() => navigate('/docs')}
          className="p-2 rounded-lg bg-[#0D1410] hover:bg-[#15231A] text-[#A0ADA4] hover:text-[#00E676] border border-[#1B3326] transition cursor-pointer"
          title="Compiler Theory & Documentation"
        >
          <HelpCircle className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};
