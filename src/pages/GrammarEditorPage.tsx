import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Sparkles,
  RotateCcw,
  Copy,
  Check,
  FileDown,
  Upload,
} from 'lucide-react';
import { useGrammar } from '../context/GrammarContext.tsx';
import { EPSILON } from '../types/compiler.ts';

export const GrammarEditorPage: React.FC = () => {
  const {
    grammarText,
    setGrammarText,
    activeGrammar,
    validation,
    recomputeAll,
    examples,
    loadExample,
    isLoading,
  } = useGrammar();

  const [copied, setCopied] = useState(false);
  const [dirty, setDirty] = useState(false);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setGrammarText(e.target.value);
    setDirty(true);
  };

  const handleApply = () => {
    recomputeAll(grammarText);
    setDirty(false);
  };

  const handleInsertEpsilon = () => {
    setGrammarText((prev) => prev + ` ${EPSILON} `);
    setDirty(true);
  };

  const handleInsertArrow = () => {
    setGrammarText((prev) => prev + ` -> `);
    setDirty(true);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(grammarText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExport = () => {
    const blob = new Blob([grammarText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `grammar-${Date.now()}.cfg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setGrammarText(content);
        recomputeAll(content);
        setDirty(false);
      }
    };
    reader.readAsText(file);
  };

  const lineCount = grammarText.split('\n').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner with Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/80 border border-slate-800">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            Context-Free Grammar (CFG) Specification
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Define grammar rules in standard notation: <code className="text-indigo-300">A -&gt; α | β</code>. Use <code className="text-indigo-300">{EPSILON}</code> for epsilon transitions.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleInsertEpsilon}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 text-xs font-mono font-bold transition cursor-pointer"
            title="Insert Epsilon character (ε)"
          >
            + {EPSILON}
          </button>
          <button
            onClick={handleInsertArrow}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-mono transition cursor-pointer"
            title="Insert Production Arrow (->)"
          >
            + -&gt;
          </button>
          <button
            onClick={handleCopy}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs transition flex items-center gap-1 cursor-pointer"
            title="Copy grammar to clipboard"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
          <button
            onClick={handleExport}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs transition flex items-center gap-1 cursor-pointer"
            title="Export as .cfg file"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>
          <label className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs transition flex items-center gap-1 cursor-pointer">
            <Upload className="w-3.5 h-3.5" />
            <span>Import</span>
            <input type="file" accept=".cfg,.txt" onChange={handleImport} className="hidden" />
          </label>
        </div>
      </div>

      {/* Editor & Validation Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Code Editor Area */}
        <div className="lg:col-span-7 flex flex-col space-y-3">
          <div className="rounded-xl border border-slate-800 bg-[#070a12] shadow-xl overflow-hidden flex flex-col flex-1">
            {/* Editor Toolbar */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-[#090d16] border-b border-slate-800 text-xs">
              <span className="font-mono text-slate-400 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                grammar.cfg ({lineCount} lines)
              </span>

              <div className="flex items-center gap-2">
                {dirty && (
                  <span className="text-[11px] text-amber-400 font-medium">
                    Unapplied changes
                  </span>
                )}
                <button
                  onClick={handleApply}
                  disabled={isLoading}
                  className="px-3 py-1 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {isLoading ? 'Analyzing...' : 'Parse & Validate'}
                </button>
              </div>
            </div>

            {/* Editor with Line Numbers */}
            <div className="flex flex-1 min-h-[360px] font-mono text-sm leading-6">
              {/* Line Numbers Gutter */}
              <div className="select-none py-3 px-3 bg-[#080c18] border-r border-slate-800/80 text-slate-600 text-right w-12 text-xs">
                {Array.from({ length: Math.max(lineCount, 12) }, (_, i) => (
                  <div key={i + 1}>{i + 1}</div>
                ))}
              </div>

              {/* Textarea */}
              <textarea
                value={grammarText}
                onChange={handleTextChange}
                placeholder="Enter CFG rules here, e.g.&#10;E -> T E'&#10;E' -> + T E' | ε"
                className="flex-1 p-3 bg-transparent text-slate-200 resize-none focus:outline-none selection:bg-indigo-900/60 font-mono text-sm leading-6"
                spellCheck={false}
              />
            </div>
          </div>

          {/* Preset Picker Quick Bar */}
          <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 flex items-center justify-between flex-wrap gap-2 text-xs">
            <span className="text-slate-400 font-medium">Quick Presets:</span>
            <div className="flex gap-1.5 flex-wrap">
              {examples.map((ex) => (
                <button
                  key={ex.id}
                  onClick={() => {
                    loadExample(ex.id);
                    setDirty(false);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-indigo-950/70 hover:text-indigo-300 text-slate-300 text-xs border border-slate-700/80 transition cursor-pointer"
                >
                  {ex.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Validation & Statistics Panel */}
        <div className="lg:col-span-5 space-y-4">
          {/* Validation Status Card */}
          <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-200">Grammar Diagnostics</h3>
              {validation?.isValid ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/70 text-emerald-400 border border-emerald-800/60 text-xs font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Valid CFG
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-950/70 text-rose-400 border border-rose-800/60 text-xs font-semibold">
                  <AlertCircle className="w-3.5 h-3.5" /> Syntax Errors Found
                </span>
              )}
            </div>

            {/* Errors */}
            {validation?.errors && validation.errors.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-rose-400 uppercase tracking-wider block">
                  Errors ({validation.errors.length}):
                </span>
                {validation.errors.map((err, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-800/50 text-xs text-rose-300 flex items-start gap-2"
                  >
                    <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                    <span>{err}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Warnings */}
            {validation?.warnings && validation.warnings.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider block">
                  Warnings ({validation.warnings.length}):
                </span>
                {validation.warnings.map((warn, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-amber-950/40 border border-amber-800/50 text-xs text-amber-300 flex items-start gap-2"
                  >
                    <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    <span>{warn}</span>
                  </div>
                ))}
              </div>
            )}

            {validation?.isValid && (!validation.warnings || validation.warnings.length === 0) && (
              <p className="text-xs text-slate-400">
                Grammar parsed successfully with zero syntax warnings or unreachable symbols.
              </p>
            )}
          </div>

          {/* Grammar Symbol Decomposition */}
          <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-slate-200">Identified Grammar Symbols</h3>

            {/* Start Symbol */}
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Start Symbol (S)
              </span>
              <span className="inline-block px-2.5 py-1 rounded-md bg-indigo-950/70 border border-indigo-700/60 text-indigo-300 font-mono font-bold text-xs">
                {activeGrammar?.startSymbol || '—'}
              </span>
            </div>

            {/* Non-Terminals */}
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                Non-Terminals ({activeGrammar?.nonTerminals.length ?? 0})
              </span>
              <div className="flex flex-wrap gap-1.5">
                {activeGrammar?.nonTerminals.map((nt) => (
                  <span
                    key={nt}
                    className="px-2 py-0.5 rounded bg-violet-950/60 border border-violet-800/50 text-violet-300 font-mono text-xs font-semibold"
                  >
                    {nt}
                  </span>
                ))}
              </div>
            </div>

            {/* Terminals */}
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                Terminals ({activeGrammar?.terminals.length ?? 0})
              </span>
              <div className="flex flex-wrap gap-1.5">
                {activeGrammar?.terminals.map((term) => (
                  <span
                    key={term}
                    className="px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/50 text-emerald-300 font-mono text-xs"
                  >
                    {term}
                  </span>
                ))}
              </div>
            </div>

            {/* Productions List */}
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                Individual Productions ({activeGrammar?.productions.length ?? 0})
              </span>
              <div className="max-h-48 overflow-y-auto space-y-1 pr-1 font-mono text-xs">
                {activeGrammar?.productions.map((p, idx) => (
                  <div
                    key={p.id}
                    className="p-1.5 rounded bg-[#070a12] border border-slate-800/60 flex items-center justify-between"
                  >
                    <span className="text-slate-500 text-[10px]">#{idx + 1} ({p.id})</span>
                    <div>
                      <strong className="text-violet-400">{p.lhs}</strong>
                      <span className="text-slate-500"> -&gt; </span>
                      <span className="text-emerald-300">{p.rhs.join(' ')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
