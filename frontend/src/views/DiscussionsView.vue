<template>
  <section class="space-y-5">
    <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div class="mb-3 flex items-center justify-between gap-3">
        <h2 class="text-xl font-semibold">求职讨论区</h2>
        <div class="flex w-auto items-center gap-2">
          <input
            v-model="searchInput"
            type="text"
            placeholder="搜索标题、内容、标签或作者"
            class="w-56 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950 lg:w-72"
            @keyup.enter="applySearch"
          />
          <button
            class="whitespace-nowrap rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-600 disabled:opacity-50 dark:text-slate-950 dark:hover:bg-emerald-400"
            :disabled="loadingDiscussions"
            @click="applySearch"
          >
            搜索
          </button>
        </div>
      </div>

      <DiscussionFeed
        :items="discussions"
        :loading="loadingDiscussions"
        :page="discussionsPage"
        :total-pages="discussionsTotalPages"
        empty-message="暂无讨论，先发起一条吧。"
        @prev-page="goPrevPage"
        @next-page="goNextPage"
      />
    </article>

    <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h3 class="mb-3 text-base font-semibold">发布讨论</h3>
      <div class="grid gap-3">
        <input
          v-model="newDiscussionTitle"
          type="text"
          placeholder="标题，例如：前端面试里性能优化怎么讲更有说服力？"
          class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950"
        />
        <input
          v-model="newDiscussionTag"
          type="text"
          placeholder="标签，可选，例如：性能"
          class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950"
        />
        <textarea
          v-model="newDiscussionContent"
          rows="4"
          placeholder="输入你想发起的讨论内容..."
          class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950"
        />
        <div class="flex items-center justify-between gap-3">
          <p v-if="discussionError" class="text-xs text-rose-500">{{ discussionError }}</p>
          <p v-else class="text-xs text-slate-500 dark:text-slate-400">当前用户：{{ authStore.userName || "未登录" }}</p>
          <button
            class="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-50 dark:text-slate-950 dark:hover:bg-emerald-400"
            :disabled="postingDiscussion || !newDiscussionTitle.trim() || !newDiscussionContent.trim()"
            @click="publishDiscussion"
          >
            {{ postingDiscussion ? "发布中..." : "发布讨论" }}
          </button>
        </div>
      </div>
    </article>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { storeToRefs } from "pinia";
import { createDiscussion, fetchDiscussions, type DiscussionItem } from "../api/discussions";
import DiscussionFeed from "../components/DiscussionFeed.vue";
import { useAppStore } from "../store/app";
import { useAuthStore } from "../store/auth";

const appStore = useAppStore();
const authStore = useAuthStore();
const { apiBase } = storeToRefs(appStore);

const discussionsPage = ref(1);
const discussionsPageSize = ref(10);
const discussionsTotal = ref(0);
const discussionsTotalPages = ref(1);
const loadingDiscussions = ref(false);
const discussions = ref<Array<DiscussionItem & { time: string }>>([]);
const searchInput = ref("");
const keyword = ref("");

const newDiscussionTitle = ref("");
const newDiscussionTag = ref("");
const newDiscussionContent = ref("");
const postingDiscussion = ref(false);
const discussionError = ref("");

async function loadDiscussions(page = discussionsPage.value) {
  loadingDiscussions.value = true;
  try {
    const result = await fetchDiscussions(apiBase.value, page, discussionsPageSize.value, keyword.value);
    discussionsPage.value = result.page;
    discussionsTotal.value = result.total;
    discussionsTotalPages.value = result.totalPages;
    discussions.value = result.items.map((item) => ({
      ...item,
      time: formatTimeAgo(item.createdAt)
    }));
  } finally {
    loadingDiscussions.value = false;
  }
}

async function applySearch() {
  keyword.value = searchInput.value.trim();
  await loadDiscussions(1);
}

async function goPrevPage() {
  if (discussionsPage.value <= 1) {
    return;
  }
  await loadDiscussions(discussionsPage.value - 1);
}

async function goNextPage() {
  if (discussionsPage.value >= discussionsTotalPages.value) {
    return;
  }
  await loadDiscussions(discussionsPage.value + 1);
}

async function publishDiscussion() {
  discussionError.value = "";
  const token = authStore.token;
  if (!token) {
    discussionError.value = "请先登录后再发布讨论。";
    return;
  }

  postingDiscussion.value = true;
  try {
    await createDiscussion(apiBase.value, token, {
      title: newDiscussionTitle.value.trim(),
      content: newDiscussionContent.value.trim(),
      tag: newDiscussionTag.value.trim() || undefined
    });

    newDiscussionTitle.value = "";
    newDiscussionTag.value = "";
    newDiscussionContent.value = "";
    await loadDiscussions(1);
  } catch (error) {
    discussionError.value = error instanceof Error ? error.message : String(error);
  } finally {
    postingDiscussion.value = false;
  }
}

function formatTimeAgo(isoTime: string) {
  const time = new Date(isoTime);
  const now = Date.now();
  const diff = Math.max(0, now - time.getTime());
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < hour) {
    return `${Math.max(1, Math.floor(diff / minute))}分钟前`;
  }
  if (diff < day) {
    return `${Math.floor(diff / hour)}小时前`;
  }
  return `${Math.floor(diff / day)}天前`;
}

onMounted(async () => {
  await loadDiscussions(1);
});
</script>
