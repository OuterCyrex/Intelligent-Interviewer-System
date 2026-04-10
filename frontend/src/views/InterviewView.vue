<template>
  <section class="grid gap-4 lg:grid-cols-5">
    <article class="space-y-4 rounded-2xl border border-slate-800 bg-slate-900 p-4 lg:col-span-3">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <h2 class="text-lg font-semibold">面试进行中</h2>
        <div class="flex gap-2" v-if="currentInterview">
          <button class="rounded-lg border border-slate-700 px-3 py-1 text-sm hover:border-slate-500" @click="refreshInterview">
            刷新状态
          </button>
          <button
            class="rounded-lg border border-amber-500 px-3 py-1 text-sm text-amber-400 hover:bg-amber-500/10 disabled:opacity-50"
            :disabled="completingInterview"
            @click="completeInterview"
          >
            {{ completingInterview ? "处理中..." : "强制完成" }}
          </button>
        </div>
      </div>

      <div v-if="currentInterview" class="space-y-3">
        <div class="rounded-xl border border-slate-800 bg-slate-950 p-3 text-sm">
          <p>候选人: <span class="font-medium">{{ currentInterview.candidateName }}</span></p>
          <p>状态: <span class="font-medium">{{ currentInterview.status }}</span></p>
          <p>
            进度:
            <span class="font-medium">
              {{ currentInterview.progress?.answeredBaseQuestions ?? 0 }} / {{ currentInterview.progress?.targetQuestionCount ?? 0 }}
            </span>
          </p>
        </div>

        <div v-if="activeTurn" class="rounded-xl border border-slate-800 bg-slate-950 p-3">
          <p class="mb-1 text-xs uppercase tracking-wide text-amber-400">当前题目</p>
          <p class="text-sm leading-6">{{ activeTurn.prompt }}</p>
          <p class="mt-2 text-xs text-slate-400">turnId: {{ activeTurn.id }}</p>
        </div>
        <p v-else class="rounded-xl border border-slate-800 bg-slate-950 p-3 text-sm text-slate-400">当前无待回答题目。</p>

        <div class="space-y-2">
          <label class="block text-sm text-slate-300">回答内容</label>
          <textarea
            v-model="answerText"
            rows="6"
            class="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-amber-400"
            placeholder="输入你的回答"
          />
        </div>

        <div class="grid gap-2 sm:grid-cols-2">
          <div>
            <label class="mb-1 block text-sm text-slate-300">转写文本（可选）</label>
            <input
              v-model="transcript"
              type="text"
              class="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-amber-400"
            />
          </div>
          <div>
            <label class="mb-1 block text-sm text-slate-300">语音时长秒数（可选）</label>
            <input
              v-model.number="durationSeconds"
              type="number"
              min="1"
              class="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-amber-400"
            />
          </div>
        </div>

        <button
          class="w-full rounded-lg bg-amber-500 px-4 py-2 font-semibold text-slate-950 hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="submittingAnswer || !activeTurn || !answerText.trim()"
          @click="submitAnswer"
        >
          {{ submittingAnswer ? "提交中..." : "提交回答" }}
        </button>
      </div>

      <p v-else class="rounded-xl border border-slate-800 bg-slate-950 p-3 text-sm text-slate-400">
        还没有创建面试，请先到“配置”页创建。
      </p>
    </article>

    <article class="space-y-3 rounded-2xl border border-slate-800 bg-slate-900 p-4 lg:col-span-2">
      <h2 class="text-lg font-semibold">实时评估</h2>
      <div v-if="lastEvaluation" class="rounded-xl border border-slate-800 bg-slate-950 p-3 text-sm">
        <p class="font-medium">最近一次结果</p>
        <p class="mt-2 leading-6 text-slate-300">{{ lastEvaluation.evaluationSummary }}</p>
        <p class="mt-2 text-slate-400">overall: {{ lastEvaluation.overallScore ?? '-' }}</p>
        <p class="text-slate-400">source: {{ lastEvaluation.evaluationSource ?? '-' }}</p>
      </div>
      <p v-else class="rounded-xl border border-slate-800 bg-slate-950 p-3 text-sm text-slate-400">提交回答后会显示评分摘要。</p>
    </article>
  </section>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";
import { useAppStore } from "../store/app";
import { useInterviewStore } from "../store/interview";

const appStore = useAppStore();
const interviewStore = useInterviewStore();

const { apiBase } = storeToRefs(appStore);
const {
  currentInterview,
  activeTurn,
  answerText,
  transcript,
  durationSeconds,
  lastEvaluation,
  submittingAnswer,
  completingInterview
} = storeToRefs(interviewStore);

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
