/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useCallback } from 'react';
import { ActiveTab, Sidebar } from './components/Sidebar';
import { GrammarEditor } from './components/GrammarEditor';
import { StringTester } from './components/StringTester';
import { LL1TraceView } from './components/LL1TraceView';
import { ParseTreeView } from './components/ParseTreeView';
import { CnfConverterView } from './components/CnfConverterView';
import { PresetsAndVivaView } from './components/PresetsAndVivaView';
import { TestSuiteView } from './components/TestSuiteView';
import { parseGrammar } from './compiler/grammarParser';
import { parseLL1 } from './compiler/ll1Parser';
import { GrammarPreset, ParseResult } from './types/grammar';
import { Menu, X, Play } from 'lucide-react';

export default function App() {
  // When the application first opens, show an empty grammar editor and an empty input-string field.
  const [activeTab, setActiveTab] = useState<ActiveTab>('editor');
  const [grammarText, setGrammarText] = useState<string>('');
  const [startSymbol, setStartSymbol] = useState<string>('');
  const [tokenMode, setTokenMode] = useState<'char' | 'word'>('char');
  const [inputString, setInputString] = useState<string>('');
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [parseFeedback, setParseFeedback] = useState<{
    type: 'info' | 'error' | 'warning';
    message: string;
  } | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Parse and validate grammar dynamically whenever grammar text or settings change
  const validation = useMemo(() => {
    return parseGrammar(grammarText, startSymbol || undefined, tokenMode);
  }, [grammarText, startSymbol, tokenMode]);

  // After editing a grammar, clear previous parsing results and require the user to parse again
  const handleGrammarTextChange = (newText: string) => {
    setGrammarText(newText);
    setParseResult(null);
    setParseFeedback(null);
  };

  const handleStartSymbolChange = (newSym: string) => {
    setStartSymbol(newSym);
    setParseResult(null);
    setParseFeedback(null);
  };

  const handleTokenModeChange = (newMode: 'char' | 'word') => {
    setTokenMode(newMode);
    setParseResult(null);
    setParseFeedback(null);
  };

  const handleInputChange = (newInput: string) => {
    setInputString(newInput);
    setParseResult(null);
    setParseFeedback(null);
  };

  // Dynamic parsing on demand using genuine LL(1) predictive parsing engine
  const handleParse = useCallback(() => {
    // Check 1: Empty grammar
    if (!grammarText.trim()) {
      setParseFeedback({
        type: 'error',
        message: 'Grammar is empty. Please enter your context-free production rules in the Grammar Editor first (e.g. S -> aSb | epsilon).',
      });
      setParseResult(null);
      setActiveTab('tester');
      return;
    }

    // Check 2: Malformed grammar
    if (!validation.isValid || !validation.grammar) {
      setParseFeedback({
        type: 'error',
        message: `Grammar contains syntax errors: ${validation.errors.join('; ')}. Please correct the rules in the Grammar Editor before parsing.`,
      });
      setParseResult(null);
      setActiveTab('tester');
      return;
    }

    // Check 3: Empty input string
    if (inputString.trim() === '') {
      setParseFeedback({
        type: 'warning',
        message: 'Input string is empty. Please enter a string to test against the grammar, or click "Test ε (Empty String)" if your grammar derives epsilon.',
      });
      setParseResult(null);
      setActiveTab('tester');
      return;
    }

    // Grammar and input valid: Execute dynamic LL(1) predictive parsing
    setParseFeedback(null);
    const res = parseLL1(validation.grammar, inputString, tokenMode);
    setParseResult(res);
    setActiveTab('tester');
  }, [grammarText, validation, inputString, tokenMode]);

  // Preset loader inserts selected example into editor so user can freely edit or replace it
  const handleLoadPreset = (preset: GrammarPreset) => {
    setGrammarText(preset.grammarText);
    setStartSymbol(preset.startSymbol);
    setTokenMode(preset.tokenMode);
    setInputString('');
    setParseResult(null);
    setParseFeedback(null);
    setActiveTab('editor');
    setMobileSidebarOpen(false);
  };

  const handleClearEditor = () => {
    setGrammarText('');
    setStartSymbol('');
    setInputString('');
    setParseResult(null);
    setParseFeedback(null);
  };

  const handleLoadTestCase = (tcGrammarText: string, tcStartSymbol: string, tcInput: string) => {
    setGrammarText(tcGrammarText);
    setStartSymbol(tcStartSymbol);
    setInputString(tcInput);
    setParseResult(null);
    setParseFeedback(null);

    const parsed = parseGrammar(tcGrammarText, tcStartSymbol, 'char');
    if (parsed.isValid && parsed.grammar) {
      setParseResult(parseLL1(parsed.grammar, tcInput, 'char'));
    }
    setActiveTab('tester');
    setMobileSidebarOpen(false);
  };

  const effectiveStartSymbol =
    startSymbol || validation.grammar?.startSymbol || '';

  return (
    <div className="flex h-screen bg-slate-100 font-sans text-slate-900 overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex h-full">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          rulesCount={validation.grammar?.rules.length || 0}
          startSymbol={effectiveStartSymbol}
          hasResult={Boolean(parseResult)}
          isAccepted={parseResult ? parseResult.accepted : null}
        />
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-slate-900 z-10">
            <div className="absolute top-3 right-3">
              <button
                onClick={() => setMobileSidebarOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <Sidebar
              activeTab={activeTab}
              setActiveTab={tab => {
                setActiveTab(tab);
                setMobileSidebarOpen(false);
              }}
              rulesCount={validation.grammar?.rules.length || 0}
              startSymbol={effectiveStartSymbol}
              hasResult={Boolean(parseResult)}
              isAccepted={parseResult ? parseResult.accepted : null}
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-slate-50">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-slate-200 px-4 lg:px-8 flex items-center justify-between shrink-0 shadow-2xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold text-slate-900 tracking-tight">
                  CFG Pattern Recognizer
                </h1>
                <span className="hidden sm:inline-block text-[11px] font-mono font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  A Compiler Design Project
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Context-Free Language parsing via LL(1) Predictive Parser &amp; Chomsky Normal Form conversion
              </p>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg text-xs font-mono">
              <span className="text-slate-500">Grammar:</span>
              <span className="font-semibold text-blue-700 truncate max-w-[160px]">
                {grammarText.trim().split('\n')[0] || '(Empty)'}
              </span>
            </div>

            <button
              onClick={handleParse}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Parse</span>
            </button>
          </div>
        </header>

        {/* Scrollable Viewport */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="max-w-6xl mx-auto pb-12">
            {activeTab === 'editor' && (
              <GrammarEditor
                grammarText={grammarText}
                setGrammarText={handleGrammarTextChange}
                startSymbol={startSymbol}
                setStartSymbol={handleStartSymbolChange}
                tokenMode={tokenMode}
                setTokenMode={handleTokenModeChange}
                validation={validation}
                onLoadPreset={handleLoadPreset}
                onClearEditor={handleClearEditor}
              />
            )}

            {activeTab === 'tester' && (
              <StringTester
                grammar={validation.grammar || null}
                grammarIsEmpty={Boolean(validation.isEmpty || !grammarText.trim())}
                grammarIsMalformed={!validation.isValid && !validation.isEmpty}
                grammarErrors={validation.errors}
                inputString={inputString}
                setInputString={handleInputChange}
                tokenMode={tokenMode}
                parseResult={parseResult}
                parseFeedback={parseFeedback}
                onParse={handleParse}
                onNavigateTab={tab => setActiveTab(tab)}
              />
            )}

            {activeTab === 'll1-trace' && (
              <LL1TraceView parseResult={parseResult} />
            )}

            {activeTab === 'parse-tree' && (
              <ParseTreeView parseResult={parseResult} />
            )}

            {activeTab === 'cnf-converter' && (
              <CnfConverterView
                grammar={validation.grammar || null}
              />
            )}

            {activeTab === 'presets-viva' && (
              <PresetsAndVivaView onLoadPreset={handleLoadPreset} />
            )}

            {activeTab === 'test-suite' && (
              <TestSuiteView onLoadTestCase={handleLoadTestCase} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
