import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Code2,
  GitFork,
  Binary,
  TableProperties,
  PlayCircle,
  Network,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { useGrammar } from '../context/GrammarContext.tsx';

export const PipelineStepper: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { tableResult, validation, activeGrammar } = useGrammar();

  const stages = [
    {
      id: 'grammar',
      name: 'Grammar',
      path: '/editor',
      icon: Code2,
      isComplete: !!(activeGrammar && activeGrammar.productions.length > 0 && validation?.isValid),
      hasWarning: !!(validation?.warnings && validation.warnings.length > 0),
    },
    {
      id: 'transform',
      name: 'Transform',
      path: '/transformations',
      icon: GitFork,
      isComplete: true,
      hasWarning: false,
    },
    {
      id: 'firstfollow',
      name: 'FIRST & FOLLOW',
      path: '/first-follow',
      icon: Binary,
      isComplete: !!activeGrammar,
      hasWarning: false,
    },
    {
      id: 'table',
      name: 'LL(1) Table',
      path: '/table',
      icon: TableProperties,
      isComplete: !!tableResult,
      hasWarning: !!(tableResult && !tableResult.isLL1),
    },
    {
      id: 'parse',
      name: 'Parsing',
      path: '/simulator',
      icon: PlayCircle,
      isComplete: true,
      hasWarning: false,
    },
    {
      id: 'tree',
      name: 'Parse Tree',
      path: '/tree',
      icon: Network,
      isComplete: true,
      hasWarning: false,
    },
  ];

  return (
    <div className="w-full bg-[#0d1322] border-y border-slate-800/80 px-4 py-2.5 overflow-x-auto">
      <div className="flex items-center min-w-max space-x-1.5 md:space-x-3 text-xs">
        <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider mr-2 hidden sm:inline">
          Pipeline:
        </span>
        {stages.map((stage, idx) => {
          const isActive = location.pathname === stage.path;
          const Icon = stage.icon;

          return (
            <React.Fragment key={stage.id}>
              <button
                onClick={() => navigate(stage.path)}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600/25 border border-indigo-500/50 text-indigo-200 shadow-sm'
                    : 'bg-slate-900/60 border border-slate-800/60 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                <span>{stage.name}</span>
                {stage.hasWarning ? (
                  <AlertTriangle className="w-3 h-3 text-amber-400" />
                ) : stage.isComplete ? (
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                ) : null}
              </button>
              {idx < stages.length - 1 && (
                <ChevronRight className="w-3.5 h-3.5 text-slate-700 flex-shrink-0" />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
