<template>
  <div class="min-h-screen bg-slate-100 text-slate-900 dark:bg-[#0f172a] dark:text-slate-100">
    <header class="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800/70 dark:bg-[#0b1220]/95">
      <div class="flex w-full items-center justify-between gap-4 px-3 py-4 lg:px-6">
        <div class="flex items-center gap-3">
          <div class="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-400 text-white shadow-sm">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              class="h-5 w-5"
              aria-hidden="true"
            >
              <rect x="3" y="4" width="18" height="14" rx="2"></rect>
              <path d="M8 20h8"></path>
              <path d="M9 9h6"></path>
              <path d="M9 13h4"></path>
            </svg>
          </div>
          <div>
            <p class="text-[11px] uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-300">AI Interview Coach</p>
            <h1 class="text-xl font-semibold">AI模拟面试与能力提升软件</h1>
          </div>
        </div>

        <div class="flex flex-wrap items-center justify-end gap-3">
          <nav class="flex flex-wrap items-center gap-2 text-sm">
            <RouterLink to="/home" class="rounded-lg px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800" active-class="bg-slate-200 text-emerald-700 dark:bg-slate-800 dark:text-emerald-300">主页</RouterLink>
            <RouterLink to="/dashboard" class="rounded-lg px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800" active-class="bg-slate-200 text-emerald-700 dark:bg-slate-800 dark:text-emerald-300">面试</RouterLink>
            <RouterLink to="/discussions" class="rounded-lg px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800" active-class="bg-slate-200 text-emerald-700 dark:bg-slate-800 dark:text-emerald-300">讨论</RouterLink>
            <RouterLink to="/me" class="rounded-lg px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800" active-class="bg-slate-200 text-emerald-700 dark:bg-slate-800 dark:text-emerald-300">我的</RouterLink>
          </nav>

          <button
            class="grid h-9 w-9 place-items-center rounded-lg border border-slate-300 bg-slate-50 text-slate-700 hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-500"
            :title="themeStore.isDark ? '切换浅色模式' : '切换深色模式'"
            @click="themeStore.toggleTheme"
          >
            <svg v-if="themeStore.isDark" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="4"></circle>
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"></path>
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 12.79A9 9 0 1 1 11.21 3c0 0 0 0 0 0A7 7 0 1 0 21 12.79z"></path>
            </svg>
          </button>

          <div class="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-2 py-1 dark:border-slate-700 dark:bg-slate-900">
            <span class="text-xs text-slate-700 dark:text-slate-300">{{ authStore.userName }}</span>
            <button
              class="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-600 hover:border-rose-400 hover:text-rose-500 dark:border-slate-600 dark:text-slate-300 dark:hover:text-rose-300"
              @click="logout"
            >
              退出
            </button>
          </div>
        </div>
      </div>
    </header>

    <main class="mx-auto w-full max-w-7xl px-4 py-6">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";
import { useRouter } from "vue-router";
import { useAppStore } from "../store/app";
import { useAuthStore } from "../store/auth";
import { useThemeStore } from "../store/theme";

const router = useRouter();
const appStore = useAppStore();
const authStore = useAuthStore();
const themeStore = useThemeStore();
const { apiBase } = storeToRefs(appStore);

async function logout() {
  await authStore.logout(apiBase.value);
  await router.push("/login");
}
</script>
