<template>
  <section class="grid gap-4 lg:grid-cols-12">
    <aside class="p-2 lg:col-span-4 xl:col-span-3">
      <div class="flex items-center gap-3">
        <div class="grid h-14 w-14 place-items-center rounded-full bg-emerald-100 text-xl font-bold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
          {{ avatarText }}
        </div>
        <div>
          <h2 class="text-lg font-semibold">{{ authStore.userName }}</h2>
          <p class="text-xs text-slate-500 dark:text-slate-400">学习型求职者画像</p>
        </div>
      </div>

      <div class="mt-5 space-y-3 text-sm">
        <template v-if="!isEditing">
          <p class="text-slate-700 dark:text-slate-300">城市：{{ user?.city || "未设置" }}</p>
          <p class="text-slate-700 dark:text-slate-300">年龄：{{ user?.age ?? "未设置" }}</p>
          <p class="text-slate-700 dark:text-slate-300">目标岗位：{{ user?.targetRole || "未设置" }}</p>
        </template>
        <template v-else>
          <div>
            <label class="mb-1 block text-xs text-slate-500 dark:text-slate-400">城市</label>
            <input v-model="cityInput" type="text" class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950" />
          </div>
          <div>
            <label class="mb-1 block text-xs text-slate-500 dark:text-slate-400">年龄</label>
            <input v-model.number="ageInput" type="number" min="1" max="100" class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950" />
          </div>
          <div>
            <label class="mb-1 block text-xs text-slate-500 dark:text-slate-400">目标岗位</label>
            <select v-model="targetRoleInput" class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950">
              <option value="">请选择岗位</option>
              <option v-for="role in targetRoleOptions" :key="role" :value="role">{{ role }}</option>
            </select>
          </div>
        </template>
      </div>

      <div class="mt-8">
        <button class="w-full rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600 dark:text-slate-950 dark:hover:bg-emerald-400" @click="handleProfileEdit">
          {{ isEditing ? "保存个人资料" : "编辑个人资料" }}
        </button>
      </div>

      <article class="mt-5 grid gap-3 grid-cols-1">
        <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p class="text-xs text-slate-500 dark:text-slate-400">完成报告</p>
          <p class="mt-1 text-3xl font-bold text-emerald-600 dark:text-emerald-300">{{ stats.totalReports }}</p>
        </div>
        <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p class="text-xs text-slate-500 dark:text-slate-400">平均分</p>
          <p class="mt-1 text-3xl font-bold text-cyan-600 dark:text-cyan-300">{{ stats.avgScore }}</p>
        </div>
        <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p class="text-xs text-slate-500 dark:text-slate-400">最高分</p>
          <p class="mt-1 text-3xl font-bold text-amber-600 dark:text-amber-300">{{ stats.bestScore }}</p>
        </div>
        <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p class="text-xs text-slate-500 dark:text-slate-400">本月活跃天数</p>
          <p class="mt-1 text-3xl font-bold text-slate-900 dark:text-slate-100">{{ stats.activeDaysThisMonth }}</p>
        </div>
      </article>
    </aside>

    <main class="space-y-4 lg:col-span-8 xl:col-span-9">
      <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h3 class="text-base font-semibold">报告综合总结</h3>
        <div class="mt-3 grid gap-4 lg:grid-cols-[320px_1fr]">
          <div class="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-950">
            <svg viewBox="0 0 260 260" class="mx-auto h-56 w-56">
              <g transform="translate(130,130)">
                <polygon :points="summaryRadarGridPoints(100)" fill="none" stroke="currentColor" class="text-slate-300 dark:text-slate-700" stroke-width="1" />
                <polygon :points="summaryRadarGridPoints(75)" fill="none" stroke="currentColor" class="text-slate-300 dark:text-slate-700" stroke-width="1" />
                <polygon :points="summaryRadarGridPoints(50)" fill="none" stroke="currentColor" class="text-slate-300 dark:text-slate-700" stroke-width="1" />
                <polygon :points="summaryRadarGridPoints(25)" fill="none" stroke="currentColor" class="text-slate-300 dark:text-slate-700" stroke-width="1" />

                <line v-for="axis in summaryRadarAxes" :key="axis.key" x1="0" y1="0" :x2="axis.x" :y2="axis.y" stroke="currentColor" class="text-slate-300 dark:text-slate-700" stroke-width="1" />
                <polygon :points="summaryRadarValuePoints" fill="rgba(16,185,129,0.22)" stroke="rgb(16,185,129)" stroke-width="2" />

                <text v-for="axis in summaryRadarAxes" :key="`${axis.key}-label`" :x="axis.labelX" :y="axis.labelY" text-anchor="middle" class="fill-slate-600 text-[11px] dark:fill-slate-300">
                  {{ axis.label }}
                </text>
              </g>
            </svg>
          </div>
          <div>
            <p class="text-sm leading-7 text-slate-700 dark:text-slate-300">{{ reportSummary.overview }}</p>
            <p class="mt-2 text-xs text-slate-500 dark:text-slate-400">
              技术 {{ reportSummary.dimensionScores.technical }} ｜ 表达 {{ reportSummary.dimensionScores.communication }} ｜ 深度 {{ reportSummary.dimensionScores.depth }} ｜ 匹配 {{ reportSummary.dimensionScores.roleFit }}
            </p>
          </div>
        </div>

        <div class="mt-4 grid gap-3 md:grid-cols-2" v-if="reportSummary.weaknesses.length || reportSummary.learningPlan.length">
          <div class="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
            <p class="text-sm font-semibold text-slate-900 dark:text-slate-100">当前主要不足</p>
            <ul class="mt-2 space-y-1 text-sm text-slate-600 dark:text-slate-300">
              <li v-for="item in reportSummary.weaknesses" :key="item">- {{ item }}</li>
            </ul>
          </div>
          <div class="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
            <p class="text-sm font-semibold text-slate-900 dark:text-slate-100">建议学习方向</p>
            <ul class="mt-2 space-y-1 text-sm text-slate-600 dark:text-slate-300">
              <li v-for="item in reportSummary.learningPlan" :key="item">- {{ item }}</li>
            </ul>
          </div>
        </div>
      </article>

      <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div class="mb-3 flex items-center justify-between">
          <h3 class="text-base font-semibold">活跃热力图</h3>
        </div>
        <div class="overflow-x-auto">
          <div class="inline-flex w-max items-start gap-0.5">
            <div v-for="(week, wIndex) in heatmapWeeks" :key="wIndex" class="grid grid-rows-7 gap-0.5">
              <div
                v-for="day in week"
                :key="day.date"
                class="h-4 w-4 rounded-[2px]"
                :class="heatColorClass(day.count)"
                :title="`${day.date} · ${day.count} 次`"
              ></div>
            </div>
          </div>
        </div>
      </article>

      <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div class="flex items-start justify-between gap-3">
          <div>
            <h3 class="text-base font-semibold">报告回顾</h3>
            <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">最近报告按时间倒序分页展示</p>
            <p v-if="reportReviewError" class="mt-1 text-xs text-amber-600 dark:text-amber-300">{{ reportReviewError }}</p>
          </div>
          <p class="text-xs text-slate-500 dark:text-slate-400">
            共 {{ reportReviewTotal }} 条 · 第 {{ reportReviewPage }} / {{ reportReviewTotalPages }} 页 · 每页 {{ reportReviewPageSize }} 条
          </p>
        </div>

        <div class="mt-4 grid gap-3" v-if="reportReviewItems.length">
          <div v-for="item in reportReviewItems" :key="item.id" class="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <p class="font-medium">{{ resolvePositionName(item) }} · {{ item.interview?.candidateName || "-" }}</p>
              <div class="flex items-center gap-2">
                <span class="rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700 dark:border-emerald-700/60 dark:bg-emerald-900/20 dark:text-emerald-300">
                  总分 {{ item.overallScore }}
                </span>
                <button
                  class="rounded-lg border border-slate-300 px-2.5 py-1 text-xs text-slate-700 hover:border-slate-400 dark:border-slate-700 dark:text-slate-200 dark:hover:border-slate-600"
                  @click="openReportDetail(item)"
                >
                  查看详情
                </button>
              </div>
            </div>
            <p class="mt-2 text-sm text-slate-600 dark:text-slate-400">{{ item.summary }}</p>
            <div class="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300 md:grid-cols-4">
              <span>技术 {{ item.technicalScore }}</span>
              <span>表达 {{ item.communicationScore }}</span>
              <span>深度 {{ item.depthScore }}</span>
              <span>匹配 {{ item.roleFitScore }}</span>
            </div>
          </div>
        </div>

        <div v-if="reportReviewItems.length" class="mt-4 flex items-center justify-center gap-3">
          <button
            class="grid h-8 w-8 place-items-center rounded-lg border border-slate-300 bg-white text-slate-700 transition hover:border-slate-400 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
            :disabled="loadingReports || reportReviewPage <= 1"
            @click="goPrevReportPage"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <path d="M15 18l-6-6 6-6"></path>
            </svg>
          </button>
          <span class="min-w-24 text-center text-sm text-slate-500 dark:text-slate-400">
            {{ reportReviewPage }} / {{ reportReviewTotalPages }}
          </span>
          <button
            class="grid h-8 w-8 place-items-center rounded-lg border border-slate-300 bg-white text-slate-700 transition hover:border-slate-400 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
            :disabled="loadingReports || reportReviewPage >= reportReviewTotalPages"
            @click="goNextReportPage"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <path d="M9 18l6-6-6-6"></path>
            </svg>
          </button>
        </div>

        <p v-else class="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400">
          暂无报告记录，完成一场面试后会在这里展示。
        </p>
      </article>
    </main>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { storeToRefs } from "pinia";
import { useRouter } from "vue-router";
import { fetchReports, fetchReportsPage, type ReportWithInterview } from "../api/reports";
import { fetchPositions } from "../api/positions";
import { useAppStore } from "../store/app";
import { useAuthStore } from "../store/auth";

interface HeatCell {
  date: string;
  count: number | null;
}

const appStore = useAppStore();
const authStore = useAuthStore();
const router = useRouter();
const { apiBase } = storeToRefs(appStore);
const { user } = storeToRefs(authStore);

const isEditing = ref(false);
const ageInput = ref<number | null>(user.value?.age ?? null);
const cityInput = ref<string>(user.value?.city ?? "");
const targetRoleInput = ref<string>(user.value?.targetRole ?? "");
const targetRoleOptions = [
  "前端开发工程师",
  "后端开发工程师",
  "全栈开发工程师",
  "测试开发工程师",
  "算法工程师",
  "产品经理"
];

const loadingReports = ref(false);
const allReports = ref<ReportWithInterview[]>([]);
const reportReviewItems = ref<ReportWithInterview[]>([]);
const reportReviewPage = ref(1);
const reportReviewPageSize = ref(10);
const reportReviewTotal = ref(0);
const reportReviewTotalPages = ref(1);
const reportReviewError = ref("");
const reportReviewPagingMode = ref<"remote" | "local">("remote");
const positionNameMap = ref<Record<string, string>>({});

const avatarText = computed(() => {
  const value = authStore.userName?.trim() || "我";
  return value.slice(0, 1).toUpperCase();
});

const stats = computed(() => {
  const totalReports = allReports.value.length;
  const scores = allReports.value.map((item) => item.overallScore);
  const avgScore = totalReports > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / totalReports) : 0;
  const bestScore = totalReports > 0 ? Math.max(...scores) : 0;

  const currentMonth = new Date().toISOString().slice(0, 7);
  const activeDaysThisMonth = new Set(
    allReports.value
      .map((item) => (item.createdAt || "").slice(0, 10))
      .filter((day) => day.startsWith(currentMonth))
  ).size;

  return {
    totalReports,
    avgScore,
    bestScore,
    activeDaysThisMonth
  };
});

const reportSummary = computed(() => {
  if (!allReports.value.length) {
    return {
      overview: "你还没有可分析的报告数据。完成几次面试后，这里会自动总结你的短板和学习重点。",
      weaknesses: [],
      learningPlan: [],
      dimensionScores: {
        technical: 0,
        communication: 0,
        depth: 0,
        roleFit: 0
      }
    };
  }

  const average = (getter: (item: ReportWithInterview) => number) =>
    Math.round(allReports.value.reduce((sum, item) => sum + getter(item), 0) / allReports.value.length);

  const dimensions = [
    { key: "technical", label: "技术正确性", score: average((item) => item.technicalScore) },
    { key: "communication", label: "表达沟通", score: average((item) => item.communicationScore) },
    { key: "depth", label: "深度分析", score: average((item) => item.depthScore) },
    { key: "roleFit", label: "岗位匹配", score: average((item) => item.roleFitScore) }
  ].sort((a, b) => a.score - b.score);

  const dimensionScores = {
    technical: dimensions.find((item) => item.key === "technical")?.score ?? 0,
    communication: dimensions.find((item) => item.key === "communication")?.score ?? 0,
    depth: dimensions.find((item) => item.key === "depth")?.score ?? 0,
    roleFit: dimensions.find((item) => item.key === "roleFit")?.score ?? 0
  };

  const weakest = dimensions.slice(0, 2);
  const weakestDimensionTips: Record<string, string> = {
    technical: "系统复盘基础知识和高频考点，按模块做错题归档并进行二次口述。",
    communication: "练习结构化表达（结论先行 + 原因 + 例子），每题控制在 1-2 分钟可复述。",
    depth: "针对每个项目准备追问链路：方案选型、权衡取舍、异常处理和监控指标。",
    roleFit: "补齐目标岗位的核心技能树，结合 JD 重写项目亮点并做岗位化问答演练。"
  };

  const improvementCounter = new Map<string, number>();
  for (const item of allReports.value) {
    const areas = Array.isArray(item.improvementAreas) ? item.improvementAreas : [];
    for (const area of areas) {
      const key = area.trim();
      if (!key) {
        continue;
      }
      improvementCounter.set(key, (improvementCounter.get(key) ?? 0) + 1);
    }
  }

  const topImprovements = [...improvementCounter.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([text]) => text);

  return {
    overview: `基于 ${allReports.value.length} 份报告，你当前整体短板主要在 ${weakest.map((item) => `${item.label}（均分 ${item.score}）`).join("、")}。建议优先做短板专项训练，再进行完整模拟巩固。`,
    weaknesses: topImprovements.length ? topImprovements : weakest.map((item) => `${item.label}得分偏低，稳定性不足。`),
    learningPlan: weakest.map((item) => weakestDimensionTips[item.key]),
    dimensionScores
  };
});

const summaryRadarAxes = computed(() => {
  const labels = [
    { key: "technical", label: "技术" },
    { key: "communication", label: "表达" },
    { key: "depth", label: "深度" },
    { key: "roleFit", label: "匹配" }
  ] as const;
  const radius = 90;
  return labels.map((item, index) => {
    const angle = -Math.PI / 2 + (index * Math.PI * 2) / labels.length;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    const labelX = Math.cos(angle) * (radius + 18);
    const labelY = Math.sin(angle) * (radius + 18);
    return { ...item, angle, x, y, labelX, labelY };
  });
});

const summaryRadarValuePoints = computed(() => {
  const scores = reportSummary.value.dimensionScores;
  const values: Record<string, number> = {
    technical: scores.technical,
    communication: scores.communication,
    depth: scores.depth,
    roleFit: scores.roleFit
  };
  const radius = 90;
  return summaryRadarAxes.value
    .map((axis) => {
      const ratio = Math.max(0, Math.min(100, values[axis.key] ?? 0)) / 100;
      const x = Math.cos(axis.angle) * radius * ratio;
      const y = Math.sin(axis.angle) * radius * ratio;
      return `${x},${y}`;
    })
    .join(" ");
});

function summaryRadarGridPoints(percent: number) {
  const radius = 90 * (percent / 100);
  return summaryRadarAxes.value
    .map((axis) => `${Math.cos(axis.angle) * radius},${Math.sin(axis.angle) * radius}`)
    .join(" ");
}

const heatmapWeeks = computed(() => {
  const dayCount = new Map<string, number>();

  for (const item of allReports.value) {
    const day = toLocalDateKey(item.createdAt);
    if (!day) {
      continue;
    }
    dayCount.set(day, (dayCount.get(day) ?? 0) + 1);
  }

  const cells: HeatCell[] = [];
  const today = new Date();
  const totalDays = 16 * 7;
  const start = new Date(today);
  start.setHours(0, 0, 0, 0);
  start.setDate(today.getDate() - (totalDays - 1));

  for (let i = 0; i < totalDays; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    const key = toDateKey(date);
    cells.push({
      date: key,
      count: dayCount.get(key) ?? 0
    });
  }

  const weeks: HeatCell[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    const chunk = cells.slice(i, i + 7);
    while (chunk.length < 7) {
      chunk.push({ date: "", count: null });
    }
    weeks.push(chunk);
  }
  return weeks;
});

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

function toDateKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function toLocalDateKey(input?: string) {
  if (!input) {
    return "";
  }
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return toDateKey(date);
}

function saveProfile() {
  return authStore.updateProfile(apiBase.value, {
    age: ageInput.value,
    city: cityInput.value.trim(),
    targetRole: targetRoleInput.value
  });
}

async function handleProfileEdit() {
  if (!isEditing.value) {
    ageInput.value = user.value?.age ?? null;
    cityInput.value = user.value?.city ?? "";
    targetRoleInput.value = user.value?.targetRole ?? "";
    isEditing.value = true;
    return;
  }

  await saveProfile();
  isEditing.value = false;
}

async function loadAllReports() {
  const reports = await fetchReports(apiBase.value);
  allReports.value = reports;
}

async function loadPositionNameMap() {
  const positions = await fetchPositions(apiBase.value);
  positionNameMap.value = positions.reduce<Record<string, string>>((map, item) => {
    map[item.id] = item.name;
    return map;
  }, {});
}

async function loadReportReviewPage(page = reportReviewPage.value) {
  const result = await fetchReportsPage(apiBase.value, page, reportReviewPageSize.value) as unknown;
  applyReportReviewData(result, page);
}

function applyReportReviewData(payload: unknown, targetPage = 1) {
  if (Array.isArray(payload)) {
    const total = payload.length;
    const totalPages = Math.max(1, Math.ceil(total / reportReviewPageSize.value));
    const page = Math.min(Math.max(1, targetPage), totalPages);
    const start = (page - 1) * reportReviewPageSize.value;
    const end = start + reportReviewPageSize.value;
    reportReviewItems.value = payload.slice(start, end) as ReportWithInterview[];
    reportReviewPage.value = page;
    reportReviewTotal.value = total;
    reportReviewTotalPages.value = totalPages;
    return;
  }

  if (
    payload &&
    typeof payload === "object" &&
    "items" in payload &&
    Array.isArray((payload as { items?: unknown[] }).items)
  ) {
    const result = payload as {
      items: ReportWithInterview[];
      page?: number;
      total?: number;
      totalPages?: number;
    };
    reportReviewItems.value = result.items;
    reportReviewPage.value = result.page ?? 1;
    reportReviewTotal.value = result.total ?? result.items.length;
    reportReviewTotalPages.value = result.totalPages ?? Math.max(1, Math.ceil(reportReviewTotal.value / reportReviewPageSize.value));
    return;
  }

  throw new Error("invalid report page payload");
}

async function refreshReportsData() {
  loadingReports.value = true;
  reportReviewError.value = "";
  try {
    await loadAllReports();

    if (reportReviewPagingMode.value === "local") {
      applyReportReviewData(allReports.value, reportReviewPage.value);
      return;
    }

    try {
      await loadReportReviewPage(reportReviewPage.value);
      reportReviewPagingMode.value = "remote";
    } catch {
      reportReviewPagingMode.value = "local";
      reportReviewError.value = "分页接口暂不可用，已切换为本地分页。";
      applyReportReviewData(allReports.value, reportReviewPage.value);
    }
  } finally {
    loadingReports.value = false;
  }
}

async function goPrevReportPage() {
  if (reportReviewPage.value <= 1) {
    return;
  }
  loadingReports.value = true;
  try {
    const nextPage = reportReviewPage.value - 1;
    if (reportReviewPagingMode.value === "local") {
      applyReportReviewData(allReports.value, nextPage);
    } else {
      await loadReportReviewPage(nextPage);
    }
  } finally {
    loadingReports.value = false;
  }
}

async function goNextReportPage() {
  if (reportReviewPage.value >= reportReviewTotalPages.value) {
    return;
  }
  loadingReports.value = true;
  try {
    const nextPage = reportReviewPage.value + 1;
    if (reportReviewPagingMode.value === "local") {
      applyReportReviewData(allReports.value, nextPage);
    } else {
      await loadReportReviewPage(nextPage);
    }
  } finally {
    loadingReports.value = false;
  }
}

function openReportDetail(item: ReportWithInterview) {
  if (!item.interviewId) {
    return;
  }
  router.push({ name: "report-detail", params: { interviewId: item.interviewId } });
}

function resolvePositionName(item: ReportWithInterview) {
  const nestedName = item.interview?.position?.name?.trim();
  if (nestedName) {
    return nestedName;
  }

  const positionId = item.interview?.positionId?.trim();
  if (positionId && positionNameMap.value[positionId]) {
    return positionNameMap.value[positionId];
  }

  return "岗位未命名";
}

onMounted(async () => {
  await Promise.all([
    refreshReportsData(),
    loadPositionNameMap()
  ]);
});
</script>
