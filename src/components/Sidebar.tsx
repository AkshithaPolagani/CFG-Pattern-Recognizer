/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Code2,
  PlayCircle,
  ListTree,
  GitGraph,
  Grid3X3,
  BookOpen,
  CheckCircle2,
  Binary,
} from 'lucide-react';

export type ActiveTab =
  | 'editor'
  | 'tester'
  | 'll1-trace'
  | 'parse-tree'
  | 'cnf-converter'
  | 'presets-viva'
  | 'test-suite';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  rulesCount: number;
  startSymbol: string;
  hasResult: boolean;
  isAccepted: boolean | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  rulesCount,
  startSymbol,
  hasResult,
  isAccepted,
}) => {
  const navItems: Array<{
    id: ActiveTab;
    label: string;
    description: string;
    icon: React.ReactNode;
    badge?: string | React.ReactNode;
  }> = [
    {
      id: 'editor',
      label: 'Grammar Editor',
      description: 'Define productions & validate',
      icon: <Code2 className="w-5 h-5" />,
      badge: `${rulesCount} rules`,
    },
    {
      id: 'tester',
      label: 'Pattern Recognizer',
      description: 'Test strings & evaluate',
      icon: <PlayCircle className="w-5 h-5" />,
      badge:
        hasResult && isAccepted !== null ? (
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded ${
              isAccepted
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-rose-100 text-rose-800'
            }`}
          >
            {isAccepted ? 'ACCEPTED' : 'REJECTED'}
          </span>
        ) : undefined,
    },
    {
      id: 'll1-trace',
      label: 'LL(1) Parsing Trace',
      description: 'Stack steps, FIRST/FOLLOW & table',
      icon: <GitGraph className="w-5 h-5" />,
    },
    {
      id: 'parse-tree',
      label: 'Parse Tree & Derivation',
      description: 'Syntax tree & leftmost derivation',
      icon: <ListTree className="w-5 h-5" />,
    },
    {
      id: 'cnf-converter',
      label: 'CNF Converter',
      description: 'Chomsky Normal Form reduction',
      icon: <Grid3X3 className="w-5 h-5" />,
    },
    {
      id: 'presets-viva',
      label: 'Presets & Viva Guide',
      description: 'Classic CFGs & exam questions',
      icon: <BookOpen className="w-5 h-5" />,
    },
    {
      id: 'test-suite',
      label: 'Automated Test Suite',
      description: 'Formal verification cases',
      icon: <CheckCircle2 className="w-5 h-5" />,
    },
  ];

  return (
    <aside className="w-72 bg-slate-900 text-slate-200 flex flex-col border-r border-slate-800 shrink-0">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 bg-slate-950/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white font-mono font-bold text-lg shadow-md shadow-blue-500/20">
            <Binary className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight leading-tight">
              CFG Recognizer
            </h1>
            <p className="text-xs text-slate-400 font-mono">Compiler Design Project</p>
          </div>
        </div>
      </div>

      {/* Grammar Quick Status */}
      <div className="px-5 py-3 border-b border-slate-800/80 bg-slate-900/90 text-xs flex items-center justify-between">
        <span className="text-slate-400">
          Start Symbol: <strong className="text-blue-400 font-mono">{startSymbol || 'None'}</strong>
        </span>
        <span className="text-slate-400">
          Rules: <strong className="text-slate-200 font-mono">{rulesCount}</strong>
        </span>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          Navigation
        </div>
        {navItems.map(item => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className={isActive ? 'text-white' : 'text-slate-400'}>{item.icon}</span>
                <div className="min-w-0">
                  <div className="text-sm font-medium leading-tight truncate">{item.label}</div>
                  <div
                    className={`text-[11px] truncate ${
                      isActive ? 'text-blue-100' : 'text-slate-400'
                    }`}
                  >
                    {item.description}
                  </div>
                </div>
              </div>
              {item.badge && (
                <div className="ml-2 shrink-0">
                  {typeof item.badge === 'string' ? (
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                        isActive
                          ? 'bg-blue-700 text-blue-100'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {item.badge}
                    </span>
                  ) : (
                    item.badge
                  )}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer / Meta */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40 text-xs text-slate-400">
        <div className="flex items-center justify-between mb-1">
          <span className="text-slate-400 font-mono text-[11px]">Engine: LL(1) Predictive Parser</span>
          <span className="text-emerald-400 text-[11px] font-mono">Deterministic Stack</span>
        </div>
        <p className="text-[11px] text-slate-400">
          Formal Language & Automata Theory (FLAT) Project
        </p>
      </div>
    </aside>
  );
};
