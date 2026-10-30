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
  Trophy,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Terminal,
} from 'lucide-react';
import { useGrammar } from '../context/GrammarContext.tsx';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const { tableResult, activeGrammar, examples, loadExample, activeExampleId } = useGrammar();

  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    {
      path: '/editor',
      label: 'Grammar Editor',
      icon: Code2,
      badge: activeGrammar ? `${activeGrammar.productions.length} rules` : null,
    },
    { path: '/transformations', label: 'Transformations', icon: GitFork },
    { path: '/first-follow', label: 'FIRST & FOLLOW', icon: Binary },
    {
      path: '/table',
      label: 'LL(1) Parse Table',
      icon: TableProperties,
      statusBadge: tableResult ? (tableResult.isLL1 ? 'LL(1)' : 'Non-LL(1)') : null,
    },
    { path: '/simulator', label: 'Parsing Simulator', icon: PlayCircle },
    { path: '/tree', label: 'Parse Tree', icon: Network },
    { path: '/practice', label: 'Practice Arena', icon: Trophy },
    { path: '/docs', label: 'Documentation', icon: BookOpen },
  ];

  return (
    <aside
      className={`fixed top-0 left-0 z-30 h-screen transition-all duration-300 ease-in-out border-r border-[#1B3326] bg-[#080D0A] flex flex-col ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between px-4 h-16 border-b border-[#1B3326] bg-[#080D0A]">
        <div className="flex items-center space-x-3 overflow-hidden">
          <div className="w-9 h-9 rounded-lg bg-[#111B15] border border-[#1B3326] flex items-center justify-center flex-shrink-0 text-[#00E676]">
            <Terminal className="w-5 h-5 text-[#00E676]" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-bold text-[#F5F7F5] text-base tracking-tight leading-tight">
                Parse<span className="text-[#00E676]">Viz</span>
              </span>
              <span className="text-[10px] text-[#68776D] font-mono tracking-wider uppercase">
                LL(1) Compiler Studio
              </span>
            </div>
          )}
        </div>
        <button
          onClick={onToggle}
          className="p-1.5 rounded-lg text-[#68776D] hover:text-[#F5F7F5] hover:bg-[#15231A] transition-colors cursor-pointer"
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
        <div className="mx-3 my-3 p-3 rounded-lg bg-[#0D1410] border border-[#1B3326]">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-[#A0ADA4] font-medium text-[11px]">Grammar Status</span>
            {tableResult ? (
              tableResult.isLL1 ? (
                <span className="inline-flex items-center text-[10px] font-semibold text-[#00E676] bg-[#00E676]/10 border border-[#00E676]/30 px-1.5 py-0.5 rounded">
                  <CheckCircle2 className="w-3 h-3 mr-1" /> LL(1)
                </span>
              ) : (
                <span className="inline-flex items-center text-[10px] font-semibold text-[#FF5252] bg-[#FF5252]/10 border border-[#FF5252]/30 px-1.5 py-0.5 rounded">
                  <AlertTriangle className="w-3 h-3 mr-1" /> {tableResult.conflicts.length} Conflicts
                </span>
              )
            ) : (
              <span className="text-[10px] text-[#68776D]">Analyzing...</span>
            )}
          </div>
          <div className="text-[11px] text-[#F5F7F5] font-mono flex items-center justify-between">
            <span>
              Start: <span className="text-[#00E676] font-bold">{activeGrammar?.startSymbol || '—'}</span>
            </span>
            <span className="text-[#68776D]">{activeGrammar?.productions.length || 0} prods</span>
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
                `flex items-center px-3 py-2.5 rounded-lg text-xs font-medium transition-all group relative cursor-pointer ${
                  isActive
                    ? 'bg-[#15231A] text-[#00E676] border border-[#00E676]/40 shadow-sm'
                    : 'text-[#A0ADA4] hover:text-[#F5F7F5] hover:bg-[#111B15] border border-transparent'
                } ${collapsed ? 'justify-center' : 'justify-between'}`
              }
              title={collapsed ? item.label : undefined}
            >
              <div className="flex items-center space-x-3">
                <Icon className="w-4 h-4 flex-shrink-0 group-hover:scale-105 transition-transform" />
                {!collapsed && <span>{item.label}</span>}
              </div>

              {!collapsed && item.statusBadge && (
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                    item.statusBadge === 'LL(1)'
                      ? 'bg-[#00E676]/10 text-[#00E676] border border-[#00E676]/30'
                      : 'bg-[#FF5252]/10 text-[#FF5252] border border-[#FF5252]/30'
                  }`}
                >
                  {item.statusBadge}
                </span>
              )}

              {!collapsed && item.badge && !item.statusBadge && (
                <span className="text-[10px] font-mono text-[#68776D] bg-[#111B15] px-1.5 py-0.5 rounded border border-[#1B3326]">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Quick Example Preset Loader (Bottom) */}
      {!collapsed && (
        <div className="p-3 border-t border-[#1B3326] bg-[#080D0A]">
          <span className="text-[11px] font-semibold text-[#68776D] uppercase tracking-wider block mb-2">
            Load Preset Grammar
          </span>
          <div className="grid grid-cols-1 gap-1">
            {examples.slice(0, 3).map((ex) => (
              <button
                key={ex.id}
                onClick={() => loadExample(ex.id)}
                className={`text-left text-xs px-2.5 py-1.5 rounded-md transition-colors flex items-center justify-between cursor-pointer ${
                  activeExampleId === ex.id
                    ? 'bg-[#15231A] text-[#00E676] border border-[#00E676]/30'
                    : 'text-[#A0ADA4] hover:bg-[#111B15] hover:text-[#F5F7F5]'
                }`}
              >
                <span className="truncate">{ex.name}</span>
                <span className="text-[9px] font-mono text-[#68776D] bg-[#111B15] px-1.5 py-0.5 rounded border border-[#1B3326] ml-1">
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
