export function AboutPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl text-main">about</h1>
      <p className="max-w-prose text-text">
        Luminotype typing test. Pick a mode, start typing, and your speed (wpm), accuracy, raw
        speed, and consistency are measured in real time. Results are stored locally in your
        browser.
      </p>
      <a
        href="https://github.com/Suyw-0123/luminotype"
        target="_blank"
        rel="noopener noreferrer"
        className="text-sub underline transition-colors hover:text-main"
      >
        Source on GitHub
      </a>
    </div>
  );
}
