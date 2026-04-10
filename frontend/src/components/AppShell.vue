<template>
  <div class="min-h-screen bg-slate-100 text-slate-900 dark:bg-[#0f172a] dark:text-slate-100">
    <header class="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800/70 dark:bg-[#0b1220]/95">
      <div class="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div class="flex items-center gap-3">
          <div class="h-9 w-9 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-400"></div>
          <div>
            <p class="text-[11px] uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-300">Intervene Studio</p>
            <h1 class="text-xl font-semibold">求职训练平台</h1>
          </div>
        </div>

        <div class="flex w-full flex-col gap-3 lg:w-auto lg:flex-row lg:items-center">
          <nav class="flex flex-wrap items-center gap-2 text-sm">
            <RouterLink to="/home" class="rounded-lg px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800" active-class="bg-slate-200 text-emerald-700 dark:bg-slate-800 dark:text-emerald-300">主页</RouterLink>
            <RouterLink to="/dashboard" class="rounded-lg px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800" active-class="bg-slate-200 text-emerald-700 dark:bg-slate-800 dark:text-emerald-300">工作台</RouterLink>
            <RouterLink to="/insights" class="rounded-lg px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800" active-class="bg-slate-200 text-emerald-700 dark:bg-slate-800 dark:text-emerald-300">报告</RouterLink>
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
import { useAuthStore } from "../store/auth";
import { useThemeStore } from "../store/theme";

const router = useRouter();
const authStore = useAuthStore();
const themeStore = useThemeStore();

async function logout() {
  authStore.logout();
  await router.push("/login");
}
</script>
