/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ParseResult } from '../types/grammar';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  Layers,
  Table as TableIcon,
  ListOrdered,
  Sparkles,
} from 'lucide-react';

interface LL1TraceViewProps {
  parseResult: ParseResult | null;
}

export const LL1TraceView: React.FC<LL1TraceViewProps> = ({ parseResult }) => {
  const [activeSubTab, setActiveSubTab] = useState<'stack' | 'table' | 'first-follow'>('stack');

  if (!parseResult) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center space-y-3">
        <Layers className="w-10 h-10 text-slate-300 mx-auto" />
        <h3 className="text-base font-bold text-slate-700">No LL(1) Parsing Trace Available</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Please input a test string in the Pattern Recognizer tab and click &quot;Parse String&quot; to generate the LL(1) predictive parsing trace, stack steps, FIRST/FOLLOW sets, and parsing table.
        </p>
      </div>
    );
  }

  const {
    accepted,
    input,
    tokens,
    isLL1,
    conflicts = [],
    firstFollow,
    ll1Table,
    parseSteps = [],
  } = parseResult;

  const getActionBadgeClass = (type: string) => {
    switch (type) {
      case 'expand':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'match':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'accept':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold';
      case 'error':
        return 'bg-rose-50 text-rose-700 border-rose-200 font-bold';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">LL(1) Predictive Parsing Trace</h2>
            <p className="text-xs text-slate-500">
              Stack execution trace, FIRST &amp; FOLLOW sets, and predictive parsing table for input{' '}
              <code className="text-blue-700 font-mono">{input === '' ? 'ε' : `"${input}"`}</code>.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {!isLL1 ? (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Not LL(1) ({conflicts.length} conflict{conflicts.length !== 1 ? 's' : ''})</span>
              </span>
            ) : accepted ? (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Accepted in {parseSteps.length} Steps</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200">
                <XCircle className="w-4 h-4 text-rose-600" />
                <span>Rejected by LL(1) Parser</span>
              </span>
            )}
          </div>
        </div>

        {/* Algorithm Theory Box */}
        <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-600 flex items-start gap-2 border border-slate-200">
          <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold text-slate-800">How LL(1) Predictive Parsing Works:</span>
            <p>
              An <strong>LL(1)</strong> parser is a deterministic top-down syntax analyzer:
              <strong> L</strong> scans input Left-to-right,
              <strong> L</strong> constructs a Leftmost derivation, and
              <strong> (1)</strong> uses 1 lookahead token. It maintains a pushdown stack initialized to <code className="font-mono text-blue-700">[$, S]</code> and indexes the parsing table <code className="font-mono text-blue-700">M[A, a]</code> constructed from <code className="font-mono text-purple-700">FIRST</code> and <code className="font-mono text-emerald-700">FOLLOW</code> sets.
            </p>
          </div>
        </div>

        {/* Conflict Warning Box if grammar is not LL(1) */}
        {!isLL1 && conflicts.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3.5 text-xs text-amber-950 space-y-2">
            <div className="font-bold flex items-center gap-1.5 text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Grammar Contains LL(1) Parsing Table Conflicts:</span>
            </div>
            <ul className="list-disc list-inside space-y-1 font-mono text-[11px] text-amber-900">
              {conflicts.map((c, idx) => (
                <li key={idx}>
                  <strong>M[{c.nonTerminal}, {c.terminal}]:</strong> {c.rules.map(r => r.raw).join('  AND  ')}{' '}
                  <span className="font-sans text-[10px] text-amber-700 font-semibold">({c.reason})</span>
                </li>
              ))}
            </ul>
            <p className="text-[11px] text-amber-800 font-sans">
              To parse this grammar with an LL(1) parser, eliminate left recursion and left factor common prefixes.
            </p>
          </div>
        )}

        {/* View Switcher Tabs */}
        <div className="flex border-b border-slate-200 pt-1">
          <button
            onClick={() => setActiveSubTab('stack')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeSubTab === 'stack'
                ? 'border-blue-600 text-blue-700 bg-blue-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <ListOrdered className="w-4 h-4" />
            <span>Stack Parsing Trace ({parseSteps.length} Steps)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('table')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeSubTab === 'table'
                ? 'border-blue-600 text-blue-700 bg-blue-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <TableIcon className="w-4 h-4" />
            <span>Predictive Parsing Table M[A, a]</span>
          </button>

          <button
            onClick={() => setActiveSubTab('first-follow')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeSubTab === 'first-follow'
                ? 'border-blue-600 text-blue-700 bg-blue-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>FIRST &amp; FOLLOW Sets</span>
          </button>
        </div>
      </div>

      {/* SUB-VIEW 1: Stack Parsing Trace Table */}
      {activeSubTab === 'stack' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              LL(1) Stack Parsing Execution Steps
            </h3>
            <span className="text-xs font-mono text-slate-500">
              Initial Stack: [$, {parseSteps[0]?.stack[1] || 'S'}]
            </span>
          </div>

          {parseSteps.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 space-y-1">
              <p className="font-semibold text-slate-700">No Stack Steps Executed</p>
              <p>
                {!isLL1
                  ? 'The grammar is not LL(1). Resolve table conflicts to enable deterministic stack parsing.'
                  : 'Enter a test string and click Parse to view stack execution.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse font-mono">
                <thead>
                  <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-700 font-semibold text-[11px]">
                    <th className="py-2.5 px-4 w-16 text-center">Step</th>
                    <th className="py-2.5 px-4 min-w-[180px]">Stack (Bottom → Top)</th>
                    <th className="py-2.5 px-4 min-w-[180px]">Remaining Input</th>
                    <th className="py-2.5 px-4 min-w-[280px]">Action / Output</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {parseSteps.map(step => (
                    <tr
                      key={step.step}
                      className={`hover:bg-slate-50 transition-colors ${
                        step.type === 'accept'
                          ? 'bg-emerald-50/60 font-semibold'
                          : step.type === 'error'
                          ? 'bg-rose-50/60 font-semibold'
                          : ''
                      }`}
                    >
                      <td className="py-2.5 px-4 text-center text-slate-400 text-[11px]">
                        {step.step}
                      </td>

                      {/* Stack Content */}
                      <td className="py-2.5 px-4">
                        <span className="bg-slate-100 text-slate-900 px-2 py-0.5 rounded font-bold">
                          {step.stackDisplay}
                        </span>
                      </td>

                      {/* Remaining Input */}
                      <td className="py-2.5 px-4 text-slate-800">
                        <span className="bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">
                          {step.remainingInputDisplay}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-2.5 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border font-sans ${getActionBadgeClass(
                              step.type
                            )}`}
                          >
                            {step.type}
                          </span>
                          <span className="text-slate-800 font-sans text-xs">
                            {step.action}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* SUB-VIEW 2: LL(1) Predictive Parsing Table */}
      {activeSubTab === 'table' && ll1Table && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs space-y-4 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                LL(1) Parsing Table M[Non-Terminal, Terminal]
              </h3>
              <p className="text-xs text-slate-500">
                Each cell M[A, a] specifies the production to apply when non-terminal A is on top of stack and terminal a is the lookahead.
              </p>
            </div>

            <div className="text-xs font-mono text-slate-600 bg-slate-100 px-2.5 py-1 rounded">
              Size: {ll1Table.nonTerminals.length} rows × {ll1Table.terminals.length} columns
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs border-collapse font-mono">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 text-[11px]">
                  <th className="py-2.5 px-4 border-r border-slate-200 font-bold bg-slate-200/70">
                    Non-Terminal
                  </th>
                  {ll1Table.terminals.map(t => (
                    <th key={t} className="py-2.5 px-3 border-r border-slate-200 text-center font-bold text-blue-700 min-w-[90px]">
                      {t}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {ll1Table.nonTerminals.map(nt => (
                  <tr key={nt} className="hover:bg-slate-50">
                    <td className="py-2 px-4 border-r border-slate-200 font-bold text-slate-900 bg-slate-50">
                      {nt}
                    </td>
                    {ll1Table.terminals.map(t => {
                      const rules = ll1Table.table[nt]?.[t] || [];
                      const hasConflict = rules.length > 1;

                      return (
                        <td
                          key={t}
                          className={`py-2 px-2.5 border-r border-slate-200 text-center text-[11px] ${
                            hasConflict
                              ? 'bg-rose-50 text-rose-800 font-bold'
                              : rules.length > 0
                              ? 'bg-white text-slate-900'
                              : 'bg-slate-50/50 text-slate-300'
                          }`}
                        >
                          {rules.length === 0 ? (
                            <span className="text-slate-300">-</span>
                          ) : hasConflict ? (
                            <div className="space-y-0.5">
                              <span className="text-[10px] bg-rose-200 text-rose-900 px-1.5 py-0.2 rounded font-sans font-bold block">
                                Conflict ({rules.length})
                              </span>
                              {rules.map((r, i) => (
                                <div key={i} className="text-rose-900">
                                  {r.raw}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-blue-900 font-medium">
                              {rules[0].raw}
                            </span>
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
      )}

      {/* SUB-VIEW 3: FIRST & FOLLOW Sets */}
      {activeSubTab === 'first-follow' && firstFollow && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs p-5 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Computed FIRST and FOLLOW Sets
            </h3>
            <p className="text-xs text-slate-500">
              FIRST(A) represents the set of terminal tokens that begin strings derived from A. FOLLOW(A) represents the set of terminals that can immediately follow A in some sentential form.
            </p>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs border-collapse font-mono">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 text-[11px]">
                  <th className="py-2.5 px-4 w-32 border-r border-slate-200 font-bold bg-slate-200/70">
                    Non-Terminal
                  </th>
                  <th className="py-2.5 px-4 min-w-[200px] border-r border-slate-200 font-bold text-purple-800">
                    FIRST Set
                  </th>
                  <th className="py-2.5 px-4 min-w-[200px] font-bold text-emerald-800">
                    FOLLOW Set
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {Object.keys(firstFollow.first).map(nt => (
                  <tr key={nt} className="hover:bg-slate-50">
                    <td className="py-3 px-4 border-r border-slate-200 font-bold text-slate-900 bg-slate-50">
                      {nt}
                    </td>
                    <td className="py-3 px-4 border-r border-slate-200 text-purple-900 font-medium">
                      {`{ ${firstFollow.first[nt].join(', ') || '∅'} }`}
                    </td>
                    <td className="py-3 px-4 text-emerald-900 font-medium">
                      {`{ ${firstFollow.follow[nt]?.join(', ') || '∅'} }`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
