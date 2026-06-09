import { useThemeStore } from '@store/themeStore';
import { LightTheme, DarkTheme, type AppTheme } from '@constants/themes';

export function useTheme(): {
  colors: AppTheme;
  isDark: boolean;
  toggle: () => void;
} {
  const { mode, toggle } = useThemeStore();
  return {
    colors: mode === 'dark' ? DarkTheme : LightTheme,
    isDark: mode === 'dark',
    toggle,
  };
}
