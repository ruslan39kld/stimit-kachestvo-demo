import { Check } from 'lucide-react';
import { AGENT_ROLES, AgentStageId } from '../data/scenarios';

export type NodeState = 'idle' | 'active' | 'completed';

interface AgentPipelineProps {
  /** Map of state for each of the 5 agents */
  nodeStates: Record<AgentStageId, NodeState>;
  /** Highlight a brief signal pulse between stages */
  animateSignals?: boolean;
  /** Compact mode for active dialogue bar */
  compact?: boolean;
}

export function AgentPipeline({
  nodeStates,
  animateSignals = true,
  compact = false,
}: AgentPipelineProps) {
  return (
    <div
      className="w-full"
      aria-label="Схема конвейера из 5 AI-агентов"
    >
      <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 sm:gap-1">
        {AGENT_ROLES.map((agent, index) => {
          const state = nodeStates[agent.id];
          const isLast = index === AGENT_ROLES.length - 1;
          const nextState = !isLast
            ? nodeStates[AGENT_ROLES[index + 1].id]
            : 'idle';
          const connectorActive =
            state === 'completed' ||
            (state === 'active' && nextState === 'active');

          return (
            <div
              key={agent.id}
              className={`flex items-center ${isLast ? 'shrink-0' : 'flex-1 min-w-0'}`}
            >
              {/* Agent Node */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="relative flex items-center justify-center">
                  {state === 'active' && (
                    <span
                      aria-hidden="true"
                      className="absolute inset-0 rounded-full bg-sky-300/40 animate-node-ring"
                    />
                  )}
                  <div
                    className={`relative z-10 flex items-center justify-center rounded-full border transition-colors duration-200 ${
                      compact ? 'w-7 h-7 text-xs' : 'w-8 h-8 text-xs'
                    } font-mono font-semibold tabular-nums ${
                      state === 'completed'
                        ? 'bg-emerald-500 border-emerald-400 text-white shadow-sm shadow-emerald-950/30'
                        : state === 'active'
                          ? 'bg-sky-400 border-sky-200 text-slate-950 shadow-md shadow-sky-900/40'
                          : 'bg-white/10 border-white/20 text-white/75'
                    }`}
                  >
                    {state === 'completed' ? (
                      <Check className="w-4 h-4 stroke-[2.5]" aria-hidden="true" />
                    ) : (
                      <span>{index + 1}</span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col">
                  <span
                    className={`whitespace-nowrap font-medium leading-tight transition-colors duration-200 ${
                      compact ? 'text-xs sm:text-[13px]' : 'text-xs sm:text-sm'
                    } ${
                      state === 'active'
                        ? 'text-white font-semibold'
                        : state === 'completed'
                          ? 'text-emerald-200'
                          : 'text-white/75'
                    }`}
                  >
                    {agent.shortName}
                  </span>
                </div>
              </div>

              {/* Connector + Traveling Signal Dot */}
              {!isLast && (
                <div
                  className="hidden sm:flex items-center flex-1 mx-2 md:mx-3 relative h-4 overflow-hidden"
                  aria-hidden="true"
                >
                  <div
                    className={`w-full h-[2px] rounded-full transition-colors duration-300 ${
                      connectorActive ? 'bg-sky-300/60' : 'bg-white/15'
                    }`}
                  />
                  {animateSignals && (state === 'active' || connectorActive) && (
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full relative h-2">
                        <span
                          className="absolute top-1/2 -translate-y-1/2 left-0 w-2 h-2 rounded-full bg-sky-200 shadow-[0_0_8px_rgba(186,230,253,0.9)] animate-signal-travel"
                          style={{
                            animationDelay: `${index * 0.28}s`,
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
