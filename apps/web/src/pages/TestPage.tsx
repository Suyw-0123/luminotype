import { ConfigBar } from '../components/ConfigBar';
import { TypingTest } from '../components/TypingTest';
import { useUiStore } from '../store/uiStore';

export function TestPage() {
  const focusMode = useUiStore((s) => s.focusMode);

  return (
    <div className="relative flex flex-1 flex-col justify-center">
      {/* ConfigBar floats at the top (out of flow) so it doesn't shift the
          vertical center. Hidden (not removed) during focus mode. */}
      <div
        className={`absolute inset-x-0 top-0 flex justify-center ${focusMode ? 'invisible' : ''}`}
      >
        <ConfigBar />
      </div>
      {/* The typing area (and the results screen that replaces it) is centered
          in the full height, so the text sits in the true vertical middle
          regardless of how tall the loaded content is. */}
      <TypingTest />
    </div>
  );
}
