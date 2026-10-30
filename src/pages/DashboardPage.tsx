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
  Zap,
  Trophy,
  Layers,
  FileCode2,
  Check,
  ChevronRight,
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

  const scrollToExamples = () => {
    const el = document.getElementById('benchmark-grammars-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Workflow pipeline
  const pipelineStages = [
    {
      title: 'Grammar Input',
      desc: 'Define non-terminals, terminals, and production rules.',
      path: '/editor',
      icon: Code2,
      isDone: !!(activeGrammar && activeGrammar.productions.length > 0 && validation?.isValid),
    },
    {
      title: 'Transformation',
      desc: 'Immediate Left Recursion Elimination & Left Factoring.',
      path: '/transformations',
      icon: GitFork,
      isDone: true,
    },
    {
      title: 'FIRST / FOLLOW',
      desc: 'Fixed-point iteration to compute lookahead sets.',
      path: '/first-follow',
      icon: Binary,
      isDone: !!firstFollowResult,
    },
    {
      title: 'LL(1) Table',
      desc: 'Predictive matrix M[A, a] & conflict diagnosis.',
      path: '/table',
      icon: TableProperties,
      isDone: !!tableResult,
    },
    {
      title: 'Predictive Parsing',
      desc: 'Stack-based step-by-step token expansion.',
      path: '/simulator',
      icon: PlayCircle,
      isDone: !!simulationResult,
    },
    {
      title: 'Parse Tree',
      desc: 'Visual derivation tree with node inspection.',
      path: '/tree',
      icon: Network,
      isDone: !!simulationResult?.parseTree,
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome Hero Section */}
      <div className="p-6 md:p-8 rounded-xl bg-[#0D1410] border border-[#1B3326] relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#111B15] border border-[#1B3326] text-[#00E676] text-xs font-mono font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00E676] inline-block" />
              Compiler Design Studio
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-[#F5F7F5] tracking-tight">
              Master Compiler Design Visually
            </h2>
            <p className="text-sm text-[#A0ADA4] leading-relaxed">
              Explore grammar transformations, understand predictive parsing, and visualize how compilers process language.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigate('/editor')}
              className="px-4 py-2.5 rounded-lg bg-[#00E676] hover:bg-[#00C853] text-[#050807] font-bold text-xs flex items-center gap-2 transition cursor-pointer shadow-sm"
            >
              <Code2 className="w-4 h-4" />
              <span>Create New Grammar</span>
            </button>
            <button
              onClick={scrollToExamples}
              className="px-4 py-2.5 rounded-lg bg-[#111B15] hover:bg-[#15231A] text-[#F5F7F5] font-medium text-xs border border-[#1B3326] flex items-center gap-2 transition cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-[#A0ADA4]" />
              <span>Explore Examples</span>
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-[#0D1410] border border-[#1B3326]">
          <span className="text-[11px] font-semibold text-[#68776D] uppercase tracking-wider block mb-1">
            Total Projects
          </span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold font-mono text-[#F5F7F5]">
              {examples.length}
            </span>
            <FileCode2 className="w-4 h-4 text-[#00E676]" />
          </div>
          <span className="text-[10px] text-[#A0ADA4] mt-1 block">Benchmark Suites</span>
        </div>

        <div className="p-4 rounded-xl bg-[#0D1410] border border-[#1B3326]">
          <span className="text-[11px] font-semibold text-[#68776D] uppercase tracking-wider block mb-1">
            Grammars Analyzed
          </span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold font-mono text-[#F5F7F5]">
              {activeGrammar ? activeGrammar.productions.length : 0}
            </span>
            <Layers className="w-4 h-4 text-[#00E676]" />
          </div>
          <span className="text-[10px] text-[#A0ADA4] mt-1 block">Active Productions</span>
        </div>

        <div className="p-4 rounded-xl bg-[#0D1410] border border-[#1B3326]">
          <span className="text-[11px] font-semibold text-[#68776D] uppercase tracking-wider block mb-1">
            LL(1) Grammars
          </span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold font-mono text-[#00E676]">
              {tableResult?.isLL1 ? 'Valid' : 'Conflict'}
            </span>
            <CheckCircle2 className="w-4 h-4 text-[#00E676]" />
          </div>
          <span className="text-[10px] text-[#A0ADA4] mt-1 block">
            {tableResult ? `${tableResult.conflicts.length} conflicts` : 'Unanalyzed'}
          </span>
        </div>

        <div className="p-4 rounded-xl bg-[#0D1410] border border-[#1B3326]">
          <span className="text-[11px] font-semibold text-[#68776D] uppercase tracking-wider block mb-1">
            Parsing Sessions
          </span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold font-mono text-[#F5F7F5]">
              {simulationResult ? simulationResult.totalSteps : 0}
            </span>
            <PlayCircle className="w-4 h-4 text-[#00E676]" />
          </div>
          <span className="text-[10px] text-[#A0ADA4] mt-1 block">
            {simulationResult?.accepted ? 'String Accepted' : 'Derivation steps'}
          </span>
        </div>
      </div>

      {/* Compiler Pipeline Horizontal Workflow */}
      <div className="p-5 rounded-xl bg-[#0D1410] border border-[#1B3326] space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-[#F5F7F5] uppercase tracking-wider">
            Compiler Pipeline Workflow
          </h3>
          <span className="text-[11px] text-[#A0ADA4]">Deterministic Top-Down LL(1) Architecture</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {pipelineStages.map((stage, idx) => {
            const Icon = stage.icon;
            return (
              <div
                key={stage.title}
                onClick={() => navigate(stage.path)}
                className="p-3.5 rounded-lg bg-[#111B15] border border-[#1B3326] hover:border-[#00E676]/60 hover:bg-[#15231A] transition cursor-pointer flex flex-col justify-between space-y-2 group"
              >
                <div className="flex items-center justify-between">
                  <div className="w-7 h-7 rounded-md bg-[#0D1410] border border-[#1B3326] flex items-center justify-center text-[#00E676] group-hover:scale-105 transition-transform">
                    <Icon className="w-3.5 h-3.5 text-[#00E676]" />
                  </div>
                  {stage.isDone ? (
                    <span className="w-2 h-2 rounded-full bg-[#00E676]" title="Ready" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-[#68776D]" title="Pending" />
                  )}
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-[#F5F7F5] group-hover:text-[#00E676] transition-colors">
                    {stage.title}
                  </h4>
                  <p className="text-[11px] text-[#A0ADA4] mt-0.5 line-clamp-2">
                    {stage.desc}
                  </p>
                </div>

                <div className="pt-1 border-t border-[#1B3326] flex items-center justify-between text-[10px] text-[#68776D]">
                  <span>Step {idx + 1}</span>
                  <ChevronRight className="w-3 h-3 text-[#00E676] group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Practice Arena Promotional Card */}
      <div className="p-5 rounded-xl bg-[#0D1410] border border-[#1B3326] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center space-x-3.5">
          <div className="w-10 h-10 rounded-lg bg-[#111B15] border border-[#1B3326] flex items-center justify-center text-[#00E676] flex-shrink-0">
            <Trophy className="w-5 h-5 text-[#00E676]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#F5F7F5] flex items-center gap-2">
              Practice Arena – Test Your Compiler Knowledge
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#00E676]/10 text-[#00E676] border border-[#00E676]/30">
                Interactive
              </span>
            </h3>
            <p className="text-xs text-[#A0ADA4] mt-0.5">
              Practice string acceptance, FIRST &amp; FOLLOW calculations, and LL(1) conflict identification with live scoring and explanations.
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate('/practice')}
          className="px-4 py-2 rounded-lg bg-[#00E676] hover:bg-[#00C853] text-[#050807] font-bold text-xs flex items-center gap-2 transition cursor-pointer self-start sm:self-auto flex-shrink-0"
        >
          <span>Enter Practice Arena</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Quick Test Bar & Active Grammar Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Grammar Summary */}
        <div className="lg:col-span-1 p-5 rounded-xl bg-[#0D1410] border border-[#1B3326] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#68776D]">
                Active Grammar
              </span>
              <button
                onClick={() => navigate('/editor')}
                className="text-xs text-[#00E676] hover:underline cursor-pointer"
              >
                Edit Grammar &rarr;
              </button>
            </div>
            <pre className="font-mono text-xs text-[#F5F7F5] bg-[#050807] p-3.5 rounded-lg border border-[#1B3326] max-h-48 overflow-y-auto leading-relaxed">
              {activeGrammar?.productions.map((p) => (
                <div key={p.id}>
                  <span className="text-[#69F0AE] font-bold">{p.lhs}</span>
                  <span className="text-[#68776D]"> -&gt; </span>
                  <span className="text-[#F5F7F5]">{p.rhs.join(' ')}</span>
                </div>
              ))}
            </pre>
          </div>

          <div className="mt-4 pt-3 border-t border-[#1B3326] flex items-center justify-between text-xs text-[#A0ADA4]">
            <span>Start: <strong className="text-[#00E676]">{activeGrammar?.startSymbol}</strong></span>
            <span>Non-Terminals: {activeGrammar?.nonTerminals.length}</span>
          </div>
        </div>

        {/* Quick Simulation Playground */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-[#0D1410] border border-[#1B3326] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#68776D]">
                Quick Predictive Test
              </span>
              {simulationResult && (
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded ${
                    simulationResult.accepted
                      ? 'bg-[#00E676]/10 text-[#00E676] border border-[#00E676]/30'
                      : 'bg-[#FF5252]/10 text-[#FF5252] border border-[#FF5252]/30'
                  }`}
                >
                  {simulationResult.accepted
                    ? `Accepted in ${simulationResult.totalSteps} steps`
                    : 'Rejected'}
                </span>
              )}
            </div>
            <p className="text-xs text-[#A0ADA4] mb-3">
              Enter a token string to test against the active LL(1) parsing table:
            </p>

            <form onSubmit={handleQuickTest} className="flex gap-2">
              <input
                type="text"
                value={quickInput}
                onChange={(e) => setQuickInput(e.target.value)}
                placeholder="e.g. id + id * id or a b c"
                className="flex-1 bg-[#050807] border border-[#1B3326] rounded-lg px-3.5 py-2 text-xs font-mono text-[#F5F7F5] focus:outline-none focus:border-[#00E676]"
              />
              <button
                type="submit"
                disabled={testing}
                className="px-4 py-2 bg-[#00E676] hover:bg-[#00C853] text-[#050807] rounded-lg text-xs font-bold flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5" />
                {testing ? 'Testing...' : 'Test String'}
              </button>
            </form>

            {/* Grammar-synchronized benchmark chips */}
            {activeGrammar && (
              <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] text-[#68776D]">Benchmark inputs:</span>
                {getBenchmarkInputs(activeGrammar, activeExampleId).slice(0, 6).map((sample) => (
                  <button
                    key={sample.input || 'EMPTY'}
                    type="button"
                    onClick={() => {
                      setQuickInput(sample.input);
                      setActiveInputString(sample.input);
                      runSimulation(sample.input);
                    }}
                    className="text-[10px] font-mono px-2 py-1 rounded transition border cursor-pointer bg-[#111B15] border-[#1B3326] text-[#A0ADA4] hover:border-[#00E676] hover:text-[#00E676]"
                    title={sample.notes}
                  >
                    {sample.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-[#1B3326] flex items-center justify-between">
            <span className="text-xs text-[#68776D] truncate max-w-sm">
              {simulationResult?.error
                ? simulationResult.error.message
                : 'Deterministic predictive parsing with full trace.'}
            </span>
            <button
              onClick={() => navigate('/simulator')}
              className="text-xs font-medium text-[#00E676] hover:underline flex items-center gap-1 cursor-pointer"
            >
              Step-by-Step Trace &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* Benchmark Grammars Section */}
      <div
        id="benchmark-grammars-section"
        className="p-6 rounded-xl bg-[#0D1410] border border-[#1B3326] space-y-4"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[#F5F7F5] flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#00E676]" /> Preloaded Benchmark Grammars
            </h3>
            <p className="text-xs text-[#A0ADA4] mt-0.5">
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
                    ? 'bg-[#15231A] border-[#00E676]'
                    : 'bg-[#111B15] border-[#1B3326] hover:border-[#00E676]/40 hover:bg-[#15231A]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-semibold text-[#F5F7F5]">
                      {ex.name}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#0D1410] text-[#00E676] border border-[#1B3326]">
                      {ex.category}
                    </span>
                  </div>
                  <p className="text-xs text-[#A0ADA4] line-clamp-2 leading-relaxed">
                    {ex.description}
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-[#1B3326] flex items-center justify-between text-xs">
                  <span className="font-mono text-[11px] text-[#68776D]">
                    {ex.grammarText.split('\n').length} rules
                  </span>
                  <span
                    className={`font-medium ${
                      isSelected ? 'text-[#00E676]' : 'text-[#A0ADA4]'
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
