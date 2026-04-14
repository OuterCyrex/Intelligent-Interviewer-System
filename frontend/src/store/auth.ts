import { computed, ref } from "vue";
import { defineStore } from "pinia";
import {
  fetchCurrentUser,
  loginUser,
  logoutUser,
  registerUser,
  updateCurrentUser,
  type UserProfile
} from "../api/auth";

const TOKEN_KEY = "intervene_auth_token";
const USER_KEY = "intervene_auth_user";

function loadToken() {
  return localStorage.getItem(TOKEN_KEY) ?? "";
}

function loadUser() {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as UserProfile;
  } catch {
    return null;
  }
}

export const useAuthStore = defineStore("auth", () => {
  const token = ref(loadToken());
  const user = ref<UserProfile | null>(loadUser());

  const userName = computed(() => user.value?.userName ?? "");
  const account = computed(() => user.value?.account ?? "");
  const isLoggedIn = computed(() => Boolean(token.value && user.value));

  function persistAuth(nextToken: string, nextUser: UserProfile) {
    token.value = nextToken;
    user.value = nextUser;
    localStorage.setItem(TOKEN_KEY, nextToken);
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
  }

  async function login(baseUrl: string, payload: { account: string; password: string }) {
    const response = await loginUser(baseUrl, payload);
    persistAuth(response.token, response.user);
  }

  async function register(
    baseUrl: string,
    payload: {
      account: string;
      password: string;
      userName?: string;
      city?: string;
      age?: number | null;
      targetRole?: string;
    }
  ) {
    const response = await registerUser(baseUrl, payload);
    persistAuth(response.token, response.user);
  }

  async function hydrate(baseUrl: string) {
    if (!token.value) {
      user.value = null;
      return;
    }
    try {
      const me = await fetchCurrentUser(baseUrl, token.value);
      user.value = me;
      localStorage.setItem(USER_KEY, JSON.stringify(me));
    } catch {
      clearLocalAuth();
    }
  }

  async function updateProfile(
    baseUrl: string,
    payload: {
      userName?: string;
      city?: string;
      age?: number | null;
      targetRole?: string;
    }
  ) {
    if (!token.value) {
      return;
    }
    const updated = await updateCurrentUser(baseUrl, token.value, payload);
    user.value = updated;
    localStorage.setItem(USER_KEY, JSON.stringify(updated));
  }

  async function logout(baseUrl?: string) {
    if (baseUrl && token.value) {
      try {
        await logoutUser(baseUrl, token.value);
      } catch {
        // Ignore logout request failures.
      }
    }
    clearLocalAuth();
  }

  function clearLocalAuth() {
    token.value = "";
    user.value = null;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  return {
    token,
    user,
    userName,
    account,
    isLoggedIn,
    login,
    register,
    hydrate,
    updateProfile,
    logout
  };
});

