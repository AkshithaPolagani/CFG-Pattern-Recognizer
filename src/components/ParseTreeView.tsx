/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { ParseResult, ParseTreeNode } from '../types/grammar';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sparkles,
  AlertCircle,
  Copy,
  Check,
  Info,
} from 'lucide-react';

interface ParseTreeViewProps {
  parseResult: ParseResult | null;
}

interface LayoutNode {
  id: string;
  symbol: string;
  isTerminal: boolean;
  isEpsilon: boolean;
  ruleRaw?: string;
  x: number;
  y: number;
  children: LayoutNode[];
}

export const ParseTreeView: React.FC<ParseTreeViewProps> = ({ parseResult }) => {
  const [zoom, setZoom] = useState(1);
  const [copiedDerivation, setCopiedDerivation] = useState(false);
  const [selectedNode, setSelectedNode] = useState<LayoutNode | null>(null);

  const root = parseResult?.parseTree;

  // Compute hierarchical layout coordinates for SVG rendering
  const layoutData = useMemo(() => {
    if (!root) return null;

    let leafCounter = 0;
    const horizontalSpacing = 68;
    const verticalSpacing = 72;

    function layout(node: ParseTreeNode, depth: number): LayoutNode {
      if (node.children.length === 0) {
        const x = leafCounter * horizontalSpacing + 40;
        leafCounter++;
        return {
          id: node.id,
          symbol: node.symbol,
          isTerminal: node.isTerminal,
          isEpsilon: node.isEpsilon,
          ruleRaw: node.rule?.raw,
          x,
          y: depth * verticalSpacing + 40,
          children: [],
        };
      }

      const layoutChildren = node.children.map(child => layout(child, depth + 1));
      // Parent x is the midpoint of its first and last child
      const minX = layoutChildren[0].x;
      const maxX = layoutChildren[layoutChildren.length - 1].x;
      const x = (minX + maxX) / 2;

      return {
        id: node.id,
        symbol: node.symbol,
        isTerminal: node.isTerminal,
        isEpsilon: node.isEpsilon,
        ruleRaw: node.rule?.raw,
        x,
        y: depth * verticalSpacing + 40,
        children: layoutChildren,
      };
    }

    const laidOutRoot = layout(root, 0);

    // Compute bounding box
    let maxX = 0;
    let maxY = 0;
    function getBounds(n: LayoutNode) {
      if (n.x > maxX) maxX = n.x;
      if (n.y > maxY) maxY = n.y;
      n.children.forEach(getBounds);
    }
    getBounds(laidOutRoot);

    return {
      root: laidOutRoot,
      width: Math.max(700, maxX + 80),
      height: Math.max(350, maxY + 80),
    };
  }, [root]);

  const handleCopyDerivations = () => {
    if (parseResult?.leftmostDerivation) {
      navigator.clipboard.writeText(parseResult.leftmostDerivation.join(' ⇒ '));
      setCopiedDerivation(true);
      setTimeout(() => setCopiedDerivation(false), 2000);
    }
  };

  if (!parseResult || !parseResult.accepted || !root) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center space-y-3">
        <AlertCircle className="w-10 h-10 text-slate-300 mx-auto" />
        <h3 className="text-base font-bold text-slate-700">No Parse Tree Available</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          A syntax parse tree is generated exclusively for <strong>ACCEPTED</strong> input strings.
          Please test an accepted string in the Pattern Recognizer tab to visualize its syntactic derivation tree.
        </p>
      </div>
    );
  }

  // Render SVG lines connecting parents and children
  const renderLines = (node: LayoutNode): React.ReactNode[] => {
    const lines: React.ReactNode[] = [];
    for (const child of node.children) {
      lines.push(
        <line
          key={`${node.id}-${child.id}`}
          x1={node.x}
          y1={node.y}
          x2={child.x}
          y2={child.y}
          stroke="#94a3b8"
          strokeWidth="1.75"
          strokeDasharray={child.isEpsilon ? '4 3' : undefined}
        />
      );
      lines.push(...renderLines(child));
    }
    return lines;
  };

  // Render SVG nodes
  const renderNodes = (node: LayoutNode): React.ReactNode[] => {
    const nodes: React.ReactNode[] = [];
    const isSelected = selectedNode?.id === node.id;

    nodes.push(
      <g
        key={node.id}
        transform={`translate(${node.x}, ${node.y})`}
        className="cursor-pointer transition-transform hover:scale-110"
        onClick={() => setSelectedNode(node)}
      >
        {node.isTerminal ? (
          // Terminal node: rounded rectangle
          <rect
            x="-18"
            y="-14"
            width="36"
            height="28"
            rx="6"
            fill={node.isEpsilon ? '#fef3c7' : '#ecfdf5'}
            stroke={
              isSelected
                ? '#2563eb'
                : node.isEpsilon
                ? '#f59e0b'
                : '#10b981'
            }
            strokeWidth={isSelected ? '2.5' : '1.5'}
          />
        ) : (
          // Non-Terminal node: circle
          <circle
            r="18"
            fill="#eff6ff"
            stroke={isSelected ? '#1d4ed8' : '#3b82f6'}
            strokeWidth={isSelected ? '2.5' : '1.75'}
          />
        )}
        <text
          textAnchor="middle"
          dominantBaseline="central"
          className={`font-mono text-xs select-none font-bold ${
            node.isEpsilon
              ? 'fill-amber-800'
              : node.isTerminal
              ? 'fill-emerald-800'
              : 'fill-blue-800'
          }`}
        >
          {node.symbol}
        </text>
      </g>
    );

    for (const child of node.children) {
      nodes.push(...renderNodes(child));
    }

    return nodes;
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Concrete Syntax Parse Tree</h2>
            <p className="text-xs text-slate-500">
              Syntactic derivation hierarchy for input <code className="text-blue-700 font-mono">{parseResult.input === '' ? 'ε' : `"${parseResult.input}"`}</code>.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setZoom(z => Math.max(0.5, Number((z - 0.15).toFixed(2))))}
              className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono text-slate-500 w-12 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom(z => Math.min(2.5, Number((z + 0.15).toFixed(2))))}
              className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoom(1)}
              className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 cursor-pointer"
              title="Reset Zoom"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Ambiguity Note Banner */}
        <div className="bg-amber-50/70 border border-amber-200 rounded-lg p-3 text-xs text-amber-900 flex items-start gap-2">
          <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Ambiguity & Canonical Derivation:</span> In general Context-Free Grammars, if a grammar is ambiguous, a string may possess more than one distinct parse tree. The parser generates a canonical leftmost derivation tree.
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 text-xs pt-1 border-t border-slate-100 text-slate-600">
          <span className="font-semibold text-slate-500">Legend:</span>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-full bg-blue-100 border border-blue-400 inline-block" />
            <span>Non-Terminal (V_N)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3 rounded bg-emerald-100 border border-emerald-400 inline-block" />
            <span>Terminal Token (Σ)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3 rounded bg-amber-100 border border-amber-400 border-dashed inline-block" />
            <span>Epsilon Transition (ε)</span>
          </div>
        </div>
      </div>

      {/* Interactive SVG Canvas Container */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs relative">
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Click any node in the tree to inspect its production rule</span>
          {selectedNode && (
            <span className="font-mono text-blue-700 font-semibold">
              Selected: {selectedNode.symbol}{' '}
              {selectedNode.ruleRaw ? `(${selectedNode.ruleRaw})` : '(Leaf token)'}
            </span>
          )}
        </div>

        <div className="overflow-auto max-h-[520px] p-6 bg-slate-900/[0.02] flex items-center justify-center">
          {layoutData && (
            <div
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: 'top center',
                transition: 'transform 0.15s ease-out',
              }}
            >
              <svg
                width={layoutData.width}
                height={layoutData.height}
                className="overflow-visible"
              >
                {/* Connecting branches */}
                {renderLines(layoutData.root)}
                {/* Tree Nodes */}
                {renderNodes(layoutData.root)}
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* Leftmost Derivation Sequence */}
      {parseResult.leftmostDerivation && parseResult.leftmostDerivation.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Step-by-Step Leftmost Derivation (S ⇒* w)
              </h3>
            </div>
            <button
              onClick={handleCopyDerivations}
              className="flex items-center gap-1 px-2.5 py-1 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded cursor-pointer transition-colors"
            >
              {copiedDerivation ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Derivation</span>
                </>
              )}
            </button>
          </div>

          <p className="text-xs text-slate-500">
            A sequence of sentential forms generated by replacing the leftmost non-terminal at each step:
          </p>

          <div className="space-y-1.5 font-mono text-xs">
            {parseResult.leftmostDerivation.map((form, stepIdx) => (
              <div
                key={stepIdx}
                className="flex items-center gap-3 p-2 bg-slate-50 hover:bg-blue-50/50 rounded-lg border border-slate-100 transition-colors"
              >
                <span className="w-7 text-slate-400 font-semibold text-right">
                  {stepIdx === 0 ? 'Start' : `${stepIdx}.`}
                </span>
                <span className="text-blue-600 font-bold">{stepIdx === 0 ? ' ' : '⇒'}</span>
                <span className="font-semibold text-slate-900 tracking-wide">{form}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
