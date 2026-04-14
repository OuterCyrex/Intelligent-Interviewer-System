<template>
  <section class="flex items-center justify-center gap-3 py-1">
    <button
      type="button"
      class="relative grid h-14 w-14 place-items-center rounded-full border transition disabled:cursor-not-allowed disabled:opacity-50"
      :class="buttonClass"
      :disabled="busy || !activeTurn"
      :title="isRecording ? 'Stop recording' : 'Start recording'"
      :aria-label="isRecording ? 'Stop recording' : 'Start recording'"
      @click="toggleRecording"
    >
      <span
        v-if="isRecording"
        class="pointer-events-none absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400/30"
      />

      <svg
        v-if="!busy"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="h-6 w-6"
      >
        <path
          v-if="!isRecording"
          d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3zM19 11a7 7 0 0 1-14 0M12 18v3M8 21h8"
        />
        <rect v-else x="9" y="9" width="6" height="6" rx="1" />
      </svg>

      <span
        v-else
        class="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent"
      />
    </button>

    <button
      type="button"
      class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-600 transition hover:border-slate-400 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-500 dark:hover:text-slate-100"
      :disabled="!isRecording"
      @click="cancelRecording"
    >
      取消
    </button>
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
const { activeTurn, transcribingAudio, submittingAnswer } = storeToRefs(interviewStore);

const isRecording = ref(false);
const discardRecordingResult = ref(false);
const recordedChunks = ref<Blob[]>([]);
const recorderMimeType = ref("");
const recorderStream = shallowRef<MediaStream | null>(null);
const mediaRecorder = shallowRef<MediaRecorder | null>(null);

const busy = computed(() => transcribingAudio.value || submittingAnswer.value);
const buttonClass = computed(() => {
  if (busy.value) {
    return "border-slate-300 bg-slate-100 text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300";
  }
  if (isRecording.value) {
    return "border-rose-400 bg-rose-500 text-white shadow-[0_0_0_6px_rgba(244,63,94,0.15)] dark:border-rose-400 dark:bg-rose-500";
  }
  return "border-emerald-300 bg-emerald-50 text-emerald-700 hover:border-emerald-400 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-200";
});

const recordingSupported = computed(
  () =>
    typeof window !== "undefined" &&
    typeof navigator !== "undefined" &&
    typeof navigator.mediaDevices?.getUserMedia === "function" &&
    typeof MediaRecorder !== "undefined"
);

async function toggleRecording() {
  if (isRecording.value) {
    stopRecording();
    return;
  }
  await startRecording();
}

async function startRecording() {
  discardRecordingResult.value = false;
  if (busy.value || !activeTurn.value || !recordingSupported.value) {
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
    recorder.onstop = () => {
      void handleRecordingStop();
    };
    recorder.onerror = () => {
      cleanupRecorder();
      isRecording.value = false;
    };

    mediaRecorder.value = recorder;
    recorder.start();
    isRecording.value = true;
    interviewStore.resetSpeechDraft();
  } catch {
    cleanupRecorder();
  }
}

function stopRecording() {
  if (mediaRecorder.value && isRecording.value) {
    mediaRecorder.value.stop();
  }
}

function cancelRecording() {
  if (!isRecording.value) {
    return;
  }

  discardRecordingResult.value = true;
  stopRecording();
}

async function handleRecordingStop() {
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

  if (!blob.size || !activeTurn.value) {
    return;
  }

  const file = buildRecordedFile(blob);
  const transcription = await interviewStore.transcribeAudioFileAction(apiBase.value, file, { language: "zh" });
  if (!transcription) {
    return;
  }

  await interviewStore.submitAnswerAction(apiBase.value);
}

function buildRecordedFile(blob: Blob) {
  const extension = blob.type.includes("ogg") ? "ogg" : blob.type.includes("wav") ? "wav" : "webm";
  return new File([blob], `interview-answer-${Date.now()}.${extension}`, {
    type: blob.type || "audio/webm"
  });
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

onBeforeUnmount(() => {
  if (isRecording.value) {
    discardRecordingResult.value = true;
    stopRecording();
  }
  cleanupRecorder();
});
</script>
