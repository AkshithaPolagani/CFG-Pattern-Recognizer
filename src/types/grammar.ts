/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type SymbolType = 'nonterminal' | 'terminal' | 'epsilon';

export interface ProductionRule {
  id: string;
  lhs: string;
  rhs: string[]; // empty array represents epsilon production (X -> ε)
  raw: string;
}

export interface Grammar {
  rules: ProductionRule[];
  startSymbol: string;
  nonTerminals: string[];
  terminals: string[];
}

export interface GrammarValidationResult {
  isValid: boolean;
  isEmpty?: boolean;
  errors: string[];
  warnings: string[];
  grammar?: Grammar;
}

export interface ParseTreeNode {
  id: string;
  symbol: string;
  isTerminal: boolean;
  isEpsilon: boolean;
  rule?: ProductionRule;
  children: ParseTreeNode[];
  span?: [number, number]; // start and end token indices
}

export interface FirstFollowSets {
  first: Record<string, string[]>; // Non-terminal -> list of terminals (and/or 'ε')
  follow: Record<string, string[]>; // Non-terminal -> list of terminals (and/or '$')
}

export interface LL1Conflict {
  nonTerminal: string;
  terminal: string;
  rules: ProductionRule[];
  reason: string;
}

export interface LL1Table {
  nonTerminals: string[];
  terminals: string[]; // Terminals plus '$'
  // table[nonTerminal][terminal] -> array of matching ProductionRules (multiple indicates a conflict)
  table: Record<string, Record<string, ProductionRule[]>>;
  conflicts: LL1Conflict[];
  isLL1: boolean;
}

export interface LL1ParseStep {
  step: number;
  stack: string[];
  stackDisplay: string;
  remainingInput: string[];
  remainingInputDisplay: string;
  action: string;
  ruleApplied?: ProductionRule;
  type: 'expand' | 'match' | 'accept' | 'error';
}

export interface ParseResult {
  accepted: boolean;
  input: string;
  tokens: string[];
  algorithm: 'll1';
  explanation: string;
  executionTimeMs: number;
  parseTree?: ParseTreeNode | null;
  failureInfo?: {
    failedAtIndex: number;
    unexpectedToken: string;
    expectedTokens: string[];
    reason: string;
  };
  leftmostDerivation?: string[];
  firstFollow?: FirstFollowSets;
  ll1Table?: LL1Table;
  parseSteps?: LL1ParseStep[];
  isLL1?: boolean;
  conflicts?: LL1Conflict[];
}

export interface GrammarPreset {
  id: string;
  title: string;
  category: string;
  description: string;
  grammarText: string;
  startSymbol: string;
  tokenMode: 'char' | 'word';
  isLL1?: boolean;
  sampleInputs: {
    input: string;
    shouldAccept: boolean;
    label: string;
  }[];
}

export interface TestCaseResult {
  name: string;
  grammarText: string;
  startSymbol: string;
  input: string;
  expectedAccepted: boolean;
  actualAccepted: boolean;
  passed: boolean;
  executionTimeMs: number;
  explanation: string;
}
