import { computed, ref } from "vue";
import { defineStore } from "pinia";

const USER_KEY = "intervene_user_name";

function loadUserName() {
  return localStorage.getItem(USER_KEY) ?? "";
}

export const useAuthStore = defineStore("auth", () => {
  const userName = ref(loadUserName());

  const isLoggedIn = computed(() => userName.value.trim().length > 0);

  function login(name: string) {
    userName.value = name.trim();
    localStorage.setItem(USER_KEY, userName.value);
  }

  function logout() {
    userName.value = "";
    localStorage.removeItem(USER_KEY);
  }

  return {
    userName,
    isLoggedIn,
    login,
    logout
  };
});
