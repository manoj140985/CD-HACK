import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Code2,
  GitFork,
  Binary,
  TableProperties,
  PlayCircle,
  Network,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Sparkles,
  Zap,
} from 'lucide-react';
import { useGrammar } from '../context/GrammarContext.tsx';
import { getBenchmarkInputs } from '../utils/benchmarkInputs.ts';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    activeGrammar,
    validation,
    firstFollowResult,
    tableResult,
    simulationResult,
    examples,
    loadExample,
    activeExampleId,
    activeInputString,
    setActiveInputString,
    runSimulation,
  } = useGrammar();

  const [quickInput, setQuickInput] = useState(activeInputString);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    setQuickInput(activeInputString);
  }, [activeInputString]);

  const handleQuickTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setTesting(true);
    setActiveInputString(quickInput);
    await runSimulation(quickInput);
    setTesting(false);
  };

  const pipelineStages = [
    {
      title: '1. Grammar Definition',
      desc: 'Define non-terminals, terminals, and production rules with epsilon support.',
      path: '/editor',
      icon: Code2,
      metric: activeGrammar ? `${activeGrammar.productions.length} Productions` : 'No rules',
      status: validation?.isValid ? 'valid' : 'pending',
    },
    {
      title: '2. Transformations',
      desc: 'Eliminate immediate left recursion and perform left factoring for LL(1) suitability.',
      path: '/transformations',
      icon: GitFork,
      metric: 'Immediate & Factoring',
      status: 'ready',
    },
    {
      title: '3. FIRST & FOLLOW Sets',
      desc: 'Calculate lookahead and follow sets using fixed-point iterative convergence.',
      path: '/first-follow',
      icon: Binary,
      metric: firstFollowResult ? `${Object.keys(firstFollowResult.firstSets).length} Sets` : 'Pending',
      status: firstFollowResult ? 'valid' : 'pending',
    },
    {
      title: '4. LL(1) Parse Table',
      desc: 'Construct M[A, a] matrix, detect FIRST/FIRST & FIRST/FOLLOW conflicts.',
      path: '/table',
      icon: TableProperties,
      metric: tableResult ? (tableResult.isLL1 ? 'Conflict-Free' : `${tableResult.conflicts.length} Conflicts`) : 'Pending',
      status: tableResult ? (tableResult.isLL1 ? 'valid' : 'conflict') : 'pending',
    },
    {
      title: '5. Predictive Parsing',
      desc: 'Execute stack-based LL(1) parsing step-by-step with matched tokens and actions.',
      path: '/simulator',
      icon: PlayCircle,
      metric: simulationResult ? (simulationResult.accepted ? 'Accepted' : 'Syntax Error') : 'Ready',
      status: simulationResult ? (simulationResult.accepted ? 'valid' : 'error') : 'ready',
    },
    {
      title: '6. Parse Tree',
      desc: 'Explore the full derivation tree with parent-child links, terminal leaves, and pan/zoom.',
      path: '/tree',
      icon: Network,
      metric: simulationResult?.parseTree ? 'Tree Generated' : 'Awaiting Parse',
      status: simulationResult?.parseTree ? 'valid' : 'pending',
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-900/40 p-6 md:p-8 shadow-xl shadow-indigo-950/20">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-mono">
              <Sparkles className="w-3.5 h-3.5" /> Compiler Design PS-03 Implementation
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Interactive LL(1) Grammar Practice Studio
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Explore the complete compiler front-end pipeline. Parse context-free grammars, eliminate left recursion, compute FIRST/FOLLOW sets iteratively, build predictive parsing tables, and visualize parse trees step-by-step.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigate('/editor')}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition cursor-pointer"
            >
              <Code2 className="w-4 h-4" /> Open Grammar Editor
            </button>
            <button
              onClick={() => navigate('/simulator')}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-sm border border-slate-700 flex items-center gap-2 transition cursor-pointer"
            >
              <PlayCircle className="w-4 h-4" /> Run Simulator
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            LL(1) Status
          </span>
          <div className="flex items-center gap-1.5">
            {tableResult ? (
              tableResult.isLL1 ? (
                <span className="text-emerald-400 font-bold text-sm flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Valid LL(1)
                </span>
              ) : (
                <span className="text-amber-400 font-bold text-sm flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" /> Conflict ({tableResult.conflicts.length})
                </span>
              )
            ) : (
              <span className="text-slate-500 text-sm">Analyzing...</span>
            )}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Start Symbol
          </span>
          <span className="text-indigo-400 font-mono font-bold text-lg">
            {activeGrammar?.startSymbol || '—'}
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Non-Terminals
          </span>
          <span className="text-violet-400 font-mono font-bold text-lg">
            {activeGrammar?.nonTerminals.length ?? 0}
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Terminals
          </span>
          <span className="text-emerald-400 font-mono font-bold text-lg">
            {activeGrammar?.terminals.length ?? 0}
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Productions
          </span>
          <span className="text-cyan-400 font-mono font-bold text-lg">
            {activeGrammar?.productions.length ?? 0}
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Nullable (ε)
          </span>
          <span className="text-amber-400 font-mono font-bold text-lg">
            {firstFollowResult?.nullableNonTerminals.length ?? 0}
          </span>
        </div>
      </div>

      {/* Compiler Pipeline Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-200">Compiler Front-End Pipeline</h3>
          <span className="text-xs text-slate-400">Click any stage to dive in</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pipelineStages.map((stage) => {
            const Icon = stage.icon;
            return (
              <div
                key={stage.title}
                onClick={() => navigate(stage.path)}
                className="group relative p-5 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-900/90 transition-all cursor-pointer shadow-sm hover:shadow-indigo-500/10 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-9 h-9 rounded-lg bg-indigo-950/80 border border-indigo-800/60 flex items-center justify-center text-indigo-400 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                      <Icon className="w-5 h-5" />
                    </div>
                    {stage.status === 'valid' && (
                      <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-emerald-950/70 text-emerald-400 border border-emerald-800/50 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Ready
                      </span>
                    )}
                    {stage.status === 'conflict' && (
                      <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-amber-950/70 text-amber-400 border border-amber-800/50 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Conflict
                      </span>
                    )}
                    {stage.status === 'error' && (
                      <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-rose-950/70 text-rose-400 border border-rose-800/50 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Reject
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-semibold text-slate-100 group-hover:text-indigo-300 transition-colors">
                    {stage.title}
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    {stage.desc}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="font-mono text-slate-300 font-medium">
                    {stage.metric}
                  </span>
                  <span className="text-indigo-400 group-hover:translate-x-1 transition-transform flex items-center gap-1 font-medium">
                    Explore <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Test Bar & Active Grammar Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Grammar Summary */}
        <div className="lg:col-span-1 p-5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Active Grammar
              </span>
              <button
                onClick={() => navigate('/editor')}
                className="text-xs text-indigo-400 hover:text-indigo-300 transition cursor-pointer"
              >
                Edit Grammar &rarr;
              </button>
            </div>
            <pre className="font-mono text-xs text-slate-300 bg-[#070a12] p-3.5 rounded-lg border border-slate-800/80 max-h-48 overflow-y-auto leading-relaxed">
              {activeGrammar?.productions.map((p) => (
                <div key={p.id}>
                  <span className="text-violet-400">{p.lhs}</span>
                  <span className="text-slate-500"> -&gt; </span>
                  <span className="text-emerald-300">{p.rhs.join(' ')}</span>
                </div>
              ))}
            </pre>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Non-Terminals: {activeGrammar?.nonTerminals.join(', ')}</span>
          </div>
        </div>

        {/* Quick Simulation Playground */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Quick Predictive Test
              </span>
              {simulationResult && (
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded ${
                    simulationResult.accepted
                      ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60'
                      : 'bg-rose-950/80 text-rose-400 border border-rose-800/60'
                  }`}
                >
                  {simulationResult.accepted ? 'Accepted in ' + simulationResult.totalSteps + ' steps' : 'Rejected'}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mb-3">
              Enter a token string to test against the active LL(1) parsing table:
            </p>

            <form onSubmit={handleQuickTest} className="flex gap-2">
              <input
                type="text"
                value={quickInput}
                onChange={(e) => setQuickInput(e.target.value)}
                placeholder="e.g. id + id * id"
                className="flex-1 bg-[#070a12] border border-slate-800 rounded-lg px-3.5 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                disabled={testing}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5" />
                {testing ? 'Testing...' : 'Test String'}
              </button>
            </form>

            {/* Grammar-synchronized benchmark chips */}
            {activeGrammar && (
              <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] text-slate-400">Benchmark inputs:</span>
                {getBenchmarkInputs(activeGrammar, activeExampleId).slice(0, 6).map((sample) => (
                  <button
                    key={sample.input || 'EMPTY'}
                    type="button"
                    onClick={() => {
                      setQuickInput(sample.input);
                      setActiveInputString(sample.input);
                      runSimulation(sample.input);
                    }}
                    className="text-[10px] font-mono px-2 py-1 rounded transition border cursor-pointer bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800"
                    title={sample.notes}
                  >
                    {sample.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              {simulationResult?.error
                ? simulationResult.error.message
                : 'Deterministic predictive parsing with visual trace.'}
            </span>
            <button
              onClick={() => navigate('/simulator')}
              className="text-xs font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
            >
              Step-by-Step Trace &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* Preset Grammars Grid */}
      <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-400" /> Preloaded Benchmark Grammars
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Select any classic problem statement from compiler design curricula to immediately populate the studio.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {examples.map((ex) => {
            const isSelected = activeExampleId === ex.id;
            return (
              <div
                key={ex.id}
                onClick={() => loadExample(ex.id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-indigo-950/40 border-indigo-500/50 shadow-md shadow-indigo-950/30'
                    : 'bg-[#090d16] border-slate-800/90 hover:border-slate-700 hover:bg-slate-900/50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-semibold text-slate-200">
                      {ex.name}
                    </span>
                    <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-slate-800 text-indigo-300 border border-slate-700">
                      {ex.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {ex.description}
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center justify-between text-xs">
                  <span className="font-mono text-[11px] text-slate-400">
                    {ex.grammarText.split('\n').length} rules
                  </span>
                  <span
                    className={`font-medium ${
                      isSelected ? 'text-indigo-300' : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  >
                    {isSelected ? 'Loaded Active ✓' : 'Load Grammar'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
