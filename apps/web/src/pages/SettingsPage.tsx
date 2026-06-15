import { useConfigStore } from '../store/configStore';
import { themes } from '../themes/themes';

const VISIBLE_LINE_OPTIONS = [3, 4, 5, 6, 7];

export function SettingsPage() {
  const c = useConfigStore();

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl text-main">settings</h1>

      <section className="flex flex-col gap-2">
        <h2 className="text-sub">theme</h2>
        <div className="flex flex-wrap gap-2">
          {themes.map((t) => (
            <button
              key={t.id}
              onClick={() => c.setTheme(t.id)}
              className={`rounded border px-3 py-1 ${
                c.theme === t.id ? 'border-main text-main' : 'border-sub text-text'
              }`}
            >
              {t.name}
            </button>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sub">visible lines</h2>
        <p className="text-sm text-sub">How many lines of text stay in view while typing.</p>
        <div className="flex flex-wrap gap-2">
          {VISIBLE_LINE_OPTIONS.map((n) => (
            <button
              key={n}
              onClick={() => c.setVisibleLines(n)}
              className={`rounded border px-3 py-1 ${
                c.visibleLines === n ? 'border-main text-main' : 'border-sub text-text'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
