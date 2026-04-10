<template>
  <section class="space-y-5">
    <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="text-xl font-semibold">面试报告中心</h2>
          <p class="text-sm text-slate-500 dark:text-slate-400">查看当前会话的评分、总结与后续建议</p>
        </div>
        <div class="flex flex-wrap gap-2" v-if="currentInterview">
          <button class="rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:border-slate-400 dark:border-slate-700" :disabled="loadingReport" @click="loadReport">
            {{ loadingReport ? "加载报告..." : "刷新报告" }}
          </button>
          <button class="rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:border-slate-400 dark:border-slate-700" :disabled="loadingRecommendations" @click="loadRecommendations">
            {{ loadingRecommendations ? "加载推荐..." : "获取推荐" }}
          </button>
          <button class="rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:border-slate-400 dark:border-slate-700" :disabled="loadingOverview" @click="loadOverview">
            {{ loadingOverview ? "加载概览..." : "成长概览" }}
          </button>
        </div>
      </div>
      <p v-if="!currentInterview" class="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400">
        当前没有面试会话，请先在工作台开始一场面试。
      </p>
    </article>

    <section v-if="report" class="grid gap-4 md:grid-cols-5">
      <article class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:col-span-2">
        <p class="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Overall</p>
        <p class="mt-2 text-5xl font-bold text-emerald-600 dark:text-emerald-300">{{ report.overallScore }}</p>
        <p class="mt-2 text-sm text-slate-500 dark:text-slate-400">综合评分（0-100）</p>
      </article>

      <article class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:col-span-3">
        <h3 class="text-base font-semibold">维度评分</h3>
        <div class="mt-3 grid gap-2 sm:grid-cols-2">
          <div class="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-950">技术正确性：<span class="font-semibold">{{ report.technicalScore }}</span></div>
          <div class="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-950">表达沟通：<span class="font-semibold">{{ report.communicationScore }}</span></div>
          <div class="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-950">深度分析：<span class="font-semibold">{{ report.depthScore }}</span></div>
          <div class="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-950">岗位匹配：<span class="font-semibold">{{ report.roleFitScore }}</span></div>
        </div>
      </article>
    </section>

    <article v-if="report" class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h3 class="text-base font-semibold">报告总结</h3>
      <p class="mt-2 leading-7 text-slate-700 dark:text-slate-300">{{ report.summary }}</p>
    </article>

    <section v-if="report" class="grid gap-4 md:grid-cols-3">
      <article class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h3 class="mb-2 font-semibold">优势</h3>
        <ul class="space-y-1 text-sm text-slate-700 dark:text-slate-300">
          <li v-for="item in report.strengths" :key="item">- {{ item }}</li>
        </ul>
      </article>
      <article class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h3 class="mb-2 font-semibold">改进点</h3>
        <ul class="space-y-1 text-sm text-slate-700 dark:text-slate-300">
          <li v-for="item in report.improvementAreas" :key="item">- {{ item }}</li>
        </ul>
      </article>
      <article class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h3 class="mb-2 font-semibold">下一步</h3>
        <ul class="space-y-1 text-sm text-slate-700 dark:text-slate-300">
          <li v-for="item in report.nextSteps" :key="item">- {{ item }}</li>
        </ul>
      </article>
    </section>

    <section v-if="recommendations" class="grid gap-4 md:grid-cols-2">
      <article class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h3 class="mb-2 font-semibold">推荐聚焦与趋势</h3>
        <p class="text-sm">聚焦点：{{ recommendations.focusAreas.join(', ') || '-' }}</p>
        <p class="mt-1 text-sm">完成轮次：{{ recommendations.trend?.completedInterviews ?? 0 }}</p>
        <p class="text-sm">最新分数：{{ recommendations.trend?.latestOverallScore ?? '-' }}</p>
        <p class="text-sm">变化值：{{ recommendations.trend?.delta ?? '-' }}</p>
      </article>

      <article class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h3 class="mb-2 font-semibold">成长概览</h3>
        <template v-if="overview">
          <p class="text-sm">候选人：{{ overview.candidateName }}</p>
          <p class="text-sm">已完成：{{ overview.completedInterviews }}</p>
          <p class="text-sm">平均分：{{ overview.averageOverallScore ?? '-' }}</p>
          <p class="text-sm">长期关注：{{ overview.focusAreas.join(', ') || '-' }}</p>
        </template>
        <p v-else class="text-sm text-slate-500 dark:text-slate-400">点击“成长概览”后展示。</p>
      </article>
    </section>

    <section v-if="recommendations" class="grid gap-4 md:grid-cols-2">
      <article class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h3 class="mb-2 font-semibold">知识推荐</h3>
        <ul class="space-y-2 text-sm">
          <li v-for="item in recommendations.knowledgeRecommendations" :key="item.id" class="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-950">
            <p class="font-medium">{{ item.title }}</p>
            <p class="mt-1 text-slate-600 dark:text-slate-400">{{ item.summary }}</p>
          </li>
        </ul>
      </article>

      <article class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h3 class="mb-2 font-semibold">练习题推荐</h3>
        <ul class="space-y-2 text-sm">
          <li v-for="item in recommendations.practiceQuestions" :key="item.id" class="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-950">
            <p class="font-medium">{{ item.topic }}</p>
            <p class="mt-1 text-slate-600 dark:text-slate-400">{{ item.type }} / {{ item.difficulty }}</p>
          </li>
        </ul>
      </article>
    </section>
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
  report,
  recommendations,
  overview,
  loadingReport,
  loadingRecommendations,
  loadingOverview
} = storeToRefs(interviewStore);

async function loadReport() {
  await interviewStore.loadReportAction(apiBase.value);
}

async function loadRecommendations() {
  await interviewStore.loadRecommendationsAction(apiBase.value);
}

async function loadOverview() {
  await interviewStore.loadOverviewAction(apiBase.value);
}
</script>
