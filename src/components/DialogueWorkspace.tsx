import {
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  MessageSquare,
  RotateCcw,
  Send,
  Sparkles,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { FormEvent, useEffect, useRef, useState } from 'react';
import {
  AGENT_ROLES,
  AgentStageId,
  AnalystSnapshot,
  ReplyOption,
  Scenario,
} from '../data/scenarios';
import { CollectedObservation } from './AgentDetailsModal';
import { AgentPipeline, NodeState } from './AgentPipeline';

export interface ChatMessage {
  id: string;
  sender: 'client' | 'operator' | 'demo-notice';
  text: string;
  showExampleButtons?: boolean;
}

interface DialogueWorkspaceProps {
  scenario: Scenario;
  hasInteracted: boolean;
  onFirstInteract: () => void;
  onComplete: (
    messages: ChatMessage[],
    observations: CollectedObservation[]
  ) => void;
  onOpenDetails: (
    stepIndex: number,
    observations: CollectedObservation[]
  ) => void;
  onBackHome: () => void;
  onRestart: () => void;
}

type PipelineRunStage =
  | null
  | 'evaluator'
  | 'critic'
  | 'calibrator'
  | 'finalizer';

const PIPELINE_MESSAGES: Record<Exclude<PipelineRunStage, null>, string> = {
  evaluator: 'Агент-Оценщик выставляет баллы по 6 критериям…',
  critic: 'Агент-Критик ищет слабые места и проверяет завышения…',
  calibrator: 'Агент-Калибратор применяет строгие правила…',
  finalizer: 'Агент-Финализатор формирует итоговый вердикт…',
};

export function DialogueWorkspace({
  scenario,
  hasInteracted,
  onFirstInteract,
  onComplete,
  onOpenDetails,
  onBackHome,
  onRestart,
}: DialogueWorkspaceProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [triedAltIds, setTriedAltIds] = useState<string[]>([]);
  const [isOperatorTyping, setIsOperatorTyping] = useState(false);

  const [analystState, setAnalystState] = useState<AnalystSnapshot | null>(
    null
  );
  const [observations, setObservations] = useState<CollectedObservation[]>([]);
  const [changedFields, setChangedFields] = useState<{
    problem: boolean;
    request: boolean;
    status: boolean;
    observation: boolean;
  }>({
    problem: false,
    request: false,
    status: false,
    observation: false,
  });

  const [mobileTab, setMobileTab] = useState<'dialogue' | 'agents'>('dialogue');
  const [customInput, setCustomInput] = useState('');
  const [pipelineStage, setPipelineStage] = useState<PipelineRunStage>(null);

  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const timeoutsRef = useRef<number[]>([]);

  const clearAllTimeouts = () => {
    timeoutsRef.current.forEach((id) => window.clearTimeout(id));
    timeoutsRef.current = [];
  };

  useEffect(() => {
    return () => clearAllTimeouts();
  }, []);

  // Reset state whenever scenario changes or restarts
  useEffect(() => {
    clearAllTimeouts();
    setCurrentStepIndex(0);
    setMessages([]);
    setTriedAltIds([]);
    setIsOperatorTyping(false);
    setAnalystState(null);
    setObservations([]);
    setChangedFields({
      problem: false,
      request: false,
      status: false,
      observation: false,
    });
    setCustomInput('');
    setPipelineStage(null);
    setMobileTab('dialogue');
  }, [scenario.id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isOperatorTyping, currentStepIndex]);

  const currentStep = scenario.steps[currentStepIndex];
  const isDialogueFinished = pipelineStage !== null;

  const triggerFieldHighlights = (
    prevAnalyst: AnalystSnapshot | null,
    nextAnalyst: AnalystSnapshot,
    hasNewObs: boolean
  ) => {
    setChangedFields({
      problem: prevAnalyst?.problem !== nextAnalyst.problem,
      request: prevAnalyst?.request !== nextAnalyst.request,
      status: prevAnalyst?.status !== nextAnalyst.status,
      observation: hasNewObs,
    });

    const t = window.setTimeout(() => {
      setChangedFields({
        problem: false,
        request: false,
        status: false,
        observation: false,
      });
    }, 1600);
    timeoutsRef.current.push(t);
  };

  const runFullPipeline = (
    finalMessages: ChatMessage[],
    finalObservations: CollectedObservation[]
  ) => {
    const prefersReduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
    const stepDelay = prefersReduced ? 150 : 720;

    setPipelineStage('evaluator');

    const t1 = window.setTimeout(() => setPipelineStage('critic'), stepDelay);
    const t2 = window.setTimeout(
      () => setPipelineStage('calibrator'),
      stepDelay * 2
    );
    const t3 = window.setTimeout(
      () => setPipelineStage('finalizer'),
      stepDelay * 3
    );
    const t4 = window.setTimeout(
      () => onComplete(finalMessages, finalObservations),
      stepDelay * 4
    );

    timeoutsRef.current.push(t1, t2, t3, t4);
  };

  const handleSelectOption = (option: ReplyOption) => {
    if (isOperatorTyping || isDialogueFinished || !currentStep) return;
    if (!hasInteracted) {
      onFirstInteract();
    }

    const clientMsg: ChatMessage = {
      id: `client-${Date.now()}-${option.id}`,
      sender: 'client',
      text: option.text,
    };

    const updatedMessagesWithClient = [...messages, clientMsg];
    setMessages(updatedMessagesWithClient);
    setIsOperatorTyping(true);

    if (!option.isMain) {
      // Alternative branch: short live operator comment, step stays the same
      if (!triedAltIds.includes(option.id)) {
        setTriedAltIds((prev) => [...prev, option.id]);
      }

      const t = window.setTimeout(() => {
        setIsOperatorTyping(false);
        const opMsg: ChatMessage = {
          id: `op-alt-${Date.now()}-${option.id}`,
          sender: 'operator',
          text:
            option.altOperatorReply ??
            'Понимаю. Уточните детали, пожалуйста.',
        };
        setMessages((prev) => [...prev, opMsg]);
      }, 620);
      timeoutsRef.current.push(t);
      return;
    }

    // Main branch: operator responds, Analyst & Evaluator update, advance step or finish
    const stepSnapshot = currentStep;
    const stepIdx = currentStepIndex;

    const t = window.setTimeout(() => {
      setIsOperatorTyping(false);
      const opMsg: ChatMessage = {
        id: `op-main-${Date.now()}-${stepSnapshot.stepNumber}`,
        sender: 'operator',
        text: stepSnapshot.mainOperatorReply,
      };
      const nextMessages = [...updatedMessagesWithClient, opMsg];
      setMessages(nextMessages);

      // Update Analyst and Evaluator panels
      const prevAnalyst = analystState;
      const nextAnalyst = stepSnapshot.analyst;
      setAnalystState(nextAnalyst);

      let nextObservations = observations;
      const hasNewObs = Boolean(stepSnapshot.evaluatorObservation);
      if (stepSnapshot.evaluatorObservation) {
        nextObservations = [
          ...observations,
          {
            stepNumber: stepSnapshot.stepNumber,
            observation: stepSnapshot.evaluatorObservation,
          },
        ];
        setObservations(nextObservations);
      }

      triggerFieldHighlights(prevAnalyst, nextAnalyst, hasNewObs);

      if (stepIdx < scenario.steps.length - 1) {
        setCurrentStepIndex(stepIdx + 1);
        setTriedAltIds([]);
      } else {
        // Step 5 finished -> launch full 5-agent pipeline
        runFullPipeline(nextMessages, nextObservations);
      }
    }, 680);

    timeoutsRef.current.push(t);
  };

  const handleCustomSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = customInput.trim();
    if (!trimmed || isOperatorTyping || isDialogueFinished) return;

    if (!hasInteracted) {
      onFirstInteract();
    }

    const clientMsg: ChatMessage = {
      id: `client-custom-${Date.now()}`,
      sender: 'client',
      text: trimmed,
    };

    const noticeMsg: ChatMessage = {
      id: `demo-notice-${Date.now()}`,
      sender: 'demo-notice',
      text: 'Это демо-стенд, показан сценарий работы системы.',
      showExampleButtons: true,
    };

    setMessages((prev) => [...prev, clientMsg, noticeMsg]);
    setCustomInput('');
  };

  // Compute pipeline node states
  const getPipelineNodeStates = (): Record<AgentStageId, NodeState> => {
    if (!pipelineStage) {
      return {
        analyst: messages.length > 0 ? 'active' : 'active',
        evaluator: observations.length > 0 ? 'active' : 'idle',
        critic: 'idle',
        calibrator: 'idle',
        finalizer: 'idle',
      };
    }

    const order: AgentStageId[] = [
      'analyst',
      'evaluator',
      'critic',
      'calibrator',
      'finalizer',
    ];
    const activeIdx = order.indexOf(pipelineStage);
    return order.reduce(
      (acc, id, idx) => {
        if (idx < activeIdx) acc[id] = 'completed';
        else if (idx === activeIdx) acc[id] = 'active';
        else acc[id] = 'idle';
        return acc;
      },
      {} as Record<AgentStageId, NodeState>
    );
  };

  const latestObservation =
    observations.length > 0 ? observations[observations.length - 1] : null;

  const activeStepNumber = Math.min(
    currentStepIndex + 1,
    scenario.stepsCount
  );

  return (
    <div className="min-h-screen flex flex-col">
      {/* Dark-blue header with scenario info, progress & 5-agent pipeline */}
      <header className="bg-gradient-to-br from-[#1B3A6B] via-[#152E56] to-[#0D1E3B] text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/12">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={onBackHome}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-white/80 hover:text-white transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                <span>На главную</span>
              </button>
              <span className="text-white/25" aria-hidden="true">
                ·
              </span>
              <h1 className="text-sm sm:text-base font-bold text-white truncate">
                Сценарий {scenario.number}. {scenario.title}
              </h1>
            </div>

            <div className="flex items-center gap-4 shrink-0">
              <div className="text-sm font-mono font-semibold tabular-nums text-sky-200 whitespace-nowrap">
                Шаг {activeStepNumber} из {scenario.stepsCount}
              </div>
              <button
                type="button"
                onClick={onRestart}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white/90 bg-white/10 hover:bg-white/18 border border-white/20 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                title="Начать сценарий заново"
              >
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Сначала</span>
              </button>
            </div>
          </div>

          {/* Live 5-Agent Conveyor */}
          <div className="pt-4">
            <AgentPipeline
              nodeStates={getPipelineNodeStates()}
              animateSignals
              compact
            />
          </div>
        </div>
      </header>

      {/* Mobile Tabs: Диалог / Агенты */}
      <div className="lg:hidden bg-white border-b border-slate-200 px-4 py-2.5 sticky top-0 z-20">
        <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-lg max-w-md mx-auto">
          <button
            type="button"
            onClick={() => setMobileTab('dialogue')}
            className={`px-3 py-2 text-xs sm:text-sm font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
              mobileTab === 'dialogue'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Диалог
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('agents')}
            className={`px-3 py-2 text-xs sm:text-sm font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap tabular-nums ${
              mobileTab === 'agents'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Агенты {observations.length > 0 ? `(${observations.length})` : ''}
          </button>
        </div>
      </div>

      {/* Main Split Workspace */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Post-Step-5 Full Pipeline Runner Banner */}
        {pipelineStage && (
          <div className="mb-6 bg-[#1B3A6B] text-white rounded-xl p-4 sm:p-5 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Sparkles
                className="w-5 h-5 text-sky-300 shrink-0"
                aria-hidden="true"
              />
              <div>
                <div className="text-sm font-bold">
                  Диалог завершён — запускается полный конвейер оценки
                </div>
                <div className="text-xs sm:text-sm text-sky-100 mt-0.5">
                  {PIPELINE_MESSAGES[pipelineStage]}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                clearAllTimeouts();
                onComplete(messages, observations);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold text-slate-950 bg-white hover:bg-sky-50 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <span>К итогу</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: Dialogue */}
          <section
            className={`lg:col-span-7 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col overflow-hidden ${
              mobileTab === 'dialogue' ? 'flex' : 'hidden lg:flex'
            }`}
          >
            {/* Chat Header */}
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between gap-3 bg-slate-50/60">
              <div className="flex items-center gap-2.5 min-w-0">
                <MessageSquare
                  className="w-4 h-4 text-[#1B3A6B] shrink-0"
                  aria-hidden="true"
                />
                <span className="text-sm font-bold text-slate-900 truncate">
                  Чат с поддержкой доставки еды
                </span>
              </div>
              <span className="text-xs font-mono text-slate-500 tabular-nums shrink-0">
                Заказ {scenario.orderNumber}
              </span>
            </div>

            {/* First-visit Helper Bubble */}
            <AnimatePresence>
              {!hasInteracted && !isDialogueFinished && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18 }}
                  className="mx-5 mt-4 px-4 py-3 rounded-xl bg-sky-50 border border-sky-200 text-xs sm:text-sm text-[#1B3A6B] font-medium"
                >
                  Вы отвечаете за клиента — выбирайте реплики и смотрите, как
                  агенты оценивают оператора
                </motion.div>
              )}
            </AnimatePresence>

            {/* Chat Feed */}
            <div className="px-5 py-5 space-y-4 min-h-[280px] max-h-[420px] overflow-y-auto">
              {messages.length === 0 && !isOperatorTyping && (
                <div className="py-10 text-center text-sm text-slate-400">
                  Выберите первую реплику клиента ниже, чтобы начать диалог с
                  оператором
                </div>
              )}

              {messages.map((msg) => {
                if (msg.sender === 'demo-notice') {
                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.18 }}
                      className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs sm:text-sm text-slate-700"
                    >
                      <p className="font-semibold text-slate-900">{msg.text}</p>
                      {msg.showExampleButtons && currentStep && !isDialogueFinished && (
                        <div className="mt-3 flex flex-col gap-2">
                          <span className="text-xs text-slate-500">
                            Примеры реплик для этого шага:
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {currentStep.options.map((opt) => (
                              <button
                                key={`hint-${msg.id}-${opt.id}`}
                                type="button"
                                disabled={isOperatorTyping}
                                onClick={() => handleSelectOption(opt)}
                                className="text-left px-3 py-1.5 text-xs font-medium text-[#1B3A6B] bg-white hover:bg-[#1B3A6B]/8 border border-slate-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                              >
                                {opt.text}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  );
                }

                const isClient = msg.sender === 'client';
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                    className={`flex flex-col ${
                      isClient ? 'items-end' : 'items-start'
                    }`}
                  >
                    <span className="text-[11px] font-medium text-slate-400 mb-1 px-1">
                      {isClient ? 'Вы (клиент)' : 'Оператор поддержки'}
                    </span>
                    <div
                      className={`max-w-[85%] px-4 py-2.5 rounded-xl text-sm leading-relaxed ${
                        isClient
                          ? 'bg-[#1B3A6B] text-white rounded-br-sm'
                          : 'bg-slate-100 text-slate-800 rounded-bl-sm'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </motion.div>
                );
              })}

              {/* Typing Indicator */}
              {isOperatorTyping && (
                <div className="flex flex-col items-start">
                  <span className="text-[11px] font-medium text-slate-400 mb-1 px-1">
                    Оператор поддержки
                  </span>
                  <div className="px-4 py-2.5 rounded-xl rounded-bl-sm bg-slate-100 text-slate-500 text-sm inline-flex items-center gap-2">
                    <span>печатает…</span>
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Reply Choices */}
            {!isDialogueFinished && currentStep && (
              <div className="px-5 py-4 border-t border-slate-200 bg-slate-50/70 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-600">
                    Выберите реплику клиента (Шаг {activeStepNumber} из{' '}
                    {scenario.stepsCount})
                  </span>
                  {isOperatorTyping && (
                    <span className="text-xs text-slate-400">
                      Ожидаем ответ оператора…
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  {currentStep.options.map((option) => {
                    const alreadyTried = triedAltIds.includes(option.id);
                    return (
                      <button
                        key={option.id}
                        type="button"
                        disabled={isOperatorTyping}
                        onClick={() => handleSelectOption(option)}
                        className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all duration-150 flex items-center justify-between gap-3 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                          alreadyTried
                            ? 'bg-slate-100/80 border-slate-200 text-slate-500'
                            : 'bg-white border-slate-200 text-slate-800 hover:border-[#1B3A6B] hover:bg-[#1B3A6B]/[0.03] shadow-xs'
                        }`}
                      >
                        <span className="leading-snug">{option.text}</span>
                        {alreadyTried ? (
                          <span className="inline-flex items-center gap-1 text-xs text-slate-400 shrink-0 whitespace-nowrap">
                            <Check className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>спросили</span>
                          </span>
                        ) : (
                          <ArrowRight
                            className="w-4 h-4 text-slate-400 shrink-0"
                            aria-hidden="true"
                          />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Arbitrary Input Bar */}
                <form
                  onSubmit={handleCustomSubmit}
                  className="pt-2 flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    disabled={isOperatorTyping}
                    placeholder="Или введите свой текст для проверки стенда…"
                    aria-label="Произвольное сообщение клиента"
                    className="flex-1 min-w-0 px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30 focus:border-[#1B3A6B] disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={!customInput.trim() || isOperatorTyping}
                    aria-label="Отправить сообщение"
                    className="p-2.5 rounded-lg bg-slate-200 hover:bg-[#1B3A6B] text-slate-700 hover:text-white transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                  >
                    <Send className="w-4 h-4" aria-hidden="true" />
                  </button>
                </form>
              </div>
            )}
          </section>

          {/* RIGHT COLUMN: Compact Live Agent Panel */}
          <aside
            className={`lg:col-span-5 bg-white border border-slate-200 rounded-xl shadow-sm p-5 sm:p-6 space-y-5 ${
              mobileTab === 'agents' ? 'block' : 'hidden lg:block'
            }`}
          >
            <div className="flex items-start justify-between gap-3 pb-3.5 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Работа AI-агентов
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {pipelineStage
                    ? PIPELINE_MESSAGES[pipelineStage]
                    : 'Во время диалога работают Аналитик и Оценщик'}
                </p>
              </div>
              <span className="text-xs font-mono tabular-nums font-semibold text-[#1B3A6B] whitespace-nowrap shrink-0">
                {observations.length} / 4 набл.
              </span>
            </div>

            {/* 1. Аналитик ситуации (3 ключевых поля) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">
                  {AGENT_ROLES[0].name}
                </h3>
                <span className="text-xs text-slate-400">без оценки</span>
              </div>

              <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
                <div
                  className={`px-3.5 py-2.5 transition-colors duration-300 ${
                    changedFields.problem ? 'bg-sky-50' : 'bg-white'
                  }`}
                >
                  <div className="text-[11px] font-semibold text-slate-400">
                    Проблема
                  </div>
                  <div className="text-sm text-slate-800 mt-0.5">
                    {analystState?.problem ?? 'Ожидание реплики клиента…'}
                  </div>
                </div>

                <div
                  className={`px-3.5 py-2.5 transition-colors duration-300 ${
                    changedFields.request ? 'bg-sky-50' : 'bg-white'
                  }`}
                >
                  <div className="text-[11px] font-semibold text-slate-400">
                    Запрос клиента
                  </div>
                  <div className="text-sm text-slate-800 mt-0.5">
                    {analystState?.request ?? 'Ожидание реплики клиента…'}
                  </div>
                </div>

                <div
                  className={`px-3.5 py-2.5 transition-colors duration-300 ${
                    changedFields.status ? 'bg-sky-50' : 'bg-white'
                  }`}
                >
                  <div className="text-[11px] font-semibold text-slate-400">
                    Статус решения
                  </div>
                  <div className="text-sm font-medium text-slate-900 mt-0.5">
                    {analystState?.status ?? 'диалог не начат'}
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Оценщик — последние наблюдения (без итоговых баллов) */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">
                  {AGENT_ROLES[1].name}
                </h3>
                <span className="text-xs text-slate-400">
                  копит наблюдения
                </span>
              </div>

              <div
                className={`px-3.5 py-3 rounded-lg border transition-colors duration-300 ${
                  changedFields.observation
                    ? 'bg-sky-50 border-sky-300'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                {latestObservation ? (
                  <div>
                    <div className="text-[11px] font-mono tabular-nums font-semibold text-[#1B3A6B]">
                      Шаг {latestObservation.stepNumber} · Последнее наблюдение
                    </div>
                    <p className="text-sm text-slate-800 mt-1">
                      {latestObservation.observation}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">
                    После ответа оператора здесь появятся предварительные
                    наблюдения по критериям.
                  </p>
                )}
              </div>
            </div>

            {/* Link to Full Agent Details Modal */}
            <div className="pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => onOpenDetails(currentStepIndex, observations)}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-[#1B3A6B] bg-[#1B3A6B]/8 hover:bg-[#1B3A6B]/14 rounded-lg transition-colors cursor-pointer"
              >
                <Eye className="w-4 h-4" aria-hidden="true" />
                <span>Подробнее: как думали агенты</span>
              </button>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
