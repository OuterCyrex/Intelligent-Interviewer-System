<template>
  <RouterView v-if="isPublicRoute" />
  <AppShell v-else>
    <ErrorBanner :message="interviewStore.errorMessage" />
    <RouterView />
  </AppShell>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from "vue";
import { storeToRefs } from "pinia";
import { useRoute } from "vue-router";
import AppShell from "./components/AppShell.vue";
import ErrorBanner from "./components/ErrorBanner.vue";
import { useAppStore } from "./store/app";
import { useAuthStore } from "./store/auth";
import { useInterviewStore } from "./store/interview";
import { useThemeStore } from "./store/theme";

const route = useRoute();
const appStore = useAppStore();
const authStore = useAuthStore();
const interviewStore = useInterviewStore();
const themeStore = useThemeStore();
const { apiBase } = storeToRefs(appStore);

const isPublicRoute = computed(() => Boolean(route.meta.public));

function applyThemeClass() {
  document.documentElement.classList.toggle("dark", themeStore.isDark);
}

async function initInterviewContext() {
  if (!authStore.isLoggedIn) {
    return;
  }
  await interviewStore.initialize(apiBase.value);
}

onMounted(async () => {
  applyThemeClass();
  await initInterviewContext();
});

watch(
  () => themeStore.mode,
  () => {
    applyThemeClass();
  }
);

watch(
  () => authStore.isLoggedIn,
  async (loggedIn) => {
    if (loggedIn) {
      await initInterviewContext();
    }
  }
);

watch(
  () => interviewStore.selectedPositionId,
  async () => {
    if (!authStore.isLoggedIn) {
      return;
    }
    await interviewStore.loadPositionAssetsAction(apiBase.value);
  }
);
</script>
