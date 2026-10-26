/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Grammar, GrammarValidationResult, ProductionRule } from '../types/grammar';

const EPSILON_LITERALS = new Set(['epsilon', 'eps', 'ε', 'λ', '""', "''", 'null', 'empty']);

export function isEpsilonSymbol(sym: string): boolean {
  if (!sym) return true;
  const trimmed = sym.trim().toLowerCase();
  return EPSILON_LITERALS.has(trimmed) || sym.trim() === 'ε' || sym.trim() === 'λ' || sym.trim() === '';
}

/**
 * Parses user grammar text into structured rules, identifying nonterminals and terminals.
 * @param grammarText Multiline grammar definitions
 * @param overrideStartSymbol Optional explicitly specified start symbol
 * @param tokenMode 'char' (character-level parsing like 'aabb') or 'word' (space-delimited tokens like 'id + id')
 */
export function parseGrammar(
  grammarText: string,
  overrideStartSymbol?: string,
  tokenMode: 'char' | 'word' = 'char'
): GrammarValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const rawLines = grammarText
    .split('\n')
    .map((line, idx) => ({ line: line.trim(), lineNumber: idx + 1 }))
    .filter(({ line }) => line.length > 0 && !line.startsWith('//') && !line.startsWith('#'));

  if (rawLines.length === 0) {
    return {
      isValid: false,
      isEmpty: true,
      errors: ['Grammar is empty. Please enter context-free production rules (e.g., S -> aSb | epsilon).'],
      warnings: [],
    };
  }

  // Phase 1: Identify all Left-Hand-Side symbols as Non-Terminals
  const discoveredNonTerminals = new Set<string>();
  const parsedLineData: Array<{
    lineNumber: number;
    lhs: string;
    rhsAlternatives: string[];
  }> = [];

  for (const { line, lineNumber } of rawLines) {
    // Match arrow: ->, →, or ::=
    const arrowMatch = line.match(/^([^\s\-→:]+)\s*(?:->|→|::=)\s*(.*)$/);
    if (!arrowMatch) {
      errors.push(
        `Line ${lineNumber}: Invalid syntax "${line}". Expected format "LHS -> RHS" (e.g., S -> aSb | epsilon).`
      );
      continue;
    }

    const lhs = arrowMatch[1].trim();
    const rhsPart = arrowMatch[2].trim();

    if (!lhs) {
      errors.push(`Line ${lineNumber}: Left-hand side (LHS) of production cannot be empty.`);
      continue;
    }

    if (isEpsilonSymbol(lhs)) {
      errors.push(`Line ${lineNumber}: Epsilon cannot be a non-terminal on the LHS.`);
      continue;
    }

    discoveredNonTerminals.add(lhs);

    // Split alternatives by |
    // Care for escaped \| or quotes if any, simple split is standard
    const alternatives = rhsPart.split('|').map(alt => alt.trim());
    parsedLineData.push({ lineNumber, lhs, rhsAlternatives: alternatives });
  }

  if (errors.length > 0) {
    return { isValid: false, errors, warnings };
  }

  const nonTerminalList = Array.from(discoveredNonTerminals);
  const startSymbol = overrideStartSymbol && discoveredNonTerminals.has(overrideStartSymbol)
    ? overrideStartSymbol
    : parsedLineData[0]?.lhs || nonTerminalList[0];

  if (!startSymbol) {
    return {
      isValid: false,
      errors: ['No valid start symbol could be determined from the grammar rules.'],
      warnings: [],
    };
  }

  // Phase 2: Tokenize RHS alternatives into symbols
  const rules: ProductionRule[] = [];
  const discoveredTerminals = new Set<string>();
  let ruleCounter = 1;

  for (const { lineNumber, lhs, rhsAlternatives } of parsedLineData) {
    for (const alt of rhsAlternatives) {
      const rhsSymbols = tokenizeRHS(alt, discoveredNonTerminals, tokenMode);

      if (rhsSymbols === null) {
        // Epsilon production
        rules.push({
          id: `R${ruleCounter++}`,
          lhs,
          rhs: [], // empty array = epsilon
          raw: `${lhs} -> ε`,
        });
      } else {
        // Collect terminals
        for (const sym of rhsSymbols) {
          if (!discoveredNonTerminals.has(sym)) {
            discoveredTerminals.add(sym);
          }
        }

        rules.push({
          id: `R${ruleCounter++}`,
          lhs,
          rhs: rhsSymbols,
          raw: `${lhs} -> ${rhsSymbols.join(' ')}`,
        });
      }
    }
  }

  // Phase 3: Grammar diagnostics and validation
  // Check for unreachable non-terminals
  const reachable = new Set<string>([startSymbol]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const rule of rules) {
      if (reachable.has(rule.lhs)) {
        for (const sym of rule.rhs) {
          if (discoveredNonTerminals.has(sym) && !reachable.has(sym)) {
            reachable.add(sym);
            changed = true;
          }
        }
      }
    }
  }

  const unreachable = nonTerminalList.filter(nt => !reachable.has(nt));
  if (unreachable.length > 0) {
    warnings.push(
      `Unreachable non-terminal${unreachable.length > 1 ? 's' : ''} detected: ${unreachable.join(
        ', '
      )}. Rules for these symbols will not be used in parsing from start symbol "${startSymbol}".`
    );
  }

  const grammar: Grammar = {
    rules,
    startSymbol,
    nonTerminals: nonTerminalList,
    terminals: Array.from(discoveredTerminals).sort(),
  };

  return {
    isValid: true,
    errors: [],
    warnings,
    grammar,
  };
}

/**
 * Tokenizes a RHS string into an array of symbol strings, or null if epsilon.
 */
export function tokenizeRHS(
  rawRhs: string,
  nonTerminals: Set<string>,
  mode: 'char' | 'word'
): string[] | null {
  const trimmed = rawRhs.trim();
  if (isEpsilonSymbol(trimmed)) {
    return null; // represents epsilon
  }

  // If the user separated tokens with spaces, e.g. "a S b" or "E + T"
  if (trimmed.includes(' ')) {
    const tokens = trimmed.split(/\s+/).filter(t => t.length > 0);
    const result: string[] = [];
    for (const t of tokens) {
      if (isEpsilonSymbol(t)) continue;
      result.push(t);
    }
    return result.length === 0 ? null : result;
  }

  // No spaces present:
  if (mode === 'word') {
    // In word mode without spaces, it's a single token
    return [trimmed];
  }

  // In char mode without spaces, e.g. "aSb" or "aSa":
  // We match known nonterminals (longest match first) and single characters for terminals
  const sortedNTs = Array.from(nonTerminals).sort((a, b) => b.length - a.length);
  const result: string[] = [];
  let i = 0;
  while (i < trimmed.length) {
    let matchedNT = false;
    for (const nt of sortedNTs) {
      if (trimmed.startsWith(nt, i)) {
        result.push(nt);
        i += nt.length;
        matchedNT = true;
        break;
      }
    }
    if (!matchedNT) {
      result.push(trimmed[i]);
      i++;
    }
  }

  return result.length === 0 ? null : result;
}

/**
 * Tokenizes an input test string given a grammar and token mode.
 */
export function tokenizeInput(
  input: string,
  grammar: Grammar,
  tokenMode: 'char' | 'word' = 'char'
): string[] {
  const trimmed = input.trim();
  if (trimmed === '' || isEpsilonSymbol(trimmed)) {
    return [];
  }

  if (tokenMode === 'word') {
    return trimmed.split(/\s+/).filter(t => t.length > 0);
  }

  // Char mode:
  // If the input string has spaces, do we treat spaces as delimiters or ignore?
  // Convention: if there are spaces, user may have spaced tokens like "a a b b"
  // Let's check if spaces separate tokens:
  if (trimmed.includes(' ')) {
    // If every spaced token exists in terminals or is 1 char, use space separation
    return trimmed.split(/\s+/).filter(t => t.length > 0);
  }

  // Otherwise, decompose character-by-character (or longest matching terminal token)
  const sortedTerminals = [...grammar.terminals].sort((a, b) => b.length - a.length);
  const tokens: string[] = [];
  let i = 0;
  while (i < trimmed.length) {
    let matched = false;
    for (const term of sortedTerminals) {
      if (term.length > 1 && trimmed.startsWith(term, i)) {
        tokens.push(term);
        i += term.length;
        matched = true;
        break;
      }
    }
    if (!matched) {
      tokens.push(trimmed[i]);
      i++;
    }
  }
  return tokens;
}
