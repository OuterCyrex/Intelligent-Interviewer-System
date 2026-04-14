import { computed, ref } from "vue";
import { defineStore } from "pinia";
import { transcribeAudioFile } from "../api/audio";
import {
  fetchAllKnowledge,
  fetchAllQuestions,
  fetchPositionKnowledge,
  fetchPositionQuestions
} from "../api/content";
import {
  completeInterview,
  createInterview,
  fetchInterview,
  submitInterviewAnswer,
  type CreateInterviewPayload
} from "../api/interviews";
import { fetchPositions } from "../api/positions";
import { fetchRecommendationsByInterview, fetchCandidateOverview } from "../api/recommendations";
import { fetchReportByInterview } from "../api/reports";
import type {
  Difficulty,
  InterviewMode,
  InterviewTurn,
  InterviewView,
  KnowledgeItem,
  Overview,
  Position,
  Question,
  Recommendations,
  Report,
  SpeechMetrics,
  SpeechTranscriptionSegment
} from "../types/domain";
import { parseCommaSeparatedInput } from "../utils/text";

export const useInterviewStore = defineStore("interview", () => {
  const errorMessage = ref("");

  const positions = ref<Position[]>([]);
  const selectedPositionId = ref("");
  const questions = ref<Question[]>([]);
  const knowledge = ref<KnowledgeItem[]>([]);
  const totalQuestions = ref(0);
  const totalKnowledge = ref(0);

  const candidateName = ref("Alice");
  const mode = ref<InterviewMode>("text");
  const difficulty = ref<Difficulty | "">("");
  const targetQuestionCount = ref(4);
  const focusAreasText = ref("");

  const currentInterview = ref<InterviewView | null>(null);
  const activeTurn = ref<InterviewTurn | null>(null);
  const answerText = ref("");
  const transcript = ref("");
  const durationSeconds = ref<number | null>(null);
  const speechMetrics = ref<SpeechMetrics | null>(null);
  const transcriptionSegments = ref<SpeechTranscriptionSegment[]>([]);
  const transcriptionLanguage = ref<string | null>(null);
  const sttProvider = ref("");
  const sttModel = ref("");
  const lastEvaluation = ref<InterviewTurn | null>(null);

  const report = ref<Report | null>(null);
  const recommendations = ref<Recommendations | null>(null);
  const overview = ref<Overview | null>(null);

  const creatingInterview = ref(false);
  const submittingAnswer = ref(false);
  const transcribingAudio = ref(false);
  const completingInterview = ref(false);
  const loadingPositions = ref(false);
  const loadingAssets = ref(false);
  const loadingReport = ref(false);
  const loadingRecommendations = ref(false);
  const loadingOverview = ref(false);

  const hasInterview = computed(() => Boolean(currentInterview.value));
  const canSubmitAnswer = computed(() =>
    Boolean(activeTurn.value && (answerText.value.trim() || transcript.value.trim()))
  );

  function clearError() {
    errorMessage.value = "";
  }

  function setError(error: unknown) {
    errorMessage.value = error instanceof Error ? error.message : String(error);
  }

  function resetSpeechDraft() {
    transcript.value = "";
    durationSeconds.value = null;
    speechMetrics.value = null;
    transcriptionSegments.value = [];
    transcriptionLanguage.value = null;
    sttProvider.value = "";
    sttModel.value = "";
  }

  function clearAnswerDraft() {
    answerText.value = "";
    resetSpeechDraft();
  }

  async function loadPositionsAction(baseUrl: string) {
    loadingPositions.value = true;
    clearError();

    try {
      const data = await fetchPositions(baseUrl);
      positions.value = data;

      if (!selectedPositionId.value && data.length > 0) {
        selectedPositionId.value = data[0].id;
      }
    } catch (error) {
      setError(error);
    } finally {
      loadingPositions.value = false;
    }
  }

  async function loadPositionAssetsAction(baseUrl: string) {
    loadingAssets.value = true;
    clearError();

    try {
      const [allQuestionData, allKnowledgeData] = await Promise.all([
        fetchAllQuestions(baseUrl),
        fetchAllKnowledge(baseUrl)
      ]);

      totalQuestions.value = allQuestionData.length;
      totalKnowledge.value = allKnowledgeData.length;

      if (!selectedPositionId.value) {
        questions.value = [];
        knowledge.value = [];
        return;
      }

      const [questionData, knowledgeData] = await Promise.all([
        fetchPositionQuestions(baseUrl, selectedPositionId.value),
        fetchPositionKnowledge(baseUrl, selectedPositionId.value)
      ]);
      questions.value = questionData;
      knowledge.value = knowledgeData;
    } catch (error) {
      setError(error);
    } finally {
      loadingAssets.value = false;
    }
  }

  async function createInterviewAction(baseUrl: string) {
    if (!selectedPositionId.value || !candidateName.value.trim()) {
      return;
    }

    creatingInterview.value = true;
    clearError();

    try {
      const payload: CreateInterviewPayload = {
        positionId: selectedPositionId.value,
        candidateName: candidateName.value.trim(),
        targetQuestionCount: targetQuestionCount.value
      };

      if (difficulty.value) {
        payload.difficulty = difficulty.value;
      }

      const focusAreas = parseCommaSeparatedInput(focusAreasText.value);
      if (focusAreas.length > 0) {
        payload.focusAreas = focusAreas;
      }

      const interview = await createInterview(baseUrl, payload);
      currentInterview.value = interview;
      activeTurn.value = interview.activeTurn ?? null;
      report.value = null;
      recommendations.value = null;
      overview.value = null;
      lastEvaluation.value = null;
      clearAnswerDraft();
    } catch (error) {
      setError(error);
    } finally {
      creatingInterview.value = false;
    }
  }

  async function transcribeAudioFileAction(
    baseUrl: string,
    file: File,
    options?: {
      language?: string;
      prompt?: string;
      temperature?: number;
    }
  ) {
    transcribingAudio.value = true;
    clearError();

    try {
      const result = await transcribeAudioFile(baseUrl, {
        file,
        language: options?.language ?? "zh",
        prompt: options?.prompt,
        temperature: options?.temperature
      });

      transcript.value = result.transcript;
      answerText.value = result.normalizedTranscript;
      durationSeconds.value = result.metrics.durationSeconds;
      speechMetrics.value = result.metrics;
      transcriptionSegments.value = result.segments;
      transcriptionLanguage.value = result.language;
      sttProvider.value = result.sttProvider;
      sttModel.value = result.sttModel;

      return result;
    } catch (error) {
      setError(error);
      return null;
    } finally {
      transcribingAudio.value = false;
    }
  }

  async function refreshInterviewAction(baseUrl: string) {
    if (!currentInterview.value) {
      return;
    }

    clearError();

    try {
      const interview = await fetchInterview(baseUrl, currentInterview.value.id);
      currentInterview.value = interview;
      activeTurn.value = interview.activeTurn ?? null;
    } catch (error) {
      setError(error);
    }
  }

  async function submitAnswerAction(baseUrl: string) {
    if (!currentInterview.value || !activeTurn.value || (!answerText.value.trim() && !transcript.value.trim())) {
      return;
    }

    submittingAnswer.value = true;
    clearError();

    try {
      const payload: {
        turnId: string;
        answerText?: string;
        transcript?: string;
        speechMetrics?: Partial<SpeechMetrics>;
      } = {
        turnId: activeTurn.value.id
      };

      if (answerText.value.trim()) {
        payload.answerText = answerText.value.trim();
      }

      if (transcript.value.trim()) {
        payload.transcript = transcript.value.trim();
      }

      if (speechMetrics.value) {
        payload.speechMetrics = {
          durationSeconds: speechMetrics.value.durationSeconds ?? durationSeconds.value ?? undefined,
          fillerWordCount: speechMetrics.value.fillerWordCount,
          averageConfidence: speechMetrics.value.averageConfidence ?? undefined,
          averagePauseMs: speechMetrics.value.averagePauseMs ?? undefined,
          paceWpm: speechMetrics.value.paceWpm ?? undefined,
          fillerRate: speechMetrics.value.fillerRate,
          clarityScore: speechMetrics.value.clarityScore,
          flags: speechMetrics.value.flags
        };
      } else if (durationSeconds.value && durationSeconds.value > 0) {
        payload.speechMetrics = {
          durationSeconds: durationSeconds.value
        };
      }

      const result = await submitInterviewAnswer(baseUrl, currentInterview.value.id, payload);
      lastEvaluation.value = result.answeredTurn;
      currentInterview.value = result.interview;
      activeTurn.value = result.interview.activeTurn ?? null;
      clearAnswerDraft();

      if (result.interview.status === "completed") {
        await Promise.all([
          loadReportAction(baseUrl),
          loadRecommendationsAction(baseUrl),
          loadOverviewAction(baseUrl)
        ]);
      }
    } catch (error) {
      setError(error);
    } finally {
      submittingAnswer.value = false;
    }
  }

  async function completeInterviewAction(baseUrl: string) {
    if (!currentInterview.value) {
      return;
    }

    completingInterview.value = true;
    clearError();

    try {
      const result = await completeInterview(baseUrl, currentInterview.value.id);
      currentInterview.value = result.interview;
      activeTurn.value = result.interview.activeTurn ?? null;

      await Promise.all([
        loadReportAction(baseUrl),
        loadRecommendationsAction(baseUrl),
        loadOverviewAction(baseUrl)
      ]);
    } catch (error) {
      setError(error);
    } finally {
      completingInterview.value = false;
    }
  }

  async function loadReportAction(baseUrl: string) {
    if (!currentInterview.value) {
      return;
    }

    loadingReport.value = true;
    clearError();

    try {
      report.value = await fetchReportByInterview(baseUrl, currentInterview.value.id);
    } catch (error) {
      setError(error);
    } finally {
      loadingReport.value = false;
    }
  }

  async function loadRecommendationsAction(baseUrl: string) {
    if (!currentInterview.value) {
      return;
    }

    loadingRecommendations.value = true;
    clearError();

    try {
      recommendations.value = await fetchRecommendationsByInterview(baseUrl, currentInterview.value.id);
    } catch (error) {
      setError(error);
    } finally {
      loadingRecommendations.value = false;
    }
  }

  async function loadOverviewAction(baseUrl: string) {
    if (!candidateName.value.trim()) {
      return;
    }

    loadingOverview.value = true;
    clearError();

    try {
      overview.value = await fetchCandidateOverview(
        baseUrl,
        candidateName.value.trim(),
        selectedPositionId.value || undefined
      );
    } catch (error) {
      setError(error);
    } finally {
      loadingOverview.value = false;
    }
  }

  async function initialize(baseUrl: string) {
    await loadPositionsAction(baseUrl);
    await loadPositionAssetsAction(baseUrl);
  }

  return {
    errorMessage,
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
    currentInterview,
    activeTurn,
    answerText,
    transcript,
    durationSeconds,
    speechMetrics,
    transcriptionSegments,
    transcriptionLanguage,
    sttProvider,
    sttModel,
    lastEvaluation,
    report,
    recommendations,
    overview,
    creatingInterview,
    submittingAnswer,
    transcribingAudio,
    completingInterview,
    loadingPositions,
    loadingAssets,
    loadingReport,
    loadingRecommendations,
    loadingOverview,
    hasInterview,
    canSubmitAnswer,
    initialize,
    loadPositionsAction,
    loadPositionAssetsAction,
    createInterviewAction,
    transcribeAudioFileAction,
    refreshInterviewAction,
    submitAnswerAction,
    completeInterviewAction,
    loadReportAction,
    loadRecommendationsAction,
    loadOverviewAction,
    resetSpeechDraft
  };
});
