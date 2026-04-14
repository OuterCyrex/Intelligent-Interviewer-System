<template>
  <div>
    <div v-if="items.length" class="divide-y divide-slate-200 dark:divide-slate-800">
      <div
        v-for="topic in items"
        :key="topic.id"
        class="py-4"
      >
        <div class="flex flex-wrap items-center justify-between gap-3">
          <p class="font-medium text-slate-900 dark:text-slate-100">{{ topic.title }}</p>
          <span class="text-xs text-slate-500 dark:text-slate-400">{{ topic.tag }}</span>
        </div>

        <p class="mt-1 text-sm text-slate-600 dark:text-slate-400">{{ topic.summary }}</p>

        <div class="mt-2 flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
          <span>作者：{{ topic.authorName }}</span>
          <button
            class="inline-flex items-center gap-1 text-slate-500 transition hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-300"
            :aria-label="isExpanded(topic.id) ? '收起回复' : '展开回复'"
            @click="toggleReplies(topic.id)"
          >
            <span>回复 {{ displayReplyCount(topic) }}</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-3.5 w-3.5 transition-transform"
              :class="isExpanded(topic.id) ? 'rotate-180' : ''"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.2"
            >
              <path d="M6 9l6 6 6-6"></path>
            </svg>
          </button>
          <span>{{ topic.time }}</span>
        </div>

        <div
          v-if="isExpanded(topic.id)"
          class="mt-4 rounded-2xl p-4"
        >
          <p
            v-if="replyState(topic.id).loadError"
            class="text-sm text-rose-500"
          >
            {{ replyState(topic.id).loadError }}
          </p>

          <p
            v-else-if="replyState(topic.id).loading"
            class="text-sm text-slate-500 dark:text-slate-400"
          >
            加载中...
          </p>

          <div
            v-else-if="replyState(topic.id).items.length"
            class="space-y-3"
          >
            <div
              v-for="reply in replyState(topic.id).items"
              :key="reply.id"
              class="rounded-xl"
            >
              <div class="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span class="font-medium text-slate-700 dark:text-slate-200">{{ reply.authorName }}</span>
                <span>{{ reply.time }}</span>
              </div>
              <p class="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700 dark:text-slate-300">{{ reply.content }}</p>
            </div>
          </div>

          <p
            v-else
            class="text-sm text-slate-500 dark:text-slate-400"
          >
            暂无回复
          </p>

          <div class="mt-4 border-t border-slate-200 pt-4 dark:border-slate-800">
            <textarea
              v-model="replyState(topic.id).draft"
              rows="3"
              placeholder="回复这条讨论..."
              class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-900"
            />

            <div class="mt-3 flex items-center justify-between gap-3">
              <p
                v-if="replyState(topic.id).submitError"
                class="text-xs text-rose-500"
              >
                {{ replyState(topic.id).submitError }}
              </p>
              <p
                v-else
                class="text-xs text-slate-500 dark:text-slate-400"
              >
                {{ authStore.isLoggedIn ? `当前用户：${authStore.userName}` : "登录后可回复" }}
              </p>

              <button
                class="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-emerald-600 disabled:opacity-50 dark:text-slate-950 dark:hover:bg-emerald-400"
                :disabled="replyState(topic.id).posting || !replyState(topic.id).draft.trim()"
                @click="submitReply(topic.id)"
              >
                {{ replyState(topic.id).posting ? "发送中..." : "发送回复" }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <p
      v-else
      class="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400"
    >
      {{ emptyMessage }}
    </p>

    <div v-if="items.length" class="mt-4 flex items-center justify-center gap-3">
      <button
        class="grid h-8 w-8 place-items-center rounded-lg border border-slate-300 bg-white text-slate-700 transition hover:border-slate-400 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
        :disabled="loading || page <= 1"
        @click="emit('prev-page')"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
          <path d="M15 18l-6-6 6-6"></path>
        </svg>
      </button>
      <span class="min-w-24 text-center text-sm text-slate-500 dark:text-slate-400">
        {{ page }} / {{ totalPages }}
      </span>
      <button
        class="grid h-8 w-8 place-items-center rounded-lg border border-slate-300 bg-white text-slate-700 transition hover:border-slate-400 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
        :disabled="loading || page >= totalPages"
        @click="emit('next-page')"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
          <path d="M9 18l6-6-6-6"></path>
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive } from "vue";
import { storeToRefs } from "pinia";
import {
  createDiscussionReply,
  fetchDiscussionReplies,
  type DiscussionItem,
  type DiscussionReplyItem
} from "../api/discussions";
import { useAppStore } from "../store/app";
import { useAuthStore } from "../store/auth";

interface DiscussionFeedItem extends DiscussionItem {
  time: string;
}

interface ReplyView extends DiscussionReplyItem {
  time: string;
}

interface ReplyState {
  draft: string;
  items: ReplyView[];
  loaded: boolean;
  loading: boolean;
  posting: boolean;
  loadError: string;
  submitError: string;
}

const props = withDefaults(defineProps<{
  items: DiscussionFeedItem[];
  loading: boolean;
  page: number;
  totalPages: number;
  emptyMessage?: string;
}>(), {
  emptyMessage: "暂无讨论。"
});

const emit = defineEmits<{
  (e: "prev-page"): void;
  (e: "next-page"): void;
}>();

const appStore = useAppStore();
const authStore = useAuthStore();
const { apiBase } = storeToRefs(appStore);

const expandedMap = reactive<Record<string, boolean>>({});
const replyStates = reactive<Record<string, ReplyState>>({});
const replyCountOverrides = reactive<Record<string, number>>({});

function replyState(discussionId: string) {
  if (!replyStates[discussionId]) {
    replyStates[discussionId] = {
      draft: "",
      items: [],
      loaded: false,
      loading: false,
      posting: false,
      loadError: "",
      submitError: ""
    };
  }
  return replyStates[discussionId];
}

function isExpanded(discussionId: string) {
  return Boolean(expandedMap[discussionId]);
}

function displayReplyCount(topic: DiscussionFeedItem) {
  return replyCountOverrides[topic.id] ?? topic.replyCount;
}

async function toggleReplies(discussionId: string) {
  const next = !isExpanded(discussionId);
  expandedMap[discussionId] = next;

  if (!next) {
    return;
  }

  await loadReplies(discussionId);
}

async function loadReplies(discussionId: string) {
  const state = replyState(discussionId);
  if (state.loading || state.loaded) {
    return;
  }

  state.loading = true;
  state.loadError = "";

  try {
    const replies = await fetchDiscussionReplies(apiBase.value, discussionId);
    state.items = replies.map((item) => ({
      ...item,
      time: formatTimeAgo(item.createdAt)
    }));
    state.loaded = true;
    replyCountOverrides[discussionId] = replies.length;
  } catch (error) {
    state.loadError = error instanceof Error ? error.message : String(error);
  } finally {
    state.loading = false;
  }
}

async function submitReply(discussionId: string) {
  const state = replyState(discussionId);
  state.submitError = "";

  if (!authStore.token) {
    state.submitError = "请先登录后再回复。";
    return;
  }

  const content = state.draft.trim();
  if (!content) {
    state.submitError = "回复内容不能为空。";
    return;
  }

  state.posting = true;

  try {
    const saved = await createDiscussionReply(apiBase.value, authStore.token, discussionId, { content });
    state.items = [
      ...state.items,
      {
        ...saved,
        time: formatTimeAgo(saved.createdAt)
      }
    ];
    state.loaded = true;
    state.draft = "";
    replyCountOverrides[discussionId] = state.items.length;
  } catch (error) {
    state.submitError = error instanceof Error ? error.message : String(error);
  } finally {
    state.posting = false;
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
</script>
