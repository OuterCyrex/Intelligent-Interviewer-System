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
          <p class="text-slate-700 dark:text-slate-300">城市：{{ profile.city || "未设置" }}</p>
          <p class="text-slate-700 dark:text-slate-300">年龄：{{ profile.age ?? "未设置" }}</p>
          <p class="text-slate-700 dark:text-slate-300">目标岗位：{{ profile.targetRole || "未设置" }}</p>
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
          <p class="text-xs text-slate-500 dark:text-slate-400">最近最好分</p>
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
        <p class="mt-2 text-sm leading-7 text-slate-700 dark:text-slate-300">{{ reportSummary.overview }}</p>

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
          <button class="rounded-lg border border-slate-300 px-3 py-1 text-xs hover:border-slate-400 dark:border-slate-700" :disabled="loadingReports" @click="loadRecentReports">
            {{ loadingReports ? "加载中..." : "刷新" }}
          </button>
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
        <h3 class="text-base font-semibold">报告回顾</h3>
        <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">最近报告按时间倒序展示</p>

        <div class="mt-4 grid gap-3" v-if="recentReportsForList.length">
          <div v-for="item in recentReportsForList" :key="item.id" class="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <p class="font-medium">{{ item.interview?.position?.name || "岗位未命名" }} · {{ item.interview?.candidateName || "-" }}</p>
              <span class="rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700 dark:border-emerald-700/60 dark:bg-emerald-900/20 dark:text-emerald-300">
                总分 {{ item.overallScore }}
              </span>
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
import { fetchReports, type ReportWithInterview } from "../api/reports";
import { useAppStore } from "../store/app";
import { useAuthStore } from "../store/auth";
import { useProfileStore } from "../store/profile";

interface HeatCell {
  date: string;
  count: number | null;
}

const appStore = useAppStore();
const authStore = useAuthStore();
const profileStore = useProfileStore();
const { apiBase } = storeToRefs(appStore);
const { profile } = storeToRefs(profileStore);

const isEditing = ref(false);
const ageInput = ref<number | null>(profile.value.age);
const cityInput = ref<string>(profile.value.city);
const targetRoleInput = ref<string>(profile.value.targetRole);
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
const recentReportsForList = computed(() => allReports.value.slice(0, 20));

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
      learningPlan: []
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
    learningPlan: weakest.map((item) => weakestDimensionTips[item.key])
  };
});

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
  profileStore.updateProfile({
    age: ageInput.value,
    city: cityInput.value.trim(),
    targetRole: targetRoleInput.value
  });
}

function handleProfileEdit() {
  if (!isEditing.value) {
    ageInput.value = profile.value.age;
    cityInput.value = profile.value.city;
    targetRoleInput.value = profile.value.targetRole;
    isEditing.value = true;
    return;
  }

  saveProfile();
  isEditing.value = false;
}

async function loadRecentReports() {
  loadingReports.value = true;
  try {
    const reports = await fetchReports(apiBase.value);
    allReports.value = reports;
  } finally {
    loadingReports.value = false;
  }
}

onMounted(async () => {
  await loadRecentReports();
});
</script>
