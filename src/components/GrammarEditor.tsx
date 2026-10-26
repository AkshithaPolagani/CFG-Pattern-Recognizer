/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  GrammarPreset,
  GrammarValidationResult,
} from '../types/grammar';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Sparkles,
  RotateCcw,
  BookOpen,
  Info,
  X,
  ArrowRight,
} from 'lucide-react';
import { GRAMMAR_PRESETS } from '../compiler/presetsAndTests';

interface GrammarEditorProps {
  grammarText: string;
  setGrammarText: (text: string) => void;
  startSymbol: string;
  setStartSymbol: (sym: string) => void;
  tokenMode: 'char' | 'word';
  setTokenMode: (mode: 'char' | 'word') => void;
  validation: GrammarValidationResult;
  onLoadPreset: (preset: GrammarPreset) => void;
  onClearEditor: () => void;
}

export const GrammarEditor: React.FC<GrammarEditorProps> = ({
  grammarText,
  setGrammarText,
  startSymbol,
  setStartSymbol,
  tokenMode,
  setTokenMode,
  validation,
  onLoadPreset,
  onClearEditor,
}) => {
  const [showPresetsModal, setShowPresetsModal] = useState(false);
  const lineCount = grammarText.split('\n').filter(l => l.trim().length > 0).length;

  const insertSymbol = (sym: string) => {
    setGrammarText(grammarText + (grammarText.endsWith(' ') || grammarText.endsWith('\n') || grammarText === '' ? '' : ' ') + sym);
  };

  const formatGrammar = () => {
    const formatted = grammarText
      .split('\n')
      .map(line => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('#')) return line;
        const match = trimmed.match(/^([^\s\-→:]+)\s*(?:->|→|::=)\s*(.*)$/);
        if (!match) return line;
        const lhs = match[1].trim();
        const alts = match[2]
          .split('|')
          .map(a => a.trim())
          .join(' | ');
        return `${lhs} -> ${alts}`;
      })
      .join('\n');
    setGrammarText(formatted);
  };

  const { isValid, isEmpty, errors, warnings, grammar } = validation;
  const autoStartSymbol = grammar?.rules[0]?.lhs || '';
  const effectiveStartSymbol = startSymbol || autoStartSymbol;

  return (
    <div className="space-y-6">
      {/* Top Banner / Controls */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Context-Free Grammar Definition</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter your context-free production rules one per line (e.g.{' '}
              <code className="bg-slate-100 px-1 py-0.5 rounded text-blue-700 font-mono">S -&gt; aSb | epsilon</code> or{' '}
              <code className="bg-slate-100 px-1 py-0.5 rounded text-blue-700 font-mono">S -&gt; AB</code>).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPresetsModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-slate-600" />
              Load Preset CFG
            </button>
            <button
              onClick={formatGrammar}
              disabled={grammarText.trim().length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors cursor-pointer"
              title="Align arrows and normalize spacing"
            >
              <Sparkles className="w-4 h-4 text-blue-600" />
              Format Rules
            </button>
            <button
              onClick={onClearEditor}
              disabled={grammarText.trim().length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors cursor-pointer"
              title="Clear all rules in editor"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Clear Editor
            </button>
          </div>
        </div>

        {/* Configuration Row: Start Symbol & Token Mode */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Start Symbol <span className="font-mono text-slate-400 font-normal">S ∈ V_N</span>
            </label>
            <div className="flex items-center gap-2">
              <select
                value={startSymbol}
                onChange={e => setStartSymbol(e.target.value)}
                className="flex-1 px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">
                  {autoStartSymbol ? `Auto: First Rule LHS ("${autoStartSymbol}")` : 'Auto (First rule left-hand side)'}
                </option>
                {grammar &&
                  grammar.nonTerminals.map(nt => (
                    <option key={nt} value={nt}>
                      {nt} {nt === autoStartSymbol ? '(First Rule LHS)' : ''}
                    </option>
                  ))}
              </select>
              <span className="text-xs text-slate-500 whitespace-nowrap">
                Effective: <strong className="font-mono text-blue-700">{effectiveStartSymbol || 'None'}</strong>
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Tokenization Mode
            </label>
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
              <button
                type="button"
                onClick={() => setTokenMode('char')}
                className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
                  tokenMode === 'char'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Character Mode (e.g. &apos;aabb&apos;)
              </button>
              <button
                type="button"
                onClick={() => setTokenMode('word')}
                className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
                  tokenMode === 'word'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Token/Word Mode (e.g. &apos;id + id&apos;)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Editor & Symbol Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        {/* Editor Toolbar with Quick Symbol Inserts */}
        <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
            <span>Quick Inserts:</span>
            <button
              onClick={() => insertSymbol('->')}
              className="px-2 py-1 bg-white border border-slate-200 hover:border-slate-300 rounded font-mono text-xs text-slate-800 shadow-2xs hover:bg-slate-50 cursor-pointer"
            >
              -&gt;
            </button>
            <button
              onClick={() => insertSymbol('|')}
              className="px-2 py-1 bg-white border border-slate-200 hover:border-slate-300 rounded font-mono text-xs text-slate-800 shadow-2xs hover:bg-slate-50 cursor-pointer"
            >
              |
            </button>
            <button
              onClick={() => insertSymbol('epsilon')}
              className="px-2 py-1 bg-white border border-slate-200 hover:border-slate-300 rounded font-mono text-xs text-blue-700 shadow-2xs hover:bg-blue-50 cursor-pointer"
              title="Insert epsilon / empty string symbol"
            >
              epsilon
            </button>
            <button
              onClick={() => insertSymbol('ε')}
              className="px-2 py-1 bg-white border border-slate-200 hover:border-slate-300 rounded font-mono text-xs text-blue-700 shadow-2xs hover:bg-blue-50 cursor-pointer"
            >
              ε
            </button>
          </div>

          <div className="text-xs text-slate-400 font-mono">
            {lineCount} rule line{lineCount !== 1 ? 's' : ''} · Comments start with //
          </div>
        </div>

        {/* Text Area */}
        <div className="relative">
          <textarea
            value={grammarText}
            onChange={e => setGrammarText(e.target.value)}
            rows={Math.max(7, Math.min(16, grammarText.split('\n').length + 2))}
            spellCheck={false}
            className="w-full p-4 font-mono text-sm leading-relaxed text-slate-900 bg-white resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
            placeholder={`// Enter your production rules here, one per line.\n// Examples of user input:\n// S -> aSb | epsilon\n// A -> aA | b\n// S -> AB\n// (Or click "Load Preset CFG" above to load a classic grammar)`}
          />
        </div>

        {/* Validation Status Bar */}
        <div
          className={`px-4 py-3 border-t text-xs flex items-center justify-between ${
            isEmpty
              ? 'bg-slate-50 border-slate-200 text-slate-600'
              : isValid
              ? 'bg-emerald-50/60 border-emerald-100 text-emerald-800'
              : 'bg-rose-50/80 border-rose-100 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {isEmpty ? (
              <>
                <Info className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Editor is empty. Enter your grammar rules above, or click &quot;Load Preset CFG&quot;.</span>
              </>
            ) : isValid ? (
              <>
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold">Grammar is formally valid</span>
                <span className="text-emerald-700/80">
                  · {grammar?.rules.length} production{grammar?.rules.length !== 1 ? 's' : ''} parsed
                </span>
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span className="font-semibold">Grammar syntax error detected</span>
              </>
            )}
          </div>

          {isValid && grammar && (
            <div className="hidden sm:flex items-center gap-3 font-mono text-[11px] text-emerald-800">
              <span>V_N = {grammar.nonTerminals.length}</span>
              <span>Σ = {grammar.terminals.length}</span>
            </div>
          )}
        </div>
      </div>

      {/* Syntax Error Box (Only shown if NOT empty and has real errors) */}
      {!isEmpty && errors.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-rose-900 font-semibold text-sm">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            Grammar Syntax Issues Found
          </div>
          <ul className="list-disc list-inside space-y-1 text-xs text-rose-800">
            {errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Warnings Displays */}
      {warnings.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-amber-900 font-semibold text-sm">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            Grammar Diagnostics & Warnings
          </div>
          <ul className="list-disc list-inside space-y-1 text-xs text-amber-800">
            {warnings.map((warn, i) => (
              <li key={i}>{warn}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Formal CFG 4-Tuple Specification Card */}
      {isValid && grammar && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">
              Formal CFG 4-Tuple Specification: <code className="text-blue-700">G = (V_N, Σ, P, S)</code>
            </h3>
            <span className="text-xs text-slate-500 font-mono">Chomsky Type 2</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div className="bg-white p-3 rounded-lg border border-slate-200">
              <span className="font-semibold text-slate-500 block mb-1">
                Non-Terminals (V_N):
              </span>
              <div className="font-mono text-blue-700 font-medium break-words">
                {`{ ${grammar.nonTerminals.join(', ')} }`}
              </div>
            </div>

            <div className="bg-white p-3 rounded-lg border border-slate-200">
              <span className="font-semibold text-slate-500 block mb-1">
                Terminals (Σ):
              </span>
              <div className="font-mono text-emerald-700 font-medium break-words">
                {grammar.terminals.length > 0
                  ? `{ ${grammar.terminals.join(', ')} }`
                  : '{ ∅ (None) }'}
              </div>
            </div>

            <div className="bg-white p-3 rounded-lg border border-slate-200">
              <span className="font-semibold text-slate-500 block mb-1">
                Start Symbol (S):
              </span>
              <div className="font-mono text-purple-700 font-bold">
                {effectiveStartSymbol}
              </div>
            </div>

            <div className="bg-white p-3 rounded-lg border border-slate-200">
              <span className="font-semibold text-slate-500 block mb-1">
                Productions (|P|):
              </span>
              <div className="font-mono text-slate-800 font-medium">
                {grammar.rules.length} total production rules
              </div>
            </div>
          </div>

          {/* Rules Preview Table */}
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            <div className="px-3 py-2 bg-slate-100/60 border-b border-slate-200 text-xs font-semibold text-slate-600">
              Parsed Production Rules
            </div>
            <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto font-mono text-xs">
              {grammar.rules.map(rule => (
                <div key={rule.id} className="px-3 py-1.5 flex items-center justify-between hover:bg-slate-50">
                  <span className="text-slate-400 text-[11px]">{rule.id}</span>
                  <span className="text-slate-800 font-medium">
                    <strong className="text-blue-700">{rule.lhs}</strong> -&gt;{' '}
                    {rule.rhs.length === 0 ? (
                      <span className="text-amber-600 font-bold">ε (epsilon)</span>
                    ) : (
                      rule.rhs.map((sym, idx) => (
                        <span
                          key={idx}
                          className={
                            grammar.nonTerminals.includes(sym)
                              ? 'text-blue-700 font-bold'
                              : 'text-emerald-700'
                          }
                        >
                          {sym}{' '}
                        </span>
                      ))
                    )}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {rule.rhs.length === 0 ? 'nullable' : `${rule.rhs.length} symbol${rule.rhs.length > 1 ? 's' : ''}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Optional Preset Selector Modal */}
      {showPresetsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl border border-slate-200 max-w-2xl w-full max-h-[85vh] flex flex-col shadow-xl">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Load Example Preset Grammar</h3>
                <p className="text-xs text-slate-500">
                  Select a classic formal grammar to insert into your editor. You can edit or replace it freely.
                </p>
              </div>
              <button
                onClick={() => setShowPresetsModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-3 overflow-y-auto flex-1">
              {GRAMMAR_PRESETS.map(preset => (
                <div
                  key={preset.id}
                  className="p-3 border border-slate-200 rounded-lg hover:border-blue-400 hover:bg-blue-50/30 transition-all flex items-start justify-between gap-4"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900">{preset.title}</h4>
                      <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                        {preset.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">{preset.description}</p>
                    <div className="bg-slate-900 text-slate-200 p-2 rounded font-mono text-xs mt-1">
                      <pre>{preset.grammarText}</pre>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      onLoadPreset(preset);
                      setShowPresetsModal(false);
                    }}
                    className="shrink-0 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>Insert</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="p-3 border-t border-slate-200 text-right">
              <button
                onClick={() => setShowPresetsModal(false)}
                className="px-4 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
