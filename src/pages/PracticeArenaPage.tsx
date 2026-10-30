import React, { useState, useEffect, useMemo } from 'react';
import {
  Trophy,
  Flame,
  Target,
  RotateCcw,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Sparkles,
  HelpCircle,
  Code2,
  Play,
  Zap,
} from 'lucide-react';
import { useGrammar } from '../context/GrammarContext.tsx';
import { simulatePredictiveParsing } from '../../server/compiler/predictive_parser.ts';
import { getBenchmarkInputs } from '../utils/benchmarkInputs.ts';

interface Question {
  id: string;
  type: 'acceptance' | 'first' | 'follow' | 'll1';
  prompt: string;
  testValue?: string;
  options: { label: string; value: string }[];
  correctAnswer: string;
  explanation: string;
}

export const PracticeArenaPage: React.FC = () => {
  const { activeGrammar, tableResult, firstFollowResult, activeExampleId } = useGrammar();

  // Arena scoring states
  const [score, setScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [bestStreak, setBestStreak] = useState<number>(0);
  const [answeredCount, setAnsweredCount] = useState<number>(0);
  const [correctCount, setCorrectCount] = useState<number>(0);

  // Active question states
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);

  // Generate dynamic challenges from active grammar
  const questions: Question[] = useMemo(() => {
    if (!activeGrammar || activeGrammar.productions.length === 0) return [];

    const qs: Question[] = [];
    const benchmarks = getBenchmarkInputs(activeGrammar, activeExampleId);

    // 1. Acceptance challenge for benchmarks
    benchmarks.forEach((bm, idx) => {
      const sim = simulatePredictiveParsing(activeGrammar, bm.input);
      const isAccepted = sim.accepted;
      const displayStr = bm.input === '' ? 'ε (empty string)' : `"${bm.input}"`;

      qs.push({
        id: `acc_${idx}_${bm.input}`,
        type: 'acceptance',
        prompt: `Given the active grammar with start symbol '${activeGrammar.startSymbol}', determine whether the input string ${displayStr} is ACCEPTED or REJECTED by the predictive parser.`,
        testValue: bm.input === '' ? 'ε' : bm.input,
        options: [
          { label: 'ACCEPT', value: 'ACCEPT' },
          { label: 'REJECT', value: 'REJECT' },
        ],
        correctAnswer: isAccepted ? 'ACCEPT' : 'REJECT',
        explanation: isAccepted
          ? `The string ${displayStr} is ACCEPTED in ${sim.totalSteps} steps through derivation.`
          : `The string ${displayStr} is REJECTED. Error diagnostic: ${sim.error?.message || 'Syntax error / missing derivation route.'}`,
      });
    });

    // 2. FIRST set questions
    if (firstFollowResult) {
      activeGrammar.nonTerminals.slice(0, 3).forEach((nt, idx) => {
        const firsts = firstFollowResult.firstSets[nt] || [];
        if (firsts.length > 0) {
          const sampleSym = firsts[0];
          qs.push({
            id: `first_${idx}_${nt}`,
            type: 'first',
            prompt: `Does FIRST(${nt}) contain the terminal symbol '${sampleSym}'?`,
            testValue: `${nt} → '${sampleSym}'`,
            options: [
              { label: 'YES, contains symbol', value: 'YES' },
              { label: 'NO, does not contain', value: 'NO' },
            ],
            correctAnswer: 'YES',
            explanation: `FIRST(${nt}) = { ${firsts.join(', ')} }, so '${sampleSym}' is indeed a member.`,
          });
        }
      });

      // 3. FOLLOW set questions
      const startNt = activeGrammar.startSymbol;
      const startFollow = firstFollowResult.followSets[startNt] || [];
      qs.push({
        id: `follow_start`,
        type: 'follow',
        prompt: `By compiler theory Rule 1, does FOLLOW(${startNt}) of the start symbol contain '$' (the end marker)?`,
        testValue: `FOLLOW(${startNt})`,
        options: [
          { label: 'YES, contains $', value: 'YES' },
          { label: 'NO, does not contain $', value: 'NO' },
        ],
        correctAnswer: 'YES',
        explanation: `Rule 1 of FOLLOW computation asserts that the end-marker '$' is always in the FOLLOW set of the grammar's start symbol.`,
      });
    }

    // 4. LL(1) Table conflict question
    if (tableResult) {
      const isLL1 = tableResult.isLL1;
      qs.push({
        id: `ll1_check`,
        type: 'll1',
        prompt: `Is the current active grammar LL(1) compliant (zero multiple entries / conflicts in table M)?`,
        testValue: `LL(1) Evaluation`,
        options: [
          { label: 'YES, LL(1) Compliant', value: 'YES' },
          { label: 'NO, contains Conflicts', value: 'NO' },
        ],
        correctAnswer: isLL1 ? 'YES' : 'NO',
        explanation: isLL1
          ? `Every cell in the predictive matrix M[A, a] contains at most one production rule. No FIRST/FIRST or FIRST/FOLLOW conflicts exist.`
          : `The grammar has ${tableResult.conflicts.length} multiply-defined cell conflicts, violating LL(1) determinism.`,
      });
    }

    return qs;
  }, [activeGrammar, tableResult, firstFollowResult, activeExampleId]);

  // Reset when grammar changes
  useEffect(() => {
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setIsAnswered(false);
  }, [activeGrammar]);

  const currentQ = questions[currentQuestionIndex] || questions[0];

  const handleSelectOption = (value: string) => {
    if (isAnswered) return;
    setSelectedAnswer(value);
    setIsAnswered(true);

    const isCorrect = value === currentQ.correctAnswer;
    setAnsweredCount((prev) => prev + 1);

    if (isCorrect) {
      setCorrectCount((prev) => prev + 1);
      setScore((prev) => prev + 100 + streak * 20);
      setStreak((prev) => {
        const next = prev + 1;
        if (next > bestStreak) setBestStreak(next);
        return next;
      });
    } else {
      setStreak(0);
    }
  };

  const handleNextQuestion = () => {
    setSelectedAnswer(null);
    setIsAnswered(false);
    setCurrentQuestionIndex((prev) => (prev + 1) % Math.max(1, questions.length));
  };

  const handleResetScore = () => {
    setScore(0);
    setStreak(0);
    setAnsweredCount(0);
    setCorrectCount(0);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setCurrentQuestionIndex(0);
  };

  const accuracy = answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0;

  if (!activeGrammar || questions.length === 0) {
    return (
      <div className="p-8 text-center text-[#A0ADA4] bg-[#0D1410] rounded-xl border border-[#1B3326]">
        Please load or define a grammar to generate interactive challenges in the Practice Arena.
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="p-5 rounded-xl bg-[#0D1410] border border-[#1B3326] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-[#F5F7F5] flex items-center gap-2">
            <Trophy className="w-5 h-5 text-[#00E676]" />
            Practice Arena – Interactive Compiler Challenges
          </h2>
          <p className="text-xs text-[#A0ADA4] mt-0.5">
            Test your predictive parsing mastery with live algorithm-driven questions on the active grammar.
          </p>
        </div>

        <button
          onClick={handleResetScore}
          className="px-3 py-1.5 rounded-lg bg-[#111B15] hover:bg-[#15231A] text-[#A0ADA4] hover:text-[#F5F7F5] border border-[#1B3326] text-xs font-medium flex items-center gap-1.5 transition cursor-pointer self-start sm:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Stats</span>
        </button>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-[#0D1410] border border-[#1B3326]">
          <span className="text-[11px] font-semibold text-[#68776D] uppercase tracking-wider block mb-1">
            Total Score
          </span>
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-[#00E676]" />
            <span className="text-xl font-bold font-mono text-[#F5F7F5]">{score}</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0D1410] border border-[#1B3326]">
          <span className="text-[11px] font-semibold text-[#68776D] uppercase tracking-wider block mb-1">
            Current Streak
          </span>
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-[#00E676]" />
            <span className="text-xl font-bold font-mono text-[#F5F7F5]">
              {streak} <span className="text-xs text-[#68776D] font-normal">(Best: {bestStreak})</span>
            </span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0D1410] border border-[#1B3326]">
          <span className="text-[11px] font-semibold text-[#68776D] uppercase tracking-wider block mb-1">
            Accuracy
          </span>
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-[#00E676]" />
            <span className="text-xl font-bold font-mono text-[#F5F7F5]">{accuracy}%</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0D1410] border border-[#1B3326]">
          <span className="text-[11px] font-semibold text-[#68776D] uppercase tracking-wider block mb-1">
            Questions Answered
          </span>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#69F0AE]" />
            <span className="text-xl font-bold font-mono text-[#F5F7F5]">
              {correctCount} / {answeredCount}
            </span>
          </div>
        </div>
      </div>

      {/* Main Question Card */}
      {currentQ && (
        <div className="p-6 rounded-xl bg-[#0D1410] border border-[#1B3326] space-y-5">
          {/* Question Index & Category Badge */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#111B15] text-[#00E676] border border-[#1B3326] text-xs font-mono font-semibold">
                Question {currentQuestionIndex + 1} of {questions.length}
              </span>
              <span className="text-xs font-mono text-[#68776D] uppercase">
                {currentQ.type.toUpperCase()} CHALLENGE
              </span>
            </div>

            {/* Active grammar pill */}
            <span className="text-xs font-mono text-[#A0ADA4] bg-[#111B15] px-2.5 py-1 rounded-md border border-[#1B3326]">
              Grammar: S = <strong className="text-[#00E676]">{activeGrammar.startSymbol}</strong>
            </span>
          </div>

          {/* Question Prompt */}
          <div className="space-y-2">
            <h3 className="text-base sm:text-lg font-medium text-[#F5F7F5] leading-relaxed">
              {currentQ.prompt}
            </h3>

            {currentQ.testValue && (
              <div className="p-3 rounded-lg bg-[#050807] border border-[#1B3326] font-mono text-sm text-[#69F0AE] inline-block">
                Token String: <span className="font-bold text-[#F5F7F5]">{currentQ.testValue}</span>
              </div>
            )}
          </div>

          {/* Options Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {currentQ.options.map((opt) => {
              const isSelected = selectedAnswer === opt.value;
              const isCorrectOption = opt.value === currentQ.correctAnswer;

              let optionStyle =
                'bg-[#111B15] border-[#1B3326] text-[#F5F7F5] hover:bg-[#15231A] hover:border-[#00E676]/60';

              if (isAnswered) {
                if (isCorrectOption) {
                  optionStyle = 'bg-[#00E676]/15 border-[#00E676] text-[#00E676] font-bold';
                } else if (isSelected && !isCorrectOption) {
                  optionStyle = 'bg-[#FF5252]/15 border-[#FF5252] text-[#FF5252] font-bold';
                } else {
                  optionStyle = 'bg-[#111B15] border-[#1B3326] text-[#68776D] opacity-60';
                }
              }

              return (
                <button
                  key={opt.value}
                  onClick={() => handleSelectOption(opt.value)}
                  disabled={isAnswered}
                  className={`p-4 rounded-xl border text-sm font-semibold transition flex items-center justify-between cursor-pointer disabled:cursor-default ${optionStyle}`}
                >
                  <span className="flex items-center gap-2">
                    {opt.label === 'ACCEPT' && <CheckCircle2 className="w-4 h-4 text-[#00E676]" />}
                    {opt.label === 'REJECT' && <XCircle className="w-4 h-4 text-[#FF5252]" />}
                    {opt.label}
                  </span>

                  {isAnswered && isCorrectOption && (
                    <CheckCircle2 className="w-4 h-4 text-[#00E676]" />
                  )}
                  {isAnswered && isSelected && !isCorrectOption && (
                    <XCircle className="w-4 h-4 text-[#FF5252]" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Explanation Banner (Appears after answer) */}
          {isAnswered && (
            <div
              className={`p-4 rounded-xl border text-xs space-y-2 animate-in fade-in ${
                selectedAnswer === currentQ.correctAnswer
                  ? 'bg-[#00E676]/10 border-[#00E676]/40 text-[#69F0AE]'
                  : 'bg-[#FF5252]/10 border-[#FF5252]/40 text-[#FF5252]'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-sm">
                {selectedAnswer === currentQ.correctAnswer ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-[#00E676]" />
                    <span className="text-[#00E676]">Correct! +100 points</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 text-[#FF5252]" />
                    <span className="text-[#FF5252]">Incorrect. Keep learning!</span>
                  </>
                )}
              </div>
              <p className="text-[#A0ADA4] leading-relaxed font-sans">{currentQ.explanation}</p>
            </div>
          )}

          {/* Footer Controls */}
          {isAnswered && (
            <div className="flex items-center justify-end pt-3 border-t border-[#1B3326]">
              <button
                onClick={handleNextQuestion}
                className="px-5 py-2.5 rounded-lg bg-[#00E676] hover:bg-[#00C853] text-[#050807] font-bold text-xs flex items-center gap-2 transition cursor-pointer"
              >
                <span>Next Challenge</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
