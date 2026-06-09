import { useLayoutEffect, useRef, useState } from 'react';
import { Word } from './Word';

interface WordsDisplayProps {
  words: string[];
  typedWords: string[];
  currentInput: string;
  wordIndex: number;
  /** Free typing (zen): render the user's own text with no target to compare against. */
  freeMode?: boolean;
  /** Number of text lines kept visible at once. */
  visibleLines?: number;
}

/** Words rendered ahead of the active one (keeps the DOM bounded). */
const WINDOW = 120;

export function WordsDisplay({
  words,
  typedWords,
  currentInput,
  wordIndex,
  freeMode,
  visibleLines = 3,
}: WordsDisplayProps) {
  const innerRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);
  const [lineHeight, setLineHeight] = useState(0);

  // In free mode the rendered text is what the user typed (committed words plus
  // the active input); each character is treated as correct.
  const activeIndex = freeMode ? typedWords.length : wordIndex;
  const rendered = [];
  if (freeMode) {
    const items = [...typedWords, currentInput];
    for (let i = 0; i < items.length; i++) {
      const text = items[i]!;
      rendered.push(<Word key={i} target={text} typed={text} isActive={i === activeIndex} />);
    }
  } else {
    const end = Math.min(words.length, wordIndex + WINDOW);
    for (let i = 0; i < end; i++) {
      const isActive = i === wordIndex;
      const typed = isActive ? currentInput : (typedWords[i] ?? '');
      rendered.push(<Word key={i} target={words[i]!} typed={typed} isActive={isActive} />);
    }
  }

  // Follow the active word vertically: keep it on the second visible line so a
  // line of already-typed context stays above it. The active word's vertical
  // position only changes when it moves to a new line (i.e. when wordIndex
  // changes), so this does not run on every keystroke.
  useLayoutEffect(() => {
    const container = innerRef.current;
    if (!container) return;
    const active = container.querySelector<HTMLElement>('[data-active="true"]');
    if (!active) return;
    const lh = active.offsetHeight;
    if (lh > 0) setLineHeight(lh);
    setOffset(Math.max(0, active.offsetTop - lh));
  }, [wordIndex, words]);

  return (
    <div
      className="relative h-[7.5rem] overflow-hidden sm:h-[9.5rem]"
      style={lineHeight ? { height: lineHeight * visibleLines } : undefined}
    >
      <div
        ref={innerRef}
        className="relative flex flex-wrap text-2xl leading-relaxed transition-transform duration-150 ease-out sm:text-3xl"
        style={{ transform: `translateY(-${offset}px)` }}
        data-testid="words"
      >
        {rendered}
      </div>
    </div>
  );
}
