import { ref, watch } from "vue";
import { defineStore } from "pinia";

const DEFAULT_API_BASE = "http://127.0.0.1:3000";
const STORAGE_KEY = "intervene_api_base";

function loadApiBaseFromStorage() {
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved?.trim() || DEFAULT_API_BASE;
}

export const useAppStore = defineStore("app", () => {
  const apiBase = ref(loadApiBaseFromStorage());

  watch(apiBase, (value) => {
    localStorage.setItem(STORAGE_KEY, value);
  });

  function setApiBase(value: string) {
    apiBase.value = value;
  }

  return {
    apiBase,
    setApiBase
  };
});
