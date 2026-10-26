/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Grammar, ProductionRule } from '../types/grammar';
import { convertToCNF } from '../compiler/cnfConverter';
import {
  FileText,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Info,
  Check,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

interface CnfConverterViewProps {
  grammar: Grammar | null;
}

export const CnfConverterView: React.FC<CnfConverterViewProps> = ({ grammar }) => {
  const [activeStepTab, setActiveStepTab] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'stepper' | 'all'>('stepper');

  // Dynamically run CNF conversion on the current user-defined grammar
  const cnfData = useMemo(() => {
    if (!grammar || grammar.rules.length === 0) return null;
    return convertToCNF(grammar);
  }, [grammar]);

  // Validate that the resulting grammar strictly satisfies Chomsky Normal Form
  const cnfValidation = useMemo(() => {
    if (!cnfData || !cnfData.success || !cnfData.cnfGrammar) {
      return { isStrictCNF: false, violations: [] };
    }

    const { rules, startSymbol, nonTerminals } = cnfData.cnfGrammar;
    const ntSet = new Set(nonTerminals);
    const violations: string[] = [];

    for (const rule of rules) {
      if (rule.rhs.length === 0) {
        if (rule.lhs !== startSymbol) {
          violations.push(`Rule ${rule.raw} derives ε, but is not the start symbol (${startSymbol}).`);
        }
      } else if (rule.rhs.length === 1) {
        if (ntSet.has(rule.rhs[0])) {
          violations.push(`Rule ${rule.raw} is a unit production (RHS is a non-terminal).`);
        }
      } else if (rule.rhs.length === 2) {
        if (!ntSet.has(rule.rhs[0]) || !ntSet.has(rule.rhs[1])) {
          violations.push(`Rule ${rule.raw} has terminal symbols in a binary rule.`);
        }
      } else {
        violations.push(`Rule ${rule.raw} has length ${rule.rhs.length} (> 2).`);
      }
    }

    return {
      isStrictCNF: violations.length === 0,
      violations,
    };
  }, [cnfData]);

  if (!grammar || grammar.rules.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center space-y-3">
        <FileText className="w-10 h-10 text-slate-300 mx-auto" />
        <h3 className="text-base font-bold text-slate-700">No Grammar Defined</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Please enter your context-free production rules in the Grammar Editor first to inspect the step-by-step Chomsky Normal Form (CNF) conversion.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Chomsky Normal Form (CNF) Converter
            </h2>
            <p className="text-xs text-slate-500">
              Transform arbitrary context-free grammars into Chomsky Normal Form using the 5 formal reduction stages.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {cnfData?.success ? (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                CNF Conversion Succeeded ({cnfData.cnfGrammar?.rules.length} CNF rules)
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                CNF Conversion Failed
              </span>
            )}
          </div>
        </div>

        {/* Educational CNF Definition & Constraints Box */}
        <div className="bg-slate-50 rounded-lg p-3.5 text-xs text-slate-600 flex items-start gap-2.5 border border-slate-200">
          <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <strong className="text-slate-800">Formal Chomsky Normal Form (CNF) Constraints:</strong>
            <p className="leading-relaxed">
              In formal language theory, a context-free grammar is in CNF if every production rule satisfies one of the following forms:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 font-mono text-[11px]">
              <div className="bg-white p-2 rounded border border-slate-200 text-blue-800">
                <strong>1. Binary Rule:</strong> A → BC<br />
                <span className="text-slate-500 font-sans text-[10px]">Exactly two non-terminals</span>
              </div>
              <div className="bg-white p-2 rounded border border-slate-200 text-emerald-800">
                <strong>2. Terminal Rule:</strong> A → a<br />
                <span className="text-slate-500 font-sans text-[10px]">Exactly one terminal symbol</span>
              </div>
              <div className="bg-white p-2 rounded border border-slate-200 text-amber-800">
                <strong>3. Nullable Start:</strong> S₀ → ε<br />
                <span className="text-slate-500 font-sans text-[10px]">Only permitted if ε ∈ L(G)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grammar Before and After Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Original Grammar (Before Conversion) */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                Grammar Before Conversion (Original CFG)
              </h3>
            </div>
            <span className="text-xs font-mono text-slate-500">
              {grammar.rules.length} rule{grammar.rules.length !== 1 ? 's' : ''} · Start: {grammar.startSymbol}
            </span>
          </div>

          <div className="p-4 space-y-2 max-h-56 overflow-y-auto font-mono text-xs divide-y divide-slate-100">
            {grammar.rules.map(rule => (
              <div key={rule.id} className="py-1.5 flex items-center justify-between">
                <span className="text-slate-400 text-[11px]">{rule.id}</span>
                <span className="text-slate-800 font-medium">
                  <strong className="text-blue-700">{rule.lhs}</strong> -&gt;{' '}
                  {rule.rhs.length === 0 ? (
                    <span className="text-amber-600 font-bold">ε</span>
                  ) : (
                    rule.rhs.join(' ')
                  )}
                </span>
                <span className="text-[10px] text-slate-400 font-sans">
                  {rule.rhs.length === 0
                    ? 'epsilon'
                    : rule.rhs.length === 1
                    ? 'length 1'
                    : `length ${rule.rhs.length}`}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Resulting Grammar in CNF (After Conversion) */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="px-4 py-3 bg-emerald-50/70 border-b border-emerald-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <h3 className="text-xs font-bold text-emerald-950 uppercase tracking-wide">
                Resulting Grammar in Chomsky Normal Form (CNF)
              </h3>
            </div>
            {cnfValidation.isStrictCNF ? (
              <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Validated CNF
              </span>
            ) : (
              <span className="text-[11px] font-semibold text-rose-700 bg-white px-2 py-0.5 rounded border border-rose-200">
                Validation warning
              </span>
            )}
          </div>

          {cnfData?.cnfGrammar ? (
            <div className="p-4 space-y-2 max-h-56 overflow-y-auto font-mono text-xs divide-y divide-slate-100">
              {cnfData.cnfGrammar.rules.map(rule => (
                <div key={rule.id} className="py-1.5 flex items-center justify-between">
                  <span className="text-slate-400 text-[11px]">{rule.id}</span>
                  <span className="text-slate-800 font-medium">
                    <strong className="text-blue-700">{rule.lhs}</strong> -&gt;{' '}
                    {rule.rhs.length === 0 ? (
                      <span className="text-amber-600 font-bold">ε</span>
                    ) : (
                      rule.rhs.join(' ')
                    )}
                  </span>
                  <span className="text-[10px] text-slate-400 font-sans">
                    {rule.rhs.length === 1
                      ? 'A → a'
                      : rule.rhs.length === 2
                      ? 'A → BC'
                      : 'S₀ → ε'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-slate-400">
              {cnfData?.error || 'Conversion not completed.'}
            </div>
          )}
        </div>
      </div>

      {/* The 5 Transformation Stages */}
      {cnfData && cnfData.steps.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs space-y-0">
          <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                The 5 Transformation Stages of CNF Reduction
              </h3>
              <p className="text-xs text-slate-500">
                Inspect each algorithm stage to see rules added, eliminated, or substituted.
              </p>
            </div>

            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-xs">
              <button
                onClick={() => setViewMode('stepper')}
                className={`px-3 py-1 rounded-md font-medium cursor-pointer transition-colors ${
                  viewMode === 'stepper'
                    ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Stage by Stage
              </button>
              <button
                onClick={() => setViewMode('all')}
                className={`px-3 py-1 rounded-md font-medium cursor-pointer transition-colors ${
                  viewMode === 'all'
                    ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                View All 5 Stages
              </button>
            </div>
          </div>

          {/* Stepper Tabs if in stepper mode */}
          {viewMode === 'stepper' && (
            <div className="flex border-b border-slate-200 overflow-x-auto bg-slate-100/40">
              {cnfData.steps.map((step, idx) => (
                <button
                  key={step.stepNumber}
                  onClick={() => setActiveStepTab(idx)}
                  className={`px-4 py-2.5 text-xs font-medium whitespace-nowrap transition-colors border-b-2 cursor-pointer flex items-center gap-2 ${
                    activeStepTab === idx
                      ? 'border-blue-600 bg-white text-blue-700 font-bold'
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold ${
                      activeStepTab === idx
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {step.stepNumber}
                  </span>
                  <span>{step.title}</span>
                </button>
              ))}
            </div>
          )}

          {/* Stage Renderers */}
          <div className="divide-y divide-slate-100">
            {(viewMode === 'stepper'
              ? [cnfData.steps[activeStepTab]]
              : cnfData.steps
            ).map(step => {
              if (!step) return null;

              return (
                <div key={step.stepNumber} className="p-5 space-y-4">
                  {/* Stage Header */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-md bg-blue-100 text-blue-800 text-xs font-bold font-mono flex items-center justify-center">
                        {step.stepNumber}
                      </div>
                      <h4 className="text-sm font-bold text-slate-900">
                        Stage {step.stepNumber}: {step.title}
                      </h4>
                    </div>
                    <div className="text-xs font-mono text-slate-500 bg-slate-100 px-2.5 py-1 rounded">
                      Rules count: {step.rulesBeforeCount} →{' '}
                      <strong className="text-blue-700">{step.rulesAfterCount}</strong>
                    </div>
                  </div>

                  {/* Stage Explanation */}
                  <div className="bg-slate-50 p-3 rounded-lg text-xs text-slate-700 leading-relaxed border border-slate-200/80">
                    {step.description}
                  </div>

                  {/* Added / Removed Rules Panels */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                    {/* Rules Added or Modified */}
                    <div className="bg-emerald-50/70 border border-emerald-200 rounded-lg p-3 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-sans font-bold text-emerald-900 flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          Rules Added / Generated ({step.addedRules.length}):
                        </span>
                      </div>
                      {step.addedRules.length > 0 ? (
                        <div className="max-h-36 overflow-y-auto space-y-1 text-emerald-950">
                          {step.addedRules.map((r, i) => (
                            <div key={i} className="bg-white/80 px-2 py-0.5 rounded border border-emerald-100">
                              {r}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 font-sans text-xs italic block">
                          No new rules required in this stage.
                        </span>
                      )}
                    </div>

                    {/* Rules Eliminated */}
                    <div className="bg-rose-50/70 border border-rose-200 rounded-lg p-3 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-sans font-bold text-rose-900 flex items-center gap-1.5">
                          <span className="w-3.5 h-3.5 rounded-full bg-rose-200 text-rose-700 flex items-center justify-center text-[10px] font-bold">
                            ×
                          </span>
                          Rules Eliminated ({step.removedRules.length}):
                        </span>
                      </div>
                      {step.removedRules.length > 0 ? (
                        <div className="max-h-36 overflow-y-auto space-y-1 text-rose-950">
                          {step.removedRules.map((r, i) => (
                            <div key={i} className="bg-white/80 px-2 py-0.5 rounded border border-rose-100 line-through text-rose-800">
                              {r}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 font-sans text-xs italic block">
                          No rules eliminated in this stage.
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Compiler Theory Insights */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-600" />
          <h3 className="text-sm font-bold text-slate-900">
            Why Chomsky Normal Form Matters in Compiler Design
          </h3>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          Converting an arbitrary CFG to Chomsky Normal Form guarantees mathematical regularity:
        </p>
        <ul className="list-disc list-inside space-y-1 text-xs text-slate-600">
          <li>
            <strong>Strict Binary Parse Trees:</strong> Every internal derivation node has branching factor 2, which simplifies tree traversal and syntax analysis.
          </li>
          <li>
            <strong>Fixed Derivation Length:</strong> Any string of length <code className="font-mono text-blue-700">n</code> generated by a CNF grammar requires exactly <code className="font-mono text-blue-700">2n - 1</code> derivation steps (<code className="font-mono">n - 1</code> binary rule steps and <code className="font-mono">n</code> terminal substitutions).
          </li>
          <li>
            <strong>Decidability Guarantee:</strong> Because derivation step counts are strictly bounded, membership in <code className="font-mono text-blue-700">L(G)</code> is guaranteed to terminate.
          </li>
        </ul>
      </div>
    </div>
  );
};
