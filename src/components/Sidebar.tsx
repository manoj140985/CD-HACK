import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Code2,
  GitFork,
  Binary,
  TableProperties,
  PlayCircle,
  Network,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { useGrammar } from '../context/GrammarContext.tsx';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const { tableResult, validation, activeGrammar, examples, loadExample, activeExampleId } = useGrammar();

  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/editor', label: 'Grammar Editor', icon: Code2, badge: activeGrammar ? `${activeGrammar.productions.length} rules` : null },
    { path: '/transformations', label: 'Transformations', icon: GitFork },
    { path: '/first-follow', label: 'FIRST & FOLLOW', icon: Binary },
    { path: '/table', label: 'LL(1) Parse Table', icon: TableProperties, statusBadge: tableResult ? (tableResult.isLL1 ? 'LL(1)' : 'Non-LL(1)') : null },
    { path: '/simulator', label: 'Parsing Simulator', icon: PlayCircle },
    { path: '/tree', label: 'Parse Tree', icon: Network },
    { path: '/docs', label: 'Documentation', icon: BookOpen },
  ];

  return (
    <aside
      className={`fixed top-0 left-0 z-30 h-screen transition-all duration-300 ease-in-out border-r border-slate-800/80 bg-[#0b0f19] flex flex-col ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between px-4 h-16 border-b border-slate-800/80 bg-[#090d16]">
        <div className="flex items-center space-x-3 overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 flex-shrink-0">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-bold text-slate-100 text-base tracking-tight leading-tight">
                Parse<span className="text-indigo-400">Viz</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono tracking-wider uppercase">
                LL(1) Compiler Studio
              </span>
            </div>
          )}
        </div>
        <button
          onClick={onToggle}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <div className="w-4 h-4 flex flex-col justify-center gap-1">
            <span className={`h-0.5 bg-current rounded-full transition-all ${collapsed ? 'w-4' : 'w-4'}`} />
            <span className={`h-0.5 bg-current rounded-full transition-all ${collapsed ? 'w-3' : 'w-4'}`} />
            <span className={`h-0.5 bg-current rounded-full transition-all ${collapsed ? 'w-2' : 'w-4'}`} />
          </div>
        </button>
      </div>

      {/* Grammar Status Card (if expanded) */}
      {!collapsed && (
        <div className="mx-3 my-3 p-3 rounded-xl bg-slate-900/90 border border-slate-800">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-slate-400 font-medium">Grammar Status</span>
            {tableResult ? (
              tableResult.isLL1 ? (
                <span className="inline-flex items-center text-[10px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-1.5 py-0.5 rounded">
                  <CheckCircle2 className="w-3 h-3 mr-1" /> LL(1)
                </span>
              ) : (
                <span className="inline-flex items-center text-[10px] font-semibold text-amber-400 bg-amber-950/60 border border-amber-800/60 px-1.5 py-0.5 rounded">
                  <AlertTriangle className="w-3 h-3 mr-1" /> {tableResult.conflicts.length} Conflicts
                </span>
              )
            ) : (
              <span className="text-[10px] text-slate-500">Unanalyzed</span>
            )}
          </div>
          <div className="text-[11px] text-slate-300 font-mono flex items-center justify-between">
            <span>Start: <span className="text-indigo-400 font-bold">{activeGrammar?.startSymbol || '—'}</span></span>
            <span className="text-slate-400">{activeGrammar?.productions.length || 0} prods</span>
          </div>
        </div>
      )}

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600/20 to-blue-600/10 text-indigo-300 border border-indigo-500/30 shadow-sm shadow-indigo-500/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'
                } ${collapsed ? 'justify-center' : 'justify-between'}`
              }
              title={collapsed ? item.label : undefined}
            >
              <div className="flex items-center space-x-3">
                <Icon className="w-4 h-4 flex-shrink-0 group-hover:scale-110 transition-transform text-slate-300" />
                {!collapsed && <span>{item.label}</span>}
              </div>

              {!collapsed && item.statusBadge && (
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                    item.statusBadge === 'LL(1)'
                      ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60'
                      : 'bg-amber-950/80 text-amber-300 border border-amber-800/60'
                  }`}
                >
                  {item.statusBadge}
                </span>
              )}

              {!collapsed && item.badge && !item.statusBadge && (
                <span className="text-[10px] font-mono text-slate-500 bg-slate-800/70 px-1.5 py-0.5 rounded">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Quick Example Loader (Bottom) */}
      {!collapsed && (
        <div className="p-3 border-t border-slate-800/80 bg-[#090d16]">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
            Load Preset Grammar
          </span>
          <div className="grid grid-cols-1 gap-1">
            {examples.slice(0, 3).map((ex) => (
              <button
                key={ex.id}
                onClick={() => loadExample(ex.id)}
                className={`text-left text-xs px-2.5 py-1.5 rounded-lg transition-colors flex items-center justify-between ${
                  activeExampleId === ex.id
                    ? 'bg-indigo-950/60 text-indigo-300 border border-indigo-800/50'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                }`}
              >
                <span className="truncate">{ex.name}</span>
                <span className="text-[9px] font-mono text-slate-400 bg-slate-800 px-1 rounded ml-1">
                  {ex.category}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
};
