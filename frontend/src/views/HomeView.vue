<template>
  <section class="space-y-6">
    <article class="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-emerald-50 shadow-[0_24px_60px_-30px_rgba(15,23,42,0.35)] dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-emerald-950/40 dark:shadow-none">
      <div class="pointer-events-none absolute -left-16 -top-16 h-48 w-48 rounded-full bg-cyan-300/25 blur-3xl dark:bg-cyan-500/20"></div>
      <div class="pointer-events-none absolute -right-12 top-8 h-56 w-56 rounded-full bg-emerald-300/30 blur-3xl dark:bg-emerald-500/20"></div>

      <div class="relative grid gap-6 p-6 lg:grid-cols-[1.45fr_1fr] lg:p-8">
        <div>
          <div class="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-3 py-1 text-xs font-medium text-emerald-700 shadow-sm dark:border-emerald-700/60 dark:bg-emerald-900/30 dark:text-emerald-200">
            <span class="h-2 w-2 rounded-full bg-emerald-500"></span>
            Interview Intelligence Console
          </div>

          <h2 class="mt-4 text-3xl font-bold leading-tight text-slate-900 lg:text-4xl dark:text-white">
            {{ greeting }}，今天继续把面试胜率拉高
          </h2>
          <p class="mt-3 max-w-2xl text-slate-600 dark:text-slate-300">
            主页已按岗位导向重构：先选赛道，再做面试实战，最后看报告改进。全流程像刷题一样高频，像求职一样真实。
          </p>

          <div class="mt-6 flex flex-wrap gap-3">
            <RouterLink
              to="/dashboard"
              class="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_24px_-12px_rgba(15,23,42,0.6)] transition hover:-translate-y-0.5 hover:bg-slate-800 dark:bg-emerald-500 dark:text-slate-950 dark:hover:bg-emerald-400"
            >
              开始配置训练
            </RouterLink>
            <RouterLink
              to="/dashboard"
              class="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-400 hover:text-emerald-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-emerald-500"
            >
              继续当前面试
            </RouterLink>
            <RouterLink
              to="/insights"
              class="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-400 hover:text-cyan-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-cyan-500"
            >
              查看报告中心
            </RouterLink>
          </div>
        </div>

        <div class="rounded-2xl border border-slate-200 bg-white/85 p-5 shadow-xl shadow-slate-200/70 backdrop-blur dark:border-slate-700 dark:bg-slate-900/80 dark:shadow-none">
          <div class="flex items-start justify-between">
            <div>
              <p class="text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">本轮进度</p>
              <p class="mt-1 text-lg font-semibold">{{ currentInterview ? '面试进行中' : '等待创建面试' }}</p>
            </div>
            <div class="relative grid h-14 w-14 place-items-center rounded-full bg-slate-100 dark:bg-slate-800">
              <span class="text-sm font-semibold text-emerald-700 dark:text-emerald-300">{{ completedRate }}%</span>
            </div>
          </div>

          <div class="mt-4 grid grid-cols-2 gap-2">
            <div class="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-950/60">
              <p class="text-[11px] text-slate-500 dark:text-slate-400">岗位数</p>
              <p class="mt-1 text-xl font-semibold text-slate-900 dark:text-slate-100">{{ positions.length }}</p>
            </div>
            <div class="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-950/60">
              <p class="text-[11px] text-slate-500 dark:text-slate-400">题库量</p>
              <p class="mt-1 text-xl font-semibold text-slate-900 dark:text-slate-100">{{ questions.length }}</p>
            </div>
            <div class="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-950/60">
              <p class="text-[11px] text-slate-500 dark:text-slate-400">知识片段</p>
              <p class="mt-1 text-xl font-semibold text-slate-900 dark:text-slate-100">{{ knowledge.length }}</p>
            </div>
            <div class="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-950/60">
              <p class="text-[11px] text-slate-500 dark:text-slate-400">当前状态</p>
              <p class="mt-1 text-sm font-semibold text-emerald-700 dark:text-emerald-300">{{ statusLabel }}</p>
            </div>
          </div>
        </div>
      </div>
    </article>

    <section class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <article class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <p class="text-xs uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">训练目标</p>
        <p class="mt-2 text-base font-semibold text-slate-900 dark:text-slate-100">
          {{ currentInterview ? "冲刺本轮面试" : "创建本轮面试计划" }}
        </p>
        <p class="mt-1 text-sm text-slate-600 dark:text-slate-400">
          {{ currentInterview ? "继续完成当前题目，保持训练节奏。" : "先定岗位，再拉通题库和知识点。" }}
        </p>
      </article>

      <article class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <p class="text-xs uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">准备度</p>
        <p class="mt-2 text-base font-semibold text-slate-900 dark:text-slate-100">{{ completedRate }}% 已完成</p>
        <p class="mt-1 text-sm text-slate-600 dark:text-slate-400">建议每天至少完成 1 次模拟和 1 次复盘。</p>
      </article>

      <article class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <p class="text-xs uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">内容库存</p>
        <p class="mt-2 text-base font-semibold text-slate-900 dark:text-slate-100">{{ questions.length + knowledge.length }} 条可练习素材</p>
        <p class="mt-1 text-sm text-slate-600 dark:text-slate-400">题库与知识片段已就绪，可直接进入面试实战。</p>
      </article>

      <article class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <p class="text-xs uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">建议动作</p>
        <div class="mt-2 flex flex-wrap gap-2">
          <RouterLink
            to="/dashboard"
            class="rounded-lg border border-slate-300 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700 transition hover:border-emerald-400 hover:text-emerald-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-emerald-500"
          >
            去工作台
          </RouterLink>
          <RouterLink
            to="/insights"
            class="rounded-lg border border-slate-300 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700 transition hover:border-cyan-400 hover:text-cyan-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-cyan-500"
          >
            看报告
          </RouterLink>
        </div>
      </article>
    </section>

    <section class="grid gap-6 lg:grid-cols-12">
      <article class="lg:col-span-8">
        <div class="mb-3 flex items-center justify-between">
          <h3 class="text-lg font-semibold">求职讨论</h3>
          <RouterLink to="/me" class="text-sm text-emerald-700 hover:underline dark:text-emerald-300">查看我的画像</RouterLink>
        </div>

        <div class="divide-y divide-slate-200 dark:divide-slate-800">
          <div
            v-for="topic in discussions"
            :key="topic.id"
            class="py-4"
          >
            <div class="flex flex-wrap items-center justify-between gap-2">
              <p class="font-medium text-slate-900 dark:text-slate-100">{{ topic.title }}</p>
              <span class="text-xs text-slate-500 dark:text-slate-400">{{ topic.tag }}</span>
            </div>
            <p class="mt-1 text-sm text-slate-600 dark:text-slate-400">{{ topic.summary }}</p>
            <div class="mt-2 flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
              <span>作者：{{ topic.author }}</span>
              <span>回复 {{ topic.replies }}</span>
              <span>{{ topic.time }}</span>
            </div>
          </div>
        </div>
      </article>

      <article class="lg:col-span-4">
        <div class="min-h-[520px] rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_20px_45px_-35px_rgba(15,23,42,0.45)] dark:border-slate-800 dark:bg-slate-900 dark:shadow-none lg:sticky lg:top-24">
          <div class="mb-4 flex items-center justify-between">
            <h3 class="text-lg font-semibold">岗位推荐</h3>
            <button
              class="rounded-lg border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-600 transition hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
              @click="refreshData"
            >
              刷新
            </button>
          </div>

          <div class="space-y-3">
            <div
              v-for="position in positions"
              :key="position.id"
              class="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950"
            >
              <div class="mb-2 flex items-center justify-between">
                <h4 class="font-semibold text-slate-900 dark:text-slate-100">{{ position.name }}</h4>
                <span class="rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700 dark:border-emerald-700/60 dark:bg-emerald-900/30 dark:text-emerald-300">
                  {{ position.defaultDifficulty }}
                </span>
              </div>
              <p class="line-clamp-2 text-sm text-slate-600 dark:text-slate-400">{{ position.description }}</p>
              <div class="mt-3 flex flex-wrap gap-2">
                <span
                  v-for="tag in position.highlights.slice(0, 2)"
                  :key="`${position.id}-${tag}`"
                  class="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                >
                  {{ tag }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </article>
    </section>
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
  questions,
  knowledge,
  currentInterview
} = storeToRefs(interviewStore);

const discussions = [
  { id: 1, title: "前端面试里“项目深挖”到底怎么答才不空？", summary: "大家聊了很多高频追问：指标怎么量化、为什么这么选技术栈、踩坑怎么复盘。", author: "小林", replies: 23, time: "2小时前", tag: "项目面" },
  { id: 2, title: "Java 后端一面被问缓存一致性，大家都怎么组织答案？", summary: "从双删策略、消息队列异步修正到幂等重试，整理了一套可复用答题模板。", author: "阿哲", replies: 35, time: "4小时前", tag: "技术面" },
  { id: 3, title: "行为面怎么讲失败经历才不扣分？", summary: "重点不是“失败”本身，而是复盘深度、责任边界和后续改进动作。", author: "Mia", replies: 18, time: "昨天", tag: "行为面" },
  { id: 4, title: "秋招前两周冲刺计划，有没有可执行版本？", summary: "讨论了每天 1 场模拟 + 1 次复盘 + 1 个薄弱点专项练习的节奏。", author: "Rex", replies: 41, time: "昨天", tag: "备战" },
  { id: 5, title: "算法岗项目经历少，简历里怎么写更有说服力？", summary: "分享了竞赛、课程项目和开源贡献的表达方式。", author: "Yuki", replies: 27, time: "1天前", tag: "简历" },
  { id: 6, title: "后端限流和熔断到底怎么讲才不泛泛而谈？", summary: "建议从业务场景、阈值选择、监控指标、演练过程四步展开。", author: "Tom", replies: 16, time: "1天前", tag: "系统设计" },
  { id: 7, title: "前端性能优化面试，哪些指标最常被追问？", summary: "LCP/FCP/CLS 与埋点口径是重点，同时要会讲优化前后对比。", author: "Ivy", replies: 22, time: "2天前", tag: "性能" },
  { id: 8, title: "校招二面常见压力问题，有没有应对思路？", summary: "讨论了反问技巧、边界表达和情绪管理。", author: "Neo", replies: 33, time: "2天前", tag: "面试技巧" }
];

const greeting = computed(() => {
  const hour = new Date().getHours();
  if (hour < 12) {
    return "早上好";
  }
  if (hour < 18) {
    return "下午好";
  }
  return "晚上好";
});

const completedRate = computed(() => {
  const answered = currentInterview.value?.progress?.answeredBaseQuestions ?? 0;
  const target = currentInterview.value?.progress?.targetQuestionCount ?? 0;
  if (target <= 0) {
    return 0;
  }
  return Math.min(100, Math.round((answered / target) * 100));
});

const statusLabel = computed(() => {
  if (!currentInterview.value) {
    return "未创建";
  }
  return currentInterview.value.status === "completed" ? "已完成" : "进行中";
});

async function refreshData() {
  await interviewStore.loadPositionsAction(apiBase.value);
  await interviewStore.loadPositionAssetsAction(apiBase.value);
}
</script>
