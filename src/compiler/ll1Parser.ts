/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  FirstFollowSets,
  Grammar,
  LL1Conflict,
  LL1ParseStep,
  LL1Table,
  ParseResult,
  ParseTreeNode,
  ProductionRule,
} from '../types/grammar';
import { tokenizeInput } from './grammarParser';

/**
 * Computes the FIRST set for every non-terminal and terminal in the grammar.
 */
export function computeFirstSets(grammar: Grammar): Record<string, Set<string>> {
  const firstSets: Record<string, Set<string>> = {};
  const nonTerminals = new Set(grammar.nonTerminals);

  // Terminals: FIRST(a) = { a }
  for (const t of grammar.terminals) {
    firstSets[t] = new Set([t]);
  }
  firstSets['$'] = new Set(['$']);
  firstSets['ε'] = new Set(['ε']);

  // Initialize FIRST sets for non-terminals
  for (const nt of grammar.nonTerminals) {
    firstSets[nt] = new Set<string>();
  }

  // Iteratively compute FIRST sets until a fixed point is reached
  let changed = true;
  let iterations = 0;
  const maxIterations = 200;

  while (changed && iterations < maxIterations) {
    changed = false;
    iterations++;

    for (const rule of grammar.rules) {
      const A = rule.lhs;
      const targetSet = firstSets[A];
      if (!targetSet) continue;

      // Case 1: Epsilon rule A -> ε
      if (rule.rhs.length === 0) {
        if (!targetSet.has('ε')) {
          targetSet.add('ε');
          changed = true;
        }
        continue;
      }

      // Case 2: A -> Y1 Y2 ... Yk
      let allDeriveEpsilon = true;

      for (let i = 0; i < rule.rhs.length; i++) {
        const Y = rule.rhs[i];

        if (!nonTerminals.has(Y)) {
          // Y is a terminal
          if (!targetSet.has(Y)) {
            targetSet.add(Y);
            changed = true;
          }
          allDeriveEpsilon = false;
          break;
        }

        // Y is a non-terminal
        const firstY = firstSets[Y] || new Set<string>();
        for (const sym of firstY) {
          if (sym !== 'ε' && !targetSet.has(sym)) {
            targetSet.add(sym);
            changed = true;
          }
        }

        if (!firstY.has('ε')) {
          allDeriveEpsilon = false;
          break;
        }
      }

      if (allDeriveEpsilon) {
        if (!targetSet.has('ε')) {
          targetSet.add('ε');
          changed = true;
        }
      }
    }
  }

  return firstSets;
}

/**
 * Computes FIRST(α) for any sequence of grammar symbols α = Y1 Y2 ... Yk.
 */
export function computeFirstOfSequence(
  sequence: string[],
  firstSets: Record<string, Set<string>>,
  nonTerminals: Set<string>
): Set<string> {
  const result = new Set<string>();
  if (sequence.length === 0) {
    result.add('ε');
    return result;
  }

  let allDeriveEpsilon = true;

  for (const Y of sequence) {
    if (!nonTerminals.has(Y)) {
      result.add(Y);
      allDeriveEpsilon = false;
      break;
    }

    const firstY = firstSets[Y] || new Set<string>();
    for (const sym of firstY) {
      if (sym !== 'ε') {
        result.add(sym);
      }
    }

    if (!firstY.has('ε')) {
      allDeriveEpsilon = false;
      break;
    }
  }

  if (allDeriveEpsilon) {
    result.add('ε');
  }

  return result;
}

/**
 * Computes the FOLLOW set for every non-terminal in the grammar.
 */
export function computeFollowSets(
  grammar: Grammar,
  firstSets: Record<string, Set<string>>
): Record<string, Set<string>> {
  const followSets: Record<string, Set<string>> = {};
  const nonTerminals = new Set(grammar.nonTerminals);

  for (const nt of grammar.nonTerminals) {
    followSets[nt] = new Set<string>();
  }

  // Rule 1: Add '$' (end-marker) to FOLLOW(startSymbol)
  if (grammar.startSymbol && followSets[grammar.startSymbol]) {
    followSets[grammar.startSymbol].add('$');
  }

  // Rule 2 & 3: Iterate until fixed point
  let changed = true;
  let iterations = 0;
  const maxIterations = 200;

  while (changed && iterations < maxIterations) {
    changed = false;
    iterations++;

    for (const rule of grammar.rules) {
      const A = rule.lhs;
      const followA = followSets[A];
      if (!followA) continue;

      for (let i = 0; i < rule.rhs.length; i++) {
        const B = rule.rhs[i];
        if (!nonTerminals.has(B)) continue;

        const followB = followSets[B];
        if (!followB) continue;

        const beta = rule.rhs.slice(i + 1);
        const firstBeta = computeFirstOfSequence(beta, firstSets, nonTerminals);

        // Add FIRST(beta) \ {ε} to FOLLOW(B)
        for (const sym of firstBeta) {
          if (sym !== 'ε' && !followB.has(sym)) {
            followB.add(sym);
            changed = true;
          }
        }

        // If beta derives ε (or beta is empty), add FOLLOW(A) to FOLLOW(B)
        if (firstBeta.has('ε')) {
          for (const sym of followA) {
            if (!followB.has(sym)) {
              followB.add(sym);
              changed = true;
            }
          }
        }
      }
    }
  }

  return followSets;
}

/**
 * Constructs the LL(1) predictive parsing table M[A, a] and identifies any conflicts.
 */
export function constructLL1Table(
  grammar: Grammar,
  firstSets: Record<string, Set<string>>,
  followSets: Record<string, Set<string>>
): LL1Table {
  const nonTerminals = [...grammar.nonTerminals];
  const terminals = [...grammar.terminals, '$'];
  const nonTerminalSet = new Set(grammar.nonTerminals);

  // Initialize table: M[A][a] = []
  const table: Record<string, Record<string, ProductionRule[]>> = {};
  for (const nt of nonTerminals) {
    table[nt] = {};
    for (const t of terminals) {
      table[nt][t] = [];
    }
  }

  // Populate M[A, a] for each rule A -> α
  for (const rule of grammar.rules) {
    const A = rule.lhs;
    if (!table[A]) continue;

    const firstAlpha = computeFirstOfSequence(rule.rhs, firstSets, nonTerminalSet);

    // 1. For each terminal 'a' in FIRST(α), add A -> α to M[A, a]
    for (const a of firstAlpha) {
      if (a !== 'ε' && table[A][a]) {
        if (!table[A][a].some(r => r.id === rule.id)) {
          table[A][a].push(rule);
        }
      }
    }

    // 2. If ε is in FIRST(α), for each terminal 'b' in FOLLOW(A), add A -> α to M[A, b]
    if (firstAlpha.has('ε')) {
      const followA = followSets[A] || new Set<string>();
      for (const b of followA) {
        if (table[A][b]) {
          if (!table[A][b].some(r => r.id === rule.id)) {
            table[A][b].push(rule);
          }
        }
      }
    }
  }

  // Detect and report conflicts
  const conflicts: LL1Conflict[] = [];

  for (const nt of nonTerminals) {
    for (const t of terminals) {
      const cellRules = table[nt][t];
      if (cellRules && cellRules.length > 1) {
        const hasEps = cellRules.some(r => r.rhs.length === 0);
        const reason = hasEps
          ? `FIRST/FOLLOW conflict: Nullable production conflicts with another production on lookahead '${t}'.`
          : `FIRST/FIRST conflict: Multiple productions derive the same initial terminal '${t}'.`;

        conflicts.push({
          nonTerminal: nt,
          terminal: t,
          rules: cellRules,
          reason,
        });
      }
    }
  }

  return {
    nonTerminals,
    terminals,
    table,
    conflicts,
    isLL1: conflicts.length === 0,
  };
}

/**
 * Genuine stack-based LL(1) predictive parsing engine.
 */
export function parseLL1(
  grammar: Grammar,
  inputString: string,
  tokenMode: 'char' | 'word' = 'char'
): ParseResult {
  const startTime = performance.now();
  const tokens = tokenizeInput(inputString, grammar, tokenMode);

  // Compute FIRST and FOLLOW sets dynamically
  const firstSets = computeFirstSets(grammar);
  const followSets = computeFollowSets(grammar, firstSets);

  // Convert sets to sorted string arrays for UI inspection
  const firstRecord: Record<string, string[]> = {};
  for (const nt of grammar.nonTerminals) {
    firstRecord[nt] = Array.from(firstSets[nt] || []).sort((a, b) => (a === 'ε' ? 1 : b === 'ε' ? -1 : a.localeCompare(b)));
  }

  const followRecord: Record<string, string[]> = {};
  for (const nt of grammar.nonTerminals) {
    followRecord[nt] = Array.from(followSets[nt] || []).sort((a, b) => (a === '$' ? 1 : b === '$' ? -1 : a.localeCompare(b)));
  }

  const firstFollow: FirstFollowSets = {
    first: firstRecord,
    follow: followRecord,
  };

  // Construct predictive parsing table
  const ll1Table = constructLL1Table(grammar, firstSets, followSets);

  // If the grammar is NOT LL(1), we must clearly report conflicts and NOT claim LL(1) parsing success
  if (!ll1Table.isLL1) {
    const conflictDescriptions = ll1Table.conflicts.map(
      c => `M[${c.nonTerminal}, ${c.terminal}]: { ${c.rules.map(r => r.raw).join(' | ')} } (${c.reason})`
    );

    const executionTimeMs = Number((performance.now() - startTime).toFixed(2));

    return {
      accepted: false,
      input: inputString,
      tokens,
      algorithm: 'll1',
      isLL1: false,
      conflicts: ll1Table.conflicts,
      firstFollow,
      ll1Table,
      parseSteps: [],
      explanation: `GRAMMAR NOT LL(1): The grammar contains ${ll1Table.conflicts.length} conflict(s) in its predictive parsing table. LL(1) predictive parsing requires every table cell M[A, a] to have at most one production. Conflicts:\n• ${conflictDescriptions.slice(0, 3).join('\n• ')}${conflictDescriptions.length > 3 ? `\n...and ${conflictDescriptions.length - 3} more` : ''}`,
      executionTimeMs,
      failureInfo: {
        failedAtIndex: 0,
        unexpectedToken: tokens[0] || '$',
        expectedTokens: [],
        reason: `Grammar has ${ll1Table.conflicts.length} LL(1) table conflict(s). Eliminate left recursion or left factor the grammar to make it LL(1).`,
      },
    };
  }

  // --- STACK-BASED PREDICTIVE PARSING ---
  // Tokens stream appended with '$'
  const inputWithEndMarker = [...tokens, '$'];
  let ip = 0; // input pointer

  // Parsing Stack: push '$', then startSymbol
  const stack: string[] = ['$', grammar.startSymbol];

  // Parallel node stack for constructing the concrete parse tree
  let nodeCounter = 1;
  const rootNode: ParseTreeNode = {
    id: `LL1_N_${nodeCounter++}`,
    symbol: grammar.startSymbol,
    isTerminal: false,
    isEpsilon: false,
    children: [],
  };

  // The nodeStack mirrors the grammar symbols on the parsing stack (null corresponds to '$')
  const nodeStack: Array<ParseTreeNode | null> = [null, rootNode];

  const parseSteps: LL1ParseStep[] = [];
  const nonTerminalSet = new Set(grammar.nonTerminals);
  const derivationForms: string[] = [grammar.startSymbol];

  let accepted = false;
  let failureReason = '';
  let failedAtIndex = 0;
  let unexpectedToken = '';
  const expectedTokensList: string[] = [];
  let stepNumber = 1;
  const maxSteps = 3000;

  while (stack.length > 0 && stepNumber <= maxSteps) {
    const X = stack[stack.length - 1]; // top of stack
    const currentNode = nodeStack[nodeStack.length - 1];
    const currentToken = inputWithEndMarker[ip];

    const currentStackDisplay = stack.join(' ');
    const currentRemainingInput = inputWithEndMarker.slice(ip).join(' ');

    // 1. Success condition: both stack top and input pointer are '$'
    if (X === '$' && currentToken === '$') {
      parseSteps.push({
        step: stepNumber++,
        stack: [...stack],
        stackDisplay: currentStackDisplay,
        remainingInput: inputWithEndMarker.slice(ip),
        remainingInputDisplay: currentRemainingInput,
        action: 'Accept (Input fully consumed, stack empty)',
        type: 'accept',
      });
      stack.pop();
      nodeStack.pop();
      accepted = true;
      break;
    }

    // 2. Terminal match condition: X is terminal and X == currentToken
    if (!nonTerminalSet.has(X) && X !== '$') {
      if (X === currentToken) {
        parseSteps.push({
          step: stepNumber++,
          stack: [...stack],
          stackDisplay: currentStackDisplay,
          remainingInput: inputWithEndMarker.slice(ip),
          remainingInputDisplay: currentRemainingInput,
          action: `Match '${currentToken}'`,
          type: 'match',
        });

        stack.pop();
        nodeStack.pop();
        ip++;
        continue;
      } else {
        // Terminal mismatch error
        failedAtIndex = ip;
        unexpectedToken = currentToken;
        expectedTokensList.push(X);
        failureReason = `Expected terminal '${X}', but found '${currentToken}'.`;

        parseSteps.push({
          step: stepNumber++,
          stack: [...stack],
          stackDisplay: currentStackDisplay,
          remainingInput: inputWithEndMarker.slice(ip),
          remainingInputDisplay: currentRemainingInput,
          action: `Error: ${failureReason}`,
          type: 'error',
        });
        accepted = false;
        break;
      }
    }

    // 3. Stack top is '$' but input is not finished
    if (X === '$' && currentToken !== '$') {
      failedAtIndex = ip;
      unexpectedToken = currentToken;
      failureReason = `Unexpected extra token '${currentToken}' after stack exhausted.`;

      parseSteps.push({
        step: stepNumber++,
        stack: [...stack],
        stackDisplay: currentStackDisplay,
        remainingInput: inputWithEndMarker.slice(ip),
        remainingInputDisplay: currentRemainingInput,
        action: `Error: ${failureReason}`,
        type: 'error',
      });
      accepted = false;
      break;
    }

    // 4. Non-terminal expansion: look up M[X, currentToken]
    const cellProductions = ll1Table.table[X]?.[currentToken] || [];

    if (cellProductions.length === 0) {
      // Syntax error: empty cell in predictive parsing table
      const expected = ll1Table.terminals.filter(t => (ll1Table.table[X]?.[t] || []).length > 0);
      failedAtIndex = ip;
      unexpectedToken = currentToken;
      expectedTokensList.push(...expected);
      failureReason = `No rule in M[${X}, ${currentToken}]. Expected one of: [${expected.join(', ')}].`;

      parseSteps.push({
        step: stepNumber++,
        stack: [...stack],
        stackDisplay: currentStackDisplay,
        remainingInput: inputWithEndMarker.slice(ip),
        remainingInputDisplay: currentRemainingInput,
        action: `Error: ${failureReason}`,
        type: 'error',
      });
      accepted = false;
      break;
    }

    // Unambiguous LL(1) entry: apply rule A -> α
    const rule = cellProductions[0];
    stack.pop();
    nodeStack.pop();

    parseSteps.push({
      step: stepNumber++,
      stack: [...stack, X],
      stackDisplay: currentStackDisplay,
      remainingInput: inputWithEndMarker.slice(ip),
      remainingInputDisplay: currentRemainingInput,
      action: `Output ${rule.lhs} -> ${rule.rhs.length === 0 ? 'ε' : rule.rhs.join(' ')}`,
      ruleApplied: rule,
      type: 'expand',
    });

    if (currentNode) {
      currentNode.rule = rule;
    }

    // Handle epsilon rule: A -> ε
    if (rule.rhs.length === 0) {
      if (currentNode) {
        currentNode.children.push({
          id: `LL1_EPS_${nodeCounter++}`,
          symbol: 'ε',
          isTerminal: true,
          isEpsilon: true,
          children: [],
        });
      }
    } else {
      // Non-empty RHS: create child nodes
      const childNodes: ParseTreeNode[] = rule.rhs.map(sym => ({
        id: `LL1_N_${nodeCounter++}`,
        symbol: sym,
        isTerminal: !nonTerminalSet.has(sym),
        isEpsilon: false,
        children: [],
      }));

      if (currentNode) {
        currentNode.children = childNodes;
      }

      // Push symbols of RHS in reverse order onto stack
      for (let j = rule.rhs.length - 1; j >= 0; j--) {
        stack.push(rule.rhs[j]);
        nodeStack.push(childNodes[j]);
      }
    }
  }

  const executionTimeMs = Number((performance.now() - startTime).toFixed(2));

  let explanation = '';
  if (accepted) {
    if (tokens.length === 0) {
      explanation = `The empty string (ε) was ACCEPTED by the LL(1) Predictive Parser. The parsing stack successfully reached the accepting state [$, $].`;
    } else {
      explanation = `Input string "${inputString}" (${tokens.length} token${tokens.length > 1 ? 's' : ''}) was ACCEPTED by the LL(1) Predictive Parser in ${parseSteps.length} stack step(s).`;
    }
  } else {
    explanation = `Input string "${inputString}" was REJECTED by the LL(1) Predictive Parser at position ${failedAtIndex}. ${failureReason}`;
  }

  // Generate leftmost derivation if accepted
  let leftmostDerivation: string[] | undefined;
  if (accepted && rootNode) {
    leftmostDerivation = extractLeftmostDerivationFromTree(rootNode);
  }

  return {
    accepted,
    input: inputString,
    tokens,
    algorithm: 'll1',
    isLL1: true,
    conflicts: [],
    firstFollow,
    ll1Table,
    parseSteps,
    explanation,
    executionTimeMs,
    parseTree: accepted ? rootNode : null,
    failureInfo: accepted
      ? undefined
      : {
          failedAtIndex,
          unexpectedToken,
          expectedTokens: expectedTokensList,
          reason: failureReason,
        },
    leftmostDerivation,
  };
}

/**
 * Extracts the step-by-step leftmost derivation from the concrete syntax tree.
 */
function extractLeftmostDerivationFromTree(root: ParseTreeNode): string[] {
  const steps: string[] = [];

  interface SententialNode {
    treeNode: ParseTreeNode;
    isExpanded: boolean;
  }

  let sententialForm: SententialNode[] = [{ treeNode: root, isExpanded: false }];

  const formatForm = (nodes: SententialNode[]) =>
    nodes
      .map(n => (n.treeNode.isEpsilon ? 'ε' : n.treeNode.symbol))
      .filter(s => s !== 'ε' || nodes.length === 1)
      .join(nodes.some(n => n.treeNode.symbol.length > 1) ? ' ' : '');

  steps.push(root.symbol);

  let hasMore = true;
  let iterations = 0;
  const maxIterations = 200;

  while (hasMore && iterations < maxIterations) {
    iterations++;
    hasMore = false;

    for (let i = 0; i < sententialForm.length; i++) {
      const node = sententialForm[i];
      if (!node.isExpanded && !node.treeNode.isTerminal) {
        node.isExpanded = true;
        hasMore = true;

        const childrenNodes: SententialNode[] = node.treeNode.children.map(child => ({
          treeNode: child,
          isExpanded: child.isTerminal,
        }));

        sententialForm = [
          ...sententialForm.slice(0, i),
          ...childrenNodes,
          ...sententialForm.slice(i + 1),
        ];

        const formatted = formatForm(sententialForm);
        if (steps[steps.length - 1] !== formatted && formatted.length > 0) {
          steps.push(formatted);
        }
        break;
      }
    }
  }

  return steps;
}
