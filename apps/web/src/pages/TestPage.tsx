import { ConfigBar } from '../components/ConfigBar';
import { TypingTest } from '../components/TypingTest';
import { useUiStore } from '../store/uiStore';

export function TestPage() {
  const focusMode = useUiStore((s) => s.focusMode);

  return (
    <div className="flex flex-col gap-10">
      {/* Hidden (not removed) during focus mode so the typing area stays put. */}
      <div className={`flex justify-center ${focusMode ? 'invisible' : ''}`}>
        <ConfigBar />
      </div>
      <div className="min-h-[40vh]">
        <TypingTest />
      </div>
    </div>
  );
}
