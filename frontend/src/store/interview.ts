import { computed, ref } from "vue";
import { defineStore } from "pinia";
import { fetchPositionKnowledge, fetchPositionQuestions } from "../api/content";
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
  Report
} from "../types/domain";
import { parseCommaSeparatedInput } from "../utils/text";

export const useInterviewStore = defineStore("interview", () => {
  const errorMessage = ref("");

  const positions = ref<Position[]>([]);
  const selectedPositionId = ref("");
  const questions = ref<Question[]>([]);
  const knowledge = ref<KnowledgeItem[]>([]);

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
  const lastEvaluation = ref<InterviewTurn | null>(null);

  const report = ref<Report | null>(null);
  const recommendations = ref<Recommendations | null>(null);
  const overview = ref<Overview | null>(null);

  const creatingInterview = ref(false);
  const submittingAnswer = ref(false);
  const completingInterview = ref(false);
  const loadingPositions = ref(false);
  const loadingAssets = ref(false);
  const loadingReport = ref(false);
  const loadingRecommendations = ref(false);
  const loadingOverview = ref(false);

  const hasInterview = computed(() => Boolean(currentInterview.value));

  function clearError() {
    errorMessage.value = "";
  }

  function setError(error: unknown) {
    errorMessage.value = error instanceof Error ? error.message : String(error);
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
    if (!selectedPositionId.value) {
      questions.value = [];
      knowledge.value = [];
      return;
    }

    loadingAssets.value = true;
    clearError();

    try {
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
        mode: mode.value,
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
      answerText.value = "";
      transcript.value = "";
      durationSeconds.value = null;
    } catch (error) {
      setError(error);
    } finally {
      creatingInterview.value = false;
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
    if (!currentInterview.value || !activeTurn.value || !answerText.value.trim()) {
      return;
    }

    submittingAnswer.value = true;
    clearError();

    try {
      const payload: {
        turnId: string;
        answerText: string;
        transcript?: string;
        speechMetrics?: { durationSeconds?: number };
      } = {
        turnId: activeTurn.value.id,
        answerText: answerText.value.trim()
      };

      if (transcript.value.trim()) {
        payload.transcript = transcript.value.trim();
      }

      if (durationSeconds.value && durationSeconds.value > 0) {
        payload.speechMetrics = {
          durationSeconds: durationSeconds.value
        };
      }

      const result = await submitInterviewAnswer(baseUrl, currentInterview.value.id, payload);
      lastEvaluation.value = result.answeredTurn;
      currentInterview.value = result.interview;
      activeTurn.value = result.interview.activeTurn ?? null;
      answerText.value = "";
      transcript.value = "";
      durationSeconds.value = null;

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
    lastEvaluation,
    report,
    recommendations,
    overview,
    creatingInterview,
    submittingAnswer,
    completingInterview,
    loadingPositions,
    loadingAssets,
    loadingReport,
    loadingRecommendations,
    loadingOverview,
    hasInterview,
    initialize,
    loadPositionsAction,
    loadPositionAssetsAction,
    createInterviewAction,
    refreshInterviewAction,
    submitAnswerAction,
    completeInterviewAction,
    loadReportAction,
    loadRecommendationsAction,
    loadOverviewAction
  };
});
