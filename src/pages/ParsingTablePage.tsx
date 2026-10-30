import React, { useState } from 'react';
import {
  TableProperties,
  CheckCircle2,
  AlertTriangle,
  Download,
  Search,
  AlertOctagon,
} from 'lucide-react';
import { useGrammar } from '../context/GrammarContext.tsx';
import { END_MARKER, Production } from '../types/compiler.ts';

export const ParsingTablePage: React.FC = () => {
  const { tableResult, activeGrammar } = useGrammar();

  const [filterConflictsOnly, setFilterConflictsOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCell, setSelectedCell] = useState<{
    nt: string;
    term: string;
    prods: Production[];
  } | null>(null);

  if (!tableResult || !activeGrammar) {
    return (
      <div className="p-8 text-center text-[#A0ADA4] bg-[#0D1410] rounded-xl border border-[#1B3326]">
        Please define or load a valid grammar to construct the LL(1) Parsing Table.
      </div>
    );
  }

  const { isLL1, table, terminals, nonTerminals, conflicts, summary } = tableResult;

  // Filter columns and rows
  const filteredTerminals = terminals.filter((t) =>
    t.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredNonTerminals = nonTerminals.filter((nt) => {
    if (searchQuery && !nt.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (filterConflictsOnly) {
      return terminals.some((term) => (table[nt]?.[term] || []).length > 1);
    }
    return true;
  });

  const exportCsv = () => {
    const headers = ['Non-Terminal', ...terminals];
    const rows = nonTerminals.map((nt) => {
      const row = [nt];
      terminals.forEach((term) => {
        const cell = table[nt]?.[term] || [];
        row.push(cell.map((p) => `${p.lhs}->${p.rhs.join(' ')}`).join(' ; ') || '');
      });
      return row.map((val) => `"${val.replace(/"/g, '""')}"`).join(',');
    });
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ll1-table-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Status Header */}
      <div className="p-5 rounded-xl bg-[#0D1410] border border-[#1B3326] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-base font-bold text-[#F5F7F5] flex items-center gap-2">
              <TableProperties className="w-4 h-4 text-[#00E676]" />
              LL(1) Predictive Parsing Table M[A, a]
            </h2>
            {isLL1 ? (
              <span className="px-2.5 py-1 rounded-full bg-[#00E676]/10 text-[#00E676] border border-[#00E676]/30 text-xs font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> Valid LL(1) Grammar
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full bg-[#FF5252]/10 text-[#FF5252] border border-[#FF5252]/30 text-xs font-semibold flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" /> Non-LL(1) Grammar ({conflicts.length} Conflicts)
              </span>
            )}
          </div>
          <p className="text-xs text-[#A0ADA4] mt-1">
            {isLL1
              ? 'All matrix cells contain at most one production. Deterministic parsing is guaranteed without backtracking.'
              : 'Multiply-defined cells detected. A predictive top-down parser cannot deterministically choose an alternative.'}
          </p>
        </div>

        {/* Metric Badges */}
        <div className="flex items-center gap-2 text-xs flex-wrap">
          <div className="px-2.5 py-1.5 rounded-lg bg-[#111B15] border border-[#1B3326] font-mono text-[#A0ADA4]">
            Filled: <strong className="text-[#00E676]">{summary.filledCells}</strong>
          </div>
          <div className="px-2.5 py-1.5 rounded-lg bg-[#111B15] border border-[#1B3326] font-mono text-[#A0ADA4]">
            Empty: <strong className="text-[#68776D]">{summary.emptyCells}</strong>
          </div>
          <div className="px-2.5 py-1.5 rounded-lg bg-[#111B15] border border-[#1B3326] font-mono text-[#A0ADA4]">
            Conflicts: <strong className={conflicts.length > 0 ? 'text-[#FF5252]' : 'text-[#68776D]'}>{summary.conflictCells}</strong>
          </div>
          <button
            onClick={exportCsv}
            className="px-3 py-1.5 rounded-lg bg-[#111B15] hover:bg-[#15231A] text-[#F5F7F5] border border-[#1B3326] font-medium flex items-center gap-1.5 transition cursor-pointer"
            title="Download CSV"
          >
            <Download className="w-3.5 h-3.5 text-[#00E676]" /> CSV
          </button>
        </div>
      </div>

      {/* Conflict Diagnostics Alert (if non-LL1) */}
      {!isLL1 && conflicts.length > 0 && (
        <div className="p-5 rounded-xl bg-[#FF5252]/10 border border-[#FF5252]/30 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#FF5252] flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 text-[#FF5252]" />
              LL(1) Conflict Analysis ({conflicts.length} Multiply-Defined Cells)
            </h3>
            <span className="text-[11px] text-[#A0ADA4] font-mono">
              Note: Shift/Reduce is LR-specific; LL(1) conflicts are FIRST/FIRST or FIRST/FOLLOW.
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-1">
            {conflicts.map((conf, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg bg-[#050807] border border-[#FF5252]/30 text-xs space-y-1.5 font-mono"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#69F0AE]">
                    Cell M[{conf.nonTerminal}, &apos;{conf.terminal}&apos;]
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-sans font-semibold ${
                      conf.conflictType === 'FIRST/FIRST'
                        ? 'bg-[#FF5252]/20 text-[#FF5252] border border-[#FF5252]/40'
                        : 'bg-[#FFD740]/20 text-[#FFD740] border border-[#FFD740]/40'
                    }`}
                  >
                    {conf.conflictType} Conflict
                  </span>
                </div>
                <div className="text-[#F5F7F5] space-y-0.5">
                  {conf.productions.map((p) => (
                    <div key={p.id} className="text-[#00E676]">
                      • {p.lhs} -&gt; {p.rhs.join(' ')}
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-[#A0ADA4] font-sans leading-relaxed pt-1 border-t border-[#1B3326]">
                  {conf.explanation}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Table Filter Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-[#0D1410] border border-[#1B3326] text-xs">
        <div className="flex items-center gap-2 flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-[#68776D]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter symbols (e.g. E, id, +)..."
            className="w-full bg-[#050807] border border-[#1B3326] rounded-lg px-2.5 py-1.5 text-xs text-[#F5F7F5] placeholder-[#68776D] focus:outline-none focus:border-[#00E676] font-mono"
          />
        </div>

        <div className="flex items-center gap-2">
          {!isLL1 && (
            <label className="flex items-center gap-2 text-[#A0ADA4] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={filterConflictsOnly}
                onChange={(e) => setFilterConflictsOnly(e.target.checked)}
                className="rounded border-[#1B3326] text-[#00E676] focus:ring-[#00E676]"
              />
              <span>Show only conflict rows</span>
            </label>
          )}
        </div>
      </div>

      {/* 2D Matrix Table */}
      <div className="rounded-xl border border-[#1B3326] bg-[#050807] shadow-xl overflow-hidden">
        <div className="overflow-x-auto max-h-[540px]">
          <table className="w-full border-collapse text-xs font-mono">
            {/* Column Headers (Terminals + $) */}
            <thead className="sticky top-0 z-10 bg-[#111B15] border-b border-[#1B3326]">
              <tr>
                <th className="py-3 px-4 text-left font-bold text-[#A0ADA4] border-r border-[#1B3326] bg-[#111B15] sticky left-0 z-20 min-w-[140px]">
                  Non-Terminal \ Terminal
                </th>
                {filteredTerminals.map((term) => (
                  <th
                    key={term}
                    className={`py-3 px-4 text-center font-bold border-r border-[#1B3326] min-w-[130px] ${
                      term === END_MARKER ? 'text-[#69F0AE] bg-[#15231A]' : 'text-[#00E676]'
                    }`}
                  >
                    {term}
                  </th>
                ))}
              </tr>
            </thead>

            {/* Table Body (Rows = NonTerminals) */}
            <tbody className="divide-y divide-[#1B3326]/60">
              {filteredNonTerminals.map((nt) => (
                <tr key={nt} className="hover:bg-[#15231A]/30 transition-colors">
                  {/* Sticky Row Header */}
                  <td className="py-3 px-4 font-bold text-[#69F0AE] border-r border-[#1B3326] bg-[#111B15] sticky left-0 z-10">
                    {nt}
                  </td>

                  {/* Matrix Cells */}
                  {filteredTerminals.map((term) => {
                    const prods = table[nt]?.[term] || [];
                    const hasConflict = prods.length > 1;
                    const isEmpty = prods.length === 0;

                    return (
                      <td
                        key={term}
                        onClick={() => !isEmpty && setSelectedCell({ nt, term, prods })}
                        className={`py-2 px-2.5 text-center border-r border-[#1B3326]/40 align-middle transition-colors ${
                          hasConflict
                            ? 'bg-[#FF5252]/10 hover:bg-[#FF5252]/20 cursor-pointer'
                            : isEmpty
                            ? 'text-[#68776D]'
                            : 'hover:bg-[#15231A]/40 cursor-pointer'
                        }`}
                      >
                        {isEmpty ? (
                          <span className="text-[#68776D]">—</span>
                        ) : hasConflict ? (
                          <div className="space-y-1">
                            <span className="inline-block px-1.5 py-0.5 rounded text-[9px] bg-[#FF5252] text-[#050807] font-sans font-bold">
                              {prods.length} CONFLICTS
                            </span>
                            {prods.map((p) => (
                              <div
                                key={p.id}
                                className="p-1 rounded bg-[#050807] border border-[#FF5252]/40 text-[10px] text-[#FF5252] font-semibold"
                              >
                                {p.lhs} -&gt; {p.rhs.join(' ')}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-1.5 rounded-md bg-[#111B15] border border-[#1B3326] text-[11px] text-[#00E676]">
                            <span className="font-bold text-[#69F0AE]">{prods[0].lhs}</span>
                            <span className="text-[#68776D]"> -&gt; </span>
                            <span className="text-[#00E676]">{prods[0].rhs.join(' ')}</span>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Cell Inspector Modal / Card */}
      {selectedCell && (
        <div className="p-4 rounded-xl bg-[#0D1410] border border-[#1B3326] flex items-center justify-between">
          <div className="text-xs space-y-1 font-mono">
            <span className="font-bold text-[#69F0AE]">
              Inspecting M[{selectedCell.nt}, &apos;{selectedCell.term}&apos;]
            </span>
            <div className="flex gap-2">
              {selectedCell.prods.map((p) => (
                <span
                  key={p.id}
                  className="px-2 py-0.5 rounded bg-[#050807] border border-[#1B3326] text-[#00E676]"
                >
                  {p.lhs} -&gt; {p.rhs.join(' ')}
                </span>
              ))}
            </div>
          </div>
          <button
            onClick={() => setSelectedCell(null)}
            className="text-xs text-[#A0ADA4] hover:text-[#F5F7F5] cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
};
