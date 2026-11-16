import { CheckCircle2, AlertTriangle, XCircle, X } from 'lucide-react';
import { useEffect } from 'react';
import {
  EVALUATION_CRITERIA,
  EVALUATION_RULES,
  Scenario,
  VerdictLevel,
} from '../data/scenarios';

export interface CollectedObservation {
  stepNumber: number;
  observation: string;
}

interface AgentDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  scenario: Scenario;
  currentStepIndex: number;
  isCompleted: boolean;
  observations: CollectedObservation[];
}

function RatingIndicator({ rating }: { rating: VerdictLevel }) {
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

export function AgentDetailsModal({
  isOpen,
  onClose,
  scenario,
  currentStepIndex,
  isCompleted,
  observations,
}: AgentDetailsModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-[2px] p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="agent-details-title"
      onClick={onClose}
    >
      <div
        className="bg-white border border-slate-200 rounded-xl shadow-2xl w-full max-w-3xl max-h-[88vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-slate-200 bg-slate-50/70">
          <div>
            <h2
              id="agent-details-title"
              className="text-lg font-bold text-slate-900"
            >
              Подробнее: как думали агенты
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
              Сценарий {scenario.number} · {scenario.title} ·{' '}
              {isCompleted
                ? 'полный конвейер завершён'
                : `шаг ${Math.min(currentStepIndex + 1, scenario.stepsCount)} из ${scenario.stepsCount}`}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200/70 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B3A6B]"
            aria-label="Закрыть подробности"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-5 space-y-6 text-sm text-slate-700">
          {/* 1. Наблюдения по шагам */}
          <section>
            <h3 className="text-base font-bold text-slate-900 mb-3">
              Наблюдения Оценщика по шагам диалога
            </h3>
            {observations.length === 0 ? (
              <p className="text-slate-500 text-sm py-3 px-4 bg-slate-50 rounded-lg border border-slate-200">
                Наблюдения появятся сразу после первой реплики в диалоге.
              </p>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg">
                {observations.map((item) => (
                  <div
                    key={item.stepNumber}
                    className="px-4 py-3 flex items-baseline gap-3"
                  >
                    <span className="font-mono tabular-nums text-xs font-semibold text-[#1B3A6B] shrink-0">
                      Шаг {item.stepNumber}
                    </span>
                    <span className="text-slate-700">{item.observation}</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <hr className="border-slate-200" />

          {/* 2. 6 критериев */}
          <section>
            <div className="flex items-baseline justify-between gap-2 mb-3">
              <h3 className="text-base font-bold text-slate-900">
                Оценка по 6 критериям
              </h3>
              {!isCompleted && (
                <span className="text-xs text-slate-500">
                  Итоговые оценки выставятся после шага 5
                </span>
              )}
            </div>

            {isCompleted ? (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg">
                {scenario.finalAnalysis.evaluator.map((item) => (
                  <div
                    key={item.criterion}
                    className="px-4 py-3 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-900">
                        {item.criterion}
                      </div>
                      <p className="text-slate-600 text-xs sm:text-sm mt-0.5">
                        {item.reason}
                      </p>
                    </div>
                    <RatingIndicator rating={item.rating} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {EVALUATION_CRITERIA.map((criterion, idx) => (
                  <div
                    key={criterion}
                    className="px-3.5 py-2.5 rounded-lg border border-slate-200 bg-slate-50/70 flex items-center justify-between gap-2"
                  >
                    <span className="text-slate-700 font-medium text-xs sm:text-sm">
                      {idx + 1}. {criterion}
                    </span>
                    <span className="text-xs text-slate-400 shrink-0">
                      ожидание
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* 3. Разбор Критика (после завершения, либо пояснение роли до завершения) */}
          <hr className="border-slate-200" />
          <section>
            <h3 className="text-base font-bold text-slate-900 mb-3">
              Разбор Агента-Критика
            </h3>
            {isCompleted ? (
              <ol className="space-y-2.5">
                {scenario.finalAnalysis.critic.map((point, idx) => (
                  <li
                    key={point}
                    className="flex items-start gap-3 px-4 py-3 rounded-lg bg-slate-50 border border-slate-200"
                  >
                    <span className="font-mono tabular-nums text-xs font-semibold text-[#1B3A6B] mt-0.5 shrink-0">
                      {idx + 1})
                    </span>
                    <span className="text-slate-700">{point}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-slate-600 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg px-4 py-3">
                Агент-Критик включится после завершения диалога на шаге 5: он
                найдёт минимум 2–3 недочёта, проверит, не завышены ли оценки
                Оценщика, и передаст отчёт Калибратору.
              </p>
            )}
          </section>

          {/* 4. Правила калибровки */}
          <hr className="border-slate-200" />
          <section>
            <h3 className="text-base font-bold text-slate-900 mb-2.5">
              Правила Калибратора
            </h3>
            <ul className="space-y-1.5 text-xs sm:text-sm text-slate-600">
              {EVALUATION_RULES.map((rule) => (
                <li key={rule} className="flex items-start gap-2">
                  <span className="text-[#1B3A6B] font-bold">—</span>
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50/70 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-sm font-semibold text-white bg-[#1B3A6B] hover:bg-[#142D54] rounded-lg transition-colors whitespace-nowrap"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}
