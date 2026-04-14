<template>
  <section class="fixed inset-x-0 bottom-0 top-[73px] bg-slate-100 dark:bg-slate-950">
    <div class="flex h-full">
      <aside class="w-[300px] shrink-0 border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div class="border-b border-slate-200 px-4 py-3 dark:border-slate-800">
          <h2 class="text-base font-semibold">岗位列表</h2>
        </div>

        <div class="h-[calc(100%-150px)] overflow-y-auto">
          <div class="divide-y divide-slate-200 dark:divide-slate-800">
            <button v-for="position in positions" :key="position.id" class="w-full px-4 py-3 text-left transition"
              :class="selectedPositionId === position.id
                ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-200'
                : 'bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50'"
              @click="selectedPositionId = position.id">
              <p class="font-medium">{{ position.name }}</p>
              <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">{{ position.slug }}</p>
            </button>
          </div>
        </div>

        <div class="border-t border-slate-200 p-3 dark:border-slate-800">
          <div class="grid grid-cols-2 gap-2 text-xs">
            <div class="rounded-lg border border-slate-200 bg-white p-2 dark:border-slate-700 dark:bg-slate-900">题库 {{
              questions.length }}/{{ totalQuestions }}</div>
            <div class="rounded-lg border border-slate-200 bg-white p-2 dark:border-slate-700 dark:bg-slate-900">知识 {{
              knowledge.length }}/{{ totalKnowledge }}</div>
          </div>
        </div>
      </aside>

      <main class="flex min-w-0 flex-1 flex-col">
        <header class="border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 class="text-lg font-semibold">{{ selectedPosition?.name || "未选择岗位" }}</h3>
              <p class="text-sm text-slate-500 dark:text-slate-400">
                候选人：{{ candidateName || "未填写" }} ｜ 状态：{{ stageLabel }}
              </p>
            </div>
            <div class="flex gap-2">
              <button class="rounded-lg border border-slate-300 px-3 py-1 text-sm dark:border-slate-700"
                @click="enterSetupMode">
                重新新建面试
              </button>
              <button v-if="stage === 'interview'"
                class="rounded-lg border border-amber-400 px-3 py-1 text-sm text-amber-600 dark:text-amber-300"
                :disabled="completingInterview" @click="completeInterview">
                {{ completingInterview ? "处理中..." : "结束并生成报告" }}
              </button>
            </div>
          </div>
        </header>

        <section v-if="stage === 'setup'" class="min-h-0 flex-1 bg-slate-100 dark:bg-slate-950">
          <div class="grid h-full place-items-center px-6">
            <div class="w-full max-w-xl">
              <h4 class="text-center text-2xl font-semibold">面试设定配置</h4>
              <p class="mt-1 text-center text-sm text-slate-500 dark:text-slate-400">确认参数后开始进入聊天面试</p>

              <div class="mt-6 space-y-3">
                <div>
                  <label class="mb-1 block text-sm text-slate-600 dark:text-slate-300">候选人名称</label>
                  <input v-model="candidateName" type="text" placeholder="请输入候选人名称"
                    class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-900" />
                </div>

                <div>
                  <label class="mb-1 block text-sm text-slate-600 dark:text-slate-300">难度</label>
                  <select v-model="difficulty"
                    class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-900">
                    <option value="">默认难度</option>
                    <option value="junior">初级</option>
                    <option value="intermediate">中级</option>
                    <option value="senior">高级</option>
                  </select>
                </div>

                <div>
                  <label class="mb-1 block text-sm text-slate-600 dark:text-slate-300">目标题数</label>
                  <input v-model.number="targetQuestionCount" type="number" min="3" max="6" placeholder="3 - 6"
                    class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-900" />
                </div>

                <div>
                  <label class="mb-1 block text-sm text-slate-600 dark:text-slate-300">聚焦点</label>
                  <input v-model="focusAreasText" type="text" placeholder="例如：系统设计、性能优化"
                    class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-900" />
                </div>

                <button
                  class="w-full rounded-lg bg-emerald-500 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-50 dark:text-slate-950 dark:hover:bg-emerald-400"
                  :disabled="creatingInterview || !selectedPositionId || !candidateName.trim()"
                  @click="createInterview">
                  {{ creatingInterview ? "创建中..." : "开始面试" }}
                </button>
              </div>
            </div>
          </div>
        </section>

        <section v-else-if="stage === 'interview'"
          class="min-h-0 flex-1 overflow-hidden bg-slate-100 dark:bg-slate-950">
          <div class="flex h-full flex-col">
            <div class="min-h-0 flex-1 overflow-y-auto px-4 py-4">
              <template v-if="currentInterview">
                <div class="mx-auto max-w-4xl space-y-3">
                  <template v-for="item in conversationTurns" :key="item.id">
                    <div class="flex items-start gap-2">
                      <div
                        class="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-emerald-500 text-xs font-semibold text-white dark:text-slate-950">
                        面
                      </div>
                      <div
                        class="max-w-[75%] rounded-2xl rounded-tl-sm border border-emerald-200 bg-white px-3 py-2 text-sm shadow-sm dark:border-emerald-800/60 dark:bg-slate-900">
                        <p class="leading-6">{{ item.prompt }}</p>
                      </div>
                    </div>
                    <div v-if="item.answeredAt && item.answerText" class="flex items-start justify-end gap-2">
                      <div
                        class="max-w-[75%] rounded-2xl rounded-tr-sm border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm shadow-sm dark:border-cyan-800/60 dark:bg-cyan-900/20">
                        <p class="leading-6">{{ item.answerText }}</p>
                        <p v-if="item.evaluationSummary" class="mt-2 text-xs text-slate-500 dark:text-slate-400">评估：{{
                          item.evaluationSummary }}</p>
                      </div>
                      <div
                        class="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-sky-500 text-xs font-semibold text-white">
                        我
                      </div>
                    </div>
                  </template>
                </div>
              </template>
              <div v-else class="grid h-full place-items-center text-sm text-slate-500 dark:text-slate-400">
                请先完成“面试设定配置”并开始面试。
              </div>
            </div>

            <footer class="border-t border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
              <div class="mx-auto max-w-4xl space-y-3">
                <p class="text-xs text-slate-500 dark:text-slate-400">当前问题：{{ activeTurn?.prompt || "当前无待回答问题" }}</p>

                <div v-if="submittingAnswer || isGeneratingReport"
                  class="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-800/60 dark:bg-emerald-900/15">
                  <div class="flex items-center gap-3">
                    <span
                      class="h-4 w-4 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent"></span>
                    <div class="min-w-0 flex-1">
                      <p class="text-sm font-medium text-emerald-800 dark:text-emerald-200">{{ pendingIndicatorLabel }}
                      </p>
                      <div class="mt-2 h-1.5 overflow-hidden rounded-full bg-emerald-100 dark:bg-emerald-950/60">
                        <div class="h-full w-2/3 animate-pulse rounded-full bg-emerald-500"></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  class="inline-flex rounded-xl border border-slate-300 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-900">
                  <button class="rounded-lg px-3 py-1.5 text-sm transition" :class="mode === 'text'
                    ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-slate-100'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'"
                    @click="mode = 'text'">
                    文字输入
                  </button>
                  <button class="rounded-lg px-3 py-1.5 text-sm transition" :class="mode === 'speech'
                    ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-slate-100'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'"
                    @click="mode = 'speech'">
                    语音输入
                  </button>
                </div>

                <textarea v-model="answerText" rows="2" :disabled="submittingAnswer || isGeneratingReport"
                  :readonly="mode === 'speech'"
                  class="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-900"
                  :placeholder="mode === 'speech' ? '语音模式下将自动转写并提交。' : '输入文字回答'" />

                <SpeechAnswerPanel v-if="mode === 'speech'" />

                <div class="flex justify-end">
                  <button v-if="mode === 'text'"
                    class="rounded-lg bg-emerald-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-50 dark:text-slate-950 dark:hover:bg-emerald-400"
                    :disabled="submittingAnswer || !activeTurn || !canSubmitAnswer" @click="submitAnswer">
                    {{ submittingAnswer ? "提交中..." : "发送文字回答" }}
                  </button>
                </div>
              </div>
            </footer>
          </div>
        </section>

        <section v-else class="min-h-0 flex-1 overflow-y-auto bg-white px-4 py-4 dark:bg-slate-900">
          <div class="mx-auto grid max-w-6xl gap-4 lg:grid-cols-[1fr_360px]">
            <article class="space-y-4">
              <div v-if="!report && isGeneratingReport"
                class="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-6 dark:border-emerald-800/60 dark:bg-emerald-900/15">
                <div class="flex items-center gap-3">
                  <span
                    class="h-5 w-5 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent"></span>
                  <div class="min-w-0 flex-1">
                    <p class="text-sm font-medium text-emerald-800 dark:text-emerald-200">正在生成面试报告...</p>
                    <div class="mt-3 h-2 overflow-hidden rounded-full bg-emerald-100 dark:bg-emerald-950/60">
                      <div class="h-full w-3/4 animate-pulse rounded-full bg-emerald-500"></div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="flex items-center gap-2">
                <h4 class="text-2xl font-bold">面试报告总结</h4>
                <span v-if="report" class="rounded-full border px-2 py-0.5 text-xs"
                  :class="report.generationSource === 'llm'
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300'
                    : 'border-slate-300 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'">
                  {{ report.generationSource === "llm" ? "AI生成" : "启发式生成" }}
                </span>
              </div>

              <div v-if="report" class="space-y-4">
                <div class="grid gap-4 md:grid-cols-[320px_1fr]">
                  <div
                    class="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
                    <svg viewBox="0 0 260 260" class="mx-auto h-64 w-64">
                      <g transform="translate(130,130)">
                        <polygon :points="radarGridPoints(100)" fill="none" stroke="currentColor"
                          class="text-slate-300 dark:text-slate-700" stroke-width="1" />
                        <polygon :points="radarGridPoints(75)" fill="none" stroke="currentColor"
                          class="text-slate-300 dark:text-slate-700" stroke-width="1" />
                        <polygon :points="radarGridPoints(50)" fill="none" stroke="currentColor"
                          class="text-slate-300 dark:text-slate-700" stroke-width="1" />
                        <polygon :points="radarGridPoints(25)" fill="none" stroke="currentColor"
                          class="text-slate-300 dark:text-slate-700" stroke-width="1" />
                        <line v-for="axis in radarAxes" :key="axis.key" x1="0" y1="0" :x2="axis.x" :y2="axis.y"
                          stroke="currentColor" class="text-slate-300 dark:text-slate-700" stroke-width="1" />
                        <polygon :points="radarValuePoints" fill="rgba(16,185,129,0.22)" stroke="rgb(16,185,129)"
                          stroke-width="2" />
                        <text v-for="axis in radarAxes" :key="`${axis.key}-label`" :x="axis.labelX" :y="axis.labelY"
                          text-anchor="middle" class="fill-slate-600 dark:fill-slate-300 text-[11px]">
                          {{ axis.label }}
                        </text>
                      </g>
                    </svg>
                  </div>

                  <div class="flex flex-col justify-center">
                    <p class="text-sm text-slate-500 dark:text-slate-400">综合分数</p>
                    <p class="text-5xl font-black tracking-tight text-emerald-600 dark:text-emerald-300">{{
                      report.overallScore
                      }}</p>
                    <p class="mt-3 text-sm leading-7 text-slate-700 dark:text-slate-300">
                      技术 {{ report.technicalScore }} ｜ 表达 {{ report.communicationScore }} ｜ 深度 {{ report.depthScore }} ｜ 匹配 {{ report.roleFitScore }}
                    </p>
                  </div>
                </div>

                <div class="space-y-4">
                  <div>
                    <p class="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                      Summary</p>
                    <p class="mt-2 text-base leading-8 text-slate-800 dark:text-slate-200">{{ report.summary }}</p>
                  </div>

                  <div class="space-y-4">
                    <div>
                      <h5 class="text-sm font-semibold text-slate-700 dark:text-slate-200">优势</h5>
                      <ul
                        class="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-slate-700 marker:text-slate-400 dark:text-slate-300 dark:marker:text-slate-500">
                        <li v-for="item in report.strengths" :key="`strength-${item}`">{{ item }}</li>
                      </ul>
                    </div>
                    <div>
                      <h5 class="text-sm font-semibold text-slate-700 dark:text-slate-200">改进点</h5>
                      <ul
                        class="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-slate-700 marker:text-slate-400 dark:text-slate-300 dark:marker:text-slate-500">
                        <li v-for="item in report.improvementAreas" :key="`improvement-${item}`">{{ item }}</li>
                      </ul>
                    </div>
                    <div>
                      <h5 class="text-sm font-semibold text-slate-700 dark:text-slate-200">下一步</h5>
                      <ul
                        class="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-slate-700 marker:text-slate-400 dark:text-slate-300 dark:marker:text-slate-500">
                        <li v-for="item in report.nextSteps" :key="`next-${item}`">{{ item }}</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div class="flex justify-end">
                <button
                  class="rounded-lg bg-emerald-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-600 dark:text-slate-950 dark:hover:bg-emerald-400"
                  @click="startNewInterviewFlow">
                  重新进行新的面试
                </button>
              </div>
            </article>

            <aside>
              <h5 class="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">聊天记录回顾</h5>
              <div class="max-h-[70vh] overflow-y-auto divide-y divide-slate-200 dark:divide-slate-800">
                <template v-for="item in conversationTurns" :key="`report-${item.id}`">
                  <div class="py-3">
                    <p class="text-xs font-semibold text-emerald-700 dark:text-emerald-300">面试官</p>
                    <p class="mt-1 text-sm leading-6 text-slate-800 dark:text-slate-200">{{ item.prompt }}</p>
                    <div v-if="item.answeredAt && item.answerText" class="mt-2">
                      <p class="text-xs font-semibold text-sky-700 dark:text-sky-300">我</p>
                      <p class="mt-1 text-sm leading-6 text-slate-700 dark:text-slate-300">{{ item.answerText }}</p>
                      <p v-if="item.evaluationSummary" class="mt-1 text-xs text-slate-500 dark:text-slate-400">评估：{{
                        item.evaluationSummary }}</p>
                    </div>
                  </div>
                </template>
              </div>
            </aside>
          </div>
        </section>
      </main>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import SpeechAnswerPanel from "../components/SpeechAnswerPanel.vue";
import { useAppStore } from "../store/app";
import { useAuthStore } from "../store/auth";
import { useInterviewStore } from "../store/interview";

const appStore = useAppStore();
const authStore = useAuthStore();
const interviewStore = useInterviewStore();

const stage = ref<"setup" | "interview" | "report">("setup");

const { apiBase } = storeToRefs(appStore);
const {
  positions,
  selectedPositionId,
  questions,
  knowledge,
  totalQuestions,
  totalKnowledge,
  candidateName,
  mode,
  difficulty,
  targetQuestionCount,
  focusAreasText,
  creatingInterview,
  currentInterview,
  activeTurn,
  answerText,
  canSubmitAnswer,
  submittingAnswer,
  loadingReport,
  completingInterview,
  report
} = storeToRefs(interviewStore);

const selectedPosition = computed(() =>
  positions.value.find((item) => item.id === selectedPositionId.value) ?? null
);

const stageLabel = computed(() => {
  if (stage.value === "setup") {
    return "配置中";
  }
  if (stage.value === "report") {
    return "已完成";
  }
  return "进行中";
});

const isGeneratingReport = computed(() => completingInterview.value || loadingReport.value);

const pendingIndicatorLabel = computed(() => {
  if (isGeneratingReport.value) {
    return "正在生成面试报告...";
  }
  return "AI 正在评估回答...";
});

const conversationTurns = computed(() => {
  const turns = ((currentInterview.value as unknown as { turns?: Array<Record<string, unknown>> })?.turns ?? []) as Array<Record<string, unknown>>;
  return turns.sort((a, b) => Number(a.sequence ?? 0) - Number(b.sequence ?? 0));
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

watch(
  () => currentInterview.value?.id,
  (id) => {
    if (id && stage.value === "setup") {
      stage.value = "interview";
    }
  }
);

watch(
  () => authStore.userName,
  (name) => {
    if (!candidateName.value.trim() && name.trim()) {
      candidateName.value = name.trim();
    }
  },
  { immediate: true }
);

watch(
  () => currentInterview.value?.status,
  async (status) => {
    if (status === "completed") {
      if (!report.value) {
        await interviewStore.loadReportAction(apiBase.value);
      }
      stage.value = "report";
    }
  }
);

function enterSetupMode() {
  stage.value = "setup";
}

function startNewInterviewFlow() {
  stage.value = "setup";
}

async function createInterview() {
  await interviewStore.createInterviewAction(apiBase.value);
  stage.value = "interview";
}

async function submitAnswer() {
  await interviewStore.submitAnswerAction(apiBase.value);
}

async function completeInterview() {
  await interviewStore.completeInterviewAction(apiBase.value);
  await interviewStore.loadReportAction(apiBase.value);
  stage.value = "report";
}
</script>


