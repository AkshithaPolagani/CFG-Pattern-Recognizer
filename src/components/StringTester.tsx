/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Grammar,
  ParseResult,
} from '../types/grammar';
import {
  CheckCircle2,
  XCircle,
  Play,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ListTree,
  GitGraph,
  Clock,
  Layers,
  HelpCircle,
  AlertTriangle,
  Info,
  Code2,
} from 'lucide-react';

interface StringTesterProps {
  grammar: Grammar | null;
  grammarIsEmpty: boolean;
  grammarIsMalformed: boolean;
  grammarErrors: string[];
  inputString: string;
  setInputString: (val: string) => void;
  tokenMode: 'char' | 'word';
  parseResult: ParseResult | null;
  parseFeedback: { type: 'info' | 'error' | 'warning'; message: string } | null;
  onParse: () => void;
  onNavigateTab: (tab: 'editor' | 'll1-trace' | 'parse-tree' | 'cnf-converter') => void;
}

export const StringTester: React.FC<StringTesterProps> = ({
  grammar,
  grammarIsEmpty,
  grammarIsMalformed,
  grammarErrors,
  inputString,
  setInputString,
  tokenMode,
  parseResult,
  parseFeedback,
  onParse,
  onNavigateTab,
}) => {
  const handleSetEpsilon = () => {
    setInputString('ε');
  };

  return (
    <div className="space-y-6">
      {/* Test Input Control Box */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">String Pattern Recognizer</h2>
            <p className="text-xs text-slate-500">
              Test whether any input string belongs to the language <code className="text-blue-700 font-mono">L(G)</code> of your current grammar.
            </p>
          </div>

          {/* Engine indicator */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Engine: LL(1) Predictive Parser</span>
          </div>
        </div>

        {/* Input Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-slate-700">
              Input String to Test <span className="font-mono text-slate-400 font-normal">w ∈ Σ*</span>
            </label>
            {grammar && (
              <span className="text-xs text-slate-500 font-mono">
                Grammar: Start = <strong className="text-blue-700">{grammar.startSymbol}</strong>, Terminals = [{grammar.terminals.join(', ') || 'none'}]
              </span>
            )}
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={inputString}
                onChange={e => setInputString(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') onParse();
                }}
                placeholder={
                  grammarIsEmpty
                    ? 'Define your grammar first...'
                    : tokenMode === 'word'
                    ? 'Enter space-separated tokens (e.g. id + id)'
                    : 'Enter test string (e.g. aabb, ab, a) or click "Test ε"'
                }
                className="w-full px-4 py-3 text-base font-mono bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900"
              />
            </div>

            <button
              onClick={onParse}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg shadow-sm hover:shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              Parse String
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">Quick Inputs:</span>
            <button
              onClick={handleSetEpsilon}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 font-mono transition-colors cursor-pointer"
              title="Test empty string derivation against epsilon productions"
            >
              Test ε (Empty String)
            </button>
            <button
              onClick={() => setInputString('')}
              className="px-2.5 py-1 text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" /> Clear Input
            </button>
          </div>

          {grammar && grammar.rules.length > 0 && (
            <div className="text-xs text-slate-500">
              Testing against start symbol <strong className="font-mono text-blue-700">{grammar.startSymbol}</strong>
            </div>
          )}
        </div>
      </div>

      {/* Helpful Validation & Empty Feedback Banners */}
      {parseFeedback && (
        <div
          className={`rounded-xl border p-4 text-xs space-y-1.5 ${
            parseFeedback.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-900'
              : parseFeedback.type === 'warning'
              ? 'bg-amber-50 border-amber-200 text-amber-900'
              : 'bg-blue-50 border-blue-200 text-blue-900'
          }`}
        >
          <div className="flex items-center gap-2 font-bold text-sm">
            {parseFeedback.type === 'error' ? (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            ) : parseFeedback.type === 'warning' ? (
              <Info className="w-4 h-4 text-amber-600 shrink-0" />
            ) : (
              <Info className="w-4 h-4 text-blue-600 shrink-0" />
            )}
            <span>
              {parseFeedback.type === 'error'
                ? 'Parser Error'
                : parseFeedback.type === 'warning'
                ? 'Input Required'
                : 'Notice'}
            </span>
          </div>
          <p className="leading-relaxed pl-6">{parseFeedback.message}</p>
          {grammarIsEmpty && (
            <div className="pl-6 pt-1">
              <button
                onClick={() => onNavigateTab('editor')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 text-white rounded-md text-xs font-semibold cursor-pointer hover:bg-rose-700 transition-colors"
              >
                <Code2 className="w-3.5 h-3.5" />
                Go to Grammar Editor
              </button>
            </div>
          )}
        </div>
      )}

      {/* Neutral Guide Card when nothing is parsed yet and no feedback */}
      {!parseResult && !parseFeedback && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 text-center space-y-3 shadow-xs">
          {grammarIsEmpty ? (
            <>
              <Code2 className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">No Grammar Defined Yet</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Please enter your context-free production rules in the Grammar Editor, or click &quot;Load Preset CFG&quot; to begin testing strings.
              </p>
              <button
                onClick={() => onNavigateTab('editor')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold cursor-pointer hover:bg-blue-700 transition-colors"
              >
                Open Grammar Editor
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </>
          ) : grammarIsMalformed ? (
            <>
              <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto" />
              <h3 className="text-base font-bold text-rose-900">Grammar Syntax Error</h3>
              <p className="text-xs text-rose-700 max-w-md mx-auto">
                {grammarErrors[0] || 'Please fix the production rules in the Grammar Editor before parsing.'}
              </p>
              <button
                onClick={() => onNavigateTab('editor')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-lg text-xs font-semibold cursor-pointer hover:bg-rose-700 transition-colors"
              >
                Fix in Grammar Editor
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <>
              <Play className="w-10 h-10 text-blue-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">Ready to Parse</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Grammar is valid with {grammar?.rules.length} production{grammar?.rules.length !== 1 ? 's' : ''} and start symbol{' '}
                <strong className="text-blue-700 font-mono">{grammar?.startSymbol}</strong>.
                Enter an input string above and click <strong>Parse String</strong>.
              </p>
            </>
          )}
        </div>
      )}

      {/* Parse Result Evaluation Banner */}
      {parseResult && (
        <div
          className={`rounded-xl border p-6 shadow-xs transition-all ${
            parseResult.accepted
              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
              : 'bg-rose-50/70 border-rose-200 text-rose-950'
          }`}
        >
          {/* Header Row */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-current/15">
            <div className="flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                  parseResult.accepted
                    ? 'bg-emerald-600 text-white'
                    : 'bg-rose-600 text-white'
                }`}
              >
                {parseResult.accepted ? (
                  <CheckCircle2 className="w-7 h-7" />
                ) : (
                  <XCircle className="w-7 h-7" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold tracking-tight">
                    {!parseResult.isLL1
                      ? 'GRAMMAR NOT LL(1)'
                      : parseResult.accepted
                      ? 'STRING ACCEPTED'
                      : 'STRING REJECTED'}
                  </h3>
                  <span
                    className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                      !parseResult.isLL1
                        ? 'bg-amber-200/80 text-amber-900'
                        : parseResult.accepted
                        ? 'bg-emerald-200/80 text-emerald-900'
                        : 'bg-rose-200/80 text-rose-900'
                    }`}
                  >
                    {!parseResult.isLL1 ? 'CONFLICTS DETECTED' : parseResult.accepted ? 'w ∈ L(G) = TRUE' : 'w ∈ L(G) = FALSE'}
                  </span>
                </div>
                <p className="text-xs opacity-80 mt-0.5">
                  Algorithm: LL(1) Predictive Parser · Input:{' '}
                  <span className="font-mono font-bold">
                    {parseResult.tokens.length === 0 ? 'ε (empty string)' : `"${parseResult.input}"`}
                  </span>
                </p>
              </div>
            </div>

            {/* Performance & Token Metrics */}
            <div className="flex items-center gap-4 text-xs font-mono">
              <div className="flex items-center gap-1.5 opacity-80">
                <Clock className="w-4 h-4" />
                <span>{parseResult.executionTimeMs} ms</span>
              </div>
              <div className="flex items-center gap-1.5 opacity-80">
                <Layers className="w-4 h-4" />
                <span>{parseResult.tokens.length} token{parseResult.tokens.length !== 1 ? 's' : ''}</span>
              </div>
            </div>
          </div>

          {/* Explanation Text */}
          <div className="pt-4 space-y-3">
            <div className="text-sm font-medium leading-relaxed whitespace-pre-line">
              {parseResult.explanation}
            </div>

            {/* Detailed Failure Diagnostic if rejected */}
            {!parseResult.accepted && parseResult.failureInfo && (
              <div className="bg-white/80 border border-rose-200 rounded-lg p-3 text-xs space-y-1.5 text-slate-800">
                <div className="font-semibold text-rose-700 flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4" />
                  Parser Diagnostic Failure Analysis:
                </div>
                <div>
                  <span className="text-slate-500">Failed at index:</span>{' '}
                  <span className="font-mono font-bold">{parseResult.failureInfo.failedAtIndex}</span>
                </div>
                <div>
                  <span className="text-slate-500">Token encountered:</span>{' '}
                  <span className="font-mono font-bold text-rose-600">
                    &apos;{parseResult.failureInfo.unexpectedToken}&apos;
                  </span>
                </div>
                {parseResult.failureInfo.expectedTokens.length > 0 && (
                  <div>
                    <span className="text-slate-500">Expected continuation:</span>{' '}
                    <span className="font-mono text-blue-700">
                      [ {parseResult.failureInfo.expectedTokens.join(', ')} ]
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Derivation summary if accepted */}
            {parseResult.accepted && parseResult.leftmostDerivation && (
              <div className="bg-white/80 border border-emerald-200 rounded-lg p-3 text-xs space-y-1.5 text-slate-800">
                <div className="font-semibold text-emerald-800 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  Leftmost Derivation Preview:
                </div>
                <div className="font-mono text-xs overflow-x-auto whitespace-nowrap text-slate-900 py-1">
                  {parseResult.leftmostDerivation.join('  ⇒  ')}
                </div>
              </div>
            )}

            {/* Quick Navigation Buttons to Views */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => onNavigateTab('ll1-trace')}
                className="inline-flex items-center gap-2 px-3.5 py-2 bg-white text-slate-800 border border-slate-300 hover:bg-slate-50 rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
              >
                <GitGraph className="w-4 h-4 text-blue-600" />
                Inspect LL(1) Parsing Trace ({parseResult.parseSteps?.length || 0} steps)
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              {parseResult.accepted && (
                <button
                  onClick={() => onNavigateTab('parse-tree')}
                  className="inline-flex items-center gap-2 px-3.5 py-2 bg-white text-slate-800 border border-slate-300 hover:bg-slate-50 rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                >
                  <ListTree className="w-4 h-4 text-emerald-600" />
                  View Interactive Parse Tree
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                onClick={() => onNavigateTab('cnf-converter')}
                className="inline-flex items-center gap-2 px-3.5 py-2 bg-white text-slate-800 border border-slate-300 hover:bg-slate-50 rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
              >
                Inspect CNF Converter
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
