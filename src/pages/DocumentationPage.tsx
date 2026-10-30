import React, { useState } from 'react';
import {
  BookOpen,
  Search,
} from 'lucide-react';
import { EPSILON, END_MARKER } from '../types/compiler.ts';

export const DocumentationPage: React.FC = () => {
  const [search, setSearch] = useState('');

  const sections = [
    {
      id: 'cfg',
      title: '1. Context-Free Grammars (CFG) & Notation',
      content: (
        <div className="space-y-3 text-xs leading-relaxed text-[#A0ADA4]">
          <p>
            A Context-Free Grammar (CFG) is a 4-tuple <code className="text-[#00E676] font-mono">G = (V, Σ, R, S)</code>, where:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2 text-[#A0ADA4]">
            <li><strong className="text-[#F5F7F5]">V (Variables / Non-Terminals):</strong> Syntactic categories that can be expanded (e.g., <code className="text-[#69F0AE] font-mono">E, T, F</code>).</li>
            <li><strong className="text-[#F5F7F5]">Σ (Terminals):</strong> Alphabet symbols appearing in input tokens (e.g., <code className="text-[#00E676] font-mono">id, +, *, (, )</code>).</li>
            <li><strong className="text-[#F5F7F5]">R (Production Rules):</strong> Mappings of form <code className="text-[#00E676] font-mono">A -&gt; α</code> where <code className="text-[#00E676] font-mono">A ∈ V</code> and <code className="text-[#00E676] font-mono">α ∈ (V ∪ Σ)*</code>.</li>
            <li><strong className="text-[#F5F7F5]">S (Start Symbol):</strong> The distinguished non-terminal representing complete programs or expressions.</li>
          </ul>
          <p>
            In <strong className="text-[#00E676]">ParseViz</strong>, rules are written with <code className="text-[#00E676] font-mono">-&gt;</code> or <code className="text-[#00E676] font-mono">::=</code>, alternatives separated by <code className="text-[#00E676] font-mono">|</code>, and epsilon transitions represented by <code className="text-[#FFD740] font-mono">{EPSILON}</code>.
          </p>
        </div>
      ),
    },
    {
      id: 'left-recursion',
      title: '2. Immediate Left Recursion Elimination',
      content: (
        <div className="space-y-3 text-xs leading-relaxed text-[#A0ADA4]">
          <p>
            A production is <em>immediately left-recursive</em> if it has the form <code className="text-[#00E676] font-mono">A -&gt; A α</code>. Top-down predictive parsers (like LL(1)) enter an infinite loop when attempting to expand such non-terminals because the same symbol appears at the front of its expansion.
          </p>
          <div className="p-3 bg-[#050807] border border-[#1B3326] rounded-lg font-mono text-[#F5F7F5]">
            <span className="text-[#68776D]">// General Form:</span><br />
            A -&gt; A α₁ | A α₂ | ... | A αₘ | β₁ | β₂ | ... | βₙ<br /><br />
            <span className="text-[#68776D]">// Transformed Non-Recursive Equivalent:</span><br />
            A -&gt; β₁ A&apos; | β₂ A&apos; | ... | βₙ A&apos;<br />
            A&apos; -&gt; α₁ A&apos; | α₂ A&apos; | ... | αₘ A&apos; | ε
          </div>
          <p>
            This replaces left-associative recursion with right-associative recursion followed by an epsilon-producing tail symbol.
          </p>
        </div>
      ),
    },
    {
      id: 'left-factoring',
      title: '3. Left Factoring (Prefix Disambiguation)',
      content: (
        <div className="space-y-3 text-xs leading-relaxed text-[#A0ADA4]">
          <p>
            Left factoring is a grammar transformation that extracts common prefixes among alternatives. When two productions share a prefix, a predictive parser with 1 token lookahead cannot determine which alternative to select.
          </p>
          <div className="p-3 bg-[#050807] border border-[#1B3326] rounded-lg font-mono text-[#F5F7F5]">
            <span className="text-[#68776D]">// Common Prefix Form:</span><br />
            A -&gt; α β₁ | α β₂ | ... | α βₖ | γ<br /><br />
            <span className="text-[#68776D]">// Factored Productions:</span><br />
            A -&gt; α A&apos; | γ<br />
            A&apos; -&gt; β₁ | β₂ | ... | βₖ  (if βᵢ is empty, use ε)
          </div>
          <p>
            Classic textbook example: The <em>dangling-else</em> problem where <code className="text-[#00E676] font-mono">S -&gt; if E then S | if E then S else S</code> shares the prefix <code className="text-[#00E676] font-mono">if E then S</code>.
          </p>
        </div>
      ),
    },
    {
      id: 'first-set',
      title: '4. The FIRST Set Algorithm',
      content: (
        <div className="space-y-3 text-xs leading-relaxed text-[#A0ADA4]">
          <p>
            <code className="text-[#00E676] font-mono">FIRST(α)</code> is the set of terminals that can begin strings derived from <code className="text-[#00E676] font-mono">α</code>. If <code className="text-[#00E676] font-mono">α ⇒* ε</code>, then <code className="text-[#FFD740] font-mono">{EPSILON} ∈ FIRST(α)</code>.
          </p>
          <ul className="list-disc list-inside space-y-1.5 ml-2 text-[#A0ADA4]">
            <li>If <code className="text-[#F5F7F5] font-mono">a</code> is a terminal, <code className="text-[#00E676] font-mono">FIRST(a) = &#123;a&#125;</code>.</li>
            <li>If <code className="text-[#F5F7F5] font-mono">A -&gt; ε</code> is a production, then add <code className="text-[#FFD740] font-mono">{EPSILON}</code> to <code className="text-[#00E676] font-mono">FIRST(A)</code>.</li>
            <li>
              For any production <code className="text-[#F5F7F5] font-mono">A -&gt; X₁ X₂ ... Xₖ</code>:
              <br />
              Add <code className="text-[#00E676] font-mono">FIRST(X₁) \ &#123;ε&#125;</code> to <code className="text-[#00E676] font-mono">FIRST(A)</code>.
              <br />
              If <code className="text-[#FFD740] font-mono">{EPSILON} ∈ FIRST(X₁)</code>, also add <code className="text-[#00E676] font-mono">FIRST(X₂) \ &#123;ε&#125;</code>, and so on.
              <br />
              If all <code className="text-[#F5F7F5] font-mono">X₁ ... Xₖ</code> contain <code className="text-[#FFD740] font-mono">{EPSILON}</code>, add <code className="text-[#FFD740] font-mono">{EPSILON}</code> to <code className="text-[#00E676] font-mono">FIRST(A)</code>.
            </li>
          </ul>
        </div>
      ),
    },
    {
      id: 'follow-set',
      title: '5. The FOLLOW Set Algorithm',
      content: (
        <div className="space-y-3 text-xs leading-relaxed text-[#A0ADA4]">
          <p>
            <code className="text-[#00E676] font-mono">FOLLOW(A)</code> is the set of terminals that can appear immediately to the right of non-terminal <code className="text-[#00E676] font-mono">A</code> in some sentential form: <code className="text-[#00E676] font-mono">S ⇒* α A a β</code>.
          </p>
          <ul className="list-disc list-inside space-y-1.5 ml-2 text-[#A0ADA4]">
            <li><strong className="text-[#F5F7F5]">Rule 1:</strong> Place the end-marker <code className="text-[#69F0AE] font-mono">{END_MARKER}</code> in <code className="text-[#00E676] font-mono">FOLLOW(S)</code>, where <code className="text-[#00E676] font-mono">S</code> is the start symbol.</li>
            <li><strong className="text-[#F5F7F5]">Rule 2:</strong> If there is a production <code className="text-[#F5F7F5] font-mono">A -&gt; α B β</code>, then everything in <code className="text-[#00E676] font-mono">FIRST(β)</code> (except <code className="text-[#FFD740] font-mono">{EPSILON}</code>) is in <code className="text-[#00E676] font-mono">FOLLOW(B)</code>.</li>
            <li><strong className="text-[#F5F7F5]">Rule 3:</strong> If there is a production <code className="text-[#F5F7F5] font-mono">A -&gt; α B</code>, or <code className="text-[#F5F7F5] font-mono">A -&gt; α B β</code> where <code className="text-[#FFD740] font-mono">{EPSILON} ∈ FIRST(β)</code>, then everything in <code className="text-[#00E676] font-mono">FOLLOW(A)</code> is in <code className="text-[#00E676] font-mono">FOLLOW(B)</code>.</li>
          </ul>
        </div>
      ),
    },
    {
      id: 'll1-condition',
      title: '6. The Necessary and Sufficient LL(1) Condition',
      content: (
        <div className="space-y-3 text-xs leading-relaxed text-[#A0ADA4]">
          <p>
            A Context-Free Grammar is <strong className="text-[#00E676]">LL(1)</strong> (Left-to-right scan, Leftmost derivation, 1 lookahead token) if and only if for every pair of distinct productions <code className="text-[#00E676] font-mono">A -&gt; α</code> and <code className="text-[#00E676] font-mono">A -&gt; β</code> with the same left-hand side:
          </p>
          <div className="p-3 bg-[#050807] border border-[#1B3326] rounded-lg font-mono text-[#F5F7F5] space-y-1.5">
            <div>1. FIRST(α) ∩ FIRST(β) = ∅ (Disjoint FIRST sets)</div>
            <div>2. At most one of α or β can derive ε.</div>
            <div>3. If β ⇒* ε, then FIRST(α) ∩ FOLLOW(A) = ∅.</div>
          </div>
          <p>
            If any of these conditions are violated, the LL(1) parsing table will have at least one cell with multiple entries (a conflict), making deterministic predictive parsing impossible.
          </p>
        </div>
      ),
    },
    {
      id: 'conflicts',
      title: '7. Conflict Terminology: FIRST/FIRST vs FIRST/FOLLOW',
      content: (
        <div className="space-y-3 text-xs leading-relaxed text-[#A0ADA4]">
          <p>
            Students often mistakenly apply LR terminology (Shift/Reduce or Reduce/Reduce) to LL(1) tables. In LL(1) parsing:
          </p>
          <ul className="list-disc list-inside space-y-1.5 ml-2 text-[#A0ADA4]">
            <li>
              <strong className="text-[#FF5252]">FIRST/FIRST Conflict:</strong> Two alternative productions for the same non-terminal can both start with the same terminal token. The parser cannot decide which production to predict based on the lookahead.
            </li>
            <li>
              <strong className="text-[#FFD740]">FIRST/FOLLOW Conflict:</strong> One alternative can start with terminal <code className="text-[#F5F7F5] font-mono">a</code>, while another alternative can derive <code className="text-[#FFD740] font-mono">{EPSILON}</code> and <code className="text-[#F5F7F5] font-mono">a</code> is in the non-terminal&apos;s <code className="text-[#00E676] font-mono">FOLLOW</code> set.
            </li>
          </ul>
        </div>
      ),
    },
    {
      id: 'predictive-parser',
      title: '8. Stack-Based Predictive Parsing Algorithm',
      content: (
        <div className="space-y-3 text-xs leading-relaxed text-[#A0ADA4]">
          <p>
            The parser maintains a stack initialized with <code className="text-[#00E676] font-mono">{END_MARKER} S</code> (where S is the start symbol) and an input buffer with <code className="text-[#00E676] font-mono">w {END_MARKER}</code>.
          </p>
          <div className="p-3 bg-[#050807] border border-[#1B3326] rounded-lg font-mono text-[#F5F7F5] space-y-1">
            <div>Let X = top of stack, a = current input token.</div>
            <div>1. If X == a == $: ACCEPT and terminate successfully.</div>
            <div>2. If X == a != $: MATCH! Pop X from stack, advance input.</div>
            <div>3. If X is a terminal and X != a: SYNTAX ERROR (mismatched terminal).</div>
            <div>4. If X is a non-terminal:</div>
            <div className="ml-4">a. If M[X, a] == &#123; X -&gt; Y₁ Y₂ ... Yₖ &#125;:</div>
            <div className="ml-8">Pop X. Push Yₖ, Yₖ₋₁, ..., Y₁ in REVERSE order onto stack.</div>
            <div className="ml-4">b. If M[X, a] is empty: SYNTAX ERROR (unexpected token).</div>
          </div>
        </div>
      ),
    },
  ];

  const filtered = sections.filter(
    (s) =>
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="p-5 rounded-xl bg-[#0D1410] border border-[#1B3326] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-[#F5F7F5] flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#00E676]" />
            Compiler Design Theory &amp; Documentation
          </h2>
          <p className="text-xs text-[#A0ADA4] mt-0.5">
            Formal definitions, mathematical proofs, and algorithms governing LL(1) grammar analysis.
          </p>
        </div>

        <div className="flex items-center gap-2 max-w-xs w-full">
          <Search className="w-4 h-4 text-[#68776D]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search topics (e.g. LL(1), FIRST)..."
            className="w-full bg-[#050807] border border-[#1B3326] rounded-lg px-3 py-1.5 text-xs text-[#F5F7F5] placeholder-[#68776D] focus:outline-none focus:border-[#00E676] font-mono"
          />
        </div>
      </div>

      {/* Sections List */}
      <div className="space-y-4">
        {filtered.map((sec) => (
          <div
            key={sec.id}
            id={sec.id}
            className="p-5 rounded-xl bg-[#0D1410] border border-[#1B3326] space-y-3"
          >
            <h3 className="text-sm font-bold text-[#00E676]">{sec.title}</h3>
            {sec.content}
          </div>
        ))}
      </div>
    </div>
  );
};
