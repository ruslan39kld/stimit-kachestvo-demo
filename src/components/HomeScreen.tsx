import { ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { AGENT_ROLES, AgentStageId, SCENARIOS } from '../data/scenarios';
import { AgentPipeline, NodeState } from './AgentPipeline';

interface HomeScreenProps {
  onStartScenario: (scenarioId: string) => void;
  onOpenMethodology: () => void;
}

const STAGE_ORDER: AgentStageId[] = [
  'analyst',
  'evaluator',
  'critic',
  'calibrator',
  'finalizer',
];

export function HomeScreen({
  onStartScenario,
  onOpenMethodology,
}: HomeScreenProps) {
  const featuredScenario = SCENARIOS.find((s) => s.isFeatured) ?? SCENARIOS[0];

  // Subtle living showcase of the 5-agent conveyor on the landing hero
  const [heroActiveIndex, setHeroActiveIndex] = useState(0);

  useEffect(() => {
    const prefersReduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
    if (prefersReduced) return;

    const timer = window.setInterval(() => {
      setHeroActiveIndex((prev) => (prev + 1) % STAGE_ORDER.length);
    }, 2000);
    return () => window.clearInterval(timer);
  }, []);

  const heroNodeStates: Record<AgentStageId, NodeState> = STAGE_ORDER.reduce(
    (acc, stage, idx) => {
      if (idx < heroActiveIndex) {
        acc[stage] = 'completed';
      } else if (idx === heroActiveIndex) {
        acc[stage] = 'active';
      } else {
        acc[stage] = 'idle';
      }
      return acc;
    },
    {} as Record<AgentStageId, NodeState>
  );

  return (
    <div className="min-h-screen flex flex-col">
      {/* Dark-blue STIMIT gradient hero block */}
      <section className="bg-gradient-to-br from-[#1B3A6B] via-[#152E56] to-[#0D1E3B] text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-12 sm:pb-14">
          {/* 3-Zone Top Bar */}
          <header className="flex items-center justify-between gap-8 pb-8 border-b border-white/12">
            <a
              href="#top"
              onClick={(e) => e.preventDefault()}
              className="text-lg font-extrabold tracking-tight text-white whitespace-nowrap shrink-0"
            >
              STIMIT
            </a>

            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-white/80">
              <a
                href="#scenarios"
                className="hover:text-white transition-colors whitespace-nowrap shrink-0"
              >
                Сценарии
              </a>
              <button
                type="button"
                onClick={onOpenMethodology}
                className="hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                6 критериев
              </button>
              <button
                type="button"
                onClick={onOpenMethodology}
                className="hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Исходный промт
              </button>
            </nav>

            <div className="flex items-center shrink-0">
              <button
                type="button"
                onClick={onOpenMethodology}
                className="px-4 py-2 text-xs sm:text-sm font-medium text-white/95 bg-white/10 hover:bg-white/18 border border-white/20 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                О системе
              </button>
            </div>
          </header>

          {/* Hero Question & Subtitle */}
          <div className="mt-8 sm:mt-10 max-w-4xl">
            <h1 className="text-3xl sm:text-4xl lg:text-[44px] font-extrabold tracking-tight leading-[1.15] text-white">
              Поддержка решает проблему — или отписывается?
            </h1>
            <p className="mt-4 text-base sm:text-lg text-slate-200/90 leading-relaxed max-w-3xl">
              Вы — клиент доставки еды с проблемой. Оператор отвечает, а пять
              AI-агентов разбирают его работу по шести критериям и выносят
              честный вердикт.
            </p>
          </div>

          {/* Animated 5-Agent Conveyor */}
          <div className="mt-8 p-4 sm:p-5 rounded-xl bg-white/[0.06] border border-white/12">
            <div className="text-xs font-medium text-sky-200/90 mb-3.5">
              Конвейер оценки: {AGENT_ROLES[heroActiveIndex].name} —{' '}
              <span className="text-white/80 font-normal">
                {AGENT_ROLES[heroActiveIndex].role}
              </span>
            </div>
            <AgentPipeline nodeStates={heroNodeStates} animateSignals />
          </div>

          {/* Single Primary CTA */}
          <div className="mt-8">
            <button
              type="button"
              onClick={() => onStartScenario(featuredScenario.id)}
              className="inline-flex items-center justify-center gap-2.5 px-7 py-3.5 text-base font-bold text-slate-950 bg-white hover:bg-sky-50 rounded-xl shadow-lg shadow-slate-950/25 transition-all duration-150 hover:-translate-y-0.5 cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
            >
              <span>Смотреть пример</span>
              <ArrowRight className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </section>

      {/* Main Content: Equal cards for all 3 scenarios */}
      <main id="scenarios" className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Сценарии проверки
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Сравните, как система выявляет отписки и строгие нарушения регламента
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {SCENARIOS.map((scenario) => (
            <article
              key={scenario.id}
              className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-150 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                  <span className="font-mono tabular-nums font-semibold text-[#1B3A6B]">
                    Сценарий {scenario.number}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums">{scenario.stepsCount} шагов</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">
                    Заказ {scenario.orderNumber}
                  </span>
                </div>

                <h3 className="mt-2.5 text-lg font-bold text-slate-900">
                  {scenario.title}
                </h3>

                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  {scenario.shortDescription}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={() => onStartScenario(scenario.id)}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-[#1B3A6B] bg-[#1B3A6B]/8 hover:bg-[#1B3A6B] hover:text-white rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                >
                  <span>Пройти сценарий</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </article>
          ))}
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white/70">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <span>
            AI-контроль качества поддержки · автономный интерактивный демо-стенд
          </span>
          <button
            type="button"
            onClick={onOpenMethodology}
            className="text-[#1B3A6B] hover:underline font-medium cursor-pointer"
          >
            Правила оценки и исходный промт
          </button>
        </div>
      </footer>
    </div>
  );
}
