<template>
  <section class="space-y-4">
    <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 class="text-xl font-semibold">报告详情</h2>
          <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {{ interview?.position?.name || "岗位未命名" }} · {{ interview?.candidateName || "-" }}
          </p>
          <p v-if="interview?.completedAt" class="mt-1 text-xs text-slate-500 dark:text-slate-400">
            完成时间：{{ formatDateTime(interview.completedAt) }}
          </p>
        </div>
        <button
          class="rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:border-slate-400 dark:border-slate-700 dark:hover:border-slate-600"
          @click="goBack"
        >
          返回我的
        </button>
      </div>
    </article>

    <article v-if="loading" class="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
      正在加载报告详情...
    </article>

    <article v-else-if="errorMessage" class="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-600 shadow-sm dark:border-rose-900/50 dark:bg-rose-900/20 dark:text-rose-300">
      {{ errorMessage }}
    </article>

    <section v-else-if="report" class="grid gap-4 lg:grid-cols-[1fr_360px]">
      <article class="space-y-4">
        <div class="grid gap-4 md:grid-cols-[320px_1fr]">
          <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
            <svg viewBox="0 0 260 260" class="mx-auto h-64 w-64">
              <g transform="translate(130,130)">
                <polygon :points="radarGridPoints(100)" fill="none" stroke="currentColor" class="text-slate-300 dark:text-slate-700" stroke-width="1" />
                <polygon :points="radarGridPoints(75)" fill="none" stroke="currentColor" class="text-slate-300 dark:text-slate-700" stroke-width="1" />
                <polygon :points="radarGridPoints(50)" fill="none" stroke="currentColor" class="text-slate-300 dark:text-slate-700" stroke-width="1" />
                <polygon :points="radarGridPoints(25)" fill="none" stroke="currentColor" class="text-slate-300 dark:text-slate-700" stroke-width="1" />

                <line v-for="axis in radarAxes" :key="axis.key" x1="0" y1="0" :x2="axis.x" :y2="axis.y" stroke="currentColor" class="text-slate-300 dark:text-slate-700" stroke-width="1" />
                <polygon :points="radarValuePoints" fill="rgba(16,185,129,0.22)" stroke="rgb(16,185,129)" stroke-width="2" />

                <text v-for="axis in radarAxes" :key="`${axis.key}-label`" :x="axis.labelX" :y="axis.labelY" text-anchor="middle" class="fill-slate-600 text-[11px] dark:fill-slate-300">
                  {{ axis.label }}
                </text>
              </g>
            </svg>
          </div>

          <div class="flex flex-col justify-center">
            <p class="text-sm text-slate-500 dark:text-slate-400">综合分数</p>
            <p class="text-5xl font-black tracking-tight text-emerald-600 dark:text-emerald-300">{{ report.overallScore }}</p>
            <p class="mt-3 text-sm leading-7 text-slate-700 dark:text-slate-300">
              技术 {{ report.technicalScore }} ｜ 表达 {{ report.communicationScore }} ｜ 深度 {{ report.depthScore }} ｜ 匹配 {{ report.roleFitScore }}
            </p>
          </div>
        </div>

        <div class="space-y-4">
          <div>
            <p class="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Summary</p>
            <p class="mt-2 text-base leading-8 text-slate-800 dark:text-slate-200">{{ report.summary }}</p>
          </div>

          <div class="space-y-4">
            <div>
              <h5 class="text-sm font-semibold text-slate-700 dark:text-slate-200">优势</h5>
              <ul class="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-slate-700 marker:text-slate-400 dark:text-slate-300 dark:marker:text-slate-500">
                <li v-for="item in report.strengths" :key="`strength-${item}`">{{ item }}</li>
              </ul>
            </div>
            <div>
              <h5 class="text-sm font-semibold text-slate-700 dark:text-slate-200">改进点</h5>
              <ul class="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-slate-700 marker:text-slate-400 dark:text-slate-300 dark:marker:text-slate-500">
                <li v-for="item in report.improvementAreas" :key="`improvement-${item}`">{{ item }}</li>
              </ul>
            </div>
            <div>
              <h5 class="text-sm font-semibold text-slate-700 dark:text-slate-200">下一步</h5>
              <ul class="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-slate-700 marker:text-slate-400 dark:text-slate-300 dark:marker:text-slate-500">
                <li v-for="item in report.nextSteps" :key="`next-${item}`">{{ item }}</li>
              </ul>
            </div>
          </div>
        </div>
      </article>

      <aside>
        <h5 class="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">聊天记录回顾</h5>
        <div class="max-h-[70vh] divide-y divide-slate-200 overflow-y-auto dark:divide-slate-800">
          <template v-for="item in conversationTurns" :key="`report-${item.id}`">
            <div class="py-3">
              <p class="text-xs font-semibold text-emerald-700 dark:text-emerald-300">面试官</p>
              <p class="mt-1 text-sm leading-6 text-slate-800 dark:text-slate-200">{{ item.prompt }}</p>
              <div v-if="item.answeredAt && item.answerText" class="mt-2">
                <p class="text-xs font-semibold text-sky-700 dark:text-sky-300">我</p>
                <p class="mt-1 text-sm leading-6 text-slate-700 dark:text-slate-300">{{ item.answerText }}</p>
                <p v-if="item.evaluationSummary" class="mt-1 text-xs text-slate-500 dark:text-slate-400">评估：{{ item.evaluationSummary }}</p>
              </div>
            </div>
          </template>
          <p v-if="!conversationTurns.length" class="py-3 text-sm text-slate-500 dark:text-slate-400">当前没有可回顾的聊天记录。</p>
        </div>
      </aside>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { storeToRefs } from "pinia";
import { fetchInterview } from "../api/interviews";
import { fetchReportByInterview } from "../api/reports";
import type { InterviewTurn, InterviewView, Report } from "../types/domain";
import { useAppStore } from "../store/app";

const route = useRoute();
const router = useRouter();
const appStore = useAppStore();
const { apiBase } = storeToRefs(appStore);

const loading = ref(false);
const errorMessage = ref("");
const report = ref<Report | null>(null);
const interview = ref<InterviewView | null>(null);

const interviewId = computed(() => String(route.params.interviewId ?? ""));

const conversationTurns = computed(() => {
  const turns = (interview.value?.turns ?? []) as InterviewTurn[];
  return [...turns].sort((a, b) => Number(a.sequence ?? 0) - Number(b.sequence ?? 0));
});

const radarAxes = computed(() => {
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

const radarValuePoints = computed(() => {
  if (!report.value) {
    return "";
  }
  const values: Record<string, number> = {
    technical: report.value.technicalScore,
    communication: report.value.communicationScore,
    depth: report.value.depthScore,
    roleFit: report.value.roleFitScore
  };
  const radius = 90;
  return radarAxes.value
    .map((axis) => {
      const ratio = Math.max(0, Math.min(100, values[axis.key] ?? 0)) / 100;
      const x = Math.cos(axis.angle) * radius * ratio;
      const y = Math.sin(axis.angle) * radius * ratio;
      return `${x},${y}`;
    })
    .join(" ");
});

function radarGridPoints(percent: number) {
  const radius = 90 * (percent / 100);
  return radarAxes.value
    .map((axis) => `${Math.cos(axis.angle) * radius},${Math.sin(axis.angle) * radius}`)
    .join(" ");
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString("zh-CN", { hour12: false });
}

function goBack() {
  router.push("/me");
}

async function loadDetail() {
  if (!interviewId.value) {
    errorMessage.value = "缺少 interviewId，无法加载报告详情。";
    report.value = null;
    interview.value = null;
    return;
  }

  loading.value = true;
  errorMessage.value = "";
  try {
    const [reportData, interviewData] = await Promise.all([
      fetchReportByInterview(apiBase.value, interviewId.value),
      fetchInterview(apiBase.value, interviewId.value)
    ]);
    report.value = reportData;
    interview.value = interviewData;
  } catch (error) {
    const message = error instanceof Error ? error.message : "加载报告详情失败，请稍后重试。";
    errorMessage.value = message;
    report.value = null;
    interview.value = null;
  } finally {
    loading.value = false;
  }
}

watch(interviewId, () => {
  void loadDetail();
});

onMounted(async () => {
  await loadDetail();
});
</script>
