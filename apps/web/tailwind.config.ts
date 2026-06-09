import type { Config } from 'tailwindcss';

/**
 * Colors map to CSS variables defined per theme (see src/themes/themes.ts),
 * so every utility class follows the active theme automatically.
 */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg-color)',
        main: 'var(--main-color)',
        caret: 'var(--caret-color)',
        sub: 'var(--sub-color)',
        'sub-alt': 'var(--sub-alt-color)',
        text: 'var(--text-color)',
        error: 'var(--error-color)',
        'error-extra': 'var(--error-extra-color)',
      },
      fontFamily: {
        mono: ['"Roboto Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
} satisfies Config;
