/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GrammarPreset, TestCaseResult } from '../types/grammar';
import { parseGrammar } from './grammarParser';
import { parseLL1 } from './ll1Parser';

export const GRAMMAR_PRESETS: GrammarPreset[] = [
  {
    id: 'an-bn',
    title: 'Language aⁿ bⁿ (n ≥ 0)',
    category: 'Classic Formal Languages',
    description: 'Textbook LL(1) grammar for matched a and b. FIRST(S)={a, ε}, FOLLOW(S)={b, $}. Disjoint sets with zero conflicts.',
    grammarText: `S -> aSb | epsilon`,
    startSymbol: 'S',
    tokenMode: 'char',
    isLL1: true,
    sampleInputs: [
      { input: '', shouldAccept: true, label: 'ε (empty string)' },
      { input: 'ab', shouldAccept: true, label: 'ab (n=1)' },
      { input: 'aabb', shouldAccept: true, label: 'aabb (n=2)' },
      { input: 'aaabbb', shouldAccept: true, label: 'aaabbb (n=3)' },
      { input: 'aab', shouldAccept: false, label: 'aab (unequal a/b)' },
      { input: 'abab', shouldAccept: false, label: 'abab (interleaved)' },
      { input: 'bbaa', shouldAccept: false, label: 'bbaa (reversed order)' },
    ],
  },
  {
    id: 'single-terminal',
    title: 'Single Terminal & Simple Base',
    category: 'Elementary Grammars',
    description: 'Elementary base grammar deriving single terminal characters. FIRST(S)={a}, FOLLOW(S)={$}.',
    grammarText: `S -> a`,
    startSymbol: 'S',
    tokenMode: 'char',
    isLL1: true,
    sampleInputs: [
      { input: 'a', shouldAccept: true, label: 'a (exact terminal)' },
      { input: 'b', shouldAccept: false, label: 'b (wrong terminal)' },
      { input: '', shouldAccept: false, label: 'ε (not nullable)' },
      { input: 'aa', shouldAccept: false, label: 'aa (too long)' },
    ],
  },
  {
    id: 'sequence-grammar',
    title: 'Sequence Production (S -> AB)',
    category: 'Elementary Grammars',
    description: 'LL(1) rule chaining non-terminals into sequence. S -> AB, A -> a, B -> b.',
    grammarText: `S -> AB
A -> a
B -> b`,
    startSymbol: 'S',
    tokenMode: 'char',
    isLL1: true,
    sampleInputs: [
      { input: 'ab', shouldAccept: true, label: 'ab (exact sequence)' },
      { input: 'a', shouldAccept: false, label: 'a (missing B)' },
      { input: 'b', shouldAccept: false, label: 'b (missing A)' },
      { input: 'ba', shouldAccept: false, label: 'ba (wrong order)' },
    ],
  },
  {
    id: 'multiple-alternatives',
    title: 'Multiple Disjoint Alternatives',
    category: 'Elementary Grammars',
    description: 'Rules with pairwise disjoint FIRST sets: FIRST(aS)={a}, FIRST(bS)={b}, FIRST(c)={c}.',
    grammarText: `S -> aS | bS | c`,
    startSymbol: 'S',
    tokenMode: 'char',
    isLL1: true,
    sampleInputs: [
      { input: 'c', shouldAccept: true, label: 'c (base case)' },
      { input: 'ac', shouldAccept: true, label: 'ac' },
      { input: 'bc', shouldAccept: true, label: 'bc' },
      { input: 'aabc', shouldAccept: true, label: 'aabc' },
      { input: 'b', shouldAccept: false, label: 'b without c suffix' },
      { input: 'ab', shouldAccept: false, label: 'ab' },
      { input: '', shouldAccept: false, label: 'ε (no epsilon rule)' },
    ],
  },
  {
    id: 'balanced-parens',
    title: 'Balanced Parentheses (Dyck Language)',
    category: 'Programming Languages',
    description: 'Textbook LL(1) bracket grammar. FIRST((S)S)={(}, FOLLOW(S)={), $}. No table conflicts.',
    grammarText: `S -> (S)S | epsilon`,
    startSymbol: 'S',
    tokenMode: 'char',
    isLL1: true,
    sampleInputs: [
      { input: '', shouldAccept: true, label: 'ε (empty)' },
      { input: '()', shouldAccept: true, label: '()' },
      { input: '(())', shouldAccept: true, label: '(())' },
      { input: '()()', shouldAccept: true, label: '()()' },
      { input: '(()())', shouldAccept: true, label: '(()())' },
      { input: '(()', shouldAccept: false, label: '(() (unclosed)' },
      { input: ')(', shouldAccept: false, label: ')( (reversed)' },
      { input: '(()))', shouldAccept: false, label: '(())) (extra close)' },
    ],
  },
  {
    id: 'll1-arithmetic-expressions',
    title: 'LL(1) Arithmetic Expressions (Left-Factored)',
    category: 'Compiler Design',
    description: 'Standard syllabus LL(1) expression grammar with left recursion eliminated. Uses helper non-terminals E′ and T′.',
    grammarText: `E -> T E'
E' -> + T E' | epsilon
T -> F T'
T' -> * F T' | epsilon
F -> ( E ) | a | b`,
    startSymbol: 'E',
    tokenMode: 'char',
    isLL1: true,
    sampleInputs: [
      { input: 'a+b*a', shouldAccept: true, label: 'a+b*a (precedence check)' },
      { input: '(a+b)*a', shouldAccept: true, label: '(a+b)*a (parenthesized)' },
      { input: 'a*b+a', shouldAccept: true, label: 'a*b+a' },
      { input: 'a', shouldAccept: true, label: 'a' },
      { input: 'a+', shouldAccept: false, label: 'a+ (trailing operator)' },
      { input: 'a+*b', shouldAccept: false, label: 'a+*b (adjacent operators)' },
    ],
  },
  {
    id: 'left-recursive-expressions',
    title: 'Left-Recursive Expression (Non-LL(1) Conflict)',
    category: 'Compiler Design',
    description: 'Classic non-LL(1) grammar containing direct left recursion. The parser reports FIRST/FIRST table conflicts.',
    grammarText: `E -> E + T | T
T -> T * F | F
F -> ( E ) | a`,
    startSymbol: 'E',
    tokenMode: 'char',
    isLL1: false,
    sampleInputs: [
      { input: 'a+a', shouldAccept: false, label: 'a+a (rejected: grammar not LL(1))' },
      { input: 'a', shouldAccept: false, label: 'a (rejected: grammar not LL(1))' },
    ],
  },
  {
    id: 'dangling-else',
    title: 'Dangling Else (Ambiguous, Non-LL(1))',
    category: 'Compiler Design',
    description: 'Famous grammar with common prefix and ambiguity. Produces an LL(1) table conflict on lookahead "else".',
    grammarText: `S -> if C then S else S | if C then S | a
C -> b`,
    startSymbol: 'S',
    tokenMode: 'word',
    isLL1: false,
    sampleInputs: [
      { input: 'if b then a else a', shouldAccept: false, label: 'rejected: table conflict' },
    ],
  },
];

export interface TestCaseDefinition {
  name: string;
  grammarText: string;
  startSymbol: string;
  tokenMode: 'char' | 'word';
  input: string;
  expectedAccepted: boolean;
  expectLL1?: boolean;
}

export const TEST_SUITE_DEFINITIONS: TestCaseDefinition[] = [
  // Required: S -> aSb | epsilon
  {
    name: 'aⁿ bⁿ: Empty string (ε)',
    grammarText: 'S -> aSb | epsilon',
    startSymbol: 'S',
    tokenMode: 'char',
    input: '',
    expectedAccepted: true,
    expectLL1: true,
  },
  {
    name: 'aⁿ bⁿ: ab (n=1)',
    grammarText: 'S -> aSb | epsilon',
    startSymbol: 'S',
    tokenMode: 'char',
    input: 'ab',
    expectedAccepted: true,
    expectLL1: true,
  },
  {
    name: 'aⁿ bⁿ: aabb (n=2)',
    grammarText: 'S -> aSb | epsilon',
    startSymbol: 'S',
    tokenMode: 'char',
    input: 'aabb',
    expectedAccepted: true,
    expectLL1: true,
  },
  {
    name: 'aⁿ bⁿ: aaabbb (n=3)',
    grammarText: 'S -> aSb | epsilon',
    startSymbol: 'S',
    tokenMode: 'char',
    input: 'aaabbb',
    expectedAccepted: true,
    expectLL1: true,
  },
  {
    name: 'aⁿ bⁿ: aab (rejected: unequal)',
    grammarText: 'S -> aSb | epsilon',
    startSymbol: 'S',
    tokenMode: 'char',
    input: 'aab',
    expectedAccepted: false,
    expectLL1: true,
  },
  {
    name: 'aⁿ bⁿ: abab (rejected: interleaved)',
    grammarText: 'S -> aSb | epsilon',
    startSymbol: 'S',
    tokenMode: 'char',
    input: 'abab',
    expectedAccepted: false,
    expectLL1: true,
  },
  {
    name: 'aⁿ bⁿ: bbaa (rejected: wrong order)',
    grammarText: 'S -> aSb | epsilon',
    startSymbol: 'S',
    tokenMode: 'char',
    input: 'bbaa',
    expectedAccepted: false,
    expectLL1: true,
  },

  // Required: Single terminal derivation
  {
    name: 'Single terminal: a (accepted)',
    grammarText: 'S -> a',
    startSymbol: 'S',
    tokenMode: 'char',
    input: 'a',
    expectedAccepted: true,
    expectLL1: true,
  },
  {
    name: 'Single terminal: b (rejected)',
    grammarText: 'S -> a',
    startSymbol: 'S',
    tokenMode: 'char',
    input: 'b',
    expectedAccepted: false,
    expectLL1: true,
  },
  {
    name: 'Single terminal: Empty string (rejected)',
    grammarText: 'S -> a',
    startSymbol: 'S',
    tokenMode: 'char',
    input: '',
    expectedAccepted: false,
    expectLL1: true,
  },

  // Required: S -> AB, A -> a, B -> b
  {
    name: 'Sequence: S -> AB, A -> a, B -> b: ab (accepted)',
    grammarText: `S -> AB\nA -> a\nB -> b`,
    startSymbol: 'S',
    tokenMode: 'char',
    input: 'ab',
    expectedAccepted: true,
    expectLL1: true,
  },
  {
    name: 'Sequence: S -> AB, A -> a, B -> b: a (rejected)',
    grammarText: `S -> AB\nA -> a\nB -> b`,
    startSymbol: 'S',
    tokenMode: 'char',
    input: 'a',
    expectedAccepted: false,
    expectLL1: true,
  },

  // Required: Multiple alternatives
  {
    name: 'Multiple alternatives: c (accepted)',
    grammarText: 'S -> aS | bS | c',
    startSymbol: 'S',
    tokenMode: 'char',
    input: 'c',
    expectedAccepted: true,
    expectLL1: true,
  },
  {
    name: 'Multiple alternatives: abc (accepted)',
    grammarText: 'S -> aS | bS | c',
    startSymbol: 'S',
    tokenMode: 'char',
    input: 'abc',
    expectedAccepted: true,
    expectLL1: true,
  },
  {
    name: 'Multiple alternatives: ba (rejected)',
    grammarText: 'S -> aS | bS | c',
    startSymbol: 'S',
    tokenMode: 'char',
    input: 'ba',
    expectedAccepted: false,
    expectLL1: true,
  },

  // Balanced Parentheses
  {
    name: 'Balanced Parentheses: () (accepted)',
    grammarText: 'S -> (S)S | epsilon',
    startSymbol: 'S',
    tokenMode: 'char',
    input: '()',
    expectedAccepted: true,
    expectLL1: true,
  },
  {
    name: 'Balanced Parentheses: (()) (accepted)',
    grammarText: 'S -> (S)S | epsilon',
    startSymbol: 'S',
    tokenMode: 'char',
    input: '(())',
    expectedAccepted: true,
    expectLL1: true,
  },
  {
    name: 'Balanced Parentheses: ()() (accepted)',
    grammarText: 'S -> (S)S | epsilon',
    startSymbol: 'S',
    tokenMode: 'char',
    input: '()()',
    expectedAccepted: true,
    expectLL1: true,
  },
  {
    name: 'Balanced Parentheses: (() (rejected)',
    grammarText: 'S -> (S)S | epsilon',
    startSymbol: 'S',
    tokenMode: 'char',
    input: '(()',
    expectedAccepted: false,
    expectLL1: true,
  },

  // LL(1) Conflict Detection on Left Recursion
  {
    name: 'Conflict Detection: Left-Recursive Grammar (E -> E+a | a)',
    grammarText: 'E -> E + a | a',
    startSymbol: 'E',
    tokenMode: 'char',
    input: 'a+a',
    expectedAccepted: false, // Rejected because grammar has LL(1) table conflict
    expectLL1: false,
  },
  {
    name: 'Conflict Detection: Common Prefix Grammar (S -> ab | ac)',
    grammarText: 'S -> ab | ac',
    startSymbol: 'S',
    tokenMode: 'char',
    input: 'ab',
    expectedAccepted: false, // Rejected because grammar has FIRST/FIRST conflict on 'a'
    expectLL1: false,
  },
];

/**
 * Runs the automated unit test suite deterministically using LL(1) predictive parser.
 */
export function runAutomatedTestSuite(): TestCaseResult[] {
  const results: TestCaseResult[] = [];

  for (const tc of TEST_SUITE_DEFINITIONS) {
    const parseResult = parseGrammar(tc.grammarText, tc.startSymbol, tc.tokenMode);
    if (!parseResult.isValid || !parseResult.grammar) {
      results.push({
        name: tc.name,
        grammarText: tc.grammarText,
        startSymbol: tc.startSymbol,
        input: tc.input,
        expectedAccepted: tc.expectedAccepted,
        actualAccepted: false,
        passed: false,
        executionTimeMs: 0,
        explanation: `Grammar syntax error: ${parseResult.errors.join('; ')}`,
      });
      continue;
    }

    const t0 = performance.now();
    const result = parseLL1(parseResult.grammar, tc.input, tc.tokenMode);
    const duration = Number((performance.now() - t0).toFixed(2));

    const passed =
      result.accepted === tc.expectedAccepted &&
      (tc.expectLL1 === undefined || result.isLL1 === tc.expectLL1);

    results.push({
      name: tc.name,
      grammarText: tc.grammarText,
      startSymbol: tc.startSymbol,
      input: tc.input,
      expectedAccepted: tc.expectedAccepted,
      actualAccepted: result.accepted,
      passed,
      executionTimeMs: duration,
      explanation: result.explanation,
    });
  }

  return results;
}
