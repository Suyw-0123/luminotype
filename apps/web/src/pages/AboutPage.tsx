export function AboutPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl text-main">about</h1>
      <p className="max-w-prose text-text">
        Luminotype typing test. Pick a mode, start typing, and your speed (wpm), accuracy, raw
        speed, and consistency are measured in real time. Results are stored locally in your
        browser.
      </p>
      <p className="max-w-prose text-sub">
        Built with React, Vite, Tailwind, Hono, and PostgreSQL. Press <kbd>tab</kbd> at any time to
        restart a test.
      </p>
    </div>
  );
}
