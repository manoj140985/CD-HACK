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
    <div className="w-full bg-[#080D0A] border-y border-[#1B3326] px-4 py-2.5 overflow-x-auto">
      <div className="flex items-center min-w-max space-x-1.5 md:space-x-3 text-xs">
        <span className="text-[11px] font-semibold text-[#68776D] uppercase tracking-wider mr-2 hidden sm:inline">
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
                    ? 'bg-[#15231A] border border-[#00E676] text-[#00E676] shadow-sm'
                    : 'bg-[#0D1410] border border-[#1B3326] text-[#A0ADA4] hover:text-[#F5F7F5] hover:border-[#1B3326] hover:bg-[#111B15]'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#00E676]' : 'text-[#68776D]'}`} />
                <span>{stage.name}</span>
                {stage.hasWarning ? (
                  <AlertTriangle className="w-3 h-3 text-[#FFD740]" />
                ) : stage.isComplete ? (
                  <CheckCircle2 className="w-3 h-3 text-[#00E676]" />
                ) : null}
              </button>
              {idx < stages.length - 1 && (
                <ChevronRight className="w-3.5 h-3.5 text-[#1B3326] flex-shrink-0" />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
