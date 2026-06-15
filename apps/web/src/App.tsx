import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Header } from './components/Header';
import { TestPage } from './pages/TestPage';
import { SettingsPage } from './pages/SettingsPage';
import { StatsPage } from './pages/StatsPage';
import { AboutPage } from './pages/AboutPage';
import { useConfigStore } from './store/configStore';
import { useUiStore } from './store/uiStore';
import { applyTheme } from './themes/themes';

export function App() {
  const theme = useConfigStore((s) => s.theme);
  const focusMode = useUiStore((s) => s.focusMode);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  return (
    <div className="mx-auto flex min-h-screen max-w-4xl flex-col px-4">
      {/* Hidden (not removed) during focus mode so the typing area stays put. */}
      <div className={focusMode ? 'invisible' : undefined}>
        <Header />
      </div>
      <main className="flex flex-1 flex-col py-8">
        <Routes>
          <Route path="/" element={<TestPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/about" element={<AboutPage />} />
        </Routes>
      </main>
    </div>
  );
}
