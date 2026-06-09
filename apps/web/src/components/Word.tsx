import { memo } from 'react';

interface WordProps {
  target: string;
  typed: string;
  isActive: boolean;
}

const Caret = () => <span className="caret" aria-hidden="true" />;

/**
 * Renders a single word as per-character spans. Memoized so that during typing
 * only the active word (whose `typed` prop changes) re-renders.
 */
function WordComponent({ target, typed, isActive }: WordProps) {
  const elements: React.ReactNode[] = [];
  const caretPos = typed.length;

  for (let i = 0; i < target.length; i++) {
    if (isActive && i === caretPos) elements.push(<Caret key="caret" />);
    let cls = 'text-sub';
    if (i < typed.length) {
      cls = typed[i] === target[i] ? 'text-text' : 'text-error underline';
    }
    elements.push(
      <span key={i} className={cls}>
        {target[i]}
      </span>,
    );
  }

  // Extra characters typed past the end of the word.
  for (let i = target.length; i < typed.length; i++) {
    elements.push(
      <span key={`x${i}`} className="text-error-extra underline">
        {typed[i]}
      </span>,
    );
  }

  // Caret at the very end (input length >= word length).
  if (isActive && caretPos >= target.length) elements.push(<Caret key="caret-end" />);

  return (
    <div className="mr-3 inline-flex whitespace-pre" data-active={isActive || undefined}>
      {elements}
    </div>
  );
}

export const Word = memo(WordComponent);
