/**
 * Theme system: each theme is a set of CSS variables injected onto :root.
 * Tailwind colors (see tailwind.config.ts) reference these variables, so the
 * whole UI re-themes by swapping the variable values — no re-render needed.
 */

export interface Theme {
  id: string;
  name: string;
  colors: {
    bg: string;
    main: string;
    caret: string;
    sub: string;
    subAlt: string;
    text: string;
    error: string;
    errorExtra: string;
  };
}

export const themes: Theme[] = [
  {
    id: 'light',
    name: 'light',
    colors: {
      bg: '#eeeeee',
      main: '#444444',
      caret: '#444444',
      sub: '#aaaaaa',
      subAlt: '#e0e0e0',
      text: '#333333',
      error: '#da3333',
      errorExtra: '#791717',
    },
  },
  {
    id: 'dark',
    name: 'dark',
    colors: {
      bg: '#111111',
      main: '#eeeeee',
      caret: '#eeeeee',
      sub: '#444444',
      subAlt: '#1a1a1a',
      text: '#eeeeee',
      error: '#da3333',
      errorExtra: '#791717',
    },
  },
  {
    id: 'nord',
    name: 'nord',
    colors: {
      bg: '#2e3440',
      main: '#88c0d0',
      caret: '#88c0d0',
      sub: '#4c566a',
      subAlt: '#272c36',
      text: '#d8dee9',
      error: '#bf616a',
      errorExtra: '#73383e',
    },
  },
  {
    id: 'dracula',
    name: 'dracula',
    colors: {
      bg: '#282a36',
      main: '#bd93f9',
      caret: '#f8f8f2',
      sub: '#6272a4',
      subAlt: '#21222c',
      text: '#f8f8f2',
      error: '#ff5555',
      errorExtra: '#a13434',
    },
  },
  {
    id: 'matrix',
    name: 'matrix',
    colors: {
      bg: '#000000',
      main: '#15ff00',
      caret: '#15ff00',
      sub: '#006500',
      subAlt: '#0a0a0a',
      text: '#15ff00',
      error: '#ff0000',
      errorExtra: '#990000',
    },
  },
  {
    id: 'gruvbox',
    name: 'gruvbox',
    colors: {
      bg: '#282828',
      main: '#fe8019',
      caret: '#fe8019',
      sub: '#665c54',
      subAlt: '#1d2021',
      text: '#ebdbb2',
      error: '#fb4934',
      errorExtra: '#cc241d',
    },
  },
  {
    id: 'solarized-light',
    name: 'solarized light',
    colors: {
      bg: '#fdf6e3',
      main: '#268bd2',
      caret: '#268bd2',
      sub: '#93a1a1',
      subAlt: '#eee8d5',
      text: '#657b83',
      error: '#dc322f',
      errorExtra: '#a52521',
    },
  },
];

export const DEFAULT_THEME_ID = 'light';

export function getTheme(id: string): Theme {
  return themes.find((t) => t.id === id) ?? themes[0]!;
}

/** Apply a theme by writing its CSS variables onto the document root. */
export function applyTheme(id: string): void {
  const theme = getTheme(id);
  const root = document.documentElement;
  const { colors } = theme;
  root.style.setProperty('--bg-color', colors.bg);
  root.style.setProperty('--main-color', colors.main);
  root.style.setProperty('--caret-color', colors.caret);
  root.style.setProperty('--sub-color', colors.sub);
  root.style.setProperty('--sub-alt-color', colors.subAlt);
  root.style.setProperty('--text-color', colors.text);
  root.style.setProperty('--error-color', colors.error);
  root.style.setProperty('--error-extra-color', colors.errorExtra);
}
