import { useConfigStore } from '../store/configStore';
import { themes } from '../themes/themes';

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

      <section className="flex items-center gap-2">
        <input
          id="sound"
          type="checkbox"
          checked={c.sound}
          onChange={c.toggleSound}
          className="h-4 w-4"
        />
        <label htmlFor="sound" className="text-text">
          sound on keypress
        </label>
      </section>
    </div>
  );
}
