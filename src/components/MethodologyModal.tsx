import { X } from 'lucide-react';
import { useEffect } from 'react';
import {
  AGENT_ROLES,
  EVALUATION_CRITERIA,
  EVALUATION_RULES,
  ORIGINAL_PROMPT_BLOCK_A,
  PROJECT_DESCRIPTION_BLOCK_B,
} from '../data/scenarios';

interface MethodologyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MethodologyModal({ isOpen, onClose }: MethodologyModalProps) {
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
      aria-labelledby="methodology-modal-title"
      onClick={onClose}
    >
      <div
        className="bg-white border border-slate-200 rounded-xl shadow-2xl w-full max-w-3xl max-h-[88vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-slate-200 bg-slate-50/70">
          <div>
            <h2
              id="methodology-modal-title"
              className="text-lg font-bold text-slate-900"
            >
              Методика оценки и архитектура системы
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              6 фиксированных критериев, правила калибровки и исходный промт агентной системы
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200/70 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B3A6B]"
            aria-label="Закрыть окно"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-5 space-y-6 text-sm text-slate-700 leading-relaxed">
          {/* Описание проекта (Блок Б) */}
          <section>
            <h3 className="text-base font-bold text-slate-900 mb-2">
              О проекте
            </h3>
            <p className="text-slate-600">{PROJECT_DESCRIPTION_BLOCK_B}</p>
          </section>

          <hr className="border-slate-200" />

          {/* 5 агентов */}
          <section>
            <h3 className="text-base font-bold text-slate-900 mb-3">
              Конвейер из 5 AI-агентов
            </h3>
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg">
              {AGENT_ROLES.map((agent, idx) => (
                <div key={agent.id} className="px-4 py-3 flex items-start gap-3">
                  <span className="font-mono tabular-nums text-xs font-semibold text-[#1B3A6B] bg-[#1B3A6B]/8 px-2 py-0.5 rounded mt-0.5 shrink-0">
                    0{idx + 1}
                  </span>
                  <div>
                    <div className="font-semibold text-slate-900">
                      {agent.name}
                    </div>
                    <div className="text-slate-600 text-xs sm:text-sm mt-0.5">
                      {agent.role}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <hr className="border-slate-200" />

          {/* 6 критериев и важные правила */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <section>
              <h3 className="text-base font-bold text-slate-900 mb-2.5">
                6 критериев оценки
              </h3>
              <ol className="space-y-1.5 text-slate-700">
                {EVALUATION_CRITERIA.map((criterion, idx) => (
                  <li key={criterion} className="flex items-baseline gap-2.5">
                    <span className="font-mono tabular-nums text-xs font-semibold text-slate-400">
                      {idx + 1}.
                    </span>
                    <span>{criterion}</span>
                  </li>
                ))}
              </ol>
            </section>

            <section>
              <h3 className="text-base font-bold text-slate-900 mb-2.5">
                Строгие правила калибровки
              </h3>
              <ul className="space-y-2 text-xs sm:text-sm text-slate-600">
                {EVALUATION_RULES.map((rule) => (
                  <li key={rule} className="flex items-start gap-2">
                    <span className="text-[#1B3A6B] font-bold mt-0.5">—</span>
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <hr className="border-slate-200" />

          {/* Блок А — исходный промт */}
          <section>
            <h3 className="text-base font-bold text-slate-900 mb-2">
              Исходный промт агентной системы (источник прототипа)
            </h3>
            <pre className="whitespace-pre-wrap font-sans text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg p-4 leading-relaxed">
              {ORIGINAL_PROMPT_BLOCK_A}
            </pre>
          </section>
        </div>

        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50/70 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-sm font-semibold text-white bg-[#1B3A6B] hover:bg-[#142D54] rounded-lg transition-colors whitespace-nowrap"
          >
            Понятно
          </button>
        </div>
      </div>
    </div>
  );
}
