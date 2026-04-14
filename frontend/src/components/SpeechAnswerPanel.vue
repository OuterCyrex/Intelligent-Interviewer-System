<template>
  <section class="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-950/70">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <div>
        <p class="text-sm font-semibold text-slate-900 dark:text-slate-100">语音转写</p>
        <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">录一整段回答，转写完成后会自动回填到回答框。</p>
      </div>
      <span
        class="rounded-full px-2.5 py-1 text-xs font-medium"
        :class="isRecording ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-200' : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300'"
      >
        {{ isRecording ? "录音中" : "待转写" }}
      </span>
    </div>

    <div class="flex flex-wrap gap-2">
      <button
        class="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 hover:border-emerald-400 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-200"
        :disabled="transcribingAudio"
        @click="toggleRecording"
      >
        {{ isRecording ? "停止录音" : "开始录音" }}
      </button>
      <button
        class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900"
        :disabled="isRecording || transcribingAudio"
        @click="openFilePicker"
      >
        选择音频文件
      </button>
      <button
        class="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-white"
        :disabled="!selectedAudioFile || isRecording || transcribingAudio"
        @click="runTranscription"
      >
        {{ transcribingAudio ? "转写中..." : "上传并转写" }}
      </button>
      <button
        class="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-600 hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-300"
        :disabled="(!selectedAudioFile && !transcript.trim() && !speechMetrics) || transcribingAudio"
        @click="clearSpeechDraft"
      >
        清空语音草稿
      </button>
      <input
        ref="fileInput"
        class="hidden"
        type="file"
        accept="audio/*,.webm,.wav,.mp3,.m4a,.aac,.ogg,.opus,.flac"
        @change="onFileChange"
      />
    </div>

    <p v-if="localMessage" class="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
      {{ localMessage }}
    </p>

    <div v-if="selectedAudioFile" class="rounded-xl border border-slate-200 bg-white p-3 text-sm dark:border-slate-800 dark:bg-slate-900">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <p class="font-medium text-slate-900 dark:text-slate-100">{{ selectedAudioFile.name }}</p>
        <p class="text-xs text-slate-500 dark:text-slate-400">{{ formatFileSize(selectedAudioFile.size) }}</p>
      </div>
      <audio v-if="audioPreviewUrl" class="mt-3 w-full" controls :src="audioPreviewUrl" />
    </div>

    <div v-if="speechMetrics" class="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
      <div class="rounded-xl border border-slate-200 bg-white p-3 text-sm dark:border-slate-800 dark:bg-slate-900">
        <p class="text-xs text-slate-500 dark:text-slate-400">时长</p>
        <p class="mt-1 font-semibold">{{ formatDuration(speechMetrics.durationSeconds) }}</p>
      </div>
      <div class="rounded-xl border border-slate-200 bg-white p-3 text-sm dark:border-slate-800 dark:bg-slate-900">
        <p class="text-xs text-slate-500 dark:text-slate-400">清晰度</p>
        <p class="mt-1 font-semibold">{{ speechMetrics.clarityScore }}</p>
      </div>
      <div class="rounded-xl border border-slate-200 bg-white p-3 text-sm dark:border-slate-800 dark:bg-slate-900">
        <p class="text-xs text-slate-500 dark:text-slate-400">平均置信度</p>
        <p class="mt-1 font-semibold">{{ formatConfidence(speechMetrics.averageConfidence) }}</p>
      </div>
      <div class="rounded-xl border border-slate-200 bg-white p-3 text-sm dark:border-slate-800 dark:bg-slate-900">
        <p class="text-xs text-slate-500 dark:text-slate-400">平均停顿</p>
        <p class="mt-1 font-semibold">{{ formatPause(speechMetrics.averagePauseMs) }}</p>
      </div>
    </div>

    <div v-if="speechMetrics" class="flex flex-wrap gap-2">
      <span class="rounded-full bg-slate-200 px-2.5 py-1 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-200">
        口头词 {{ speechMetrics.fillerWordCount }}
      </span>
      <span class="rounded-full bg-slate-200 px-2.5 py-1 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-200">
        语速 {{ speechMetrics.paceWpm ?? "-" }}
      </span>
      <span
        v-for="flag in speechMetrics.flags"
        :key="flag"
        class="rounded-full bg-amber-100 px-2.5 py-1 text-xs text-amber-700 dark:bg-amber-900/30 dark:text-amber-200"
      >
        {{ flag }}
      </span>
      <span
        v-if="sttProvider || sttModel"
        class="rounded-full bg-sky-100 px-2.5 py-1 text-xs text-sky-700 dark:bg-sky-900/30 dark:text-sky-200"
      >
        {{ [sttProvider, sttModel].filter(Boolean).join(" / ") }}
      </span>
    </div>

    <div class="space-y-2">
      <label class="block text-sm font-medium text-slate-700 dark:text-slate-200">转写文本</label>
      <textarea
        v-model="transcript"
        rows="4"
        class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-900"
        placeholder="转写结果会显示在这里，你也可以手动修正。"
      />
      <p class="text-xs text-slate-500 dark:text-slate-400">
        当前语言：{{ transcriptionLanguage || "自动" }}。转写成功后，回答内容会自动回填到上方回答框，你仍可继续修改回答内容。
      </p>
    </div>

    <details v-if="transcriptionSegments.length > 0" class="rounded-xl border border-slate-200 bg-white p-3 text-sm dark:border-slate-800 dark:bg-slate-900">
      <summary class="cursor-pointer font-medium text-slate-800 dark:text-slate-100">查看分段转写</summary>
      <div class="mt-3 space-y-2">
        <div
          v-for="(segment, index) in transcriptionSegments"
          :key="`${index}-${segment.startSeconds ?? 0}`"
          class="rounded-lg border border-slate-200 bg-slate-50 p-2 dark:border-slate-800 dark:bg-slate-950"
        >
          <p class="text-xs text-slate-500 dark:text-slate-400">
            {{ formatTimeline(segment.startSeconds, segment.endSeconds) }} · confidence {{ formatConfidence(segment.confidence) }}
          </p>
          <p class="mt-1 leading-6 text-slate-700 dark:text-slate-300">{{ segment.text }}</p>
        </div>
      </div>
    </details>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, shallowRef } from "vue";
import { storeToRefs } from "pinia";
import { useAppStore } from "../store/app";
import { useInterviewStore } from "../store/interview";

const appStore = useAppStore();
const interviewStore = useInterviewStore();

const { apiBase } = storeToRefs(appStore);
const {
  transcript,
  speechMetrics,
  transcriptionSegments,
  transcriptionLanguage,
  sttProvider,
  sttModel,
  transcribingAudio
} = storeToRefs(interviewStore);

const fileInput = ref<HTMLInputElement | null>(null);
const selectedAudioFile = ref<File | null>(null);
const audioPreviewUrl = ref("");
const localMessage = ref("");
const isRecording = ref(false);
const discardRecordingResult = ref(false);
const recordedChunks = ref<Blob[]>([]);
const recorderMimeType = ref("");
const recorderStream = shallowRef<MediaStream | null>(null);
const mediaRecorder = shallowRef<MediaRecorder | null>(null);

const recordingSupported = computed(
  () =>
    typeof window !== "undefined" &&
    typeof navigator !== "undefined" &&
    typeof navigator.mediaDevices?.getUserMedia === "function" &&
    typeof MediaRecorder !== "undefined"
);

function openFilePicker() {
  fileInput.value?.click();
}

function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement | null;
  const file = input?.files?.[0] ?? null;
  if (!file) {
    return;
  }

  interviewStore.resetSpeechDraft();
  setSelectedAudioFile(file);
  localMessage.value = "已选择音频文件，点击“上传并转写”开始处理。";
}

function setSelectedAudioFile(file: File | null) {
  selectedAudioFile.value = file;
  revokePreviewUrl();

  if (file) {
    audioPreviewUrl.value = URL.createObjectURL(file);
  }
}

function revokePreviewUrl() {
  if (audioPreviewUrl.value) {
    URL.revokeObjectURL(audioPreviewUrl.value);
    audioPreviewUrl.value = "";
  }
}

async function toggleRecording() {
  if (isRecording.value) {
    stopRecording();
    return;
  }

  await startRecording();
}

async function startRecording() {
  localMessage.value = "";
  discardRecordingResult.value = false;

  if (!recordingSupported.value) {
    localMessage.value = "当前浏览器不支持录音，请改用“选择音频文件”。";
    return;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    recorderStream.value = stream;
    recordedChunks.value = [];
    recorderMimeType.value = resolveRecorderMimeType();

    const recorder = recorderMimeType.value
      ? new MediaRecorder(stream, { mimeType: recorderMimeType.value })
      : new MediaRecorder(stream);

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunks.value.push(event.data);
      }
    };
    recorder.onstop = handleRecordingStop;
    recorder.onerror = () => {
      localMessage.value = "录音过程中发生错误，请重试。";
      cleanupRecorder();
      isRecording.value = false;
    };

    mediaRecorder.value = recorder;
    recorder.start();
    isRecording.value = true;
    interviewStore.resetSpeechDraft();
    setSelectedAudioFile(null);
    localMessage.value = "录音开始，回答完成后点击“停止录音”。";
  } catch {
    cleanupRecorder();
    localMessage.value = "无法访问麦克风，请检查浏览器权限后重试。";
  }
}

function stopRecording() {
  if (mediaRecorder.value && isRecording.value) {
    mediaRecorder.value.stop();
  }
}

function handleRecordingStop() {
  if (discardRecordingResult.value) {
    cleanupRecorder();
    isRecording.value = false;
    return;
  }

  const blob = new Blob(recordedChunks.value, {
    type: recorderMimeType.value || mediaRecorder.value?.mimeType || "audio/webm"
  });

  cleanupRecorder();
  isRecording.value = false;

  if (!blob.size) {
    localMessage.value = "没有录到有效音频，请重试。";
    return;
  }

  const extension = blob.type.includes("ogg") ? "ogg" : blob.type.includes("wav") ? "wav" : "webm";
  const file = new File([blob], `interview-answer-${Date.now()}.${extension}`, {
    type: blob.type || "audio/webm"
  });

  setSelectedAudioFile(file);
  localMessage.value = "录音已完成，点击“上传并转写”获取文本。";
}

function cleanupRecorder() {
  mediaRecorder.value = null;

  if (recorderStream.value) {
    for (const track of recorderStream.value.getTracks()) {
      track.stop();
    }
    recorderStream.value = null;
  }
}

function resolveRecorderMimeType() {
  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus", "audio/mp4"];
  return candidates.find((candidate) => typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(candidate)) || "";
}

async function runTranscription() {
  if (!selectedAudioFile.value) {
    localMessage.value = "请先选择音频文件或完成录音。";
    return;
  }

  const result = await interviewStore.transcribeAudioFileAction(apiBase.value, selectedAudioFile.value, {
    language: "zh"
  });

  if (result) {
    localMessage.value = "转写完成，回答内容已自动回填。你可以继续微调文本后再提交。";
  }
}

function clearSpeechDraft() {
  if (isRecording.value) {
    stopRecording();
  }

  interviewStore.resetSpeechDraft();
  setSelectedAudioFile(null);

  if (fileInput.value) {
    fileInput.value.value = "";
  }

  localMessage.value = "";
}

function formatFileSize(size: number) {
  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))} KB`;
  }
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDuration(value: number | null) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "-";
  }
  return `${value.toFixed(1)} 秒`;
}

function formatConfidence(value: number | null) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "-";
  }
  return value.toFixed(2);
}

function formatPause(value: number | null) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "-";
  }
  return `${Math.round(value)} ms`;
}

function formatTimeline(start: number | null, end: number | null) {
  const left = typeof start === "number" && Number.isFinite(start) ? start.toFixed(1) : "-";
  const right = typeof end === "number" && Number.isFinite(end) ? end.toFixed(1) : "-";
  return `${left}s - ${right}s`;
}

onBeforeUnmount(() => {
  if (isRecording.value) {
    discardRecordingResult.value = true;
    stopRecording();
  }
  cleanupRecorder();
  revokePreviewUrl();
});
</script>
