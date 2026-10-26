/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { TestCaseResult } from '../types/grammar';
import { runAutomatedTestSuite } from '../compiler/presetsAndTests';
import {
  CheckCircle2,
  XCircle,
  Play,
  RotateCcw,
  Clock,
  Sparkles,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';

interface TestSuiteViewProps {
  onLoadTestCase: (grammarText: string, startSymbol: string, input: string) => void;
}

export const TestSuiteView: React.FC<TestSuiteViewProps> = ({ onLoadTestCase }) => {
  const [results, setResults] = useState<TestCaseResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [filter, setFilter] = useState<'all' | 'passed' | 'failed'>('all');

  const executeTests = () => {
    setIsRunning(true);
    setTimeout(() => {
      const res = runAutomatedTestSuite();
      setResults(res);
      setIsRunning(false);
    }, 50);
  };

  useEffect(() => {
    // Run tests automatically on mount
    executeTests();
  }, []);

  const total = results.length;
  const passedCount = results.filter(r => r.passed).length;
  const failedCount = total - passedCount;
  const totalDuration = results.reduce((acc, r) => acc + r.executionTimeMs, 0);

  const filteredResults = results.filter(r => {
    if (filter === 'passed') return r.passed;
    if (filter === 'failed') return !r.passed;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Automated Compiler Unit Test Suite
            </h2>
            <p className="text-xs text-slate-500">
              Formal verification test suite checking arbitrary CFGs, epsilon productions, rejection boundaries, and precedence.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={executeTests}
              disabled={isRunning}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer disabled:cursor-not-allowed transition-colors"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              {isRunning ? 'Running Verification...' : 'Run All Tests'}
            </button>
          </div>
        </div>

        {/* Metrics Overview Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
            <span className="text-slate-500 block mb-1">Total Unit Tests</span>
            <div className="text-lg font-bold font-mono text-slate-900">{total}</div>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
            <span className="text-emerald-800 block mb-1">Passed Tests</span>
            <div className="text-lg font-bold font-mono text-emerald-700">
              {passedCount} / {total}
            </div>
          </div>

          <div className={`rounded-lg p-3 border ${failedCount > 0 ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-slate-200'}`}>
            <span className={`block mb-1 ${failedCount > 0 ? 'text-rose-800' : 'text-slate-500'}`}>
              Failed Tests
            </span>
            <div className={`text-lg font-bold font-mono ${failedCount > 0 ? 'text-rose-700' : 'text-slate-700'}`}>
              {failedCount}
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
            <span className="text-slate-500 block mb-1">Total Engine Time</span>
            <div className="text-lg font-bold font-mono text-blue-700">
              {totalDuration.toFixed(2)} ms
            </div>
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-md font-medium cursor-pointer transition-colors ${
                filter === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Tests ({total})
            </button>
            <button
              onClick={() => setFilter('passed')}
              className={`px-3 py-1 rounded-md font-medium cursor-pointer transition-colors ${
                filter === 'passed'
                  ? 'bg-white text-emerald-800 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Passed ({passedCount})
            </button>
            <button
              onClick={() => setFilter('failed')}
              className={`px-3 py-1 rounded-md font-medium cursor-pointer transition-colors ${
                filter === 'failed'
                  ? 'bg-white text-rose-800 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Failed ({failedCount})
            </button>
          </div>

          <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
            <ShieldCheck className="w-4 h-4" />
            <span>Deterministic formal parser verification</span>
          </div>
        </div>
      </div>

      {/* Tests Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold font-mono text-[11px]">
                <th className="py-2.5 px-4 w-12 text-center">Status</th>
                <th className="py-2.5 px-4">Test Case &amp; Grammar</th>
                <th className="py-2.5 px-4 w-32">Input String</th>
                <th className="py-2.5 px-4 w-28">Expected</th>
                <th className="py-2.5 px-4 w-28">Actual</th>
                <th className="py-2.5 px-4 w-20 text-right">Time</th>
                <th className="py-2.5 px-4 w-24 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {filteredResults.map((tc, idx) => (
                <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 text-center">
                    {tc.passed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-600 mx-auto" />
                    )}
                  </td>

                  <td className="py-3 px-4">
                    <div className="font-sans font-bold text-slate-900 text-xs">{tc.name}</div>
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5 truncate max-w-sm">
                      {tc.grammarText}
                    </div>
                  </td>

                  <td className="py-3 px-4 font-bold text-slate-800">
                    {tc.input === '' ? (
                      <span className="text-amber-700 font-mono">ε (empty)</span>
                    ) : (
                      `"${tc.input}"`
                    )}
                  </td>

                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        tc.expectedAccepted
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-rose-50 text-rose-800 border border-rose-200'
                      }`}
                    >
                      {tc.expectedAccepted ? 'ACCEPTED' : 'REJECTED'}
                    </span>
                  </td>

                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        tc.actualAccepted
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-rose-50 text-rose-800 border border-rose-200'
                      }`}
                    >
                      {tc.actualAccepted ? 'ACCEPTED' : 'REJECTED'}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-right text-slate-500 text-[11px]">
                    {tc.executionTimeMs} ms
                  </td>

                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => onLoadTestCase(tc.grammarText, tc.startSymbol, tc.input)}
                      className="px-2 py-1 text-[11px] text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors font-sans font-medium cursor-pointer"
                      title="Load this test case into the Grammar Editor & Pattern Recognizer"
                    >
                      Load Case
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
