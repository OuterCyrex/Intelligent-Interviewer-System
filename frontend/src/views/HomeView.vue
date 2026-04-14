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
              开始面试
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

    <section class="grid gap-5 md:grid-cols-2 xl:grid-cols-2">
      <article class="rounded-2xl border border-emerald-200 bg-slate-950 p-6 text-white shadow-[0_20px_45px_-35px_rgba(6,78,59,0.9)]">
        <div class="flex items-center justify-between gap-3">
          <p class="text-xs uppercase tracking-[0.18em] text-emerald-100/70">今日报告</p>
          <button
            class="rounded-lg border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-white/90 transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="loadingReportInsights"
            @click="loadReportInsights"
          >
            {{ loadingReportInsights ? "刷新中" : "刷新" }}
          </button>
        </div>

        <div class="mt-5 flex items-end justify-between gap-4">
          <div>
            <p class="text-6xl font-black tracking-tight">{{ todayReportsCount }}</p>
            <p class="mt-1 text-xs text-emerald-50/65">今日生成报告数</p>
          </div>
        </div>

        <div class="mt-6 grid grid-cols-7 gap-2.5">
          <div
            v-for="day in recentDailyReportCounts"
            :key="day.date"
            class="flex flex-col items-center gap-2"
          >
            <div class="flex h-16 items-end">
              <div
                class="w-6 rounded-full bg-gradient-to-t from-emerald-400 via-emerald-300 to-cyan-300 shadow-[0_8px_18px_-12px_rgba(103,232,249,0.85)]"
                :class="day.count <= 0 ? 'opacity-20' : ''"
                :style="{ height: `${dailyBarHeight(day.count)}px` }"
              ></div>
            </div>
            <div class="text-[10px] text-emerald-50/65">{{ day.label }}</div>
          </div>
        </div>
      </article>

      <article class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div class="flex items-center justify-between gap-3">
          <p class="text-xs uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">热力图</p>
          <div class="text-right">
          </div>
        </div>

        <div class="mt-5 overflow-x-auto">
          <div class="inline-flex w-max items-start gap-1.5">
            <div v-for="(week, index) in reportHeatmapWeeks" :key="index" class="grid grid-rows-7 gap-1">
              <div
                v-for="day in week"
                :key="day.date"
                class="h-5 w-5 rounded-[4px]"
                :class="heatColorClass(day.count)"
                :title="`${day.date} · ${day.count} 份报告`"
              ></div>
            </div>
          </div>
        </div>

      </article>
    </section>

    <p
      v-if="reportInsightsError"
      class="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-700/60 dark:bg-amber-900/20 dark:text-amber-300"
    >
      报告看板暂时没加载成功：{{ reportInsightsError }}
    </p>

    <section class="grid gap-6 lg:grid-cols-12">
      <article class="lg:col-span-8">
        <div class="mb-3 flex items-center justify-between">
          <h3 class="text-lg font-semibold">求职讨论</h3>
        </div>

        <DiscussionFeed
          :items="discussions"
          :loading="loadingDiscussions"
          :page="discussionsPage"
          :total-pages="discussionsTotalPages"
          empty-message="暂无讨论，先发起第一条吧。"
          @prev-page="goPrevPage"
          @next-page="goNextPage"
        />
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
                  {{ position.defaultDifficulty === "junior" ? "初级" : position.defaultDifficulty === "intermediate" ? "中级" : "高级" }}
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
import { computed, onMounted, ref } from "vue";
import { storeToRefs } from "pinia";
import { fetchDiscussions, type DiscussionItem } from "../api/discussions";
import DiscussionFeed from "../components/DiscussionFeed.vue";
import { fetchReports, type ReportWithInterview } from "../api/reports";
import { useAppStore } from "../store/app";
import { useInterviewStore } from "../store/interview";

interface HeatCell {
  date: string;
  count: number | null;
}

interface DailyReportCount {
  date: string;
  label: string;
  count: number;
}

const appStore = useAppStore();
const interviewStore = useInterviewStore();
const { apiBase } = storeToRefs(appStore);
const {
  positions,
  questions,
  knowledge,
  currentInterview
} = storeToRefs(interviewStore);
const discussionsPage = ref(1);
const discussionsPageSize = ref(6);
const discussionsTotal = ref(0);
const discussionsTotalPages = ref(1);
const loadingDiscussions = ref(false);
const discussions = ref<Array<DiscussionItem & { time: string }>>([]);
const loadingReportInsights = ref(false);
const reportInsightsError = ref("");
const reports = ref<ReportWithInterview[]>([]);

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

const sortedReports = computed(() =>
  [...reports.value].sort((a, b) => getReportTimestamp(b) - getReportTimestamp(a))
);

const reportDayCountMap = computed(() => {
  const counter = new Map<string, number>();
  for (const item of sortedReports.value) {
    const key = getReportDateKey(item);
    if (!key) {
      continue;
    }
    counter.set(key, (counter.get(key) ?? 0) + 1);
  }
  return counter;
});

const todayReportsCount = computed(() => reportDayCountMap.value.get(toDateKey(new Date())) ?? 0);

const recentMonthActiveDays = computed(() => {
  let total = 0;
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - 29);

  for (let i = 0; i < 30; i += 1) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    if ((reportDayCountMap.value.get(toDateKey(date)) ?? 0) > 0) {
      total += 1;
    }
  }

  return total;
});

const recentDailyReportCounts = computed<DailyReportCount[]>(() => {
  const days: DailyReportCount[] = [];
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - 6);

  for (let i = 0; i < 7; i += 1) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    const key = toDateKey(date);
    days.push({
      date: key,
      label: `${date.getMonth() + 1}/${date.getDate()}`,
      count: reportDayCountMap.value.get(key) ?? 0
    });
  }

  return days;
});

const recentDailyMaxCount = computed(() =>
  Math.max(1, ...recentDailyReportCounts.value.map((item) => item.count))
);

const averageOverallScore = computed(() => {
  if (!sortedReports.value.length) {
    return 0;
  }
  return Math.round(
    sortedReports.value.reduce((sum, item) => sum + item.overallScore, 0) / sortedReports.value.length
  );
});

const dimensionAverages = computed(() => {
  const total = sortedReports.value.length;
  const average = (getter: (item: ReportWithInterview) => number) => {
    if (!total) {
      return 0;
    }
    return Math.round(sortedReports.value.reduce((sum, item) => sum + getter(item), 0) / total);
  };

  return [
    { key: "technical", label: "技术", score: average((item) => item.technicalScore) },
    { key: "communication", label: "表达", score: average((item) => item.communicationScore) },
    { key: "depth", label: "深度", score: average((item) => item.depthScore) },
    { key: "roleFit", label: "匹配", score: average((item) => item.roleFitScore) }
  ];
});

const dimensionScoreMap = computed(() =>
  dimensionAverages.value.reduce<Record<string, number>>((map, item) => {
    map[item.key] = item.score;
    return map;
  }, {})
);

const reportRadarAxes = computed(() => {
  const radius = 68;
  return dimensionAverages.value.map((item, index, array) => {
    const angle = -Math.PI / 2 + (index * Math.PI * 2) / array.length;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    const labelX = Math.cos(angle) * (radius + 18);
    const labelY = Math.sin(angle) * (radius + 18);
    return { ...item, angle, x, y, labelX, labelY };
  });
});

const reportRadarValuePoints = computed(() =>
  reportRadarAxes.value
    .map((axis) => {
      const ratio = Math.max(0, Math.min(100, dimensionScoreMap.value[axis.key] ?? 0)) / 100;
      const x = Math.cos(axis.angle) * 68 * ratio;
      const y = Math.sin(axis.angle) * 68 * ratio;
      return `${x},${y}`;
    })
    .join(" ")
);

const reportHeatmapWeeks = computed(() => {
  const cells: HeatCell[] = [];
  const totalDays = 10 * 7;
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (totalDays - 1));

  for (let i = 0; i < totalDays; i += 1) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    const key = toDateKey(date);
    cells.push({
      date: key,
      count: reportDayCountMap.value.get(key) ?? 0
    });
  }

  const weeks: HeatCell[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }
  return weeks;
});

async function refreshData() {
  await interviewStore.loadPositionsAction(apiBase.value);
  await interviewStore.loadPositionAssetsAction(apiBase.value);
}

async function loadReportInsights() {
  loadingReportInsights.value = true;
  reportInsightsError.value = "";

  try {
    reports.value = await fetchReports(apiBase.value);
  } catch (error) {
    reports.value = [];
    reportInsightsError.value = error instanceof Error ? error.message : String(error);
  } finally {
    loadingReportInsights.value = false;
  }
}

async function loadDiscussions(page = discussionsPage.value) {
  loadingDiscussions.value = true;
  try {
    const result = await fetchDiscussions(apiBase.value, page, discussionsPageSize.value);
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

function dailyBarHeight(count: number) {
  if (count <= 0) {
    return 10;
  }
  return 10 + Math.round((count / recentDailyMaxCount.value) * 46);
}

function reportRadarGridPoints(percent: number) {
  const radius = 68 * (percent / 100);
  return reportRadarAxes.value
    .map((axis) => `${Math.cos(axis.angle) * radius},${Math.sin(axis.angle) * radius}`)
    .join(" ");
}

function heatColorClass(count: number | null) {
  if (count === null) {
    return "bg-transparent";
  }
  if (count <= 0) {
    return "bg-slate-200 dark:bg-slate-700";
  }
  if (count === 1) {
    return "bg-emerald-200 dark:bg-emerald-800";
  }
  if (count === 2) {
    return "bg-emerald-400 dark:bg-emerald-600";
  }
  return "bg-emerald-600 dark:bg-emerald-400";
}

function getReportTimestamp(item: ReportWithInterview) {
  const raw = item.createdAt || item.interview?.completedAt || "";
  const time = new Date(raw).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function getReportDateKey(item: ReportWithInterview) {
  return toLocalDateKey(item.createdAt || item.interview?.completedAt || "");
}

function toDateKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function toLocalDateKey(input: string) {
  if (!input) {
    return "";
  }
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return toDateKey(date);
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
  await Promise.all([
    loadDiscussions(1),
    loadReportInsights()
  ]);
});
</script>
