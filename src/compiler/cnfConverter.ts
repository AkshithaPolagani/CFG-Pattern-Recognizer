/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Grammar, ProductionRule } from '../types/grammar';

export interface CNFConversionStep {
  stepNumber: number;
  title: string;
  description: string;
  rulesBeforeCount: number;
  rulesAfterCount: number;
  addedRules: string[];
  removedRules: string[];
}

export interface CNFConversionResult {
  success: boolean;
  cnfGrammar?: Grammar;
  steps: CNFConversionStep[];
  error?: string;
  nullableSymbols: string[];
  unitPairs: Array<{ from: string; to: string }>;
}

/**
 * Converts any arbitrary Context-Free Grammar into Chomsky Normal Form (CNF)
 * with transparent tracking of every transformation step.
 */
export function convertToCNF(originalGrammar: Grammar): CNFConversionResult {
  const steps: CNFConversionStep[] = [];
  let currentRules: ProductionRule[] = originalGrammar.rules.map(r => ({ ...r }));
  const nonTerminals = new Set<string>(originalGrammar.nonTerminals);
  let ruleIdCounter = 1;

  const createRule = (lhs: string, rhs: string[]): ProductionRule => ({
    id: `CNF_R${ruleIdCounter++}`,
    lhs,
    rhs,
    raw: `${lhs} -> ${rhs.length === 0 ? 'ε' : rhs.join(' ')}`,
  });

  try {
    // ----------------------------------------------------
    // STEP 1: Add new start symbol S0 -> S
    // ----------------------------------------------------
    const oldStart = originalGrammar.startSymbol;
    const newStart = nonTerminals.has(`${oldStart}0`) ? `${oldStart}_START` : `${oldStart}0`;
    nonTerminals.add(newStart);

    const s0Rule = createRule(newStart, [oldStart]);
    const step1Before = currentRules.length;
    currentRules = [s0Rule, ...currentRules];

    steps.push({
      stepNumber: 1,
      title: 'Introduce New Start Symbol',
      description: `Created new start symbol ${newStart} and added rule ${newStart} -> ${oldStart} to ensure the start symbol never appears on the right-hand side.`,
      rulesBeforeCount: step1Before,
      rulesAfterCount: currentRules.length,
      addedRules: [s0Rule.raw],
      removedRules: [],
    });

    // ----------------------------------------------------
    // STEP 2: Eliminate Epsilon Productions (A -> ε)
    // ----------------------------------------------------
    // Find all nullable non-terminals: A derives ε
    const nullable = new Set<string>();
    let nullableChanged = true;

    while (nullableChanged) {
      nullableChanged = false;
      for (const rule of currentRules) {
        if (rule.rhs.length === 0) {
          if (!nullable.has(rule.lhs)) {
            nullable.add(rule.lhs);
            nullableChanged = true;
          }
        } else if (rule.rhs.every(sym => nullable.has(sym))) {
          if (!nullable.has(rule.lhs)) {
            nullable.add(rule.lhs);
            nullableChanged = true;
          }
        }
      }
    }

    const startDerivesEpsilon = nullable.has(newStart) || nullable.has(oldStart);

    // Generate expansions for rules containing nullable symbols
    const nonEpsilonRules: ProductionRule[] = [];
    const removedEps: string[] = [];
    const addedEpsExpansions: string[] = [];

    for (const rule of currentRules) {
      if (rule.rhs.length === 0) {
        removedEps.push(rule.raw);
        continue; // drop epsilon rule for now
      }

      // Check if RHS contains nullable symbols
      const nullablePositions: number[] = [];
      for (let i = 0; i < rule.rhs.length; i++) {
        if (nullable.has(rule.rhs[i])) {
          nullablePositions.push(i);
        }
      }

      if (nullablePositions.length === 0) {
        nonEpsilonRules.push(rule);
      } else {
        // Generate 2^k subsets of omissions
        const k = nullablePositions.length;
        const totalCombinations = 1 << k;
        const existingCombKeys = new Set<string>();

        for (let mask = 0; mask < totalCombinations; mask++) {
          const newRhs: string[] = [];
          let nullableIdx = 0;

          for (let pos = 0; pos < rule.rhs.length; pos++) {
            if (pos === nullablePositions[nullableIdx]) {
              const keep = (mask & (1 << nullableIdx)) !== 0;
              nullableIdx++;
              if (keep) {
                newRhs.push(rule.rhs[pos]);
              }
            } else {
              newRhs.push(rule.rhs[pos]);
            }
          }

          if (newRhs.length > 0) {
            const key = `${rule.lhs}->${newRhs.join(' ')}`;
            if (!existingCombKeys.has(key)) {
              existingCombKeys.add(key);
              const generatedRule = createRule(rule.lhs, newRhs);
              nonEpsilonRules.push(generatedRule);
              if (mask !== totalCombinations - 1) {
                addedEpsExpansions.push(generatedRule.raw);
              }
            }
          }
        }
      }
    }

    // If the start symbol was nullable, re-add S0 -> ε
    if (startDerivesEpsilon) {
      const startEps = createRule(newStart, []);
      nonEpsilonRules.push(startEps);
      addedEpsExpansions.push(startEps.raw);
    }

    const step2Before = currentRules.length;
    currentRules = nonEpsilonRules;

    steps.push({
      stepNumber: 2,
      title: 'Eliminate Epsilon (ε) Productions',
      description: `Identified nullable non-terminals: {${Array.from(nullable).join(
        ', '
      )}}. Expanded all combinations and removed ε-productions${
        startDerivesEpsilon ? ` (retained ${newStart} -> ε as start symbol derives ε)` : ''
      }.`,
      rulesBeforeCount: step2Before,
      rulesAfterCount: currentRules.length,
      addedRules: addedEpsExpansions.slice(0, 8),
      removedRules: removedEps,
    });

    // ----------------------------------------------------
    // STEP 3: Eliminate Unit Productions (A -> B)
    // ----------------------------------------------------
    // Build unit graph
    const unitPairs: Array<{ from: string; to: string }> = [];
    const allNTs = Array.from(nonTerminals);

    // Reflexive transitive closure of unit productions
    const unitClosure = new Map<string, Set<string>>();
    for (const nt of allNTs) {
      unitClosure.set(nt, new Set<string>([nt]));
    }

    for (const rule of currentRules) {
      if (rule.rhs.length === 1 && nonTerminals.has(rule.rhs[0])) {
        unitClosure.get(rule.lhs)?.add(rule.rhs[0]);
        unitPairs.push({ from: rule.lhs, to: rule.rhs[0] });
      }
    }

    // Warshall / Flooding for transitive closure
    let closureChanged = true;
    while (closureChanged) {
      closureChanged = false;
      for (const [a, setA] of unitClosure.entries()) {
        for (const b of Array.from(setA)) {
          const setB = unitClosure.get(b);
          if (setB) {
            for (const c of setB) {
              if (!setA.has(c)) {
                setA.add(c);
                closureChanged = true;
              }
            }
          }
        }
      }
    }

    // For every pair (A, B) where B != A and B -> γ (non-unit), add A -> γ
    const nonUnitRules: ProductionRule[] = [];
    const removedUnits: string[] = [];
    const addedFromUnits: string[] = [];

    // Separate non-unit rules
    const nonUnitByLhs = new Map<string, ProductionRule[]>();
    for (const rule of currentRules) {
      const isUnit = rule.rhs.length === 1 && nonTerminals.has(rule.rhs[0]);
      if (isUnit) {
        removedUnits.push(rule.raw);
      } else {
        if (!nonUnitByLhs.has(rule.lhs)) {
          nonUnitByLhs.set(rule.lhs, []);
        }
        nonUnitByLhs.get(rule.lhs)!.push(rule);
      }
    }

    const seenRuleSignatures = new Set<string>();

    for (const [a, reachableNTs] of unitClosure.entries()) {
      for (const b of reachableNTs) {
        const rulesOfB = nonUnitByLhs.get(b) || [];
        for (const r of rulesOfB) {
          const sig = `${a}->${r.rhs.join(' ')}`;
          if (!seenRuleSignatures.has(sig)) {
            seenRuleSignatures.add(sig);
            const copyRule = createRule(a, [...r.rhs]);
            nonUnitRules.push(copyRule);
            if (a !== b) {
              addedFromUnits.push(copyRule.raw);
            }
          }
        }
      }
    }

    const step3Before = currentRules.length;
    currentRules = nonUnitRules;

    steps.push({
      stepNumber: 3,
      title: 'Eliminate Unit Productions (A -> B)',
      description: `Identified unit pairs and substituted all reachable non-unit derivations into source non-terminals. Removed ${removedUnits.length} unit productions.`,
      rulesBeforeCount: step3Before,
      rulesAfterCount: currentRules.length,
      addedRules: addedFromUnits.slice(0, 8),
      removedRules: removedUnits,
    });

    // ----------------------------------------------------
    // STEP 4: Replace Terminals in Long Rules (Length >= 2)
    // ----------------------------------------------------
    // e.g. A -> a B  =>  A -> Ta B,  Ta -> a
    const terminalDummyMap = new Map<string, string>(); // 'a' -> 'T_a'
    const addedTerminalRules: ProductionRule[] = [];
    let termDummyCounter = 1;

    const getOrCreateTerminalNT = (term: string): string => {
      if (terminalDummyMap.has(term)) {
        return terminalDummyMap.get(term)!;
      }
      const dummyNT = `T_${term.replace(/[^a-zA-Z0-9]/g, '') || termDummyCounter++}`;
      nonTerminals.add(dummyNT);
      terminalDummyMap.set(term, dummyNT);

      const tRule = createRule(dummyNT, [term]);
      addedTerminalRules.push(tRule);
      return dummyNT;
    };

    const rulesAfterTermReplacement: ProductionRule[] = [];

    for (const rule of currentRules) {
      if (rule.rhs.length <= 1) {
        rulesAfterTermReplacement.push(rule);
      } else {
        const newRhs = rule.rhs.map(sym => {
          if (!nonTerminals.has(sym)) {
            return getOrCreateTerminalNT(sym);
          }
          return sym;
        });
        rulesAfterTermReplacement.push(createRule(rule.lhs, newRhs));
      }
    }

    rulesAfterTermReplacement.push(...addedTerminalRules);

    const step4Before = currentRules.length;
    currentRules = rulesAfterTermReplacement;

    steps.push({
      stepNumber: 4,
      title: 'Replace Terminals in Rules with Length ≥ 2',
      description: `Replaced terminals in multi-symbol rules with dedicated terminal non-terminals (${Array.from(
        terminalDummyMap.entries()
      )
        .map(([t, nt]) => `${nt} -> ${t}`)
        .join(', ')}).`,
      rulesBeforeCount: step4Before,
      rulesAfterCount: currentRules.length,
      addedRules: addedTerminalRules.map(r => r.raw),
      removedRules: [],
    });

    // ----------------------------------------------------
    // STEP 5: Break Down Long Productions (Length > 2)
    // ----------------------------------------------------
    // A -> B C D => A -> B C1, C1 -> C D
    const binaryRules: ProductionRule[] = [];
    const addedCascades: string[] = [];
    let cascadeCounter = 1;

    for (const rule of currentRules) {
      if (rule.rhs.length <= 2) {
        binaryRules.push(rule);
      } else {
        let prevLhs = rule.lhs;
        for (let i = 0; i < rule.rhs.length - 2; i++) {
          const cascadeNT = `C_${rule.lhs}_${cascadeCounter++}`;
          nonTerminals.add(cascadeNT);
          const r1 = createRule(prevLhs, [rule.rhs[i], cascadeNT]);
          binaryRules.push(r1);
          addedCascades.push(r1.raw);
          prevLhs = cascadeNT;
        }
        const lastRule = createRule(prevLhs, [
          rule.rhs[rule.rhs.length - 2],
          rule.rhs[rule.rhs.length - 1],
        ]);
        binaryRules.push(lastRule);
        addedCascades.push(lastRule.raw);
      }
    }

    const step5Before = currentRules.length;
    currentRules = binaryRules;

    steps.push({
      stepNumber: 5,
      title: 'Decompose Productions into Binary Form',
      description: `Split all productions with length > 2 into binary chains of length 2 using helper non-terminals. Every rule now adheres to A -> BC or A -> a.`,
      rulesBeforeCount: step5Before,
      rulesAfterCount: currentRules.length,
      addedRules: addedCascades.slice(0, 10),
      removedRules: [],
    });

    const cnfGrammar: Grammar = {
      rules: currentRules,
      startSymbol: newStart,
      nonTerminals: Array.from(nonTerminals),
      terminals: originalGrammar.terminals,
    };

    return {
      success: true,
      cnfGrammar,
      steps,
      nullableSymbols: Array.from(nullable),
      unitPairs,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      steps,
      error: `Chomsky Normal Form conversion failed: ${errorMsg}. Earley parsing can still be used directly on the original grammar.`,
      nullableSymbols: [],
      unitPairs: [],
    };
  }
}
