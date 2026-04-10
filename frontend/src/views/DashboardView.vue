<template>
  <section class="h-[calc(100vh-140px)] min-h-[620px]">
    <div class="flex h-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_70px_-40px_rgba(15,23,42,0.45)] dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
      <aside class="w-[320px] shrink-0 border-r border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950">
        <div class="border-b border-slate-200 px-4 py-3 dark:border-slate-800">
          <div class="mb-2 flex items-center justify-between">
            <h2 class="text-base font-semibold">岗位列表</h2>
            <button
              class="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900"
              :disabled="loadingPositions"
              @click="refreshAll"
            >
              {{ loadingPositions ? "刷新中" : "刷新" }}
            </button>
          </div>
          <p class="text-xs text-slate-500 dark:text-slate-400">像联系人一样选择你的目标岗位</p>
        </div>

        <div class="h-[calc(100%-180px)] overflow-y-auto p-2">
          <button
            v-for="position in positions"
            :key="position.id"
            class="mb-2 w-full rounded-xl border p-3 text-left transition"
            :class="selectedPositionId === position.id
              ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20'
              : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900'"
            @click="selectedPositionId = position.id"
          >
            <p class="font-medium">{{ position.name }}</p>
            <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">{{ position.slug }}</p>
          </button>
        </div>

        <div class="border-t border-slate-200 p-3 dark:border-slate-800">
          <div class="grid grid-cols-2 gap-2 text-xs">
            <div class="rounded-lg border border-slate-200 bg-white p-2 dark:border-slate-700 dark:bg-slate-900">题库 {{ questions.length }}</div>
            <div class="rounded-lg border border-slate-200 bg-white p-2 dark:border-slate-700 dark:bg-slate-900">知识 {{ knowledge.length }}</div>
          </div>
        </div>
      </aside>

      <main class="flex min-w-0 flex-1 flex-col">
        <header class="border-b border-slate-200 px-4 py-3 dark:border-slate-800">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 class="text-lg font-semibold">面试会话</h3>
              <p class="text-sm text-slate-500 dark:text-slate-400">
                {{ currentInterview ? `状态：${currentInterview.status}` : '先在左侧选择岗位并开始面试' }}
              </p>
            </div>
            <div class="flex gap-2" v-if="currentInterview">
              <button class="rounded-lg border border-slate-300 px-3 py-1 text-sm dark:border-slate-700" @click="refreshInterview">刷新</button>
              <button class="rounded-lg border border-amber-400 px-3 py-1 text-sm text-amber-600 dark:text-amber-300" :disabled="completingInterview" @click="completeInterview">
                {{ completingInterview ? '处理中...' : '结束并生成报告' }}
              </button>
            </div>
          </div>
        </header>

        <div class="border-b border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950">
          <div class="grid gap-2 md:grid-cols-5">
            <input v-model="candidateName" type="text" placeholder="候选人" class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-900" />
            <select v-model="mode" class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-900">
              <option value="text">text</option>
              <option value="speech">speech</option>
            </select>
            <select v-model="difficulty" class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-900">
              <option value="">默认</option>
              <option value="junior">junior</option>
              <option value="intermediate">intermediate</option>
              <option value="senior">senior</option>
            </select>
            <input v-model.number="targetQuestionCount" type="number" min="3" max="6" placeholder="题数" class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-900" />
            <button
              class="rounded-lg bg-emerald-500 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-50 dark:text-slate-950 dark:hover:bg-emerald-400"
              :disabled="creatingInterview || !selectedPositionId || !candidateName.trim()"
              @click="createInterview"
            >
              {{ creatingInterview ? '创建中...' : (currentInterview ? '重新开始' : '开始面试') }}
            </button>
          </div>
          <input v-model="focusAreasText" type="text" placeholder="聚焦点（例如 Redis, 系统设计）" class="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-900" />
        </div>

        <div class="min-h-0 flex-1 overflow-y-auto bg-white p-4 dark:bg-slate-900">
          <template v-if="currentInterview">
            <div class="space-y-3">
              <template v-for="item in conversationTurns" :key="item.id">
                <div class="max-w-[78%] rounded-2xl rounded-bl-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm dark:border-emerald-800/60 dark:bg-emerald-900/20">
                  <p class="text-xs text-emerald-700 dark:text-emerald-300">面试官</p>
                  <p class="mt-1 leading-6">{{ item.prompt }}</p>
                </div>

                <div
                  v-if="item.answeredAt && item.answerText"
                  class="ml-auto max-w-[78%] rounded-2xl rounded-br-md border border-sky-200 bg-sky-50 px-3 py-2 text-sm dark:border-sky-800/60 dark:bg-sky-900/20"
                >
                  <p class="text-xs text-sky-700 dark:text-sky-300">你</p>
                  <p class="mt-1 leading-6">{{ item.answerText }}</p>
                  <p v-if="item.evaluationSummary" class="mt-2 text-xs text-slate-500 dark:text-slate-400">评估：{{ item.evaluationSummary }}</p>
                </div>
              </template>
            </div>
          </template>
          <div v-else class="grid h-full place-items-center text-sm text-slate-400">开始面试后，这里会显示对话内容</div>
        </div>

        <footer class="border-t border-slate-200 p-3 dark:border-slate-800" v-if="currentInterview">
          <div class="space-y-2">
            <p class="text-xs text-slate-500 dark:text-slate-400">当前问题：{{ activeTurn?.prompt || '当前无待回答问题' }}</p>
            <textarea
              v-model="answerText"
              rows="3"
              class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950"
              placeholder="输入回答，提交后会作为聊天消息显示"
            />
            <div class="grid gap-2 sm:grid-cols-3">
              <input v-model="transcript" type="text" placeholder="转写文本（可选）" class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950" />
              <input v-model.number="durationSeconds" type="number" min="1" placeholder="语音时长秒数" class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950" />
              <button
                class="rounded-lg bg-emerald-500 px-4 py-2 font-semibold text-white hover:bg-emerald-600 disabled:opacity-50 dark:text-slate-950 dark:hover:bg-emerald-400"
                :disabled="submittingAnswer || !activeTurn || !answerText.trim()"
                @click="submitAnswer"
              >
                {{ submittingAnswer ? '发送中...' : '发送回答' }}
              </button>
            </div>
          </div>
        </footer>
      </main>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { storeToRefs } from "pinia";
import { useAppStore } from "../store/app";
import { useInterviewStore } from "../store/interview";

const appStore = useAppStore();
const interviewStore = useInterviewStore();

const { apiBase } = storeToRefs(appStore);
const {
  positions,
  selectedPositionId,
  questions,
  knowledge,
  candidateName,
  mode,
  difficulty,
  targetQuestionCount,
  focusAreasText,
  creatingInterview,
  loadingPositions,
  currentInterview,
  activeTurn,
  answerText,
  transcript,
  durationSeconds,
  submittingAnswer,
  completingInterview
} = storeToRefs(interviewStore);

const conversationTurns = computed(() => {
  const turns = ((currentInterview.value as unknown as { turns?: Array<Record<string, unknown>> })?.turns ?? []) as Array<Record<string, unknown>>;
  return turns.sort((a, b) => Number(a.sequence ?? 0) - Number(b.sequence ?? 0));
});

async function refreshAll() {
  await interviewStore.loadPositionsAction(apiBase.value);
  await interviewStore.loadPositionAssetsAction(apiBase.value);
}

async function createInterview() {
  await interviewStore.createInterviewAction(apiBase.value);
}

async function refreshInterview() {
  await interviewStore.refreshInterviewAction(apiBase.value);
}

async function submitAnswer() {
  await interviewStore.submitAnswerAction(apiBase.value);
}

async function completeInterview() {
  await interviewStore.completeInterviewAction(apiBase.value);
}
</script>
