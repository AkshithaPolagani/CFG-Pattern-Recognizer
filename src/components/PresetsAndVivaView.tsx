/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { GrammarPreset } from '../types/grammar';
import { GRAMMAR_PRESETS } from '../compiler/presetsAndTests';
import {
  BookOpen,
  ArrowRight,
  HelpCircle,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface PresetsAndVivaViewProps {
  onLoadPreset: (preset: GrammarPreset) => void;
}

export const PresetsAndVivaView: React.FC<PresetsAndVivaViewProps> = ({ onLoadPreset }) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  const categories = ['all', 'Classic Formal Languages', 'Compiler Design', 'Programming Languages', 'Elementary Grammars'];

  const filteredPresets =
    activeCategory === 'all'
      ? GRAMMAR_PRESETS
      : GRAMMAR_PRESETS.filter(p => p.category === activeCategory);

  const vivaQuestions = [
    {
      q: 'What is a Context-Free Grammar (CFG) formally?',
      a: 'A Context-Free Grammar is formally defined as a 4-tuple G = (V_N, Σ, P, S), where V_N is a finite set of non-terminals, Σ is a finite set of terminals disjoint from V_N, P is a set of production rules of the form A -> α where A ∈ V_N and α ∈ (V_N ∪ Σ)*, and S ∈ V_N is the designated start symbol.',
    },
    {
      q: 'Why can general CFGs not always be parsed using LL(1) parsers?',
      a: 'LL(1) parsers are deterministic top-down predictive parsers that use 1 token of lookahead. They require that the parsing table M[A, a] contains at most one production per cell. Grammars with left recursion (e.g., A -> A α), common prefixes, or overlapping FIRST/FOLLOW sets create table conflicts and are not LL(1).',
    },
    {
      q: 'How does the LL(1) Predictive Parsing algorithm work?',
      a: 'LL(1) parsing utilizes a stack initialized with [$ S] and an input buffer ending in $. At each step: 1. If stack top X is a terminal matching the current lookahead a, both are matched and consumed. 2. If X is a non-terminal, the parser consults the predictive parsing table M[X, a]; if an entry A -> α exists, X is popped and α is pushed onto the stack in reverse order. 3. If M[X, a] is empty, a syntax error occurs. Input is accepted when stack top is $ and remaining input is $.',
    },
    {
      q: 'What are FIRST and FOLLOW sets in LL(1) parser construction?',
      a: 'FIRST(α) is the set of terminals that can appear as the first symbol of a string derived from α (including ε if α can derive ε). FOLLOW(A) is the set of terminals that can appear immediately to the right of non-terminal A in some sentential form, plus $ if A can appear at the end of a derivation. The LL(1) table places A -> α in M[A, a] for all a in FIRST(α), and in M[A, b] for all b in FOLLOW(A) if ε in FIRST(α).',
    },
    {
      q: 'What is Chomsky Normal Form (CNF) and what are its five transformation stages?',
      a: 'A context-free grammar is in CNF if every production rule has the form A -> BC (two non-terminals), A -> a (single terminal), or S0 -> ε (if the language includes the empty string). The conversion follows 5 formal stages: 1. Introduce a new start symbol (S0 -> S), 2. Eliminate epsilon productions (nullable expansions), 3. Eliminate unit productions (A -> B), 4. Replace terminals in longer productions (Ta -> a), and 5. Decompose productions of length > 2 into binary cascades.',
    },
    {
      q: 'What is grammar ambiguity and how does it affect LL(1) parsing?',
      a: 'A grammar is ambiguous if there exists at least one string in its language that possesses two or more distinct parse trees (or leftmost derivations). Ambiguous grammars can NEVER be LL(1) because ambiguity inevitably leads to multiple derivation choices for the same lookahead, resulting in table conflicts in M[A, a].',
    },
    {
      q: 'How are ε (epsilon / empty string) transitions processed in LL(1) parsing?',
      a: 'When a non-terminal A derives ε (A -> ε), that production is placed into the parsing table cell M[A, b] for every terminal b in FOLLOW(A), including $ if $ in FOLLOW(A). During parsing, encountering this table entry pops A from the stack without pushing any symbols, successfully deriving the empty string without consuming the lookahead token.',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Preset Grammars &amp; Compiler Viva Guide
            </h2>
            <p className="text-xs text-slate-500">
              Curated benchmark grammars for formal language demonstration and compiler design oral examination preparation.
            </p>
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg text-xs">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-md font-medium capitalize transition-colors cursor-pointer ${
                  activeCategory === cat
                    ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {cat === 'all' ? 'All Grammars' : cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Preset Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredPresets.map(preset => (
          <div
            key={preset.id}
            className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-blue-300 hover:shadow-sm transition-all"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                  {preset.category}
                </span>
                <span className="text-xs font-mono text-slate-400">
                  Start: {preset.startSymbol}
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900">{preset.title}</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {preset.description}
                </p>
              </div>

              {/* Grammar Text Box */}
              <div className="bg-slate-900 text-slate-200 p-3 rounded-lg font-mono text-xs overflow-x-auto">
                <pre>{preset.grammarText}</pre>
              </div>

              {/* Sample test preview */}
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-slate-600 block">
                  Sample Inputs:
                </span>
                <div className="flex flex-wrap gap-1">
                  {preset.sampleInputs.slice(0, 4).map((s, idx) => (
                    <span
                      key={idx}
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                        s.shouldAccept
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                          : 'bg-rose-50 border-rose-200 text-rose-800'
                      }`}
                    >
                      {s.input === '' ? 'ε' : s.input} {s.shouldAccept ? '✓' : '✗'}
                    </span>
                  ))}
                  {preset.sampleInputs.length > 4 && (
                    <span className="text-[10px] text-slate-400 self-center">
                      +{preset.sampleInputs.length - 4} more
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Load Button */}
            <div className="pt-4 mt-3 border-t border-slate-100">
              <button
                onClick={() => onLoadPreset(preset)}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-800 rounded-lg text-xs font-semibold transition-all cursor-pointer group"
              >
                <span>Load This Grammar</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* College Viva Q&A Guide */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <BookOpen className="w-5 h-5 text-blue-600" />
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Compiler Design Project Viva Examination Guide
            </h3>
            <p className="text-xs text-slate-500">
              Key questions commonly asked by external examiners and professors during project viva presentations.
            </p>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {vivaQuestions.map((item, idx) => {
            const isExpanded = expandedFaq === idx;
            return (
              <div key={idx} className="py-3">
                <button
                  onClick={() => setExpandedFaq(isExpanded ? null : idx)}
                  className="w-full flex items-center justify-between text-left text-xs font-semibold text-slate-800 hover:text-blue-600 transition-colors cursor-pointer py-1"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-blue-600 font-mono font-bold">Q{idx + 1}.</span>
                    <span>{item.q}</span>
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                </button>
                {isExpanded && (
                  <div className="mt-2 text-xs text-slate-600 leading-relaxed pl-6 border-l-2 border-blue-500 bg-blue-50/30 p-2.5 rounded-r">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
