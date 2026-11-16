import { useState } from 'react';
import { AgentDetailsModal, CollectedObservation } from './components/AgentDetailsModal';
import { ChatMessage, DialogueWorkspace } from './components/DialogueWorkspace';
import { HomeScreen } from './components/HomeScreen';
import { MethodologyModal } from './components/MethodologyModal';
import { MissionResult } from './components/MissionResult';
import { SCENARIOS } from './data/scenarios';

type ScreenView = 'home' | 'dialogue' | 'result';

export default function App() {
  const [view, setView] = useState<ScreenView>('home');
  const [activeScenarioId, setActiveScenarioId] = useState<string>(
    SCENARIOS[0].id
  );
  const [runKey, setRunKey] = useState(0);
  const [hasInteracted, setHasInteracted] = useState(false);

  const [completedMessages, setCompletedMessages] = useState<ChatMessage[]>([]);
  const [collectedObservations, setCollectedObservations] = useState<
    CollectedObservation[]
  >([]);
  const [detailsStepIndex, setDetailsStepIndex] = useState(0);

  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isMethodologyOpen, setIsMethodologyOpen] = useState(false);

  const activeScenario =
    SCENARIOS.find((s) => s.id === activeScenarioId) ?? SCENARIOS[0];

  const handleStartScenario = (scenarioId: string) => {
    setActiveScenarioId(scenarioId);
    setCompletedMessages([]);
    setCollectedObservations([]);
    setDetailsStepIndex(0);
    setRunKey((prev) => prev + 1);
    setView('dialogue');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRestartScenario = () => {
    setCompletedMessages([]);
    setCollectedObservations([]);
    setDetailsStepIndex(0);
    setRunKey((prev) => prev + 1);
    setView('dialogue');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCompleteDialogue = (
    messages: ChatMessage[],
    observations: CollectedObservation[]
  ) => {
    setCompletedMessages(messages);
    setCollectedObservations(observations);
    setView('result');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenDetails = (
    stepIndex: number,
    observations: CollectedObservation[]
  ) => {
    setDetailsStepIndex(stepIndex);
    setCollectedObservations(observations);
    setIsDetailsOpen(true);
  };

  const handleBackHome = () => {
    setView('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div id="top" className="min-h-screen bg-[#F4F6FA] text-slate-900">
      {view === 'home' && (
        <HomeScreen
          onStartScenario={handleStartScenario}
          onOpenMethodology={() => setIsMethodologyOpen(true)}
        />
      )}

      {view === 'dialogue' && (
        <DialogueWorkspace
          key={`${activeScenario.id}-${runKey}`}
          scenario={activeScenario}
          hasInteracted={hasInteracted}
          onFirstInteract={() => setHasInteracted(true)}
          onComplete={handleCompleteDialogue}
          onOpenDetails={handleOpenDetails}
          onBackHome={handleBackHome}
          onRestart={handleRestartScenario}
        />
      )}

      {view === 'result' && (
        <MissionResult
          scenario={activeScenario}
          messages={completedMessages}
          onRestart={handleRestartScenario}
          onSelectScenario={handleStartScenario}
          onBackHome={handleBackHome}
          onOpenDetails={() => setIsDetailsOpen(true)}
        />
      )}

      <AgentDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        scenario={activeScenario}
        currentStepIndex={detailsStepIndex}
        isCompleted={view === 'result'}
        observations={collectedObservations}
      />

      <MethodologyModal
        isOpen={isMethodologyOpen}
        onClose={() => setIsMethodologyOpen(false)}
      />
    </div>
  );
}
