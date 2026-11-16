import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  XCircle,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { AGENT_ROLES, AgentStageId, SCENARIOS, Scenario, VerdictLevel } from '../data/scenarios';
import { AgentPipeline, NodeState } from './AgentPipeline';
import { ChatMessage } from './DialogueWorkspace';

interface MissionResultProps {
  scenario: Scenario;
  messages: ChatMessage[];
  onRestart: () => void;
  onSelectScenario: (scenarioId: string) => void;
  onBackHome: () => void;
  onOpenDetails: () => void;
}

function getVerdictTheme(verdict: VerdictLevel) {
  if (verdict === 'хорошо') {
    return {
      text: 'text-emerald-700',
      surface: 'bg-emerald-50 border-emerald-200',
      scoreColor: 'text-emerald-700',
      Icon: CheckCircle2,
    };
  }
  if (verdict === 'средне') {
    return {
      text: 'text-amber-700',
      surface: 'bg-amber-50 border-amber-200',
      scoreColor: 'text-amber-700',
      Icon: AlertTriangle,
    };
  }
  return {
    text: 'text-red-700',
    surface: 'bg-red-50 border-red-200',
    scoreColor: 'text-red-700',
    Icon: XCircle,
  };
}

function CriterionBadge({ rating }: { rating: VerdictLevel }) {
  if (rating === 'хорошо') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 whitespace-nowrap shrink-0">
        <CheckCircle2 className="w-4 h-4 text-emerald-600" aria-hidden="true" />
        <span>хорошо</span>
      </span>
    );
  }
  if (rating === 'средне') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 whitespace-nowrap shrink-0">
        <AlertTriangle className="w-4 h-4 text-amber-600" aria-hidden="true" />
        <span>средне</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-700 whitespace-nowrap shrink-0">
      <XCircle className="w-4 h-4 text-red-600" aria-hidden="true" />
      <span>плохо</span>
    </span>
  );
}

const COMPLETED_PIPELINE: Record<AgentStageId, NodeState> = AGENT_ROLES.reduce(
  (acc, agent) => {
    acc[agent.id] = 'completed';
    return acc;
  },
  {} as Record<AgentStageId, NodeState>
);

export function MissionResult({
  scenario,
  messages,
  onRestart,
  onSelectScenario,
  onBackHome,
  onOpenDetails,
}: MissionResultProps) {
  const { finalAnalysis } = scenario;
  const theme = getVerdictTheme(finalAnalysis.verdict);
  const VerdictIcon = theme.Icon;

  const [displayScore, setDisplayScore] = useState(0);
  const [showTranscript, setShowTranscript] = useState(false);

  const otherScenarios = SCENARIOS.filter((s) => s.id !== scenario.id);

  // Animate score counter from 0 to target
  useEffect(() => {
    const prefersReduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
    if (prefersReduced) {
      setDisplayScore(finalAnalysis.score);
      return;
    }

    let frameId = 0;
    const duration = 900;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.round(eased * finalAnalysis.score));
      if (progress < 1) {
        frameId = requestAnimationFrame(tick);
      }
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [finalAnalysis.score]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Compact Header with Completed Pipeline */}
      <header className="bg-gradient-to-br from-[#1B3A6B] via-[#152E56] to-[#0D1E3B] text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/12">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={onBackHome}
                className="text-base font-extrabold tracking-tight text-white hover:text-sky-200 transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                STIMIT
              </button>
              <span className="text-white/30" aria-hidden="true">
                /
              </span>
              <span className="text-sm text-white/85 truncate">
                Сценарий {scenario.number}: {scenario.title}
              </span>
            </div>

            <button
              type="button"
              onClick={onBackHome}
              className="px-3.5 py-1.5 text-xs sm:text-sm font-medium text-white/90 bg-white/10 hover:bg-white/18 border border-white/20 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Все сценарии
            </button>
          </div>

          <div className="pt-4">
            <AgentPipeline
              nodeStates={COMPLETED_PIPELINE}
              animateSignals={false}
              compact
            />
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Top Verdict Card — Итог миссии */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 sm:p-8"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="text-xs font-semibold text-slate-500">
                Итог миссии · Сценарий {scenario.number} · Заказ{' '}
                <span className="font-mono">{scenario.orderNumber}</span>
              </div>
              <h1 className="mt-1.5 text-2xl sm:text-3xl font-extrabold text-slate-900">
                {scenario.title}
              </h1>
              <p className="mt-2 text-sm text-slate-600 max-w-2xl">
                {finalAnalysis.finalizer.summaryTitle}
              </p>
            </div>

            <div
              className={`flex items-center gap-5 px-6 py-4 rounded-xl border ${theme.surface} shrink-0`}
            >
              <div className="flex items-center gap-2.5">
                <VerdictIcon
                  className={`w-7 h-7 ${theme.text}`}
                  aria-hidden="true"
                />
                <div>
                  <div className="text-xs text-slate-500 font-medium">
                    Вердикт
                  </div>
                  <div
                    className={`text-2xl font-extrabold tracking-tight ${theme.text}`}
                  >
                    {finalAnalysis.verdictLabel}
                  </div>
                </div>
              </div>

              <div className="h-10 w-px bg-slate-300/70" aria-hidden="true" />

              <div className="text-right">
                <div className="text-xs text-slate-500 font-medium">Балл</div>
                <div
                  className={`text-3xl font-mono font-bold tabular-nums leading-none mt-0.5 ${theme.scoreColor}`}
                >
                  {displayScore}
                  <span className="text-base font-medium text-slate-400">
                    /100
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Primary Actions */}
          <div className="mt-6 pt-5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={onRestart}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
              >
                <RotateCcw className="w-4 h-4" aria-hidden="true" />
                <span>Пройти ещё раз</span>
              </button>

              <button
                type="button"
                onClick={onBackHome}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#1B3A6B] hover:bg-[#142D54] rounded-lg transition-colors cursor-pointer whitespace-nowrap"
              >
                <span>Пройти другой сценарий</span>
              </button>
            </div>

            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setShowTranscript((prev) => !prev)}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 cursor-pointer whitespace-nowrap"
              >
                <span>История диалога</span>
                {showTranscript ? (
                  <ChevronUp className="w-4 h-4" aria-hidden="true" />
                ) : (
                  <ChevronDown className="w-4 h-4" aria-hidden="true" />
                )}
              </button>

              <button
                type="button"
                onClick={onOpenDetails}
                className="text-sm font-semibold text-[#1B3A6B] hover:underline cursor-pointer whitespace-nowrap"
              >
                Подробнее: как думали агенты
              </button>
            </div>
          </div>

          {/* Optional Collapsible Transcript */}
          {showTranscript && (
            <div className="mt-5 pt-5 border-t border-slate-200">
              <h2 className="text-sm font-bold text-slate-900 mb-3">
                Запись переписки
              </h2>
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${
                      msg.sender === 'client' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-xl px-3.5 py-2 rounded-lg text-xs sm:text-sm ${
                        msg.sender === 'client'
                          ? 'bg-[#1B3A6B] text-white'
                          : 'bg-slate-100 text-slate-800'
                      }`}
                    >
                      <span className="font-semibold mr-1.5">
                        {msg.sender === 'client' ? 'Клиент:' : 'Оператор:'}
                      </span>
                      <span>{msg.text}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.section>

        {/* 1. Оценщик — 6 критериев */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
          className="bg-white border border-slate-200 rounded-xl shadow-sm p-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 pb-4 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-900">
              Агент-Оценщик: разбор по 6 критериям
            </h2>
            <span className="text-xs text-slate-500">
              Только факты по диалогу, без обобщений
            </span>
          </div>

          <div className="divide-y divide-slate-100 mt-1">
            {finalAnalysis.evaluator.map((item) => (
              <div
                key={item.criterion}
                className="py-3.5 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2"
              >
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-slate-900">
                    {item.criterion}
                  </div>
                  <p className="text-sm text-slate-600 mt-0.5">{item.reason}</p>
                </div>
                <CriterionBadge rating={item.rating} />
              </div>
            ))}
          </div>
        </motion.section>

        {/* 2. Критик + Калибратор */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.25,
              delay: 0.22,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="bg-white border border-slate-200 rounded-xl shadow-sm p-6"
          >
            <h2 className="text-lg font-bold text-slate-900">
              Агент-Критик: ошибки и завышения
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 mb-4">
              Ищет слабые места и проверяет, не завышена ли оценка
            </p>
            <ol className="space-y-3">
              {finalAnalysis.critic.map((point, idx) => (
                <li
                  key={point}
                  className="flex items-start gap-3 text-sm text-slate-700 leading-relaxed"
                >
                  <span className="font-mono tabular-nums text-xs font-bold text-[#1B3A6B] bg-[#1B3A6B]/8 px-2 py-0.5 rounded mt-0.5 shrink-0">
                    {idx + 1}
                  </span>
                  <span>{point}</span>
                </li>
              ))}
            </ol>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.25,
              delay: 0.3,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 flex flex-col justify-between"
          >
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Агент-Калибратор: строгая логика
              </h2>
              <p className="text-xs text-slate-500 mt-0.5 mb-4">
                Опирается на весь анализ и проверяет блокирующие правила
              </p>
              <p className="text-sm text-slate-800 leading-relaxed bg-slate-50 border border-slate-200 rounded-lg p-4">
                {finalAnalysis.calibrator}
              </p>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Итоговый уровень калибровки</span>
              <span className={`font-bold ${theme.text}`}>
                {finalAnalysis.verdictLabel}
              </span>
            </div>
          </motion.section>
        </div>

        {/* 3. Финализатор: Почему / Что было хорошо / Что улучшить */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.38, ease: [0.16, 1, 0.3, 1] }}
          className="bg-white border border-slate-200 rounded-xl shadow-sm p-6"
        >
          <h2 className="text-lg font-bold text-slate-900 pb-4 border-b border-slate-100">
            Агент-Финализатор: выводы и рекомендации
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-5">
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-3">Почему</h3>
              <ul className="space-y-2 text-sm text-slate-700 leading-relaxed">
                {finalAnalysis.finalizer.why.map((reason, idx) => (
                  <li key={reason} className="flex items-start gap-2.5">
                    <span className="font-mono tabular-nums text-xs font-semibold text-slate-400 mt-0.5 shrink-0">
                      {idx + 1})
                    </span>
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="md:border-l md:border-slate-100 md:pl-6">
              <h3 className="text-sm font-bold text-emerald-700 mb-3">
                Что было хорошо
              </h3>
              <ul className="space-y-2 text-sm text-slate-700 leading-relaxed">
                {finalAnalysis.finalizer.whatWasGood.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <CheckCircle2
                      className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0"
                      aria-hidden="true"
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="md:border-l md:border-slate-100 md:pl-6">
              <h3 className="text-sm font-bold text-[#1B3A6B] mb-3">
                Что улучшить
              </h3>
              <ul className="space-y-2 text-sm text-slate-700 leading-relaxed">
                {finalAnalysis.finalizer.whatToImprove.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="text-[#1B3A6B] font-bold mt-0.5 shrink-0">
                      →
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.section>

        {/* Quick Switch to Other Scenarios */}
        <section className="pt-2">
          <h2 className="text-base font-bold text-slate-900 mb-3">
            Попробовать другие сценарии
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {otherScenarios.map((other) => (
              <button
                key={other.id}
                type="button"
                onClick={() => onSelectScenario(other.id)}
                className="text-left bg-white border border-slate-200 hover:border-[#1B3A6B]/50 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-150 cursor-pointer"
              >
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="font-mono tabular-nums font-semibold text-[#1B3A6B]">
                    Сценарий {other.number}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums">{other.stepsCount} шагов</span>
                </div>
                <div className="mt-1.5 text-base font-bold text-slate-900">
                  {other.title}
                </div>
                <p className="mt-1 text-xs sm:text-sm text-slate-600">
                  {other.shortDescription}
                </p>
              </button>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
