import { computed, ref, watch } from "vue";
import { defineStore } from "pinia";

type ThemeMode = "light" | "dark";

const THEME_KEY = "intervene_theme_mode";

function loadThemeMode(): ThemeMode {
  const saved = localStorage.getItem(THEME_KEY);
  return saved === "dark" ? "dark" : "light";
}

export const useThemeStore = defineStore("theme", () => {
  const mode = ref<ThemeMode>(loadThemeMode());

  const isDark = computed(() => mode.value === "dark");

  function toggleTheme() {
    mode.value = mode.value === "dark" ? "light" : "dark";
  }

  watch(mode, (value) => {
    localStorage.setItem(THEME_KEY, value);
  });

  return {
    mode,
    isDark,
    toggleTheme
  };
});
