import {
  computed,
  inject,
  onMounted,
  provide,
  ref,
  type ComputedRef,
  type InjectionKey,
  type Ref,
} from "vue";

export type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Ref<Theme>;
  isLight: ComputedRef<boolean>;
  setTheme: (nextTheme: Theme) => void;
  toggleTheme: () => void;
}

const themeKey: InjectionKey<ThemeContextValue> = Symbol("theme");
const STORAGE_KEY = "theme";

function readStoredTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  return window.localStorage.getItem(STORAGE_KEY) === "light" ? "light" : "dark";
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.style.colorScheme = theme;
}

export function provideTheme(): ThemeContextValue {
  const theme = ref<Theme>(readStoredTheme());
  const isLight = computed(() => theme.value === "light");

  const setTheme = (nextTheme: Theme) => {
    theme.value = nextTheme;
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, nextTheme);
      applyTheme(nextTheme);
    }
  };

  const toggleTheme = () => setTheme(theme.value === "light" ? "dark" : "light");
  const value = { theme, isLight, setTheme, toggleTheme };

  provide(themeKey, value);
  applyTheme(theme.value);
  onMounted(() => {
    const storedTheme = readStoredTheme();
    if (storedTheme !== theme.value) setTheme(storedTheme);
  });
  return value;
}

export function useTheme(): ThemeContextValue {
  const context = inject(themeKey);
  if (!context) {
    throw new Error("useTheme must be used within a Vue theme provider");
  }
  return context;
}