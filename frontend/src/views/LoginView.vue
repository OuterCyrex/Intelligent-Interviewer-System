<template>
  <div class="relative min-h-screen overflow-hidden bg-slate-50 text-slate-900 dark:bg-[#0b1020] dark:text-slate-100">
    <div class="absolute -left-24 top-10 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl dark:bg-cyan-500/20"></div>
    <div class="absolute left-1/3 top-1/2 h-96 w-96 -translate-y-1/2 rounded-full bg-emerald-400/10 blur-3xl dark:bg-emerald-500/20"></div>

    <div class="relative flex min-h-screen">
      <section class="flex-1 px-6 py-12 lg:px-12 xl:px-20">
        <div class="mx-auto flex h-full w-full max-w-4xl flex-col justify-center">
          <p class="text-xs uppercase tracking-[0.22em] text-emerald-600 dark:text-emerald-300">Intervene Interview Coach</p>
          <h1 class="mt-4 text-4xl font-bold leading-tight md:text-5xl">
            像刷题一样刷面试，
            <span class="text-emerald-600 dark:text-emerald-300">但每一步都对齐真实岗位</span>
          </h1>
          <p class="mt-5 max-w-2xl text-slate-600 dark:text-slate-300">
            题库、追问、评分、报告、推荐形成闭环。你可以从今天开始把“知道”变成“能说清、能拿 offer”。
          </p>

          <div class="mt-8 grid max-w-2xl gap-3 sm:grid-cols-3">
            <div class="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900/80">
              <p class="text-2xl font-semibold text-emerald-600 dark:text-emerald-300">2+</p>
              <p class="text-xs text-slate-500 dark:text-slate-400">岗位赛道</p>
            </div>
            <div class="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900/80">
              <p class="text-2xl font-semibold text-cyan-600 dark:text-cyan-300">多轮</p>
              <p class="text-xs text-slate-500 dark:text-slate-400">动态追问</p>
            </div>
            <div class="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900/80">
              <p class="text-2xl font-semibold text-amber-600 dark:text-amber-300">4维</p>
              <p class="text-xs text-slate-500 dark:text-slate-400">结构评分</p>
            </div>
          </div>
        </div>
      </section>

      <aside class="w-full border-l border-slate-200 bg-white/95 px-6 py-10 shadow-xl dark:border-slate-800 dark:bg-slate-900/90 sm:max-w-md lg:max-w-lg lg:px-10">
        <div class="mx-auto flex h-full max-w-md flex-col justify-center">
          <div class="mb-6 flex items-center justify-between">
            <h2 class="text-2xl font-semibold">登录平台</h2>
            <span class="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-600 dark:text-emerald-300">MVP</span>
          </div>

          <form class="space-y-4" @submit.prevent="handleSubmit">
            <div>
              <label class="mb-1 block text-sm text-slate-600 dark:text-slate-300">用户名</label>
              <input
                v-model="userName"
                type="text"
                class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950 dark:focus:border-emerald-400"
              />
            </div>

            <div>
              <label class="mb-1 block text-sm text-slate-600 dark:text-slate-300">密码（MVP 可任意）</label>
              <input
                v-model="password"
                type="password"
                class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950 dark:focus:border-emerald-400"
              />
            </div>

            <div>
              <label class="mb-1 block text-sm text-slate-600 dark:text-slate-300">后端地址</label>
              <input
                :value="apiBase"
                type="text"
                class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950 dark:focus:border-emerald-400"
                @input="onApiInput"
              />
            </div>

            <p v-if="error" class="rounded-lg border border-rose-300 bg-rose-100 px-3 py-2 text-sm text-rose-600 dark:border-rose-700 dark:bg-rose-900/30 dark:text-rose-300">{{ error }}</p>

            <button type="submit" class="w-full rounded-lg bg-emerald-500 px-4 py-2 font-semibold text-white transition hover:bg-emerald-600 dark:text-slate-950 dark:hover:bg-emerald-400">
              登录并进入主页
            </button>
          </form>

          <p class="mt-4 text-xs text-slate-500 dark:text-slate-400">当前是本地 MVP 登录，仅用于进入训练平台，不校验真实账号体系。</p>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { storeToRefs } from "pinia";
import { useRoute, useRouter } from "vue-router";
import { useAppStore } from "../store/app";
import { useAuthStore } from "../store/auth";

const router = useRouter();
const route = useRoute();
const appStore = useAppStore();
const authStore = useAuthStore();
const { apiBase } = storeToRefs(appStore);

const userName = ref("");
const password = ref("");
const error = ref("");

function onApiInput(event: Event) {
  const target = event.target as HTMLInputElement;
  appStore.setApiBase(target.value);
}

async function handleSubmit() {
  error.value = "";
  if (!userName.value.trim()) {
    error.value = "请先输入用户名";
    return;
  }
  if (!password.value.trim()) {
    error.value = "请先输入密码";
    return;
  }

  authStore.login(userName.value);
  const redirect = typeof route.query.redirect === "string" ? route.query.redirect : "/home";
  await router.push(redirect);
}
</script>
